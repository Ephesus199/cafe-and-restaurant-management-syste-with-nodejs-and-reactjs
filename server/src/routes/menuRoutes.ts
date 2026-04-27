import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createMainCategory,
  getMainCategories,
  createSubcategory,
  getSubcategories,
  createMenuItem,
  getMenuItems,
  getMenuForBranch,
  updateMenuItem,
  toggleAvailability,
  setDailySpecial,
  getDailySpecials,
  getAvailableMenuForBranch,

} from "../controllers/menuController";
import { validate } from "../middleware/validateMiddleware";
import {
  createMainCategorySchema,
  createSubcategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../validation/index";
import { parse } from "node:path";
import { parseMenuItemFormData } from "../middleware/parseFormData";

const router = Router();

router.get("/categories", getMainCategories);
router.get("/subcategories", getSubcategories);
router.get("/items", getMenuItems);


router.get("/branches/:branchId/available-menu", getAvailableMenuForBranch);




// All menu routes require authentication
router.use(protect);

// ==================== MAIN CATEGORIES ====================
router.post(
  "/categories",
  authorizeRoles("super_admin"),
  validate(createMainCategorySchema),
  createMainCategory,
);


// ==================== SUBCATEGORIES ====================
router.post(
  "/subcategories",
  authorizeRoles("super_admin", "branch_admin"),
  validate(createSubcategorySchema),
  createSubcategory,
);


// ==================== MENU ITEMS ====================
router.post(
  "/items",
  authorizeRoles("super_admin", "branch_admin"),
  parseMenuItemFormData,
  validate(createMenuItemSchema),
  createMenuItem,
);

router.get("/items", authorizeRoles("super_admin"), getMenuItems);

// Get menu for a specific branch (with availability)
router.get("/branch/full-menu", authorizeRoles("branch_admin"), getMenuForBranch);


// Update menu item (global)
router.put(
  "/items/:id",
  authorizeRoles("super_admin", "branch_admin"),
  validate(updateMenuItemSchema),
  updateMenuItem,
);

// Toggle availability for a branch
router.patch(
  "/branches/menu/:itemId/availability",
  authorizeRoles("branch_admin"),
  toggleAvailability,
);

// ==================== DAILY SPECIALS ====================
router.post(
  "/branches/:branchId/daily-specials",
  authorizeRoles("branch_admin"),
  setDailySpecial,
);

router.get("/branches/:branchId/daily-specials", getDailySpecials);

export default router;
