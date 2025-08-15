import { WebPlugin } from '@capacitor/core';
import type { ConvertHeicToJpegOptions, ConvertHeicToJpegResult, FilePickerPlugin, PickFilesOptions, PickFilesResult, PickImagesOptions, PickImagesResult, PickMediaOptions, PickMediaResult, PickVideosOptions, PickVideosResult } from './definitions';
export declare class FilePickerWeb extends WebPlugin implements FilePickerPlugin {
    readonly ERROR_PICK_FILE_CANCELED = "pickFiles canceled.";
    convertHeicToJpeg(_options: ConvertHeicToJpegOptions): Promise<ConvertHeicToJpegResult>;
    pickFiles(options?: PickFilesOptions): Promise<PickFilesResult>;
    pickImages(options?: PickImagesOptions): Promise<PickImagesResult>;
    pickMedia(options?: PickMediaOptions): Promise<PickMediaResult>;
    pickVideos(options?: PickVideosOptions): Promise<PickVideosResult>;
    private openFilePicker;
    private getDataFromFile;
    private getNameFromUrl;
    private getMimeTypeFromUrl;
    private getSizeFromUrl;
    private wait;
}
