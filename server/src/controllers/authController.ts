import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res
        .status(400)
        .json({ message: "Email/Username and password are required" });
    }

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
      console.log("User found for login:", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          branchId: user.branchId,
        },
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
