import { createRealmContext } from '@realm/react';
import Realm from 'realm';
import { Collection, Marker, Tag, Video, VideoTag, schemas } from './models';

const SCHEMA_VERSION = 1;

export type RealmObjects = {
  Video: Video;
  Tag: Tag;
  VideoTag: VideoTag;
  Marker: Marker;
  Collection: Collection;
};

const realmConfig: Realm.Configuration = {
  schema: schemas,
  schemaVersion: SCHEMA_VERSION,
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 1) {
      const videos = newRealm.objects<Video>('Video');
      for (const video of videos) {
        if (!video.contentSignature) {
          video.contentSignature = `${video.importUri}|${video.localPath}`;
        }
      }
    }
  },
};

export const RealmContext = createRealmContext<RealmObjects>({
  schema: schemas,
  schemaVersion: SCHEMA_VERSION,
  onMigration: realmConfig.onMigration,
});

export const RealmProvider = RealmContext.RealmProvider;
export const useRealm = RealmContext.useRealm;
export const useQuery = RealmContext.useQuery;
export const useObject = RealmContext.useObject;

export const openRealm = (): Promise<Realm> => Realm.open(realmConfig);
