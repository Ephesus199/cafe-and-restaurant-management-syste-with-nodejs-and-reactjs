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
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed for the request data",
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};
