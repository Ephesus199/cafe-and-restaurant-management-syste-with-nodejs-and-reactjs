import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createOrder,
  addOrderItem,
  updateOrderStatus,
  markOrderPaid,
  getOrdersByBranch,
  getOrderById,
} from "../controllers/orderController";
import { validate } from "../middleware/validateMiddleware";
import {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderStatusSchema,
  markOrderPaidSchema,
} from "../validation/index";

const router = Router();

// All order routes require authentication
router.use(protect);

// ==================== CREATE ORDER ====================
// Waiters (and branch admins) can create orders
router.post(
  "/",
  authorizeRoles("waiter", "branch_admin"),
  validate(createOrderSchema),
  createOrder,
);

// ==================== ADD ITEM TO ORDER ====================
router.post(
  "/orders/:orderId/items",
  authorizeRoles("waiter", "branch_admin"),
  validate(addOrderItemSchema),
  addOrderItem,
);

// ==================== UPDATE ORDER STATUS ====================
// Chef and Waiter can update status
router.patch(
  "/orders/:orderId/status",
  authorizeRoles("chef", "waiter", "branch_admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

// ==================== MARK ORDER AS PAID ====================
// Cashier can mark order as paid
router.patch(
  "/orders/:orderId/payment",
  authorizeRoles("cashier", "branch_admin"),
  validate(markOrderPaidSchema),
  markOrderPaid,
);

// ==================== GET ORDERS ====================
// Get all orders for a branch
// router.get(
//   "/branches/:branchId/orders",
//   authorizeRoles("branch_admin", "waiter", "cashier"),
//   getOrdersByBranch,
// );

// Get single order details
router.get(
  "/orders/:orderId",
  authorizeRoles("branch_admin", "waiter", "cashier", "chef"),
  getOrderById,
);

export default router;
