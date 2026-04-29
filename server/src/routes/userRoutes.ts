import express from "express";
import { validate } from "../middleware/validateMiddleware";
import { createUserSchema, updateUserSchema } from "../validation";



import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getUsers,
  restoreUser,
  getWaiters,
} from "../controllers/userController";

const router = express.Router();
// All user routes require authentication
router.use(protect)

// ==================== GET ALL USERS ====================
// Super Admin can see all users
// Branch Admin can only see users in their own branch
router.get(
  '/', 
  authorizeRoles("cashier", "super_admin", "branch_admin"), 
  getUsers
)

// ==================== GET WAITERS ====================
// For cashier/branch_admin selection.
// - non-super-admins can only see waiters from their own branch
router.get(
  "/waiters",
  authorizeRoles("cashier", "branch_admin", "super_admin"),
  getWaiters,
);

// ==================== GET SINGLE USER ====================
// Must be declared AFTER the "/waiters" route to avoid "/waiters" matching "/:id".
router.get(
  '/:id',
  authorizeRoles('super_admin', 'branch_admin'),
  getUserById
)

// ==================== CREATE USER ====================
// Super Admin can create any role
// Branch Admin can only create lower roles (store_manager, waiter, cashier, staff)
router.post(
  '/', 
  authorizeRoles('super_admin', 'branch_admin'),
  validate(createUserSchema),
  createUser
)

router.post('/:id/restore', authorizeRoles("super_admin","branch_admin"),restoreUser)

// ==================== UPDATE USER ====================
router.patch(
  '/:id', 
  authorizeRoles('super_admin', 'branch_admin'),
  validate(updateUserSchema),
  updateUser
)

// ==================== SOFT DELETE USER ====================
router.delete(
  '/:id', 
  authorizeRoles('super_admin', 'branch_admin'),
  deleteUser
);

export default router;