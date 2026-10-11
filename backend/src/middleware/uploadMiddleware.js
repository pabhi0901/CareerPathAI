import multer from 'multer';

// Use memory storage so we can parse buffer with pdf-parse and upload to ImageKit
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents (.pdf) are supported.'), false);
  }
};

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter,
});
