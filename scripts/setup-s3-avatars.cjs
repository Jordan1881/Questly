#!/usr/bin/env node
/**
 * One-time Questly avatar storage setup on AWS S3 + IAM.
 *
 * Requires admin-ish credentials (S3 + IAM) in the environment:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   optional: AWS_REGION or S3_REGION (default us-east-1)
 *   optional: S3_BUCKET (default questly-avatars-<accountId slice>)
 *
 * Usage:
 *   node scripts/setup-s3-avatars.cjs
 *   S3_BUCKET=my-unique-bucket node scripts/setup-s3-avatars.cjs
 *
 * Prints Railway env vars at the end.
 */

const path = require('path')
const {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
} = require(path.join(__dirname, '../server/node_modules/@aws-sdk/client-s3'))
const {
  IAMClient,
  GetUserCommand,
  CreateUserCommand,
  PutUserPolicyCommand,
  CreateAccessKeyCommand,
} = require(path.join(__dirname, '../server/node_modules/@aws-sdk/client-iam'))
const { STSClient, GetCallerIdentityCommand } = require(
  path.join(__dirname, '../server/node_modules/@aws-sdk/client-sts'),
)

const REGION = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'
const IAM_USER_NAME = process.env.QUESTLY_IAM_USER || 'questly-avatar-uploader'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name}. Export AWS credentials before running this script.`)
    process.exit(1)
  }
  return value
}

async function bucketExists(client, bucket) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    return true
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false
    if (err.name === 'Forbidden' || err.$metadata?.httpStatusCode === 403) {
      console.error(`Bucket name "${bucket}" may be taken by another AWS account. Pick a different S3_BUCKET.`)
      process.exit(1)
    }
    throw err
  }
}

async function ensureBucket(s3, bucket) {
  if (await bucketExists(s3, bucket)) {
    console.log(`Bucket exists: ${bucket}`)
    return
  }

  const input = { Bucket: bucket }
  if (REGION !== 'us-east-1') {
    input.CreateBucketConfiguration = { LocationConstraint: REGION }
  }

  await s3.send(new CreateBucketCommand(input))
  console.log(`Created bucket: ${bucket} (${REGION})`)
}

async function configurePublicRead(s3, bucket) {
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucket,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    }),
  )
  console.log('Public access block: bucket policy public reads allowed')

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadAvatars',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucket}/avatars/*`,
      },
    ],
  }

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }),
  )
  console.log('Bucket policy applied (public read on avatars/*)')
}

function isIamUserMissing(err) {
  return err.name === 'NoSuchEntity' || err.name === 'NoSuchEntityException'
}

async function ensureIamUploader(iam, bucket) {
  try {
    await iam.send(new GetUserCommand({ UserName: IAM_USER_NAME }))
    console.log(`IAM user exists: ${IAM_USER_NAME}`)
  } catch (err) {
    if (!isIamUserMissing(err)) throw err
    await iam.send(new CreateUserCommand({ UserName: IAM_USER_NAME }))
    console.log(`Created IAM user: ${IAM_USER_NAME}`)
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'QuestlyAvatarUpload',
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:DeleteObject'],
        Resource: `arn:aws:s3:::${bucket}/avatars/*`,
      },
    ],
  }

  await iam.send(
    new PutUserPolicyCommand({
      UserName: IAM_USER_NAME,
      PolicyName: 'QuestlyAvatarUpload',
      PolicyDocument: JSON.stringify(policy),
    }),
  )
  console.log('IAM inline policy attached')

  const { AccessKey } = await iam.send(
    new CreateAccessKeyCommand({ UserName: IAM_USER_NAME }),
  )

  return {
    accessKeyId: AccessKey.AccessKeyId,
    secretAccessKey: AccessKey.SecretAccessKey,
  }
}

async function main() {
  requireEnv('AWS_ACCESS_KEY_ID')
  requireEnv('AWS_SECRET_ACCESS_KEY')

  const sts = new STSClient({ region: REGION })
  const identity = await sts.send(new GetCallerIdentityCommand())
  const accountId = identity.Account
  const bucket = process.env.S3_BUCKET || `questly-avatars-${accountId.slice(-8)}`

  console.log(`AWS account: ${accountId}`)
  console.log(`Region: ${REGION}`)
  console.log(`Bucket: ${bucket}`)
  console.log('')

  const s3 = new S3Client({ region: REGION })
  const iam = new IAMClient({ region: REGION })

  await ensureBucket(s3, bucket)
  await configurePublicRead(s3, bucket)
  const keys = await ensureIamUploader(iam, bucket)

  const publicUrl = `https://${bucket}.s3.${REGION}.amazonaws.com`

  console.log('\n=== Add these to Railway (Questly API service) ===\n')
  console.log(`AVATAR_STORAGE=s3`)
  console.log(`S3_BUCKET=${bucket}`)
  console.log(`S3_REGION=${REGION}`)
  console.log(`S3_ACCESS_KEY_ID=${keys.accessKeyId}`)
  console.log(`S3_SECRET_ACCESS_KEY=${keys.secretAccessKey}`)
  console.log(`S3_PUBLIC_URL=${publicUrl}`)
  console.log('\nRedeploy the API, then upload a profile photo to verify.')
  console.log(`Test URL pattern: ${publicUrl}/avatars/<user-id>.png`)
}

main().catch((err) => {
  console.error('Setup failed:', err.message || err)
  if (err.name === 'AccessDenied') {
    console.error('Credentials need S3 + IAM permissions (CreateBucket, PutBucketPolicy, CreateUser, etc.).')
  }
  process.exit(1)
})
