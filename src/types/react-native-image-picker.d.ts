declare module 'react-native-image-picker' {
  export interface Asset {
    uri?: string;
    fileName?: string;
    type?: string | null;
  }
  export interface ImageLibraryOptions {
    mediaType?: 'photo' | 'video' | 'mixed';
    selectionLimit?: number;
    includeExtra?: boolean;
  }
  export interface ImagePickerResponse {
    assets?: Asset[] | null;
    didCancel?: boolean;
  }
  export function launchImageLibrary(options: ImageLibraryOptions): Promise<ImagePickerResponse>;
}
