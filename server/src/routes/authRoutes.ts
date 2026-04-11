import express from "express";
import { changePassword, forgotPassword, getMe, login, logout, refreshToken, resetPassword } from "../controllers/authController";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "../validation";
import { validate } from "../middleware/validateMiddleware";
import { protect } from "../middleware/authMiddleware";


const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);
router.post("/logout", logout);

// password management

router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
