import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET_KEY!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY!;

const ACCESS_EXPIRES_WEB = process.env.JWT_ACCESS_EXPIRES_WEB as SignOptions['expiresIn'];
const ACCESS_EXPIRES_MOBILE = process.env.JWT_ACCESS_EXPIRES_MOBILE as SignOptions['expiresIn'];

const REFRESH_EXPIRES_WEB = process.env.JWT_REFRESH_EXPIRES_WEB as SignOptions['expiresIn'];
const REFRESH_EXPIRES_MOBILE = process.env.JWT_REFRESH_EXPIRES_MOBILE as SignOptions['expiresIn'];

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
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: clientType === 'web' ? ACCESS_EXPIRES_WEB : ACCESS_EXPIRES_MOBILE,
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: clientType,
  });
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload,
  clientType: ClientType
): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: clientType === 'web' ? REFRESH_EXPIRES_WEB : REFRESH_EXPIRES_MOBILE,
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: clientType,
  });
};

/* ------------------ Utilities ------------------ */

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const verifyRefreshToken = (token: string, clientType: ClientType) => {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer: ISSUER,
    audience: clientType,
  }) as RefreshTokenPayload;
};
