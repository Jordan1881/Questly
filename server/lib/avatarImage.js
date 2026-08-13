const sharp = require('sharp')
const { minSourcePx } = require('./avatarUploadLimits')

const AVATAR_SIZE = 1024
const WEBP_QUALITY = 92
const MIN_SOURCE_PX = minSourcePx

/**
 * Normalize uploads to a square, retina-ready WebP avatar.
 * Lanczos downscale/upscale, light sharpen, EXIF rotation, attention crop.
 */
async function processAvatarImage(file) {
  const input = sharp(file.buffer, { animated: false })
  const meta = await input.metadata()
  const minDim = Math.min(meta.width || 0, meta.height || 0)

  if (minDim < MIN_SOURCE_PX) {
    const err = new Error(
      `Photo is too small (${meta.width || 0}×${meta.height || 0}). Use at least 400×400 pixels for a sharp profile picture.`,
    )
    err.code = 'AVATAR_TOO_SMALL'
    throw err
  }

  const needsUpscale = minDim < AVATAR_SIZE

  let pipeline = input.rotate().resize(AVATAR_SIZE, AVATAR_SIZE, {
    fit: 'cover',
    position: 'attention',
    kernel: sharp.kernel.lanczos3,
  })

  pipeline = pipeline.sharpen(
    needsUpscale
      ? { sigma: 1.1, m1: 1.0, m2: 0.5, x1: 2, y2: 10 }
      : { sigma: 0.8, m1: 0.8, m2: 0.3, x1: 2, y2: 10 },
  )

  const buffer = await pipeline
    .webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: false })
    .toBuffer()

  return {
    buffer,
    mimetype: 'image/webp',
    ext: '.webp',
  }
}

module.exports = {
  processAvatarImage,
  AVATAR_SIZE,
  WEBP_QUALITY,
  MIN_SOURCE_PX,
}
