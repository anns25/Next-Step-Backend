import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes/'); // Store resumes in a specific folder
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and user ID if available
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.user?._id || 'unknown';
        cb(null, `resume-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter for resumes (PDF and DOC files)
const resumeFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and DOC files are allowed for resumes!'), false);
    }
};

// File filter for images (for profile pictures, etc.)
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer for resumes
export const uploadResume = multer({
    storage: storage,
    fileFilter: resumeFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for resumes
    }
});

// Configure multer for images
export const uploadImage = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/images/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for images
    }
});

// Default export for backward compatibility
const upload = multer({
    storage: storage,
    fileFilter: resumeFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    }
});

export default upload;
