import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET_KEY;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY;

const ACCESS_EXPIRES_WEB = process.env.JWT_ACCESS_EXPIRES_WEB as SignOptions['expiresIn'];

const ACCESS_EXPIRES_MOBILE = process.env.JWT_ACCESS_EXPIRES_MOBILE as SignOptions['expiresIn'];

const REFRESH_EXPIRES_WEB = process.env.JWT_REFRESH_EXPIRES_WEB as SignOptions['expiresIn'];

const REFRESH_EXPIRES_MOBILE = process.env.JWT_REFRESH_EXPIRES_MOBILE as SignOptions['expiresIn'];

if (
  !ACCESS_SECRET ||
  !REFRESH_SECRET ||
  !ACCESS_EXPIRES_WEB ||
  !ACCESS_EXPIRES_MOBILE ||
  !REFRESH_EXPIRES_WEB ||
  !REFRESH_EXPIRES_MOBILE
) {
  throw new Error('Missing JWT environment variables');
}

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (
  payload: AccessTokenPayload,
  clientType: 'web' | 'mobile'
): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: clientType === 'web' ? ACCESS_EXPIRES_WEB : ACCESS_EXPIRES_MOBILE,
    algorithm: 'HS256',
  });
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload,
  clientType: 'web' | 'mobile'
): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: clientType === 'web' ? REFRESH_EXPIRES_WEB : REFRESH_EXPIRES_MOBILE,
    algorithm: 'HS256',
  });
};

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
