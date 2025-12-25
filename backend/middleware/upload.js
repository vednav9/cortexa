import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        );
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/', 'text/csv', 'application/vnd.ms-excel'];
        const isAllowed = allowedTypes.some(type => 
            file.mimetype.startsWith(type) || file.originalname.endsWith('.csv')
        );
        
        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error('Only images and CSV files allowed'), false);
        }
    },
});

export default upload;
