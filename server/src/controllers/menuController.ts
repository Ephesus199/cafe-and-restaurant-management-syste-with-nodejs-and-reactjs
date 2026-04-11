import type { Request, Response } from "express";
// import prisma from "../prisma/client";
import type { AuthRequest } from "../types";
import { prisma } from "../../lib/prisma";
import type { MenuItem } from "../../generated/prisma/client";
import {
  createMainCategorySchema,
  createSubcategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../validation/index";

// ==================== MAIN CATEGORIES ====================
export const createMainCategory = async (req: AuthRequest, res: Response) => {
  try {
    // Ensure req.body is typed as any for Zod parsing
      const data = createMainCategorySchema.parse(req.body as any);
      console.log("Creating main category with data:", data);

    const category = await prisma.mainCategory.create({
      data: {
        name: data.name,
        displayOrder: data.displayOrder,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Main category created successfully",
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMainCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.mainCategory.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch main categories" });
  }
};

// ==================== SUBCATEGORIES ====================
export const createSubcategory = async (req: AuthRequest, res: Response) => {
  try {
    const data = createSubcategorySchema.parse(req.body);

    const subcategory = await prisma.subcategory.create({
      data: {
        name: data.body.name,
        mainCategoryId: data.body.mainCategoryId,
        displayOrder: data.body.displayOrder,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: subcategory,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: { deletedAt: null },
      include: {
        mainCategory: true,
      },
      orderBy: [
        { mainCategory: { displayOrder: "asc" } },
        { displayOrder: "asc" },
      ],
    });

    res.json({ success: true, data: subcategories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch subcategories" });
  }
};

// ==================== MENU ITEMS ====================
export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const data = createMenuItemSchema.parse(req.body);

    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.body.name,
        price: data.body.price,
        imageUrl: data.body.imageUrl === undefined ? null : data.body.imageUrl,
        description: data.body.description === undefined ? null : data.body.description,
        calories: data.body.calories === undefined ? null : data.body.calories,
        preparationTime: data.body.preparationTime === undefined ? null : data.body.preparationTime,
        subcategoryId: data.body.subcategoryId,
        // defaultAvailable: data.body.defaultAvailable,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: menuItem,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { deletedAt: null },
      include: {
        subcategory: {
          include: {
            mainCategory: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch menu items" });
  }
};

export const getMenuForBranch = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId } = req.params;

      if (Array.isArray(branchId)) {
        branchId = branchId[0];
      }

      if(!branchId) {
        return res
          .status(400)
          .json({ success: false, message: "Branch ID is required" });
      }
      

    const menuItems = await prisma.menuItem.findMany({
      where: { deletedAt: null },
      include: {
        subcategory: {
          include: {
            mainCategory: true,
          },
        },
        availabilityExceptions: {
          where: { branchId },
        },
      },
    });

    const result = menuItems.map((item) => {
      const exception = item.availabilityExceptions[0];
      return {
        ...item,
        availabilityExceptions: undefined,
        isAvailable: exception ? exception.isAvailable : item.defaultAvailable,
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch branch menu" });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
      let { id } = req.params;
      if (Array.isArray(id)) {
        id = id[0];
      }
      if (!id) {
        return res.status(400)
          .json({ success: false, message: "Menu item ID is required" });
      }
    const data = updateMenuItemSchema.parse(req.body);

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        updatedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleAvailability = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId, itemId } = req.params;
      if (Array.isArray(branchId)) {
          branchId = branchId[0];
      }
      if (Array.isArray(itemId)) {
          itemId = itemId[0];
      }
      
      if (!branchId || !itemId) {
            return res.status(400).json({ success: false, message: "Branch ID and Menu Item ID are required" });
      }
    const { isAvailable } = req.body;

    await prisma.menuItemAvailabilityException.upsert({
      where: {
        menuItemId_branchId: {
          menuItemId: itemId,
          branchId,
        },
      },
      update: {
        isAvailable,
        updatedBy: req.user!.id,
      },
      create: {
        menuItemId: itemId===undefined ? "" : itemId,
        branchId,
        isAvailable,
        updatedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: "Availability updated for this branch",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update availability" });
  }
};

// ==================== DAILY SPECIALS ====================
export const setDailySpecial = async (req: AuthRequest, res: Response) => {
  try {
      let { branchId } = req.params;
      if (Array.isArray(branchId)) {
          branchId = branchId[0];
      }
      if (!branchId) {
          return res.status(400).json({ success: false, message: "Branch ID is required" });
        }
    const { subcategoryId, menuItemId } = req.body;

    const dailySpecial = await prisma.dailySpecial.upsert({
      where: {
        branchId_subcategoryId: {
          branchId,
          subcategoryId,
        },
      },
      update: {
        menuItemId,
        createdBy: req.user!.id,
      },
      create: {
        branchId,
        subcategoryId,
        menuItemId,
        createdBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: "Daily special set successfully",
      data: dailySpecial,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDailySpecials = async (req: AuthRequest, res: Response) => {
  try {
    let { branchId } = req.params;
    if (Array.isArray(branchId)) {
      branchId = branchId[0];
      }
      if (!branchId) {
        return res.status(400).json({ success: false, message: "Branch ID is required" });
      }

    const specials = await prisma.dailySpecial.findMany({
      where: { branchId },
      include: {
        menuItem: true,
        subcategory: true,
      },
    });

    res.json({
      success: true,
      data: specials,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch daily specials" });
  }
};
