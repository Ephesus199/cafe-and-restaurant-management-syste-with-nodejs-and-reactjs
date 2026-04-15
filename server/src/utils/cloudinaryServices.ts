import cloudinary from "../../lib/cloudinary";
import type { UploadedFile } from "express-fileupload";

// Define UploadedFile type inline (minimal version)
// export interface UploadedFile {
//   tempFilePath: string;
//   [key: string]: any;
// }

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    file: UploadedFile,
    folder: string = "cafe-menu",
  ): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        resource_type: "auto",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
        ],
      });

      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  /**
   * Delete image from Cloudinary by public_id
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl) return true;

      // Extract public_id from Cloudinary URL
      const parts = imageUrl.split("/");
      if (parts.length < 2) return true;
      const lastTwo = parts.slice(-2);
      const fileName = lastTwo.join("/");
      const dotIndex = fileName.lastIndexOf(".");
      const publicId = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
      if (!publicId) return true;

      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      return false; // Don't throw — we don't want delete to fail the whole operation
    }
  }

  /**
   * Replace image (delete old + upload new)
   */
  static async replaceImage(
    oldImageUrl: string | null,
    newFile: UploadedFile,
  ): Promise<string> {
    // Delete old image if exists
    if (oldImageUrl) {
      await this.deleteImage(oldImageUrl);
    }

    // Upload new image
    return this.uploadImage(newFile);
  }
}
