const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Làm sạch tên file và thêm timestamp
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${Date.now()}_${baseName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.zip', '.rar'];
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận định dạng file văn bản và tài liệu: PDF, DOC, DOCX, ZIP, RAR!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Tối đa 25MB
    fileFilter: fileFilter
});

const paymentSlipUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowed = new Map([
            ['.jpg', 'image/jpeg'],
            ['.jpeg', 'image/jpeg'],
            ['.png', 'image/png'],
            ['.webp', 'image/webp']
        ]);
        if (allowed.get(ext) === file.mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Biên lai phải là ảnh JPG, PNG hoặc WEBP.'));
        }
    }
});

module.exports = upload;
module.exports.paymentSlipUpload = paymentSlipUpload;

