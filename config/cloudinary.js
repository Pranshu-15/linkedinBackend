import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a buffer directly to Cloudinary via a stream.
 * No temp files, no disk I/O — works on ephemeral filesystems like Render.
 */
const uploadOnCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

export default uploadOnCloudinary;