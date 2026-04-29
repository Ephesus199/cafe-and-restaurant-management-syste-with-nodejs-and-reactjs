import type { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import type { AuthRequest } from "../types";
import { getCookieValue } from "../utils/cookies";

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = getCookieValue(req, "accessToken");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // Normalize roles to avoid casing/whitespace mismatches.
    const currentRole = String(req.user.role ?? "").trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) =>
      String(r).trim().toLowerCase(),
    );

    if (!normalizedAllowedRoles.includes(currentRole)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
