import type { Request } from "express";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  branchId?: string | null;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}
