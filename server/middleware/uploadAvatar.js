const multer = require('multer')
const limits = require('../../shared/avatarUploadLimits.json')

const MAX_BYTES = limits.maxBytes
const ALLOWED_MIME = new Set(limits.allowedMime)
const MAX_LABEL = limits.maxMbLabel

const storage = multer.memoryStorage()

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

/**
 * Zero-dep magic-byte check. Do not trust client mimetype alone.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function hasAllowedImageMagic(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true
  }

  // GIF87a / GIF89a
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a') return true
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return true

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true
  }

  return false
}

function rejectBadContentLength(req, res) {
  const raw = req.headers['content-length']
  if (raw === undefined) return false

  if (!/^\d+$/.test(String(raw).trim())) {
    res.status(400).json({ error: 'Invalid Content-Length header' })
    return true
  }

  const length = Number.parseInt(String(raw).trim(), 10)
  if (length > MAX_BYTES) {
    res.status(400).json({ error: `Avatar must be ${MAX_LABEL} or smaller` })
    return true
  }

  return false
}

function uploadAvatarMiddleware(req, res, next) {
  if (rejectBadContentLength(req, res)) return

  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `Avatar must be ${MAX_LABEL} or smaller` })
      }
      return res.status(400).json({ error: err.message || 'Invalid avatar upload' })
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Avatar file is required' })
    }

    if (!hasAllowedImageMagic(req.file.buffer)) {
      return res.status(400).json({
        error: 'File content is not a valid JPEG, PNG, WebP, or GIF image',
      })
    }

    return next()
  })
}

module.exports = {
  uploadAvatarMiddleware,
  hasAllowedImageMagic,
  MAX_BYTES,
  MAX_LABEL,
}
