import express from "express";


const userRouter = express.Router();

import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { createUser } from "../controllers/userController";

userRouter.post("/", protect, authorizeRoles("super_admin", "branch_admin"), createUser);

export default userRouter;