import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export const THUMBNAILS_DIR = "thumbnails";
export const VIDEOS_DIR = "videos";

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
    console.log(
      "Thumbnails directory already exists or could not be created:",
      error
    );
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
    console.error("Error getting thumbnail URI:", error);
    throw error;
  }
}

/**
 * Save thumbnail data to app directory
 */
export async function saveThumbnail(
  videoId: string,
  data: string
): Promise<string> {
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
    console.error("Error deleting thumbnail:", error);
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

// === VIDEO FILE MANAGEMENT ===

/**
 * Ensure the videos directory exists
 */
export async function ensureVideosDir(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: VIDEOS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    // Directory might already exist, ignore error
    console.log(
      "Videos directory already exists or could not be created:",
      error
    );
  }
}

/**
 * Get the path for a video file in app storage
 */
export function getVideoPath(videoId: string, originalName: string): string {
  // Extract file extension from original name
  const extension = originalName.split(".").pop() || "mov";
  return `${VIDEOS_DIR}/${videoId}.${extension}`;
}

/**
 * Copy a video file from temporary location to permanent app storage
 */
export async function copyVideoToAppStorage(
  videoId: string,
  sourceUri: string,
  originalName: string
): Promise<string> {
  await ensureVideosDir();

  const destinationPath = getVideoPath(videoId, originalName);

  try {
    console.log("Copying video from:", sourceUri);
    console.log("To app storage path:", destinationPath);

    // Copy the file to app's permanent storage
    await Filesystem.copy({
      from: sourceUri,
      to: destinationPath,
      directory: Directory.Data,
    });

    // Return the full URI for the copied file
    const uri = await Filesystem.getUri({
      directory: Directory.Data,
      path: destinationPath,
    });

    console.log("Video copied successfully to:", uri.uri);
    return uri.uri;
  } catch (error) {
    console.error("Error copying video to app storage:", error);
    throw new Error(`Failed to copy video to app storage: ${error}`);
  }
}

/**
 * Delete a video file from app storage
 */
export async function deleteVideoFromAppStorage(
  videoId: string,
  originalName: string
): Promise<void> {
  const path = getVideoPath(videoId, originalName);

  try {
    await Filesystem.deleteFile({
      path,
      directory: Directory.Data,
    });
    console.log("Video deleted from app storage:", path);
  } catch (error) {
    console.error("Error deleting video from app storage:", error);
  }
}

/**
 * Check if video exists in app storage
 */
export async function videoExistsInAppStorage(
  videoId: string,
  originalName: string
): Promise<boolean> {
  const path = getVideoPath(videoId, originalName);

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
