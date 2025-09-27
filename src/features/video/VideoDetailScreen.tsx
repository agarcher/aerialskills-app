import Realm from 'realm';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import VideoPlayer, { OnLoadData, OnProgressData } from 'react-native-video';
import { useObject, useRealm } from '../../lib/db/realm';
import { Marker, Video } from '../../lib/db/models';
import { addMarker, updateVideoDuration } from '../../lib/db/repositories';
import type { RootStackParamList } from '../../app/navigation/types';
import { useAppTheme } from '../../styles/theme';
import { formatDuration, formatFileSize } from '../../lib/utils/time';
import TagEditor from './TagEditor';
import NotesEditor from './NotesEditor';
import { showToast } from '../../lib/utils/toasts';

const VideoDetailScreen = ({ route }: NativeStackScreenProps<RootStackParamList, 'VideoDetail'>): JSX.Element => {
  const { videoId } = route.params;
  const theme = useAppTheme();
  const video = useObject(Video, videoId);
  const realm = useRealm();
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const playerRef = useRef<VideoPlayer | null>(null);

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      const durationMs = Math.round(data.duration * 1000);
      if (video && (!video.durationMs || Math.abs(video.durationMs - durationMs) > 1000)) {
        updateVideoDuration(realm, video.id, durationMs);
      }
    },
    [realm, video],
  );

  const handleProgress = useCallback((data: OnProgressData) => {
    setCurrentTimeMs(Math.round(data.currentTime * 1000));
  }, []);

  const handleAddBookmark = useCallback(() => {
    if (!video) {
      return;
    }
    const marker = addMarker(realm, video.id, { tStartMs: currentTimeMs, tEndMs: null, notes: null });
    if (marker) {
      showToast('Bookmark added');
    }
  }, [currentTimeMs, realm, video]);

  if (!video) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}> 
        <Text style={{ color: theme.colors.text }}>Video not found.</Text>
      </View>
    );
  }

  const markers = video.markers as Realm.List<Marker>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{video.displayName}</Text>
      <View style={styles.playerWrapper}>
        <VideoPlayer
          ref={(ref) => {
            playerRef.current = ref;
          }}
          source={{ uri: video.localPath }}
          style={styles.player}
          controls
          onLoad={handleLoad}
          onProgress={handleProgress}
          paused={false}
          resizeMode="contain"
        />
      </View>
      <View style={[styles.metaContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.metaLine, { color: theme.colors.muted }]}>Source: {video.source}</Text>
        <Text style={[styles.metaLine, { color: theme.colors.muted }]}>Size: {formatFileSize(video.filesize)}</Text>
        <Text style={[styles.metaLine, { color: theme.colors.muted }]}>Duration: {formatDuration(video.durationMs)}</Text>
        <Text style={[styles.metaLine, { color: theme.colors.muted }]}>Imported: {new Date(video.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: theme.colors.accent }]} onPress={handleAddBookmark}>
        <Text style={styles.bookmarkLabel}>Add bookmark at {formatDuration(currentTimeMs)}</Text>
      </TouchableOpacity>
      {markers.length > 0 && (
        <View style={styles.markerList}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bookmarks</Text>
          {markers.map((marker) => (
            <View key={marker.id} style={[styles.markerRow, { backgroundColor: theme.colors.surface }]}> 
              <Text style={{ color: theme.colors.text }}>{formatDuration(marker.tStartMs)}</Text>
              {marker.notes ? <Text style={{ color: theme.colors.muted }}>{marker.notes}</Text> : null}
            </View>
          ))}
        </View>
      )}
      <TagEditor video={video} />
      <NotesEditor video={video} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  playerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    aspectRatio: 16 / 9,
  },
  player: {
    flex: 1,
  },
  metaContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  metaLine: {
    fontSize: 14,
  },
  bookmarkButton: {
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookmarkLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  markerList: {
    gap: 8,
  },
  markerRow: {
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VideoDetailScreen;
