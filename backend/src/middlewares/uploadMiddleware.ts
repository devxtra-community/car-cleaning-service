import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/s3';

// Use memory storage - files will be in req.files
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

/**
 * Middleware to handle multiple file uploads
 * Accepts 'document' (required) and 'profile_image' (optional)
 */
export const uploadDocumentToS3 = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'profile_image', maxCount: 1 },
]);

/**
 * Helper function to upload a single file buffer to S3
 * Returns the public S3 URL
 */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const timestamp = Date.now();
  const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return url;
};

export const handleMulterError = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }

    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
    });
  }

  next();
};
