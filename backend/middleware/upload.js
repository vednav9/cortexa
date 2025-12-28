import multer from "multer";

// Use memory storage to get file buffer for R2 upload
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/', 'text/csv', 'application/vnd.ms-excel', 'application/pdf'];
        const isAllowed = allowedTypes.some(type => 
            file.mimetype.startsWith(type) || 
            file.originalname.endsWith('.csv') || 
            file.originalname.endsWith('.pdf')
        );
        
        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and CSV files allowed'), false);
        }
    },
});

export default upload;
