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
import { CloudinaryService, } from "../utils/cloudinaryServices";
import type { UploadedFile } from "express-fileupload";
import type fileUpload from "express-fileupload";

// ==================== MAIN CATEGORIES ====================
export const createMainCategory = async (req: AuthRequest, res: Response) => {

  try {
    const data = createMainCategorySchema.parse(req.body);
    console.log("Creating main category with data:", data);
    const { displayOrder, translations } = data;

    // Find English translation (default)
    const englishTranslation = translations.find(
      (t: any) => t.languageCode === "en",
    );

    if (!englishTranslation || !englishTranslation.name) {
      return res.status(400).json({
        success: false,
        message: "English name is required as default",
      });
    }

    const category = await prisma.mainCategory.create({
      data: {
        name: englishTranslation.name.trim(), // ← Store English in main table
        displayOrder: displayOrder || 0,
        createdBy: req.user!.id,

        // Create all translations (including English)
        translations: {
          create: translations.map((t: any) => ({
            languageCode: t.languageCode,
            name: t.name.trim(),
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Main category created successfully with translations",
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
      select: {
        id: true,
        name: true,
        displayOrder: true,
      }
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
    console.log("Creating subcategory with data:", data);
    const { displayOrder, mainCategoryId, translations } = data;
    const englishName = translations.find(
      (t: any) => t.languageCode === "en",
    )?.name;

    const subcategory = await prisma.subcategory.create({
      data: {
        name: englishName?.trim() || "", // ← Store English here too
        mainCategoryId: data.mainCategoryId,
        displayOrder: data.displayOrder || 0,
        createdBy: req.user!.id,
        translations: {
          create: translations.map((t: any) => ({
            languageCode: t.languageCode,
            name: t.name.trim(),
          })),
        },
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
      
      select: {
        id: true,
        name: true,
        displayOrder: true,
        mainCategory: {
          select: {
            id: true,
            name: true,
            displayOrder: true,
          }
        }
       
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
    console.log("Creating menu item with data:", data);
    const { translations } = data;
    const creator = req.user!;
    const imageFile = req.files?.image as UploadedFile | undefined;
    console.log("image file: ", imageFile);

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await CloudinaryService.uploadImage(imageFile, "cafe-menu");
    }

    const isBranchAdmin = creator.role === "branch_admin";

    const englishTranslation = translations.find(
      (t: any) => t.languageCode === "en",
    );

    const menuItem = await prisma.menuItem.create({
      data: {
        name: englishTranslation?.name.trim() || "", // ← Store English name here
        price: data.price,
        imageUrl,
        description: englishTranslation?.description || "",
        subcategoryId: data.subcategoryId,
        defaultAvailable: data.defaultAvailable,
        createdBy: req.user!.id,

        translations: {
          create: translations.map((t: any) => ({
            languageCode: t.languageCode,
            name: t.name.trim(),
            description: t.description?.trim(),
          })),
        },
      },
    });

    // If created by Branch Admin → create exception for their branch
    if (isBranchAdmin && creator.branchId) {
      await prisma.menuItemAvailabilityException.create({
        data: {
          menuItemId: menuItem.id,
          branchId: creator.branchId,
          isAvailable: true,
          updatedBy: creator.id,
        },
      });
    }

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
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        description: true,
        calories: true,
        preparationTime: true,
        subcategory: {
          select: {
            id: true,
            name: true,
            mainCategory: {
              select: {
                id: true,
                name: true,              }
            }
          }
        }
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

     select: {
       id: true,
       name: true,
       price: true,
       description: true,
       imageUrl: true,
       displayOrder: true,
       defaultAvailable: true,
       isAvailable: true,
       // Add any other menuItem fields you need
       // sku: true,
       // calories: true,

       // Nested relation: subcategory + mainCategory
       subcategory: {
         select: {
           id: true,
           name: true,
           displayOrder: true,
           // slug: true,

           mainCategory: {
             select: {
               id: true,
               name: true,
               displayOrder: true,
               // icon: true,
               // color: true,
             },
           },
         },
       },

       // Availability exceptions for specific branch
       availabilityExceptions: {
         where: { branchId }, // filter by branch
         select: {
           id: true,
           isAvailable: true,
           // startDate: true,
           // endDate: true,
           // reason: true,
         },
       },
     },

     // Optional: Order the results
     orderBy: [
       { subcategory: { mainCategory: { displayOrder: "asc" } } },
       { subcategory: { displayOrder: "asc" } },
       { displayOrder: "asc" },
     ],
   });


    const result = menuItems.map((item) => {
      const exception = item.availabilityExceptions[0];
      console.log("exception:", exception);
      return {
        ...item,
        availabilityExceptions: undefined,
        isAvailable: exception ? exception.isAvailable : item.defaultAvailable,
      };
    });

    console.log("Menu for branch:", result);

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

export const getAvailableMenuForBranch = async (req: AuthRequest, res: Response) => {
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
      console.log("exception:", exception);
      return {
        ...item,
        availabilityExceptions: undefined,
        isAvailable: exception ? exception.isAvailable : item.defaultAvailable,
      };
    });

    const finalavailableItems = result.filter(item => item.isAvailable);

    res.json({
      success: true,
      data: finalavailableItems,
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
    // Ensure id is a string (handle string[] or undefined)
    if (Array.isArray(id)) {
      id = id[0];
    }
    if (typeof id !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid menu item id" });
    }
    console.log("updating menu body:", req.body);
    // Parse body (now safe even if body is empty)
    const bodyData = updateMenuItemSchema.parse(req.body) || {};

    const imageFile = req.files?.image as UploadedFile | undefined;

    // Get current menu item to delete old image if new one is uploaded
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    let imageUrl = existingItem?.imageUrl;

    // If new image is uploaded, replace old one
    if (imageFile) {
      imageUrl = await CloudinaryService.replaceImage(
        existingItem?.imageUrl || null,
        imageFile,
      );
    }

    // Prepare update data to match Prisma's MenuItemUpdateInput
    const updateData: any = {};
    // if (bodyData.name !== undefined) updateData.name = { set: bodyData.name };
    if (bodyData.price !== undefined) updateData.price = { set: bodyData.price };
    if (bodyData.description !== undefined)
      updateData.description = { set: bodyData.description };
    if (bodyData.calories !== undefined)
      updateData.calories = { set: bodyData.calories };
    if (bodyData.preparationTime !== undefined)
      updateData.preparationTime = { set: bodyData.preparationTime };
    if (imageUrl !== undefined) updateData.imageUrl = { set: imageUrl };
    updateData.updatedBy = { set: req.user!.id };

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
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
      return res.status(400)
        .json({ success: false, message: "Branch ID and Item ID are required" });
    }
    const { isAvailable } = req.body;
    const currentUser = req.user!;

    // Get the menu item to check defaultAvailable
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    // Branch Admin can only toggle for their own branch
    if (
      currentUser.role === "branch_admin" &&
      currentUser.branchId !== branchId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (isAvailable === menuItem.defaultAvailable) {
      // If setting to default value → delete exception (cleanup)
      await prisma.menuItemAvailabilityException.deleteMany({
        where: {
          menuItemId: itemId,
          branchId: branchId,
        },
      });
    } else {
      // Otherwise upsert the exception
      await prisma.menuItemAvailabilityException.upsert({
        where: {
          menuItemId_branchId: {
            menuItemId: itemId,
            branchId: branchId,
          },
        },
        update: {
          isAvailable,
          updatedBy: currentUser.id,
        },
        create: {
          menuItemId: itemId,
          branchId: branchId,
          isAvailable,
          updatedBy: currentUser.id,
        },
      });
    }

    res.json({
      success: true,
      message: `Availability updated for this branch`,
      data: { isAvailable },
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
