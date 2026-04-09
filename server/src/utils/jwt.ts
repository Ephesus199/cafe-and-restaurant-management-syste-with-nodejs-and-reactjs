import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserPayload } from "../types";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-super-secret-key";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" } as SignOptions);
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};
