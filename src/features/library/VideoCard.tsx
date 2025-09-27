import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Video } from '../../lib/db/models';
import { formatDuration, formatFileSize } from '../../lib/utils/time';
import { useAppTheme } from '../../styles/theme';

export type VideoCardProps = {
  video: Video;
  onPress: () => void;
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onPress }) => {
  const theme = useAppTheme();
  const tags = video.tags.map((entry) => entry.tag);
  return (
    <Pressable style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {video.displayName}
        </Text>
        <Text style={[styles.duration, { color: theme.colors.muted }]}>{formatDuration(video.durationMs)}</Text>
      </View>
      <Text style={[styles.meta, { color: theme.colors.muted }]}>{formatFileSize(video.filesize)}</Text>
      {tags.length > 0 && (
        <View style={styles.tagContainer}>
          {tags.slice(0, 3).map((tag) => (
            <View key={tag.id} style={[styles.tagBadge, { borderColor: theme.colors.accent }]}> 
              <Text style={[styles.tagText, { color: theme.colors.accent }]} numberOfLines={1}>
                {tag.label}
              </Text>
            </View>
          ))}
          {tags.length > 3 && (
            <Text style={[styles.tagOverflow, { color: theme.colors.muted }]}>+{tags.length - 3}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  duration: {
    fontSize: 14,
  },
  meta: {
    fontSize: 13,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagOverflow: {
    fontSize: 12,
    alignSelf: 'center',
  },
});

export default VideoCard;
