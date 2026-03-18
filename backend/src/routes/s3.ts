import express from 'express';
import AWS from 'aws-sdk';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

router.post('/presign', protect, async (req, res) => {
  const { fileType, folder = 'tasks' } = req.body;

  // Validate allowed folders
  const allowedFolders = ['tasks', 'profiles'];
  const targetFolder = allowedFolders.includes(folder) ? folder : 'tasks';

  const key = `${targetFolder}/${Date.now()}.jpg`;
  console.log(`PRESIGN HIT: ${key}`);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
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

export default router;
