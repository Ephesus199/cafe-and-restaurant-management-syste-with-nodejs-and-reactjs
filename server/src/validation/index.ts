// src/validations/index.ts
import { z } from "zod";

export const loginSchema = z
  .object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
  });

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(["store_manager", "waiter", "cashier", "staff"]),
  branchId: z.string().uuid().optional(),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    role: z.enum(["store_manager", "waiter", "cashier", "staff"]).optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// Branch Validations
export const createBranchSchema = z.object({
  name: z.string().min(3).max(100),
  branchCode: z.string().min(2).max(50),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),

  openingDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export const createMainCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order cannot be negative")
    .optional()
    .default(0),
});

// ====================== SUBCATEGORY ======================
export const createSubcategorySchema = z.object({
  name: z
    .string()
    .min(2, "Subcategory name must be at least 2 characters")
    .max(100, "Subcategory name cannot exceed 100 characters"),
  mainCategoryId: z.string().uuid("Invalid main category ID"),
  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order cannot be negative")
    .optional()
    .default(0),
});

// ====================== MENU ITEM ======================
export const createMenuItemSchema = z.object({
  name: z
    .string()
    .min(3, "Menu item name must be at least 3 characters")
    .max(200, "Menu item name cannot exceed 200 characters"),

  price: z.coerce.number().positive("Price must be greater than 0"),

  imageUrl: z.string().url("Invalid image URL").optional(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  calories: z
    .number()
    .int("Calories must be a whole number")
    .positive()
    .optional(),

  preparationTime: z
    .number()
    .int("Preparation time must be a whole number")
    .positive()
    .optional(),

  subcategoryId: z.string().uuid("Invalid subcategory ID"),

  defaultAvailable: z.boolean().default(true),
});

export const updateMenuItemSchema = z.object({
  name: z
    .string()
    .min(3, "Menu item name must be at least 3 characters")
    .max(200, "Menu item name cannot exceed 200 characters")
    .optional(),

  price: z.number().positive("Price must be greater than 0").optional(),

  // imageUrl: z.string().url("Invalid image URL").optional(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  calories: z
    .number()
    .int("Calories must be a whole number")
    .positive()
    .optional(),

  preparationTime: z
    .number()
    .int("Preparation time must be a whole number")
    .positive()
    .optional(),
});

// ====================== AVAILABILITY ======================
export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

// ====================== DAILY SPECIAL ======================
export const setDailySpecialSchema = z.object({
  subcategoryId: z.string().uuid("Invalid subcategory ID"),
  menuItemId: z.string().uuid("Invalid menu item ID"),
});

// import { z } from "zod";

// ====================== SUPPLIER ======================
export const createSupplierSchema = z.object({
  supplierName: z.string().min(3).max(255),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

// ====================== STORE ITEM ======================
export const createStoreItemSchema = z.object({
  name: z.string().min(3).max(255),
  category: z.string().optional(),
  description: z.string().optional(),
});

// ====================== STORE ITEM VARIANT ======================
export const createStoreItemVariantSchema = z.object({
  storeItemId: z.string().uuid("Invalid store item ID"),
  variantName: z.string().min(2).max(255),
  baseUnit: z.string().min(1, "Base unit is required"),
  packUnit: z.string().optional(),
  unitsPerPack: z.number().int().positive().optional(),
  defaultMinStock: z.number().min(0).default(0),
  sku: z.string().optional(),
  barcode: z.string().optional(),
});

// ====================== PURCHASE BATCH ======================
export const createPurchaseBatchSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  supplierId: z.string().uuid().optional(),
  purchaseDate: z
    .string()
    .datetime()
    .optional()
    .default(new Date().toISOString()),
  quantityPurchased: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
  packPrice: z.number().positive().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// ====================== DAILY USAGE ======================
export const createDailyUsageSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  usageDate: z.string().datetime().optional().default(new Date().toISOString()),
  quantityUsed: z.number().positive("Quantity used must be greater than 0"),
  notes: z.string().optional(),
});



// Create Order
export const createOrderSchema = z.object({
  tableNumber: z.string().optional(),
  customerNotes: z.string().optional(),
  kitchenNotes: z.string().optional(),

});

// Add Item to Order
export const addOrderItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  specialInstructions: z.string().optional(),

});

// Update Order Status
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "completed", "cancelled"]),

});

// Mark Order as Paid
export const markOrderPaidSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "upi", "other"]),

});