const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Requires multer-storage-cloudinary to work properly if we want direct cloud streams.
// However, considering package.json only has cloudinary and multer (not multer-storage-cloudinary),
// we will just configure multer for local memory/disk and use cloudinary API.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use memory storage temporarily before uploading to Cloudinary manually
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadToCloudinary = (fileBuffer, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'mockprep_uploads' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
