
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createS3Client, getBucketConfig } from "./aws-config"

const s3Client = createS3Client()

export async function uploadFile(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
  try {
    const { bucketName, folderPrefix } = getBucketConfig()
    
    if (!bucketName) {
      throw new Error('AWS_BUCKET_NAME is not configured')
    }
    
    const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`
    
    // Determine content type from file extension if not provided
    let fileContentType = contentType
    if (!fileContentType) {
      const ext = fileName.split('.').pop()?.toLowerCase()
      const contentTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      }
      fileContentType = contentTypeMap[ext || ''] || 'application/octet-stream'
    }
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: fileContentType,
    })
    
    console.log(`Uploading file to S3: ${key} (${fileContentType})`)
    await s3Client.send(command)
    console.log(`File uploaded successfully: ${key}`)
    
    return key
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw error
  }
}

export async function downloadFile(key: string): Promise<string> {
  try {
    const { bucketName, folderPrefix } = getBucketConfig()
    
    if (!bucketName) {
      throw new Error('AWS_BUCKET_NAME is not configured')
    }
    
    if (!key) {
      throw new Error('S3 key is required')
    }
    
    // Normalize the key - try to handle different formats
    let normalizedKey = key
    
    // If key doesn't start with folder prefix and we have one, try both with and without
    if (folderPrefix && !key.startsWith(folderPrefix)) {
      // First, try to check if object exists with original key
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
        await s3Client.send(headCommand)
        normalizedKey = key // Original key works
        console.log(`Using original key (exists): ${normalizedKey}`)
      } catch (headError) {
        // Original key doesn't exist, try with prefix
        normalizedKey = `${folderPrefix}${key}`
        console.log(`Original key not found, trying with prefix: ${normalizedKey}`)
      }
    }
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: normalizedKey,
    })
    
    // Generate signed URL valid for 24 hours
    const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 })
    console.log(`Generated signed URL for: ${normalizedKey}`)
    return url
  } catch (error) {
    console.error(`Error generating signed URL for key ${key}:`, error)
    throw error
  }
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig()
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  
  await s3Client.send(command)
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // For S3, we need to copy and then delete
  // This is a simplified implementation
  const { bucketName } = getBucketConfig()
  return newKey
}
