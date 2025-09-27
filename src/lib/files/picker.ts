import { Alert, Platform } from 'react-native';
import DocumentPicker, { types as DocumentTypes } from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type VideoSource = 'device' | 'shareSheet' | 'filePicker';

export type PickedVideo = {
  uri: string;
  name: string;
  type?: string | null;
  source: VideoSource;
};

const getLibraryPermission = (): string => {
  if (Platform.OS === 'android') {
    return Platform.Version >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
  }
  return PERMISSIONS.IOS.PHOTO_LIBRARY;
};

const ensureLibraryPermission = async (): Promise<boolean> => {
  const permission = getLibraryPermission();
  const status = await check(permission);
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return true;
  }
  const requestResult = await request(permission);
  return requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED;
};

export const pickVideosFromFilePicker = async (): Promise<PickedVideo[]> => {
  try {
    const results = await DocumentPicker.pickMultiple({
      type: [DocumentTypes.video],
      allowMultiSelection: true,
      presentationStyle: 'fullScreen',
    });
    return results.map((item) => ({
      uri: item.uri,
      name: item.name ?? 'video',
      type: item.type,
      source: 'filePicker',
    }));
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      return [];
    }
    throw error;
  }
};

export const pickVideosFromLibrary = async (): Promise<PickedVideo[]> => {
  const granted = await ensureLibraryPermission();
  if (!granted) {
    Alert.alert(
      'Permission needed',
      'We need access to your media library to import videos. You can enable permissions from settings.',
    );
    return [];
  }
  const result = await launchImageLibrary({
    mediaType: 'video',
    selectionLimit: 0,
    includeExtra: true,
  });
  if (result.didCancel || !result.assets) {
    return [];
  }
  return result.assets
    .filter((asset) => !!asset.uri)
    .map((asset) => ({
      uri: asset.uri!,
      name: asset.fileName ?? 'video',
      type: asset.type,
      source: 'device',
    }));
};
