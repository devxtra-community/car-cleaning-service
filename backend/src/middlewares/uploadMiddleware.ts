import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/s3';

// Use memory storage - file will be in req.file.buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
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
      cb(new Error('Invalid file type'));
    }
  },
});

// Middleware to upload file to S3 after multer processes it
export const uploadDocumentToS3 = upload.single('document');

// Helper function to upload buffer to S3
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const key = `documents/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  // Return S3 URL
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
