import { FilePicker } from "@capawesome/capacitor-file-picker";

export interface PickedVideo {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

/**
 * Pick video files using the native file picker
 */
export async function pickVideos(): Promise<PickedVideo[]> {
  try {
    const result = await FilePicker.pickVideos({
      readData: false, // We don't need the data, just the file reference
    });

    return result.files.map((file) => {
      console.log("FilePicker file object:", {
        path: file.path,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
      });

      const uri = file.path || file.name;
      console.log("Selected URI:", uri);

      return {
        uri,
        name: file.name || "Unknown Video",
        size: file.size,
        mimeType: file.mimeType,
      };
    });
  } catch (error) {
    console.error("Error picking videos:", error);
    throw new Error("Failed to pick videos. Please try again.");
  }
}

/**
 * Pick a single video file
 */
export async function pickSingleVideo(): Promise<PickedVideo | null> {
  try {
    const result = await FilePicker.pickVideos({
      readData: false,
      limit: 1, // Limit to single video selection
    });

    const file = result.files[0];
    if (!file) return null;

    return {
      uri: file.path || file.name,
      name: file.name || "Unknown Video",
      size: file.size,
      mimeType: file.mimeType,
    };
  } catch (error: any) {
    console.error("Error picking video:", error);
    if (
      error?.message?.includes("User cancelled") ||
      error?.message?.includes("cancelled")
    ) {
      return null; // User cancelled, not an error
    }
    throw new Error("Failed to pick video. Please try again.");
  }
}

/**
 * Check if the file picker is available on the current platform
 */
export async function isFilePickerAvailable(): Promise<boolean> {
  try {
    // Check if FilePicker is available
    return typeof FilePicker.pickVideos === "function";
  } catch {
    return false;
  }
}
