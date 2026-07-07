const fs = require('fs')
const path = require('path')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

const LOCAL_DIR = path.join(__dirname, '..', 'uploads', 'avatars')
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function storageMode() {
  return process.env.AVATAR_STORAGE === 's3' ? 's3' : 'local'
}

function isLocalMode() {
  return storageMode() === 'local'
}

function isS3Mode() {
  return storageMode() === 's3'
}

function assertS3Configured() {
  const missing = [
    ['S3_BUCKET', process.env.S3_BUCKET],
    ['S3_ACCESS_KEY_ID', process.env.S3_ACCESS_KEY_ID],
    ['S3_SECRET_ACCESS_KEY', process.env.S3_SECRET_ACCESS_KEY],
    ['S3_PUBLIC_URL', process.env.S3_PUBLIC_URL],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length) {
    throw new Error(`Avatar storage misconfigured: missing ${missing.join(', ')}`)
  }
}

function extensionFor(file) {
  const fromMime = MIME_TO_EXT[file.mimetype]
  if (fromMime) return fromMime
  const fromName = path.extname(file.originalname || '').toLowerCase()
  return fromName || '.jpg'
}

function objectKey(userId, ext) {
  return `avatars/${userId}${ext}`
}

function publicBaseUrl() {
  return String(process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')
}

function isManagedAvatarUrl(avatarUrl) {
  if (!avatarUrl) return false
  if (avatarUrl.startsWith('/api/uploads/avatars/')) return true
  const base = publicBaseUrl()
  return Boolean(base && avatarUrl.startsWith(`${base}/avatars/`))
}

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true })
  }
}

function getS3Client() {
  assertS3Configured()
  const config = {
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  }

  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT
    config.forcePathStyle = true
  }

  return new S3Client(config)
}

async function uploadAvatar(userId, file) {
  const ext = extensionFor(file)
  const key = objectKey(userId, ext)

  if (isS3Mode()) {
    const client = getS3Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    return `${publicBaseUrl()}/${key}`
  }

  ensureLocalDir()
  const filename = `${userId}${ext}`
  const targetPath = path.join(LOCAL_DIR, filename)
  await fs.promises.writeFile(targetPath, file.buffer)
  return `/api/uploads/avatars/${filename}`
}

async function deleteManagedAvatar(avatarUrl) {
  if (!isManagedAvatarUrl(avatarUrl)) return

  if (avatarUrl.startsWith('/api/uploads/avatars/')) {
    const filename = avatarUrl.replace('/api/uploads/avatars/', '')
    const targetPath = path.join(LOCAL_DIR, filename)
    try {
      await fs.promises.unlink(targetPath)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
    return
  }

  const base = publicBaseUrl()
  const key = avatarUrl.slice(base.length + 1)
  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }),
  )
}

module.exports = {
  storageMode,
  isLocalMode,
  isS3Mode,
  isManagedAvatarUrl,
  uploadAvatar,
  deleteManagedAvatar,
  LOCAL_DIR,
}
