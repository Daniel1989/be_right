import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Base directory for image storage
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// URL path for serving the images
const UPLOADS_URL_PATH = '/uploads';

/**
 * Ensures the upload directory exists
 */
async function ensureUploadDir(subDir: string = ''): Promise<string> {
  const fullPath = path.join(UPLOAD_DIR, subDir);
  
  try {
    await mkdir(fullPath, { recursive: true });
    return fullPath;
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
}

/**
 * Saves a file from a FormData upload to disk
 */
export async function saveFormFile(file: File, subDir: string = ''): Promise<{ url: string, path: string }> {
  try {
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${fileExtension}`;
    
    // Ensure directory exists
    const uploadDir = await ensureUploadDir(subDir);
    const filePath = path.join(uploadDir, filename);
    
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the file
    await writeFile(filePath, buffer);
    
    // Return the URL and local path
    const relativePath = path.join(subDir, filename).replace(/\\/g, '/');
    return {
      url: `${UPLOADS_URL_PATH}/${relativePath}`,
      path: filePath
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save uploaded file');
  }
}

/**
 * Saves a base64 image to disk
 */
export async function saveBase64Image(base64Data: string, subDir: string = ''): Promise<{ url: string, path: string }> {
  try {
    // Generate a unique filename
    const filename = `${uuidv4()}.jpg`;
    
    // Ensure directory exists
    const uploadDir = await ensureUploadDir(subDir);
    const filePath = path.join(uploadDir, filename);
    
    // Convert base64 to buffer
    // Remove data URL prefix if present (e.g., data:image/jpeg;base64,)
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    // Write the file
    await writeFile(filePath, buffer);
    
    // Return the URL and local path
    const relativePath = path.join(subDir, filename).replace(/\\/g, '/');
    return {
      url: `${UPLOADS_URL_PATH}/${relativePath}`,
      path: filePath
    };
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw new Error('Failed to save base64 image');
  }
} 