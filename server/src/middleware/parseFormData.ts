import type { Request, Response, NextFunction } from "express";

export const parseMenuItemFormData = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
      req.body.translations = JSON.parse(req.body.translations);
    //  console.log("image file in middleware: ", req.files);
    req.body.price = Number(req.body.price);

    req.body.calories = req.body.calories
      ? Number(req.body.calories)
      : undefined;

    req.body.preparationTime = req.body.preparationTime
      ? Number(req.body.preparationTime)
      : undefined;

    req.body.defaultAvailable = req.body.defaultAvailable === "true";

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid form data",
    });
  }
};
