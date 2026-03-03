import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
};

export interface AuthedRequest extends Request {
  user?: AuthUser;
}
