import { Request, Response } from 'express';

import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../config/jwt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from 'src/database/connectDatabase';

export const refresh = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    console.log('==== REFRESH HIT ====');
    console.log('BODY:', req.body);
    console.log('COOKIES:', req.cookies);
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    const payload = verifyRefreshToken(refreshToken);
    console.log('REFRESH PAYLOAD:', payload);

    const { userId, tokenId, tokenVersion, clientType } = payload;

    await client.query('BEGIN');

    const { rows } = await client.query(
      `
      SELECT rt.user_id, u.token_version, u.role
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_id = $1
        AND rt.token_hash = $2
        AND rt.revoked = FALSE
        AND rt.expires_at > NOW()
      `,
      [tokenId, hashToken(refreshToken)]
    );

    if (!rows.length) {
      await client.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);

      await client.query('COMMIT');

      return res.status(401).json({
        success: false,
        message: 'Refresh token reused or invalid',
      });
    }

    if (rows[0].token_version !== tokenVersion) {
      await client.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);

      await client.query('COMMIT');

      return res.status(401).json({
        success: false,
        message: 'Session expired',
      });
    }

    // delete old token
    await client.query(`DELETE FROM refresh_tokens WHERE token_id = $1`, [tokenId]);

    const newTokenId = uuidv4();

    const newRefreshToken = generateRefreshToken(
      { userId, tokenId: newTokenId, tokenVersion, clientType },
      clientType
    );

    const newAccessToken = generateAccessToken(
      {
        userId,
        role: rows[0]?.role || 'user',
        tokenVersion,
      },
      clientType
    );

    const expiresSeconds = clientType === 'web' ? 7 * 86400 : 90 * 86400;

    await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES ($1,$2,$3,$4, NOW() + ($5 * INTERVAL '1 second'))
      `,
      [userId, newTokenId, hashToken(newRefreshToken), clientType, expiresSeconds]
    );

    await client.query('COMMIT');

    if (clientType === 'web') {
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 7 * 86400000,
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      ...(clientType === 'mobile' && { refreshToken: newRefreshToken }),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log('REFRESH ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Refresh crashed',
    });
  } finally {
    client.release();
  }
};
