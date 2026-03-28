import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const listingUploadDir = path.join(process.cwd(), "uploads", "listings");

fs.mkdirSync(listingUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, listingUploadDir);
  },
  filename: function filename(req, file, cb) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeBaseName = path
      .basename(file.originalname || "image", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 60);

    cb(null, `${Date.now()}-${safeBaseName || "image"}${extension}`);
  }
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed."));
  }

  cb(null, true);
}

export const uploadListingImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024
  }
}).array("images", 5);
