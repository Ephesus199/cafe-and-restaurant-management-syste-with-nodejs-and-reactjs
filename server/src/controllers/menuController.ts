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
import { is } from "zod/locales";

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
    const languageCode = (req.query.lang as string)?.toLowerCase() || "en"; // Default to English

    const categories = await prisma.mainCategory.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        displayOrder: true,

        // Get translations for requested language with English fallback
        translations: {
          where: {
            languageCode: { in: [languageCode, "en"] },
          },
          select: {
            languageCode: true,
            name: true,
          },
        },
      },
    });

    // Transform the data to return clean structure with selected language
    const result = categories.map((category) => {
      // Find translation for requested language, fallback to English
      const translation =
        category.translations.find((t) => t.languageCode === languageCode) ||
        category.translations.find((t) => t.languageCode === "en");

      return {
        id: category.id,
        name: translation?.name || "Untitled Category", // fallback
        displayOrder: category.displayOrder,
      };
    });

    res.json({
      success: true,
      data: result,
      meta: {
        language: languageCode,
        total: result.length,
      },
    });
  } catch (error) {
    console.error("Error fetching main categories:", error);
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
    const languageCode = (req.query.lang as string)?.toLowerCase() || "en"; // Default to English

    const subcategories = await prisma.subcategory.findMany({
      where: { deletedAt: null },

      select: {
        id: true,
        displayOrder: true,

        // Subcategory translations (requested language + English fallback)
        translations: {
          where: {
            languageCode: { in: [languageCode, "en"] },
          },
          select: {
            languageCode: true,
            name: true,
          },
        },

        // Main Category with translations
        mainCategory: {
          select: {
            id: true,
            displayOrder: true,

            translations: {
              where: {
                languageCode: { in: [languageCode, "en"] },
              },
              select: {
                languageCode: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: [
        { mainCategory: { displayOrder: "asc" } },
        { displayOrder: "asc" },
      ],
    });

    // Transform data to clean structure with selected language
    const result = subcategories.map((sub) => {
      // Subcategory name: requested language → English fallback
      const subTranslation =
        sub.translations.find((t) => t.languageCode === languageCode) ||
        sub.translations.find((t) => t.languageCode === "en");

      // Main Category name: requested language → English fallback
      const mainCatTranslation =
        sub.mainCategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) || sub.mainCategory.translations.find((t) => t.languageCode === "en");

      return {
        id: sub.id,
        name: subTranslation?.name || "Untitled Subcategory",
        displayOrder: sub.displayOrder,

        mainCategory: {
          id: sub.mainCategory.id,
          name: mainCatTranslation?.name || "Untitled Category",
          displayOrder: sub.mainCategory.displayOrder,
        },
      };
    });

    res.json({
      success: true,
      data: result,
      meta: {
        language: languageCode,
        total: result.length,
      },
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch subcategories" });
  }
};

// ==================== MENU ITEMS ====================
export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Received menu item creation request with body:", req.body);

    const data = createMenuItemSchema.parse(req.body);
   
    const { translations } = data;
    const creator = req.user!;
    const imageFile = req.files?.image as UploadedFile | undefined;
    console.log("Received file:", req.files);
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
        defaultAvailable: isBranchAdmin ? false : true, // Branch Admin items default to unavailable
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
    res.status(400).json({ success: false, message: "Failed to create menu item: " + error.message });
  }
};
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const languageCode = (req.query.lang as string) || "en"; // Default to English

    const items = await prisma.menuItem.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        price: true,
        imageUrl: true,
        calories: true,
        preparationTime: true,
        defaultAvailable: true,
        availabilityExceptions: {
          select: {
            branchId: true,
          }
        },

        // Get translation for the requested language, fallback to English
        translations: {
          where: {
            languageCode: { in: [languageCode, "en"] },
          },
          select: {
            languageCode: true,
            name: true,
            description: true,
          },
        },

        subcategory: {
          select: {
            id: true,
            translations: {
              where: {
                languageCode: { in: [languageCode, "en"] },
              },
              select: {
                languageCode: true,
                name: true,
              },
            },
            mainCategory: {
              select: {
                id: true,
                translations: {
                  where: {
                    languageCode: { in: [languageCode, "en"] },
                  },
                  select: {
                    languageCode: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { subcategory: { mainCategory: { displayOrder: "asc" } } },
        { subcategory: { displayOrder: "asc" } },
        { name: "asc" }, // fallback sort
      ],
    });

    console.log("Fetched menu items with translations:", items);

    // Transform the data to return clean structure with selected language
    const transformedItems = items.map((item) => {
      // Find translation for requested language, fallback to English
      const itemTranslation =
        item.translations.find((t) => t.languageCode === languageCode) ||
        item.translations.find((t) => t.languageCode === "en");

      const subcategoryTranslation =
        item.subcategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) || item.subcategory.translations.find((t) => t.languageCode === "en");

      const mainCategoryTranslation =
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) ||
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === "en",
        );

      return {
        id: item.id,
        name: itemTranslation?.name , // fallback to main table name
        price: item.price,
        imageUrl: item.imageUrl,
        description: itemTranslation?.description || "",
        calories: item.calories,
        preparationTime: item.preparationTime,

        subcategory: {
          id: item.subcategory.id,
          name: subcategoryTranslation?.name || "",
        },

        mainCategory: {
          id: item.subcategory.mainCategory.id,
          name: mainCategoryTranslation?.name || "",
        },

        defaultAvailable: item.defaultAvailable,
        // Optional: return all translations if needed
        // translations: item.translations
      };
    });

    res.json({
      success: true,
      data: transformedItems,
      meta: {
        language: languageCode,
        total: transformedItems.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
    });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Menu item ID is required",
      });
    }


    const item = await prisma.menuItem.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        price: true,
        imageUrl: true,
        calories: true,
        preparationTime: true,
        defaultAvailable: true,
        subcategoryId: true,
        translations: {
          select: {
            languageCode: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching menu item by id:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
    });
  }
};
export const getAvailableMenuForBranch = async (req: AuthRequest, res: Response) => {
  try {
    let { branchId } = req.params;
    const languageCode = (req.query.lang as string) || "am"; // Default: English
    console.log("request Query: ", req.query)

    if (Array.isArray(branchId)) {
      branchId = branchId[0];
    }

    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is required" });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { deletedAt: null },

      select: {
        id: true,
        price: true,
        imageUrl: true,
        calories: true,
        preparationTime: true,
        defaultAvailable: true,

        // Translations for requested language (with English fallback)
        translations: {
          where: {
            languageCode: { in: [languageCode] },
          },
          select: {
            languageCode: true,
            name: true,
            description: true,
          },
        },

        // Subcategory with translations
        subcategory: {
          select: {
            id: true,
            displayOrder: true,

            translations: {
              where: {
                languageCode: { in: [languageCode, "en"] },
              },
              select: {
                languageCode: true,
                name: true,
              },
            },

            // Main Category with translations
            mainCategory: {
              select: {
                id: true,
                displayOrder: true,

                translations: {
                  where: {
                    languageCode: { in: [languageCode, "en"] },
                  },
                  select: {
                    languageCode: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        // Availability exceptions for this specific branch
        availabilityExceptions: {
          where: { branchId },
          select: {
            isAvailable: true,
          },
        },
      },

      orderBy: [
        { subcategory: { mainCategory: { displayOrder: "asc" } } },
        { subcategory: { displayOrder: "asc" } },
        { name: "asc" }, // fallback sort
      ],
    });

    // Transform the data into clean frontend-friendly structure
    const result = menuItems.map((item) => {
      // Get translation for requested language, fallback to English
      const itemTranslation =
        item.translations.find((t) => t.languageCode === languageCode) ||
        item.translations.find((t) => t.languageCode === "en");

      const subcategoryTranslation =
        item.subcategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) || item.subcategory.translations.find((t) => t.languageCode === "en");

      const mainCategoryTranslation =
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) ||
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === "en",
        );

      const exception = item.availabilityExceptions[0];

      return {
        id: item.id,
        name: itemTranslation?.name , // fallback to main name
        price: item.price,
        imageUrl: item.imageUrl,
        description: itemTranslation?.description || "",
        calories: item.calories,
        preparationTime: item.preparationTime,
        defaultAvailable: item.defaultAvailable,
        isAvailable: exception ? exception.isAvailable : item.defaultAvailable,

        subcategory: {
          id: item.subcategory.id,
          name: subcategoryTranslation?.name || "",
          displayOrder: item.subcategory.displayOrder,
        },

        mainCategory: {
          id: item.subcategory.mainCategory.id,
          name: mainCategoryTranslation?.name || "",
          displayOrder: item.subcategory.mainCategory.displayOrder,
        },
      };
    });

    const availableItems = result.filter(item => item.isAvailable);
    console.log("Available items: ", availableItems);

    res.json({
      success: true,
      data: availableItems,
      meta: {
        branchId,
        language: languageCode,
        totalItems: availableItems.length,
      },
    });
  } catch (error) {
    console.error("Error fetching menu for branch:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch branch menu" });
  }
};

export const getMenuForBranch = async (req: AuthRequest, res: Response) => {
  try {
    // let { branchId } = req.params;
    const user = req.user!;
    let branchId: string = user.branchId || "";
    
    const languageCode = (req.query.lang as string)?.toLowerCase() || "en"; // Default to English

    if (Array.isArray(branchId)) {
      branchId = branchId[0];
    }

    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is required" });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { deletedAt: null },

      select: {
        id: true,
        price: true,
        imageUrl: true,
        calories: true,
        preparationTime: true,
        defaultAvailable: true,

        // Get translations for requested language + English fallback
        translations: {
          where: {
            languageCode: { in: [languageCode, "en"] },
          },
          select: {
            languageCode: true,
            name: true,
            description: true,
          },
        },

        // Subcategory with translations
        subcategory: {
          select: {
            id: true,
            displayOrder: true,

            translations: {
              where: {
                languageCode: { in: [languageCode, "en"] },
              },
              select: {
                languageCode: true,
                name: true,
              },
            },

            mainCategory: {
              select: {
                id: true,
                displayOrder: true,

                translations: {
                  where: {
                    languageCode: { in: [languageCode, "en"] },
                  },
                  select: {
                    languageCode: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        // Branch-specific availability
        availabilityExceptions: {
          where: { branchId },
          select: {
            isAvailable: true,
          },
        },
      },

      orderBy: [
        { subcategory: { mainCategory: { displayOrder: "asc" } } },
        { subcategory: { displayOrder: "asc" } },
        { name: "asc" },
      ],
    });

    // Transform data to clean structure with selected language
    const result = menuItems.map((item) => {
      // Priority: requested language → English → fallback to main table name
      const itemTranslation =
        item.translations.find((t) => t.languageCode === languageCode) ||
        item.translations.find((t) => t.languageCode === "en");

      const subcategoryTranslation =
        item.subcategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) || item.subcategory.translations.find((t) => t.languageCode === "en");

      const mainCategoryTranslation =
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === languageCode,
        ) ||
        item.subcategory.mainCategory.translations.find(
          (t) => t.languageCode === "en",
        );

      const exception = item.availabilityExceptions[0];

      return {
        id: item.id,
        name: itemTranslation?.name  || "Untitled Item",
        price: item.price,
        imageUrl: item.imageUrl,
        description: itemTranslation?.description || "",
        calories: item.calories,
        preparationTime: item.preparationTime,
        defaultAvailable: item.defaultAvailable,
        isAvailable: exception ? exception.isAvailable : item.defaultAvailable,

        subcategory: {
          id: item.subcategory.id,
          name: subcategoryTranslation?.name || "Untitled Subcategory",
          displayOrder: item.subcategory.displayOrder,
        },

        mainCategory: {
          id: item.subcategory.mainCategory.id,
          name: mainCategoryTranslation?.name || "Untitled Category",
          displayOrder: item.subcategory.mainCategory.displayOrder,
        },
      };
    });

    res.json({
      success: true,
      data: result,
      meta: {
        branchId,
        language: languageCode,
        totalItems: result.length,
      },
    });
  } catch (error) {
    console.error("Error fetching menu for branch:", error);
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

    // Fetch branch privileges if user is a branch admin
    const user = req.user!;
    let privileges = null;
    if (user.role === "branch_admin" && user.branchId) {
      privileges = await prisma.branchPrivilege.findUnique({
        where: { branchId: user.branchId },
      });
    }

    const isSuperAdmin = user.role === "super_admin";
    const canEditPrice = isSuperAdmin || privileges?.canEditPrice;
    const canEditDescription = isSuperAdmin || privileges?.canEditDescription;
    const canEditCalories = isSuperAdmin || privileges?.canEditCalories;
    const canEditPreparationTime = isSuperAdmin || privileges?.canEditPreparationTime;
    const canEditImage = isSuperAdmin || privileges?.canEditImage;
    // const canEditName = isSuperAdmin || privileges?.canEditName;

    // Check for unauthorized field updates
    const unauthorizedFields: string[] = [];
    // if (bodyData.name !== undefined && !canEditName) unauthorizedFields.push("name");
    if (bodyData.price !== undefined && !canEditPrice) unauthorizedFields.push("price");
    if (bodyData.description !== undefined && !canEditDescription) unauthorizedFields.push("description");
    if (bodyData.calories !== undefined && !canEditCalories) unauthorizedFields.push("calories");
    if (bodyData.preparationTime !== undefined && !canEditPreparationTime) unauthorizedFields.push("preparation time");
    if (imageFile && !canEditImage) unauthorizedFields.push("image");

    if (unauthorizedFields.length > 0) {
      return res.status(403).json({
        success: false,
        message: `You do not have privilege to update the specified field(s): ${unauthorizedFields.join(", ")}`,
      });
    }

    // If new image is uploaded and user has privilege, replace old one
    if (imageFile && canEditImage) {
      imageUrl = await CloudinaryService.replaceImage(
        existingItem?.imageUrl || null,
        imageFile,
      );
    }

    // Prepare update data to match Prisma's MenuItemUpdateInput
    const updateData: any = {};
    if (bodyData.price !== undefined) updateData.price = { set: bodyData.price };
    if (bodyData.description !== undefined) updateData.description = { set: bodyData.description };
    if (bodyData.calories !== undefined) updateData.calories = { set: bodyData.calories };
    if (bodyData.preparationTime !== undefined) updateData.preparationTime = { set: bodyData.preparationTime };
    if (imageFile && imageUrl !== undefined) updateData.imageUrl = { set: imageUrl };
    
    updateData.updatedBy = { set: user.id };

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
    let { itemId } = req.params;
    const user = req.user!;
    let branchId: string = user.branchId || "";
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
