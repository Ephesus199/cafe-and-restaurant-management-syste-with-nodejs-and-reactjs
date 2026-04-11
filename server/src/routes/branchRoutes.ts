import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController";
import { validate } from "../middleware/validateMiddleware";
import { createBranchSchema, updateBranchSchema } from "../validation/index";

const router = Router();

// All branch routes require authentication
router.get("/", getBranches);
router.use(protect);

// Super Admin only for create, update, delete
router.post(
  "/",
  authorizeRoles("super_admin"),
  validate(createBranchSchema),
  createBranch,
);


router.get("/:id", authorizeRoles("super_admin"), getBranchById);

router.put(
  "/:id",
  authorizeRoles("super_admin"),
  validate(updateBranchSchema),
  updateBranch,
);

router.delete("/:id", authorizeRoles("super_admin"), deleteBranch);

export default router;
