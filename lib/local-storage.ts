import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/prieelo/uploads'
const BASE_URL = process.env.BASE_URL || 'https://prieelo.com'

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    console.log(`Created upload directory: ${UPLOAD_DIR}`)
  }
}

export async function uploadFile(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
  try {
    await ensureUploadDir()
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`
    
    // Create year/month subdirectory for organization
    const now = new Date()
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
    const subDir = path.join(UPLOAD_DIR, yearMonth)
    
    await fs.mkdir(subDir, { recursive: true })
    
    const filePath = path.join(subDir, uniqueFileName)
    const relativePath = path.join(yearMonth, uniqueFileName)
    
    // Write file to disk
    await fs.writeFile(filePath, buffer)
    
    console.log(`File uploaded locally: ${filePath}`)
    
    // Return relative path for database storage (compatible with S3 key format)
    return relativePath
  } catch (error) {
    console.error('Error uploading file locally:', error)
    throw error
  }
}

export async function getFileUrl(relativePath: string): Promise<string> {
  if (!relativePath) {
    throw new Error('File path is required')
  }
  
  // If it's already a full URL, return as-is
  if (relativePath.startsWith('http')) {
    return relativePath
  }
  
  // Return public URL for the file
  return `${BASE_URL}/api/uploads/${relativePath}`
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOAD_DIR, relativePath)
    await fs.unlink(fullPath)
    console.log(`File deleted: ${fullPath}`)
  } catch (error) {
    console.error(`Error deleting file ${relativePath}:`, error)
    // Don't throw - file might already be deleted
  }
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(UPLOAD_DIR, relativePath)
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

export async function renameFile(oldPath: string, newPath: string): Promise<string> {
  try {
    const oldFullPath = path.join(UPLOAD_DIR, oldPath)
    const newFullPath = path.join(UPLOAD_DIR, newPath)
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(newFullPath), { recursive: true })
    
    await fs.rename(oldFullPath, newFullPath)
    console.log(`File renamed: ${oldPath} -> ${newPath}`)
    
    return newPath
  } catch (error) {
    console.error(`Error renaming file ${oldPath} to ${newPath}:`, error)
    throw error
  }
}

// Helper function to get file stats
export async function getFileStats(relativePath: string) {
  try {
    const fullPath = path.join(UPLOAD_DIR, relativePath)
    const stats = await fs.stat(fullPath)
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile()
    }
  } catch (error) {
    console.error(`Error getting file stats for ${relativePath}:`, error)
    return null
  }
}
