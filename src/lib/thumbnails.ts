import { Capacitor } from '@capacitor/core';
import { VideoEditor } from '@whiteguru/capacitor-plugin-video-editor';
import { getThumbnailPath, thumbnailExists } from './filePaths';

export interface ThumbnailResult {
  path: string;
  src: string;
}

/**
 * Capture thumbnail at specific time using VideoEditor plugin
 */
export async function captureAt(uri: string, seconds: number, width = 480): Promise<ThumbnailResult> {
  try {
    const at = Math.max(0, Math.round(seconds * 1000)); // Convert to milliseconds
    
    const result = await VideoEditor.thumbnail({
      path: uri,
      at,
      width,
    });

    return {
      path: result.file.path,
      src: Capacitor.convertFileSrc(result.file.path),
    };
  } catch (error) {
    console.error('Error capturing thumbnail:', error);
    throw new Error('Failed to capture thumbnail');
  }
}

/**
 * Generate default thumbnail at video midpoint
 */
export async function generateDefaultThumbnail(
  videoId: string, 
  uri: string, 
  durationMs: number,
  width = 480
): Promise<string> {
  try {
    // Generate thumbnail at midpoint
    const midpointSeconds = (durationMs / 1000) / 2;
    const thumbnail = await captureAt(uri, midpointSeconds, width);
    
    // Save to app data directory
    const thumbnailPath = getThumbnailPath(videoId);
    
    // Copy the generated thumbnail to our app directory
    // Note: This might need platform-specific handling
    await saveThumbnailFromPath(videoId, thumbnail.path);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating default thumbnail:', error);
    throw error;
  }
}

/**
 * Save thumbnail from a temporary path to app data
 */
async function saveThumbnailFromPath(videoId: string, sourcePath: string): Promise<void> {
  try {
    // For now, we'll use the path directly
    // In a real implementation, you might need to copy the file
    const thumbnailPath = getThumbnailPath(videoId);
    
    // This is a simplified implementation
    // In production, you'd copy the file from sourcePath to app data directory
    console.log(`Saving thumbnail from ${sourcePath} to ${thumbnailPath}`);
  } catch (error) {
    console.error('Error saving thumbnail:', error);
    throw error;
  }
}

/**
 * Ensure a video has a default thumbnail
 */
export async function ensureDefaultThumbnail(
  videoId: string,
  uri: string,
  durationMs: number
): Promise<string | null> {
  try {
    // Check if thumbnail already exists
    if (await thumbnailExists(videoId)) {
      return getThumbnailPath(videoId);
    }
    
    // Generate new thumbnail
    return await generateDefaultThumbnail(videoId, uri, durationMs);
  } catch (error) {
    console.error('Error ensuring default thumbnail:', error);
    return null;
  }
}

/**
 * Generate filmstrip thumbnails (6 evenly spaced frames)
 */
export async function generateFilmstrip(
  uri: string,
  durationMs: number,
  width = 240
): Promise<ThumbnailResult[]> {
  const thumbnails: ThumbnailResult[] = [];
  const frameCount = 6;
  
  for (let i = 0; i < frameCount; i++) {
    try {
      // Calculate time position (avoid first and last 5% to skip black frames)
      const progress = (i + 1) / (frameCount + 1);
      const timeSeconds = (durationMs / 1000) * progress;
      
      const thumbnail = await captureAt(uri, timeSeconds, width);
      thumbnails.push(thumbnail);
    } catch (error) {
      console.error(`Error generating filmstrip frame ${i}:`, error);
      // Continue with other frames even if one fails
    }
  }
  
  return thumbnails;
}

/**
 * Update video thumbnail at specific time
 */
export async function updateThumbnail(
  videoId: string,
  uri: string,
  seconds: number,
  width = 480
): Promise<string> {
  try {
    const thumbnail = await captureAt(uri, seconds, width);
    await saveThumbnailFromPath(videoId, thumbnail.path);
    return getThumbnailPath(videoId);
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    throw error;
  }
}

/**
 * Check if VideoEditor plugin is available
 */
export async function isVideoEditorAvailable(): Promise<boolean> {
  try {
    return typeof VideoEditor.thumbnail === 'function';
  } catch {
    return false;
  }
}