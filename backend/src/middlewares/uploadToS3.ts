import { Request } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { s3 } from '../config/s3';

export const uploadTaskImageToS3 = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req: Request, file: Express.Multer.File, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `tasks/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, fileName);
    },
  }),

  limits: { fileSize: 5 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});
