/**
 * ElevateCV AI — Multer Upload Middleware & Security Guards
 * Validates file types, mime types, sizes, and manages temporary file cleanup.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temporary uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter for Resume import (.pdf, .docx, .doc)
const resumeFileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only PDF, DOCX, and DOC files are supported.'));
    }
};

// File filter for Job Description upload (.pdf, .docx, .txt)
const jdFileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only PDF, DOCX, and TXT files are supported.'));
    }
};

// Multer instances
const uploadResume = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: resumeFileFilter
});

const uploadJD = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: jdFileFilter
});

/**
 * Safely removes a file from disk if it exists
 */
function cleanupFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error('[Upload Cleanup] Error removing file:', e.message);
        }
    }
}

module.exports = {
    uploadResume,
    uploadJD,
    cleanupFile
};
