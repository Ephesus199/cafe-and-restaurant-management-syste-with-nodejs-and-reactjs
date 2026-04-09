import type { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, fullName, role } = req.body;
    const creator = req.user!;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Role permission check
    if (creator.role === "branch_admin") {
      if (!["store_manager", "waiter", "cashier", "staff"].includes(role)) {
        return res
          .status(403)
          .json({ message: "Branch admin can only create lower roles" });
      }
      // Force branch to creator's branch
      req.body.branchId = creator.branchId;
    } else if (creator.role !== "super_admin") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        fullName,
        role,
        branchId: req.body.branchId,
        createdBy: creator.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to create user" });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, branchId } = req.query;
    const currentUser = req.user!;

    let whereClause: any = { deletedAt: null };

    if (currentUser.role === "branch_admin") {
      whereClause.branchId = currentUser.branchId;
    } else if (role) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
