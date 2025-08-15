import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const THUMBNAILS_DIR = 'thumbnails';

/**
 * Ensure the thumbnails directory exists
 */
export async function ensureThumbnailsDir(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: THUMBNAILS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    // Directory might already exist, ignore error
    console.log('Thumbnails directory already exists or could not be created:', error);
  }
}

/**
 * Get the path for a video thumbnail
 */
export function getThumbnailPath(videoId: string): string {
  return `${THUMBNAILS_DIR}/${videoId}.jpg`;
}

/**
 * Get the full file URI for a thumbnail
 */
export async function getThumbnailUri(videoId: string): Promise<string> {
  const path = getThumbnailPath(videoId);
  
  try {
    // Return the full URI that can be used in img src
    const uri = await Filesystem.getUri({
      directory: Directory.Data,
      path,
    });
    
    return Capacitor.convertFileSrc(uri.uri);
  } catch (error) {
    console.error('Error getting thumbnail URI:', error);
    throw error;
  }
}

/**
 * Save thumbnail data to app directory
 */
export async function saveThumbnail(videoId: string, data: string): Promise<string> {
  await ensureThumbnailsDir();
  
  const path = getThumbnailPath(videoId);
  
  await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Data,
  });
  
  return path;
}

/**
 * Delete a thumbnail file
 */
export async function deleteThumbnail(videoId: string): Promise<void> {
  const path = getThumbnailPath(videoId);
  
  try {
    await Filesystem.deleteFile({
      path,
      directory: Directory.Data,
    });
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
  }
}

/**
 * Check if thumbnail exists
 */
export async function thumbnailExists(videoId: string): Promise<boolean> {
  const path = getThumbnailPath(videoId);
  
  try {
    await Filesystem.stat({
      path,
      directory: Directory.Data,
    });
    return true;
  } catch {
    return false;
  }
}