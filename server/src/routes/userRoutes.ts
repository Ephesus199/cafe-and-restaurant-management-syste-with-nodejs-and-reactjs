import express from "express";
import { validate } from "../middleware/validateMiddleware";
import { createUserSchema } from "../validation";



import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { createUser } from "../controllers/userController";

const userRouter = express.Router();
userRouter.use(protect);

userRouter.post("/", validate(createUserSchema), authorizeRoles("super_admin", "branch_admin"), createUser);

export default userRouter;