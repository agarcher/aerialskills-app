import Realm from 'realm';
import { createId } from '../utils/id';
import { Marker, Tag, Video, VideoTag } from './models';

export type SortOption = 'createdAt' | 'displayName' | 'filesize';

export type VideoFilter = {
  searchText?: string;
  tagIds?: string[];
  startDate?: number | null;
  endDate?: number | null;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
};

export type VideoInput = {
  id: string;
  importUri: string;
  localPath: string;
  displayName: string;
  filesize?: number;
  durationMs?: number | null;
  createdAt: number;
  notes?: string | null;
  source: string;
  contentSignature: string;
};

export type VideoWithRelations = Video & {
  tagList: Tag[];
};

export const toPlainVideo = (video: Video): VideoWithRelations => {
  const tagList = video.tags.map((videoTag) => videoTag.tag);
  return Object.assign(video, { tagList });
};

export const findVideoBySignature = (realm: Realm, signature: string): Video | undefined => {
  return realm.objects(Video).find((video) => video.contentSignature === signature);
};

export const createVideo = (realm: Realm, input: VideoInput): Video => {
  let video: Video;
  realm.write(() => {
    video = realm.create(
      Video,
      {
        ...input,
        markers: [],
      },
      Realm.UpdateMode.Never,
    );
  });
  // @ts-expect-error video assigned in write
  return video!;
};

export const upsertTag = (realm: Realm, label: string, type?: Tag['type']): Tag => {
  const normalized = label.trim();
  const existing = realm.objects(Tag).find((tag) => tag.label.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    return existing;
  }
  let created: Tag;
  realm.write(() => {
    created = realm.create(
      Tag,
      {
        id: createId(),
        label: normalized,
        type,
      },
      Realm.UpdateMode.Never,
    );
  });
  // @ts-expect-error created assigned in write
  return created!;
};

export const attachTagToVideo = (realm: Realm, video: Video, tag: Tag): void => {
  const exists = video.tags.find((entry) => entry.tag.id === tag.id);
  if (exists) {
    return;
  }
  realm.write(() => {
    realm.create(
      VideoTag,
      {
        id: createId(),
        video,
        tag,
      },
      Realm.UpdateMode.Never,
    );
  });
};

export const detachTagFromVideo = (realm: Realm, video: Video, tagId: string): void => {
  const match = video.tags.find((entry) => entry.tag.id === tagId);
  if (!match) {
    return;
  }
  realm.write(() => {
    realm.delete(match);
  });
};

export const updateVideoNotes = (realm: Realm, videoId: string, notes: string): void => {
  const video = realm.objectForPrimaryKey(Video, videoId);
  if (!video) {
    return;
  }
  realm.write(() => {
    video.notes = notes;
  });
};

export const updateVideoDuration = (realm: Realm, videoId: string, durationMs: number): void => {
  const video = realm.objectForPrimaryKey(Video, videoId);
  if (!video) {
    return;
  }
  realm.write(() => {
    video.durationMs = durationMs;
  });
};

export const listTags = (realm: Realm): Tag[] => Array.from(realm.objects(Tag).sorted('label'));

export const queryVideos = (realm: Realm, filter: VideoFilter = {}): Video[] => {
  const {
    searchText,
    tagIds,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = sortBy === 'displayName' ? 'asc' : 'desc',
  } = filter;

  const allVideos = Array.from(realm.objects(Video));

  const filtered = allVideos.filter((video) => {
    if (searchText && searchText.trim().length > 0) {
      const query = searchText.trim().toLowerCase();
      const tagsMatch = video.tags.some((entry) => entry.tag.label.toLowerCase().includes(query));
      const textMatch =
        video.displayName.toLowerCase().includes(query) ||
        (video.notes ?? '').toLowerCase().includes(query);
      if (!textMatch && !tagsMatch) {
        return false;
      }
    }
    if (tagIds && tagIds.length > 0) {
      const hasTag = video.tags.some((entry) => tagIds.includes(entry.tag.id));
      if (!hasTag) {
        return false;
      }
    }
    if (startDate && video.createdAt < startDate) {
      return false;
    }
    if (endDate && video.createdAt > endDate) {
      return false;
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const direction = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'displayName') {
      return direction * a.displayName.localeCompare(b.displayName);
    }
    if (sortBy === 'filesize') {
      const sizeA = a.filesize ?? 0;
      const sizeB = b.filesize ?? 0;
      return direction * (sizeA - sizeB);
    }
    return direction * (a.createdAt - b.createdAt);
  });

  return sorted;
};

export const addMarker = (
  realm: Realm,
  videoId: string,
  marker: Pick<Marker, 'tStartMs' | 'tEndMs' | 'notes'>,
): Marker | undefined => {
  const video = realm.objectForPrimaryKey(Video, videoId);
  if (!video) {
    return undefined;
  }
  let created: Marker;
  realm.write(() => {
    created = realm.create(
      Marker,
      {
        id: createId(),
        video,
        tStartMs: marker.tStartMs,
        tEndMs: marker.tEndMs ?? null,
        notes: marker.notes ?? null,
      },
      Realm.UpdateMode.Never,
    );
    video.markers.push(created);
  });
  // @ts-expect-error assigned
  return created!;
};

export const removeMarker = (realm: Realm, markerId: string): void => {
  const marker = realm.objectForPrimaryKey(Marker, markerId);
  if (!marker) {
    return;
  }
  realm.write(() => {
    realm.delete(marker);
  });
};

export const deleteVideo = (realm: Realm, videoId: string): void => {
  const video = realm.objectForPrimaryKey(Video, videoId);
  if (!video) {
    return;
  }
  realm.write(() => {
    const videoTags = Array.from(realm.objects(VideoTag)).filter((entry) => entry.video.id === video.id);
    realm.delete(videoTags);
    realm.delete(video.markers);
    realm.delete(video);
  });
};
