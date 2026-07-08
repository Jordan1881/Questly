const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { LOCAL_DIR } = require('./avatarStorage')
const { AVATAR_SIZE } = require('./avatarImage')

const MAX_SERVE_WIDTH = AVATAR_SIZE
const cache = new Map()
const MAX_CACHE_ENTRIES = 256

function safeFilename(raw) {
  if (!raw || typeof raw !== 'string') return null
  const base = path.basename(raw)
  if (!/^[a-f0-9-]+\.(webp|png|jpe?g|gif)$/i.test(base)) return null
  return base
}

function getCached(key) {
  return cache.get(key)
}

function setCached(key, buffer) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, buffer)
}

async function renderAvatar(filename, requestedWidth) {
  const width = Math.min(
    Math.max(Number.parseInt(String(requestedWidth), 10) || MAX_SERVE_WIDTH, 32),
    MAX_SERVE_WIDTH,
  )
  const cacheKey = `${filename}:${width}`
  const hit = getCached(cacheKey)
  if (hit) return hit

  const filePath = path.join(LOCAL_DIR, filename)
  if (!fs.existsSync(filePath)) return null

  const buffer = await sharp(filePath)
    .rotate()
    .resize(width, width, {
      fit: 'cover',
      position: 'attention',
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.2 })
    .webp({ quality: WEBP_QUALITY_FOR_SERVE(width), effort: 4, smartSubsample: false })
    .toBuffer()

  setCached(cacheKey, buffer)
  return buffer
}

function WEBP_QUALITY_FOR_SERVE(width) {
  if (width <= 96) return 90
  if (width <= 256) return 92
  return 94
}

async function serveAvatar(req, res, next) {
  try {
    const filename = safeFilename(req.params.filename)
    if (!filename) return res.status(400).json({ error: 'Invalid avatar filename' })

    const buffer = await renderAvatar(filename, req.query.w)
    if (!buffer) return next()

    res.set('Content-Type', 'image/webp')
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    res.set('Vary', 'Accept')
    return res.send(buffer)
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  serveAvatar,
  renderAvatar,
  safeFilename,
  clearAvatarRenderCache: () => cache.clear(),
}
