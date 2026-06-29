import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

const createUpload = (allowedTypes, maxSizeMB) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });

export const avatarUpload = createUpload(ALLOWED_IMAGE_TYPES, 2);
export const documentUpload = createUpload(ALLOWED_DOC_TYPES, 5);
export const reportUpload = createUpload(ALLOWED_DOC_TYPES, 10);
