declare module 'react-native-document-picker' {
  export const types: {
    video: string;
  };
  export interface DocumentPickerOptions {
    type?: string[];
    allowMultiSelection?: boolean;
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet';
  }
  export interface DocumentPickerResult {
    uri: string;
    name?: string;
    type?: string | null;
  }
  export function pickMultiple(options: DocumentPickerOptions): Promise<DocumentPickerResult[]>;
  export function isCancel(error: unknown): boolean;
}
