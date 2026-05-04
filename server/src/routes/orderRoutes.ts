import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createOrder,
  addOrderItem,
  updateOrderStatus,
  markOrderPaid,
  getOrdersByBranch,
  getOrderById,
  viewOrders,
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
// Waiter and cashier can create orders
router.post(
  "/",
  authorizeRoles("waiter", "cashier"),
  validate(createOrderSchema),
  createOrder,
);

// ==================== ADD ITEM TO ORDER ====================
router.post(
  "/orders/:orderId/items",
  authorizeRoles("waiter", "cashier"),
  validate(addOrderItemSchema),
  addOrderItem,
);

// ==================== UPDATE ORDER STATUS ====================
// Chef and Waiter can update status
router.patch(
  "/orders/:orderId/status",
  authorizeRoles("chef", "waiter"),
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
// Get orders with role-based filtering
router.get(
  "/view",
  authorizeRoles("waiter", "branch_admin", "cashier", "super_admin", "chef"),
  viewOrders,
);

// Get single order details
router.get(
  "/orders/:orderId",
  authorizeRoles("branch_admin", "waiter", "cashier", "chef", "super_admin"),
  getOrderById,
);

export default router;
