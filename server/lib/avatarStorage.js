const fs = require('fs')
const path = require('path')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { processAvatarImage } = require('./avatarImage')

const LOCAL_DIR = path.join(__dirname, '..', 'uploads', 'avatars')

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
    ['S3_REGION', process.env.S3_REGION],
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

function objectKey(userId) {
  return `avatars/${userId}.webp`
}

function avatarFilename(userId) {
  return `${userId}.webp`
}

function cacheBustedUrl(baseUrl) {
  return `${baseUrl}?v=${Date.now()}`
}

function filenameFromManagedUrl(avatarUrl) {
  const withoutQuery = avatarUrl.split('?')[0]
  if (withoutQuery.startsWith('/api/uploads/avatars/')) {
    return withoutQuery.replace('/api/uploads/avatars/', '')
  }
  const base = publicBaseUrl()
  if (base && withoutQuery.startsWith(`${base}/avatars/`)) {
    return withoutQuery.slice(base.length + '/avatars/'.length)
  }
  return null
}

function publicBaseUrl() {
  return String(process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')
}

function isManagedAvatarUrl(avatarUrl) {
  if (!avatarUrl) return false
  const pathOnly = avatarUrl.split('?')[0]
  if (pathOnly.startsWith('/api/uploads/avatars/')) return true
  const base = publicBaseUrl()
  return Boolean(base && pathOnly.startsWith(`${base}/avatars/`))
}

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true })
  }
}

function getS3Client() {
  assertS3Configured()
  const config = {
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  }

  // Optional — only for S3-compatible providers (MinIO, R2). Omit for AWS S3.
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT
    config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== 'false'
  }

  return new S3Client(config)
}

async function uploadAvatar(userId, file) {
  const processed = await processAvatarImage(file)
  const key = objectKey(userId)

  if (isS3Mode()) {
    const client = getS3Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: processed.buffer,
        ContentType: processed.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    return cacheBustedUrl(`${publicBaseUrl()}/${key}`)
  }

  ensureLocalDir()
  const filename = avatarFilename(userId)
  const targetPath = path.join(LOCAL_DIR, filename)
  await fs.promises.writeFile(targetPath, processed.buffer)
  return cacheBustedUrl(`/api/uploads/avatars/${filename}`)
}

async function deleteManagedAvatar(avatarUrl) {
  if (!isManagedAvatarUrl(avatarUrl)) return

  const filename = filenameFromManagedUrl(avatarUrl)
  if (!filename) return

  if (isLocalMode()) {
    const targetPath = path.join(LOCAL_DIR, filename)
    try {
      await fs.promises.unlink(targetPath)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
    return
  }

  const base = publicBaseUrl()
  const key = filename ? `avatars/${filename}` : avatarUrl.split('?')[0].slice(base.length + 1)
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
