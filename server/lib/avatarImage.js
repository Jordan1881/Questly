const sharp = require('sharp')

const AVATAR_SIZE = 512
const WEBP_QUALITY = 90

/**
 * Normalize uploads to a square, retina-ready WebP avatar.
 * Covers EXIF rotation, center crop, and consistent output dimensions.
 */
async function processAvatarImage(file) {
  const buffer = await sharp(file.buffer, { animated: false })
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: 'cover',
      position: 'attention',
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
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
}
