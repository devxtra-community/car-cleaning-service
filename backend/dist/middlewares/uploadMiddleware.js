"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.uploadToS3 = exports.uploadDocumentToS3 = void 0;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../config/s3");
// Use memory storage - files will be in req.files
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
});
/**
 * Middleware to handle multiple file uploads
 * Accepts 'document' (required) and 'profile_image' (optional)
 */
exports.uploadDocumentToS3 = upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 },
]);
/**
 * Helper function to upload a single file buffer to S3
 * Returns the public S3 URL
 */
const uploadToS3 = async (file) => {
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${timestamp}-${sanitizedFilename}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await s3_1.s3.send(command);
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return url;
};
exports.uploadToS3 = uploadToS3;
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
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
exports.handleMulterError = handleMulterError;
