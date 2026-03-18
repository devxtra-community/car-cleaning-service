import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const getJwtConfig = () => ({
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET_KEY!,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET_KEY!,
  ACCESS_EXPIRES_WEB: process.env.JWT_ACCESS_EXPIRES_WEB as SignOptions['expiresIn'],
  ACCESS_EXPIRES_MOBILE: process.env.JWT_ACCESS_EXPIRES_MOBILE as SignOptions['expiresIn'],
  REFRESH_EXPIRES_WEB: process.env.JWT_REFRESH_EXPIRES_WEB as SignOptions['expiresIn'],
  REFRESH_EXPIRES_MOBILE: process.env.JWT_REFRESH_EXPIRES_MOBILE as SignOptions['expiresIn'],
});

const ISSUER = 'your-app-name';

export type ClientType = 'web' | 'mobile';

/* ------------------ Payloads ------------------ */

export interface AccessTokenPayload {
  userId: string;
  role: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // UNIQUE per refresh token
  tokenVersion: number;
  clientType: ClientType;
}

/* ------------------ Generators ------------------ */

export const generateAccessToken = (
  payload: AccessTokenPayload,
  clientType: ClientType
): string => {
  const config = getJwtConfig();
  return jwt.sign(payload, config.ACCESS_SECRET, {
    expiresIn: clientType === 'web' ? config.ACCESS_EXPIRES_WEB : config.ACCESS_EXPIRES_MOBILE,
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: clientType,
  });
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload,
  clientType: ClientType
): string => {
  const config = getJwtConfig();
  return jwt.sign(payload, config.REFRESH_SECRET, {
    expiresIn: clientType === 'web' ? config.REFRESH_EXPIRES_WEB : config.REFRESH_EXPIRES_MOBILE,
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: clientType,
  });
};

/* ------------------ Utilities ------------------ */

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const config = getJwtConfig();
  try {
    return jwt.verify(token, config.REFRESH_SECRET, {
      issuer: ISSUER,
    }) as RefreshTokenPayload;
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
};
