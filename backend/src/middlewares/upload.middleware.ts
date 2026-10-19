// src/middlewares/upload.middleware.ts
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya izinkan format gambar
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak didukung. Harap unggah gambar."));
    }
  },
});