export type ThumbnailRequest = {
  videoId: string;
  localPath: string;
};

export const queueThumbnailGeneration = (_request: ThumbnailRequest): Promise<void> => {
  // Thumbnail generation is out of scope for v1. This is a stub that allows
  // the future implementation to hook into the import pipeline.
  return Promise.resolve();
};
