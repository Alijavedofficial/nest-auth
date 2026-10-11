import { CookieOptions, Request } from 'express';

export interface CookiePayload {
  sub: string;
  verified: boolean;
  iat: number;
  exp: number;
}

export type RequestWithCookie = Request & { user: CookiePayload };

export interface createTokenParams {
  id: string;
  verifyToken?: string | null;
  passwordToken?: string | null;
}

export interface updateTokenParams extends Omit<createTokenParams, 'id'> {
  verified?: boolean;
}

export interface createCookieParams {
  sub: string;
  verified: boolean;
}

export interface JwtCookie {
  jwt: string;
  options: CookieOptions;
}
