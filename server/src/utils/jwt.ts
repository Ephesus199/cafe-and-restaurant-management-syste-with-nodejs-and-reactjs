import jwt from "jsonwebtoken";
import type { UserPayload } from "../types";

// import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-strong-secret-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key";

const ACCESS_TOKEN_EXPIRES = "15m"; // Short lived access token
const REFRESH_TOKEN_EXPIRES = "7d"; // Longer lived refresh token

// export interface UserPayload {
//   id: string;
//   email: string;
//   role: string;
//   branchId?: string | null;
// }

// Generate Access Token (short lived)
export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

// Generate Refresh Token
export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
};

// Verify Access Token
export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): UserPayload => {
  return jwt.verify(token, REFRESH_SECRET) as UserPayload;
};
