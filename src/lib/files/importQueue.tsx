import Realm from 'realm';
import EventEmitter from 'eventemitter3';
import React, { PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import RNFS from 'react-native-fs';
import { showError, showToast } from '../utils/toasts';
import { createId } from '../utils/id';
import { buildVideoPath, ensureVideoDirectory } from './paths';
import { buildContentSignature, extractVideoMetadata } from './metadata';
import type { PickedVideo, VideoSource } from './picker';
import { queueThumbnailGeneration } from './thumbnails';
import { useRealm } from '../db/realm';
import {
  createVideo,
  findVideoBySignature,
  type VideoInput,
} from '../db/repositories';

export type ImportJobStatus =
  | 'pending'
  | 'copying'
  | 'processing'
  | 'completed'
  | 'duplicate'
  | 'error'
  | 'cancelled';

export type ImportJob = {
  id: string;
  name: string;
  sourceUri: string;
  source: VideoSource;
  status: ImportJobStatus;
  progress: number;
  error?: string;
  videoId?: string;
};

type QueueEvents = {
  update: (jobs: ImportJob[]) => void;
};

export class VideoImportQueue extends EventEmitter<QueueEvents> {
  private jobs: ImportJob[] = [];

  private processing = false;

  constructor(private readonly realm: Realm) {
    super();
  }

  enqueue = async (items: PickedVideo[]): Promise<void> => {
    if (items.length === 0) {
      return;
    }
    for (const item of items) {
      const job: ImportJob = {
        id: createId(),
        name: item.name,
        sourceUri: item.uri,
        source: item.source,
        status: 'pending',
        progress: 0,
      };
      this.jobs.push(job);
    }
    this.emit('update', [...this.jobs]);
    void this.process();
  };

  cancel = (id: string): void => {
    const job = this.jobs.find((entry) => entry.id === id);
    if (!job) {
      return;
    }
    if (job.status === 'completed' || job.status === 'duplicate') {
      return;
    }
    job.status = 'cancelled';
    job.progress = 1;
    this.emit('update', [...this.jobs]);
  };

  getJobs = (): ImportJob[] => [...this.jobs];

  private async process(): Promise<void> {
    if (this.processing) {
      return;
    }
    this.processing = true;
    try {
      while (true) {
        const nextJob = this.jobs.find((job) => job.status === 'pending');
        if (!nextJob) {
          break;
        }
        await this.handleJob(nextJob);
      }
    } finally {
      this.processing = false;
    }
  }

  private async handleJob(job: ImportJob): Promise<void> {
    if (job.status !== 'pending') {
      return;
    }
    job.status = 'copying';
    job.progress = 0.1;
    this.emit('update', [...this.jobs]);

    try {
      await ensureVideoDirectory();
      const extension = this.getExtension(job.name);
      const destinationPath = buildVideoPath(`${job.id}${extension}`);
      await RNFS.copyFile(job.sourceUri, destinationPath);
      job.progress = 0.4;
      job.status = 'processing';
      this.emit('update', [...this.jobs]);

      const signature = await buildContentSignature(destinationPath, job.sourceUri);
      const existing = findVideoBySignature(this.realm, signature);
      if (existing) {
        job.status = 'duplicate';
        job.progress = 1;
        job.videoId = existing.id;
        this.emit('update', [...this.jobs]);
        showToast('Duplicate video skipped');
        await RNFS.unlink(destinationPath).catch(() => undefined);
        return;
      }

      const metadata = await extractVideoMetadata(destinationPath);
      const input: VideoInput = {
        id: job.id,
        importUri: job.sourceUri,
        localPath: destinationPath,
        displayName: job.name,
        filesize: metadata.filesize,
        durationMs: metadata.durationMs ?? null,
        createdAt: metadata.createdAt,
        notes: null,
        source: job.source,
        contentSignature: signature,
      };
      const video = createVideo(this.realm, input);
      job.status = 'completed';
      job.progress = 1;
      job.videoId = video.id;
      this.emit('update', [...this.jobs]);

      await queueThumbnailGeneration({ videoId: video.id, localPath: destinationPath });
    } catch (error) {
      console.error('Failed to import video', error);
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.progress = 1;
      this.emit('update', [...this.jobs]);
      showError('Failed to import video', job.error);
    }
  }

  private getExtension(name: string): string {
    const index = name.lastIndexOf('.');
    return index !== -1 ? name.slice(index) : '.mp4';
  }
}

const ImportQueueContext = React.createContext<{
  jobs: ImportJob[];
  enqueue: (items: PickedVideo[]) => Promise<void>;
  cancel: (id: string) => void;
} | null>(null);

export const ImportQueueProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const realm = useRealm();
  const queueRef = useRef<VideoImportQueue>();
  const [jobs, setJobs] = useState<ImportJob[]>([]);

  if (!queueRef.current) {
    queueRef.current = new VideoImportQueue(realm);
  }

  useEffect(() => {
    const queue = queueRef.current!;
    const listener = (updated: ImportJob[]) => setJobs(updated);
    queue.on('update', listener);
    setJobs(queue.getJobs());
    return () => {
      queue.off('update', listener);
    };
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      enqueue: queueRef.current!.enqueue,
      cancel: queueRef.current!.cancel,
    }),
    [jobs],
  );

  return <ImportQueueContext.Provider value={value}>{children}</ImportQueueContext.Provider>;
};

export const useImportQueue = (): {
  jobs: ImportJob[];
  enqueue: (items: PickedVideo[]) => Promise<void>;
  cancel: (id: string) => void;
} => {
  const context = useContext(ImportQueueContext);
  if (!context) {
    throw new Error('useImportQueue must be used within ImportQueueProvider');
  }
  return context;
};
