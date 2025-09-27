import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

export type VideoMetadata = {
  filesize?: number;
  createdAt: number;
  durationMs?: number | null;
};

const { VideoMetadataModule } = NativeModules;

const tryFetchDuration = async (path: string): Promise<number | null> => {
  if (VideoMetadataModule?.getDurationMs) {
    try {
      const value = await VideoMetadataModule.getDurationMs(path);
      if (typeof value === 'number' && value > 0) {
        return value;
      }
    } catch (error) {
      console.warn('Failed to read duration', error);
    }
  }
  return null;
};

export const extractVideoMetadata = async (path: string): Promise<VideoMetadata> => {
  const stat = await RNFS.stat(path);
  const createdAt = stat.ctime ? new Date(stat.ctime).getTime() : Date.now();
  const durationMs = await tryFetchDuration(path);
  return {
    filesize: stat.size,
    createdAt,
    durationMs,
  };
};

export const buildContentSignature = async (path: string, importUri: string): Promise<string> => {
  const stat = await RNFS.stat(path);
  const parts = [importUri, String(stat.size)];
  if (stat.mtime) {
    parts.push(String(new Date(stat.mtime).getTime()));
  }
  return parts.join('|');
};
