import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URL to Cloudinary under the "syncspace/avatars" folder.
 * Returns the secure_url of the uploaded image.
 * Automatically replaces the old avatar if publicId is provided.
 */
export const uploadAvatar = async (base64DataUrl, existingPublicId = null) => {
  // Delete old avatar first if it exists
  if (existingPublicId) {
    try {
      await cloudinary.uploader.destroy(existingPublicId);
    } catch (_) {
      // Non-fatal — old avatar might already be gone
    }
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: "syncspace/avatars",
    resource_type: "image",
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return { url: result.secure_url, publicId: result.public_id };
};

export default cloudinary;
