import { createId } from '../src/lib/utils/id';
import { Marker, Tag, Video, VideoTag } from '../src/lib/db/models';
import {
  addMarker,
  attachTagToVideo,
  createVideo,
  deleteVideo,
  listTags,
  queryVideos,
  updateVideoNotes,
  upsertTag,
} from '../src/lib/db/repositories';

type SchemaName = 'Video' | 'Tag' | 'VideoTag' | 'Marker';

type Store = {
  Video: Video[];
  Tag: Tag[];
  VideoTag: VideoTag[];
  Marker: Marker[];
};

class MockResults<T> implements Iterable<T> {
  constructor(private _realm: MockRealm, private collection: SchemaName, private items: T[]) {}

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }

  map<U>(callback: (item: T) => U): U[] {
    return this.items.map(callback);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  some(predicate: (item: T) => boolean): boolean {
    return this.items.some(predicate);
  }

  sorted(key: keyof T): MockResults<T> {
    const sorted = [...this.items].sort((a, b) => {
      const valueA = a[key] as unknown as string;
      const valueB = b[key] as unknown as string;
      return valueA.localeCompare(valueB);
    });
    return new MockResults(this._realm, this.collection, sorted);
  }

  get realm(): MockRealm {
    return this._realm;
  }
}

class MockRealm {
  data: Store = {
    Video: [],
    Tag: [],
    VideoTag: [],
    Marker: [],
  };

  write(callback: () => void): void {
    callback();
  }

  create<T>(schema: { name: SchemaName }, values: any): T {
    const collection = schema.name;
    const instance = { ...values };
    if (collection === 'Video') {
      instance.tags = instance.tags ?? [];
      instance.markers = instance.markers ?? [];
    }
    if (collection === 'Tag') {
      instance.videos = instance.videos ?? [];
    }
    if (collection === 'VideoTag') {
      instance.video.tags.push(instance);
      instance.tag.videos.push(instance);
    }
    this.data[collection].push(instance);
    return instance as T;
  }

  objects<T>(schema: { name: SchemaName } | SchemaName): MockResults<T> {
    const name = typeof schema === 'string' ? schema : schema.name;
    return new MockResults<T>(this, name, this.data[name] as unknown as T[]);
  }

  objectForPrimaryKey<T>(schema: { name: SchemaName }, id: string): T | undefined {
    const collection = schema.name;
    return this.data[collection].find((item) => item.id === id) as unknown as T | undefined;
  }

  delete(target: any): void {
    if (Array.isArray(target)) {
      target.forEach((item) => this.delete(item));
      return;
    }
    const collection = this.getCollectionName(target);
    if (!collection) {
      return;
    }
    const list = this.data[collection];
    const index = list.indexOf(target);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }

  refresh(): Promise<void> {
    return Promise.resolve();
  }

  private getCollectionName(instance: any): SchemaName | undefined {
    if ('localPath' in instance) {
      return 'Video';
    }
    if ('tStartMs' in instance) {
      return 'Marker';
    }
    if ('video' in instance && 'tag' in instance) {
      return 'VideoTag';
    }
    if ('label' in instance) {
      return 'Tag';
    }
    return undefined;
  }
}

describe('repositories', () => {
  let realm: MockRealm;

  beforeEach(() => {
    realm = new MockRealm();
  });

  it('creates and queries videos', () => {
    const video = createVideo(realm as unknown as any, {
      id: createId(),
      importUri: 'file://one.mov',
      localPath: '/app/videos/one.mov',
      displayName: 'Back balance',
      createdAt: 1,
      filesize: 1024,
      durationMs: 2000,
      notes: null,
      source: 'device',
      contentSignature: 'sig',
    });
    expect(video.displayName).toBe('Back balance');

    const results = queryVideos(realm as unknown as any, { searchText: 'back' });
    expect(results).toHaveLength(1);
  });

  it('upserts tags and attaches to videos', () => {
    const tag = upsertTag(realm as unknown as any, 'Spin');
    expect(tag.label).toBe('Spin');

    const video = createVideo(realm as unknown as any, {
      id: createId(),
      importUri: 'file://two.mov',
      localPath: '/app/videos/two.mov',
      displayName: 'Hip key',
      createdAt: 1,
      filesize: 2048,
      durationMs: 3000,
      notes: null,
      source: 'device',
      contentSignature: 'sig-2',
    });

    attachTagToVideo(realm as unknown as any, video, tag);
    expect(video.tags).toHaveLength(1);
    expect(listTags(realm as unknown as any)).toHaveLength(1);
  });

  it('updates notes and adds markers', () => {
    const video = createVideo(realm as unknown as any, {
      id: createId(),
      importUri: 'file://three.mov',
      localPath: '/app/videos/three.mov',
      displayName: 'Drops',
      createdAt: 1,
      filesize: 4096,
      durationMs: 4000,
      notes: null,
      source: 'device',
      contentSignature: 'sig-3',
    });

    updateVideoNotes(realm as unknown as any, video.id, 'Remember wrap direction');
    expect(video.notes).toBe('Remember wrap direction');

    const marker = addMarker(realm as unknown as any, video.id, { tStartMs: 1000, tEndMs: null, notes: null });
    expect(marker).toBeTruthy();
    expect(video.markers).toHaveLength(1);
  });

  it('removes videos and linked tags', () => {
    const video = createVideo(realm as unknown as any, {
      id: createId(),
      importUri: 'file://four.mov',
      localPath: '/app/videos/four.mov',
      displayName: 'Sequence',
      createdAt: 1,
      filesize: 2048,
      durationMs: 5000,
      notes: null,
      source: 'device',
      contentSignature: 'sig-4',
    });
    const tag = upsertTag(realm as unknown as any, 'Combo');
    attachTagToVideo(realm as unknown as any, video, tag);

    deleteVideo(realm as unknown as any, video.id);
    expect(queryVideos(realm as unknown as any, {})).toHaveLength(0);
  });
});
