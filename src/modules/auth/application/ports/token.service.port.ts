export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresAt: Date;
}

export interface ITokenService {
  generateTokens(payload: TokenPayload): GeneratedTokens;
  verifyRefreshToken(token: string): TokenPayload;
}

export const TOKEN_SERVICE = Symbol('ITokenService');
