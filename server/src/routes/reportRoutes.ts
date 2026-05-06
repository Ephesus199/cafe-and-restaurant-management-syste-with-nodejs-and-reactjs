import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getCompanyReport,
} from "../controllers/reportController";

const router = Router();

// Store managers, branch admins, and super admins can view daily and weekly reports
router.get(
  "/daily",
  protect,
  authorizeRoles("store_manager", "branch_admin", "super_admin"),
  getDailyReport
);

router.get(
  "/weekly",
  protect,
  authorizeRoles("store_manager", "branch_admin", "super_admin"),
  getWeeklyReport
);

// Only branch admins and super admins can view monthly reports
router.get(
  "/monthly",
  protect,
  authorizeRoles("branch_admin", "super_admin"),
  getMonthlyReport
);

// Only super admins can view company wide reports
router.get(
  "/company",
  protect,
  authorizeRoles("super_admin"),
  getCompanyReport
);

export default router;
