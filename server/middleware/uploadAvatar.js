const path = require('path')
const fs = require('fs')
const multer = require('multer')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'avatars')
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${req.user.id}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
    return
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
})

function uploadAvatarMiddleware(req, res, next) {
  upload.single('avatar')(req, res, (err) => {
    if (!err) return next()

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Avatar must be 2 MB or smaller' })
    }

    return res.status(400).json({ error: err.message || 'Invalid avatar upload' })
  })
}

module.exports = {
  UPLOAD_DIR,
  uploadAvatarMiddleware,
}
