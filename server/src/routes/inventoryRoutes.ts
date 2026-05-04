import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createSupplier,
  getSuppliers,
  createStoreItem,
  getStoreItems,
  createStoreItemVariant,
  createPurchaseBatch,
  createDailyUsage,
  getBranchInventory,
  getLowStockItems,
  approvePurchase,
  getPurchasesByBranch,
} from "../controllers/inventoryController";
import { validate } from "../middleware/validateMiddleware";
import {
  createSupplierSchema,
  createStoreItemSchema,
  createStoreItemVariantSchema,
  createPurchaseBatchSchema,
  createDailyUsageSchema,
} from "../validation/index";

const router = Router();

// All inventory routes require authentication
router.use(protect);

// ==================== SUPPLIERS ====================
router.post(
  "/suppliers",
  authorizeRoles("super_admin"),
  validate(createSupplierSchema),
  createSupplier,
);

router.get(
  "/suppliers",
  authorizeRoles("super_admin", "branch_admin", "store_manager"),
  getSuppliers,
);

// ==================== STORE ITEMS ====================
router.post(
  "/store-items",
  authorizeRoles("super_admin"),
  validate(createStoreItemSchema),
  createStoreItem,
);

router.get("/store-items", getStoreItems);

// ==================== STORE ITEM VARIANTS ====================
router.post(
  "/store-item-variants",
  authorizeRoles("super_admin"),
  validate(createStoreItemVariantSchema),
  createStoreItemVariant,
);

// ==================== PURCHASES ====================
router.post(
  "/branches/:branchId/purchases",
  authorizeRoles("store_manager"),
  validate(createPurchaseBatchSchema),
  createPurchaseBatch,
);

router.get(
  "/branches/:branchId/purchases",
  authorizeRoles("branch_admin"),
  getPurchasesByBranch,
);

// Approve Purchase (Branch Admin only)
router.patch(
  "/purchases/:purchaseId/approve",
  authorizeRoles("branch_admin"),
  approvePurchase,
);

// ==================== DAILY USAGE ====================
router.post(
  "/branches/:branchId/usage",
  authorizeRoles("store_manager"),
  validate(createDailyUsageSchema),
  createDailyUsage,
);

// ==================== BRANCH INVENTORY & STOCK STATUS ====================
router.get(
  "/branches/:branchId/inventory",
  authorizeRoles("branch_admin", "store_manager"),
  getBranchInventory,
);

router.get(
  "/branches/:branchId/low-stock",
  authorizeRoles("branch_admin", "store_manager"),
  getLowStockItems,
);

export default router;
