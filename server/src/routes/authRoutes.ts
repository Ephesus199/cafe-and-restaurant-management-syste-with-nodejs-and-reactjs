import express from "express";
import { login } from "../controllers/authController";
import { loginSchema } from "../validation";
import { validate } from "../middleware/validateMiddleware";


const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), login);

export default authRouter;

