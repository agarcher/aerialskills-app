import RNFS from 'react-native-fs';

const VIDEO_DIR_NAME = 'videos';

export const getAppDataDirectory = (): string => RNFS.DocumentDirectoryPath;

export const getVideoDirectory = (): string => `${getAppDataDirectory()}/${VIDEO_DIR_NAME}`;

export const ensureVideoDirectory = async (): Promise<string> => {
  const dir = getVideoDirectory();
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
  return dir;
};

export const buildVideoPath = (filename: string): string => `${getVideoDirectory()}/${filename}`;
