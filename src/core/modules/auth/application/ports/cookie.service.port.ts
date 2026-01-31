import { Response } from 'express';

export interface ICookieService {
  setRefreshToken(res: Response, refreshToken: string): void;
  clearRefreshToken(res: Response): void;
}

export const COOKIE_SERVICE = Symbol('ICookieService');
