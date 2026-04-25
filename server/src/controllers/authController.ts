import type { Request, Response } from "express";
import type { AuthRequest } from "../types";
import crypto from "node:crypto";

import bcrypt from "bcryptjs";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../validation";
import { sendResetEmail } from "../utils/email";

// Login (Updated to return both access + refresh token)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    console.log("Login attempt with:", { email, username });

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email?.toLowerCase() },
          { username: username?.toLowerCase() },
        ],
        deletedAt: null,
        isActive: true,
      },
    });

    console.log("User found:", user ? { id: user.id, email: user.email } : null);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // ← Most important
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "strict", // Protects against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          branchId: user.branchId,
        },
        accessToken,
        // refreshToken, // No need to send refresh token in response body since it's in cookie
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // const { refreshToken } = req.body;
    const refreshToken = req.cookies.refreshToken; // Read from cookie

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    const payload = verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.id, deletedAt: null, isActive: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists or inactive" });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// Get Current User Profile
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};

// Logout (Client-side only for now - stateless JWT)
export const logout = async (req: Request, res: Response) => {
  // For stateless JWT, we just tell client to delete tokens
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({
    success: true,
    message: "Logged out successfully. Please delete tokens from client.",
  });
};


export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body,
    );
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    res
      .status(400)
      .json({
        success: false,
        message: error.message || "Failed to change password",
      });
  }
};

// Forgot Password - Send Reset Link
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      },
    });

    // Send email (we'll implement this)
    await sendResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error: any) {
    console.log("error occurs here", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
