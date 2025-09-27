import Realm from 'realm';
import type { VideoSource } from '../files/picker';

export class Tag extends Realm.Object<Tag> {
  id!: string;
  label!: string;
  type?: 'skill' | 'cue' | 'instructor' | 'me';
  videos!: Realm.Results<VideoTag>;

  static schema: Realm.ObjectSchema = {
    name: 'Tag',
    primaryKey: 'id',
    properties: {
      id: 'string',
      label: { type: 'string', indexed: true },
      type: 'string?',
      videos: {
        type: 'linkingObjects',
        objectType: 'VideoTag',
        property: 'tag',
      },
    },
  };
}

export class Marker extends Realm.Object<Marker> {
  id!: string;
  video!: Video;
  tStartMs!: number;
  tEndMs?: number | null;
  notes?: string | null;

  static schema: Realm.ObjectSchema = {
    name: 'Marker',
    primaryKey: 'id',
    properties: {
      id: 'string',
      video: 'Video',
      tStartMs: 'int',
      tEndMs: 'int?',
      notes: 'string?',
    },
  };
}

export class Video extends Realm.Object<Video> {
  id!: string;
  importUri!: string;
  localPath!: string;
  displayName!: string;
  filesize?: number;
  durationMs?: number | null;
  createdAt!: number;
  notes?: string | null;
  source!: VideoSource;
  contentSignature!: string;
  markers!: Realm.List<Marker>;
  tags!: Realm.Results<VideoTag>;

  static schema: Realm.ObjectSchema = {
    name: 'Video',
    primaryKey: 'id',
    properties: {
      id: 'string',
      importUri: 'string',
      localPath: 'string',
      displayName: 'string',
      filesize: 'int?',
      durationMs: 'int?',
      createdAt: 'int',
      notes: 'string?',
      source: 'string',
      contentSignature: 'string',
      markers: { type: 'list', objectType: 'Marker' },
      tags: {
        type: 'linkingObjects',
        objectType: 'VideoTag',
        property: 'video',
      },
    },
  };
}

export class VideoTag extends Realm.Object<VideoTag> {
  id!: string;
  video!: Video;
  tag!: Tag;

  static schema: Realm.ObjectSchema = {
    name: 'VideoTag',
    primaryKey: 'id',
    properties: {
      id: 'string',
      video: 'Video',
      tag: 'Tag',
    },
  };
}

export class Collection extends Realm.Object<Collection> {
  id!: string;
  name!: string;
  videoIds!: string[];

  static schema: Realm.ObjectSchema = {
    name: 'Collection',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: 'string',
      videoIds: 'string[]',
    },
  };
}

export const schemas = [Video, Tag, VideoTag, Marker, Collection];
