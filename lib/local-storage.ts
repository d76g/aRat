import { promises as fs } from 'fs'
import path from 'path'
import logger from './logger'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/prieelo/uploads'
const BASE_URL = process.env.BASE_URL || 'https://prieelo.com'

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    logger.info('Created upload directory', { uploadDir: UPLOAD_DIR })
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
    
    logger.info('File uploaded locally', { filePath, relativePath, contentType })
    
    // Return relative path for database storage (compatible with S3 key format)
    return relativePath
  } catch (error) {
    logger.error('Error uploading file locally', { error: (error as Error)?.message })
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
    logger.info('File deleted', { fullPath })
  } catch (error) {
    logger.warn('Error deleting file (ignored)', { relativePath, error: (error as Error)?.message })
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
    logger.info('File renamed', { oldPath, newPath })
    
    return newPath
  } catch (error) {
    logger.error('Error renaming file', { oldPath, newPath, error: (error as Error)?.message })
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
    logger.warn('Error getting file stats', { relativePath, error: (error as Error)?.message })
    return null
  }
}
