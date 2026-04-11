// src/validations/index.ts
import { z } from "zod";

export const loginSchema = z
  .object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
  });

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(["store_manager", "waiter", "cashier", "staff"]),
  branchId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["store_manager", "waiter", "cashier", "staff"]).optional(),
}).strict();
