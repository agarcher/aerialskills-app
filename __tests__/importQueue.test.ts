import { Video } from '../src/lib/db/models';
import { VideoImportQueue } from '../src/lib/files/importQueue';
import type { PickedVideo } from '../src/lib/files/picker';

jest.mock('../src/lib/files/metadata', () => ({
  extractVideoMetadata: jest.fn().mockResolvedValue({ filesize: 100, createdAt: 1, durationMs: 2000 }),
  buildContentSignature: jest.fn().mockResolvedValue('signature'),
}));

jest.mock('../src/lib/files/thumbnails', () => ({
  queueThumbnailGeneration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/lib/utils/toasts', () => ({
  showError: jest.fn(),
  showToast: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp/app',
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(undefined),
  copyFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: 100, ctime: new Date(), mtime: new Date() }),
}));

class MockRealm {
  private videos: Video[] = [];

  write(callback: () => void): void {
    callback();
  }

  create(schema: { name: string }, values: any): any {
    if (schema.name === 'Video') {
      const instance = { ...values, tags: [], markers: [] };
      this.videos.push(instance);
      return instance;
    }
    return values;
  }

  objects(_schema?: any): Video[] {
    return this.videos;
  }

  objectForPrimaryKey(_: any, id: string): Video | undefined {
    return this.videos.find((video) => video.id === id);
  }
}

describe('VideoImportQueue', () => {
  it('imports a new video and writes to realm', async () => {
    const realm = new MockRealm();
    const queue = new VideoImportQueue(realm as unknown as any);
    const picked: PickedVideo = { uri: 'file:///source.mov', name: 'Clip', source: 'device' };

    await queue.enqueue([picked]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const jobs = queue.getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe('completed');
    expect(realm.objects()).toHaveLength(1);
  });

  it('marks duplicates when signature already exists', async () => {
    const realm = new MockRealm();
    const queue = new VideoImportQueue(realm as unknown as any);

    realm.create({ name: 'Video' }, {
      id: 'existing',
      importUri: 'file://already',
      localPath: '/tmp/app/videos/existing.mp4',
      displayName: 'Existing clip',
      createdAt: 1,
      filesize: 100,
      durationMs: 2000,
      notes: null,
      source: 'device',
      contentSignature: 'signature',
      markers: [],
      tags: [],
    });

    const picked: PickedVideo = { uri: 'file:///duplicate.mov', name: 'Clip', source: 'device' };
    await queue.enqueue([picked]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const jobs = queue.getJobs();
    expect(jobs[0].status).toBe('duplicate');
  });
});
