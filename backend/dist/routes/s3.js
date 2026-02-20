"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
const s3 = new aws_sdk_1.default.S3({ region: process.env.AWS_REGION });
router.post('/presign', authMiddleware_1.protect, async (req, res) => {
    const { fileType } = req.body;
    const key = `tasks/${Date.now()}.jpg`;
    console.log('PRESIGN HIT');
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        Expires: 60,
    };
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    res.json({
        uploadUrl,
        fileUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
});
exports.default = router;
