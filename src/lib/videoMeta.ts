import { Capacitor } from "@capacitor/core";

export interface VideoMetadata {
  duration: number; // in milliseconds
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
}

/**
 * Get video metadata using HTML video element
 */
export async function getVideoMetadata(uri: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
      video.remove();
    };

    const onLoadedMetadata = () => {
      try {
        const metadata: VideoMetadata = {
          duration: video.duration * 1000, // Convert to milliseconds
          width: video.videoWidth,
          height: video.videoHeight,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        };

        cleanup();
        resolve(metadata);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error("Failed to load video metadata"));
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("error", onError);

    // Set the source - convert file URI for Capacitor if needed
    const convertedSrc = Capacitor.convertFileSrc(uri);
    console.log("getVideoMetadata - Original URI:", uri);
    console.log("getVideoMetadata - Converted src:", convertedSrc);
    video.src = convertedSrc;

    // Add to DOM temporarily (hidden) to ensure it loads
    video.style.position = "absolute";
    video.style.visibility = "hidden";
    video.style.width = "1px";
    video.style.height = "1px";
    document.body.appendChild(video);

    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      reject(new Error("Timeout loading video metadata"));
    }, 10000);
  });
}

/**
 * Get video duration only (faster than full metadata)
 */
export async function getVideoDuration(uri: string): Promise<number> {
  const metadata = await getVideoMetadata(uri);
  return metadata.duration;
}

/**
 * Check if a file is a valid video by attempting to load its metadata
 */
export async function isValidVideo(uri: string): Promise<boolean> {
  try {
    await getVideoMetadata(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a hash for a video based on its URI and metadata
 */
export function createVideoHash(
  uri: string,
  size?: number,
  duration?: number
): string {
  const hashInput = `${uri}|${size || 0}|${duration || 0}`;

  // Simple hash function (for production, consider using crypto-js)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
