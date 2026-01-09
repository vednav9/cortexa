import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Initialize R2 Client
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_S3_API,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Name of the file
 * @param {string} folder - Folder name (images or docs)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadToR2 = async (fileBuffer, fileName, folder = "images", contentType = "image/jpeg") => {
    try {
        const key = `${folder}/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await r2Client.send(command);

        // Return public URL
        const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_DEVELOPMENT_URL}/${key}`;
        
        console.log(`✅ File uploaded to R2: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("❌ R2 Upload Error:", error);
        throw new Error(`Failed to upload to R2: ${error.message}`);
    }
};

/**
 * Delete file from Cloudflare R2
 * @param {string} fileUrl - Public URL of the file
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromR2 = async (fileUrl) => {
    try {
        // Extract key from URL
        const key = fileUrl.replace(`${process.env.CLOUDFLARE_R2_PUBLIC_DEVELOPMENT_URL}/`, "");

        const command = new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
        
        console.log(`✅ File deleted from R2: ${key}`);
        return true;
    } catch (error) {
        console.error("❌ R2 Delete Error:", error);
        return false;
    }
};

/**
 * Upload institution logo to R2 (images folder)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
export const uploadInstitutionLogo = async (fileBuffer, fileName, contentType) => {
    return uploadToR2(fileBuffer, fileName, "images", contentType);
};

/**
 * Upload institution banner to R2 (images folder)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
export const uploadInstitutionBanner = async (fileBuffer, fileName, contentType) => {
    return uploadToR2(fileBuffer, fileName, "images", contentType);
};

/**
 * Upload document to R2 (docs folder)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
export const uploadDocument = async (fileBuffer, fileName, contentType) => {
    return uploadToR2(fileBuffer, fileName, "docs", contentType);
};

export default { uploadToR2, deleteFromR2, uploadInstitutionLogo, uploadInstitutionBanner, uploadDocument };
