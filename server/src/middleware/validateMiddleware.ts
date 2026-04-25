import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse only the body (most common case)
      console.log("Validating request body:", req.body);
      req.body = await schema.parseAsync(req.body);
      console.log("Validation successful:", req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log("Validation errors:", error);
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        console.log("Formatted validation errors:", formattedErrors);

        return res.status(400).json({
          success: false,
          message: formattedErrors.map((e) => `${e.message}`).join("; "),
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};
