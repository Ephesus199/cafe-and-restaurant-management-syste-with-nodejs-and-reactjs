import type { Request } from "express";
import type { FileArray, UploadedFile } from "express-fileupload";
// import type { UploadedFile } from "../utils/cloudinaryServices";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  branchId?: string | null;
  files?: FileArray | { [key: string]: UploadedFile };
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}
