import type { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";
import { createUserSchema, updateUserSchema } from "../validation";

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, fullName, role, branchId } =
      createUserSchema.parse(req.body);
    const creator = req.user!;
      const createdBy = creator.id;
    console.log("Creating user with data:", {
      created_by: creator.id,
      username,
      email,
      role,
      branchId,
      creator,
    });

    // Validation
    if (!username || !email || !password || !role ) {
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
        fullName: fullName ?? null,
        role,
        branchId:req.body.branchId ?? null,
        createdBy,
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

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    let { id } = req.params;
    const currentUser = req.user!;

    // Ensure id is a string (handle array or undefined)
    if (Array.isArray(id)) {
      id = id[0];
    }
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
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

    // Branch Admin can only view users in their branch
    if (
      currentUser.role === "branch_admin" &&
      user.branchId !== currentUser.branchId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// Update User
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    // const { id } = req.params;
    const data = updateUserSchema.parse(req.body);
    // const currentUser = req.user!;

        let { id } = req.params;
        const currentUser = req.user!;

        // Ensure id is a string (handle array or undefined)
        if (Array.isArray(id)) {
          id = id[0];
        }
        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "User ID is required" });
        }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Permission check
    if (
      currentUser.role === "branch_admin" &&
      user.branchId !== currentUser.branchId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }


    // Remove undefined properties to satisfy Prisma's strict typing
    const updateData: any = { ...data, updatedAt: new Date() };
    if (updateData.fullName === undefined) delete updateData.fullName;
    if (updateData.isActive === undefined) delete updateData.isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    res
      .status(400)
      .json({
        success: false,
        message: error.message || "Failed to update user",
      });
  }
};

// Soft Delete User
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
     let { id } = req.params;
     const currentUser = req.user!;

     // Ensure id is a string (handle array or undefined)
     if (Array.isArray(id)) {
       id = id[0];
     }
     if (!id) {
       return res
         .status(400)
         .json({ success: false, message: "User ID is required" });
     }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Permission check
    if (
      currentUser.role === "branch_admin" &&
      user.branchId !== currentUser.branchId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    res.json({
      success: true,
      message: "User has been soft deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};



// Restore Soft Deleted User
export const restoreUser = async (req: AuthRequest, res: Response) => {
  try {
     let { id } = req.params;
     const currentUser = req.user!;

     // Ensure id is a string (handle array or undefined)
     if (Array.isArray(id)) {
       id = id[0];
     }
     if (!id) {
       return res
         .status(400)
         .json({ success: false, message: "User ID is required" });
     }

    // Find the user (including soft deleted)
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    if (!user.deletedAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not deleted' 
      })
    }

    // Permission check
    if (currentUser.role === 'branch_admin') {
      if (user.branchId !== currentUser.branchId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: You can only restore users in your branch' 
        })
      }
    }

    const restoredUser = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
        // Optional: You can track who restored the user
        // restoredBy: currentUser.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        isActive: true,
        deletedAt: true
      }
    })

    res.json({
      success: true,
      message: 'User has been successfully restored',
      data: restoredUser
    })

  } catch (error: any) {
    console.error('Restore user error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to restore user' 
    })
  }
}