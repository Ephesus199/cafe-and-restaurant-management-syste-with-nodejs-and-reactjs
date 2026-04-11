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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });


  // Branch Validations
export const createBranchSchema = z.object({
  name: z.string().min(3).max(100),
  branchCode: z.string().min(2).max(50),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),

  openingDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});
