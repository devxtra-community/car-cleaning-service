"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = void 0;
const jwt_1 = require("../../config/jwt");
const uuid_1 = require("uuid");
const connectDatabase_1 = require("../../database/connectDatabase");
const refresh = async (req, res) => {
    let client;
    try {
        client = await connectDatabase_1.pool.connect();
        const rawTokens = req.cookies?.refreshToken;
        // ... (rest of the logic)
        const tokensToTry = [];
        if (Array.isArray(rawTokens)) {
            tokensToTry.push(...rawTokens);
        }
        else if (rawTokens) {
            tokensToTry.push(rawTokens);
        }
        if (req.body?.refreshToken && !tokensToTry.includes(req.body.refreshToken)) {
            tokensToTry.push(req.body.refreshToken);
        }
        if (tokensToTry.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token missing',
            });
        }
        let validToken = null;
        let lastError = null;
        let payload = null;
        let dbRow = null;
        let hasRevokedToken = false;
        let revokedUserId = null;
        console.log(`[AUTH-REFRESH] Refreshing. Found ${tokensToTry.length} potential tokens.`);
        if (tokensToTry.length > 1) {
            console.log(`[AUTH-REFRESH] Multiple cookies/tokens detected!`);
        }
        // Try each token until one works with the DB
        for (const token of tokensToTry) {
            try {
                const decoded = (0, jwt_1.verifyRefreshToken)(token);
                const { rows } = await client.query(`
          SELECT rt.user_id, u.token_version, u.role, rt.revoked, rt.expires_at
          FROM refresh_tokens rt
          JOIN users u ON u.id = rt.user_id
          WHERE rt.token_id = $1
            AND rt.token_hash = $2
          `, [decoded.tokenId, (0, jwt_1.hashToken)(token)]);
                if (rows.length > 0) {
                    const row = rows[0];
                    // Check if it's actually valid (not revoked, not expired, matches version)
                    if (!row.revoked &&
                        new Date(row.expires_at) > new Date() &&
                        row.token_version === decoded.tokenVersion) {
                        validToken = token;
                        payload = decoded;
                        dbRow = row;
                        break;
                    }
                    else if (row.revoked) {
                        // Track reuse attempt but don't fail immediately in case a valid duplicate exists
                        hasRevokedToken = true;
                        revokedUserId = row.user_id;
                    }
                }
            }
            catch (err) {
                lastError = err;
            }
        }
        if (!validToken) {
            if (hasRevokedToken && revokedUserId) {
                console.warn(`[SECURITY] Revoked token reused for user ${revokedUserId} and no valid duplicate found. Revoking all!`);
                await client.query('BEGIN');
                await client.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [
                    revokedUserId,
                ]);
                await client.query('COMMIT');
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token reused or invalid',
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }
        const { userId, tokenId, tokenVersion, clientType } = payload;
        await client.query('BEGIN');
        // delete old token
        await client.query(`DELETE FROM refresh_tokens WHERE token_id = $1`, [tokenId]);
        const newTokenId = (0, uuid_1.v4)();
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ userId, tokenId: newTokenId, tokenVersion, clientType }, clientType);
        const newAccessToken = (0, jwt_1.generateAccessToken)({
            userId,
            role: dbRow.role || 'user',
            tokenVersion,
        }, clientType);
        const expiresSeconds = clientType === 'web' ? 7 * 86400 : 90 * 86400;
        await client.query(`
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES ($1,$2,$3,$4, NOW() + ($5 * INTERVAL '1 second'))
      `, [userId, newTokenId, (0, jwt_1.hashToken)(newRefreshToken), clientType, expiresSeconds]);
        await client.query('COMMIT');
        if (clientType === 'web') {
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                domain: process.env.COOKIE_DOMAIN || undefined,
                maxAge: 7 * 86400000,
            });
        }
        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            ...(clientType === 'mobile' && { refreshToken: newRefreshToken }),
        });
    }
    catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }
        }
        console.error('REFRESH ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Refresh crashed',
        });
    }
    finally {
        if (client) {
            client.release();
        }
    }
};
exports.refresh = refresh;
