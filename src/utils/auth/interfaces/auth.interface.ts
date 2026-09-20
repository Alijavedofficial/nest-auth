import { Request } from 'express';

export interface CookiePayload {
  sub: string;
  verified: boolean;
  iat: number;
  exp: number;
}

export type RequestWithCookie = Request & { user: CookiePayload };
