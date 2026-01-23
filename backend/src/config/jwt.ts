import jwt, { SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET_KEY!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_KEY!;
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET_KEY);

export const generateAccessToken = (payload: object, clientType: 'web' | 'mobile') => {
  const options: SignOptions = {
    expiresIn: (clientType === 'web'
      ? process.env.JWT_ACCESS_EXPIRES_WEB
      : process.env.JWT_ACCESS_EXPIRES_MOBILE) as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: object, clientType: 'web' | 'mobile') => {
  const options: SignOptions = {
    expiresIn: (clientType === 'web'
      ? process.env.JWT_REFRESH_EXPIRES_WEB
      : process.env.JWT_REFRESH_EXPIRES_MOBILE) as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, REFRESH_SECRET, options);
};
