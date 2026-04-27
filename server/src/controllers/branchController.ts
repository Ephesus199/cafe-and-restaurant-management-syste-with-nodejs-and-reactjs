import type { Request, Response } from "express";
// import prisma from "../prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthRequest } from "../types";
import { createBranchSchema, updateBranchSchema } from "../validation/index";

// Create New Branch (Super Admin only)
export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const data = createBranchSchema.parse(req.body);

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        branchCode: data.branchCode.toUpperCase(),
        address: data.address === undefined ? null : data.address,
        city: data.city === undefined ? null : data.city,
        postalCode: data.postalCode === undefined ? null : data.postalCode,
        country: data.country || "UK",
        phone: data.phone === undefined ? null : data.phone,
        email: data.email === undefined ? null : data.email,
        openingDate: data.openingDate ? new Date(data.openingDate) : null,
        notes: data.notes === undefined ? null : data.notes,
      },
    });

    // Automatically create branch privileges for this branch
    await prisma.branchPrivilege.create({
      data: {
        branchId: branch.id,
        canEditName: data.privileges?.canEditName ?? false,
        canEditPrice: data.privileges?.canEditPrice ?? false,
        canEditImage: data.privileges?.canEditImage ?? false,
        canEditDescription: data.privileges?.canEditDescription ?? false,
        canEditCalories: data.privileges?.canEditCalories ?? false,
        canEditPreparationTime: data.privileges?.canEditPreparationTime ?? false,
      },
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create branch",
    });
  }
};

// Get All Branches
export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        bracnhPrivileges: true,
      },
    });

    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
  }
};

// Get Single Branch
export const getBranchById = async (req: Request, res: Response) => {
  try {
      let { id } = req.params;
      
        if (Array.isArray(id)) {
          id = id[0];
        }
        if (!id) {
          return res
            .status(400)
            .json({ success: false, message: "User ID is required" });
        }


    const branch = await prisma.branch.findUnique({
      where: { id, deletedAt: null },
      include: {
        bracnhPrivileges: true,
      },
    });

    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch branch" });
  }
};

// Update Branch
export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is required" });
    }

    const data = updateBranchSchema.parse(req.body);

    // Remove undefined properties to satisfy Prisma strict typing
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.branchCode !== undefined) {
      updateData.branchCode = data.branchCode.toUpperCase();
    }
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.openingDate !== undefined) {
      updateData.openingDate = data.openingDate ? new Date(data.openingDate) : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    if (data.privileges) {
      await prisma.branchPrivilege.upsert({
        where: { branchId: id },
        update: {
          canEditName: data.privileges.canEditName,
          canEditPrice: data.privileges.canEditPrice,
          canEditImage: data.privileges.canEditImage,
          canEditDescription: data.privileges.canEditDescription,
          canEditCalories: data.privileges.canEditCalories,
          canEditPreparationTime: data.privileges.canEditPreparationTime,
        },
        create: {
          branchId: id,
          canEditName: data.privileges.canEditName,
          canEditPrice: data.privileges.canEditPrice,
          canEditImage: data.privileges.canEditImage,
          canEditDescription: data.privileges.canEditDescription,
          canEditCalories: data.privileges.canEditCalories,
          canEditPreparationTime: data.privileges.canEditPreparationTime,
        },
      });
    }

    res.json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
     } catch (error: any) {
    res
      .status(400)
      .json({
        success: false,
        message: error.message || "Failed to update branch",
      });
  }
};

// Soft Delete Branch
export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
      let { id } = req.params;
      if (Array.isArray(id)) {
        id = id[0];
      }
      if (!id) {
          return res.status(400)
            .json({ success: false, message: "Branch ID is required" });
      }

    await prisma.branch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    res.json({
      success: true,
      message: "Branch has been soft deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete branch" });
  }
};

// Get My Branch Privileges
export const getMyPrivileges = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    
    // Only Branch Admin has branch privileges conceptually, or users attached to a branch
    if (!user.branchId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with any branch",
      });
    }

    const privileges = await prisma.branchPrivilege.findUnique({
      where: { branchId: user.branchId },
    });

    if (!privileges) {
      return res.status(404).json({
        success: false,
        message: "Branch privileges not found",
      });
    }

    res.json({
      success: true,
      data: privileges,
    });
  } catch (error) {
    console.error("Error fetching branch privileges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch branch privileges",
    });
  }
};
