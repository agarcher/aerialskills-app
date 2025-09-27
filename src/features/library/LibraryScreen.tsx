import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '../../lib/db/realm';
import { Tag, Video } from '../../lib/db/models';
import { useImportQueue } from '../../lib/files/importQueue';
import { pickVideosFromFilePicker, pickVideosFromLibrary } from '../../lib/files/picker';
import { queryVideos, type SortOption } from '../../lib/db/repositories';
import { useAppTheme } from '../../styles/theme';
import type { RootStackParamList } from '../../app/navigation/types';
import VideoCard from './VideoCard';
import Filters from './Filters';

const LibraryScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Library'>): JSX.Element => {
  const theme = useAppTheme();
  const realmVideos = useQuery(Video);
  const realmTags = useQuery(Tag);
  const { enqueue, jobs } = useImportQueue();

  const [searchText, setSearchText] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [refreshing, setRefreshing] = useState(false);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }, []);

  const handleAddVideos = useCallback(() => {
    Alert.alert('Add videos', 'Choose a source', [
      {
        text: 'Files',
        onPress: async () => {
          try {
            const picked = await pickVideosFromFilePicker();
            await enqueue(picked);
          } catch (error) {
            console.error(error);
            Alert.alert('Import failed', 'Unable to import from files.');
          }
        },
      },
      {
        text: 'Media Library',
        onPress: async () => {
          try {
            const picked = await pickVideosFromLibrary();
            await enqueue(picked);
          } catch (error) {
            console.error(error);
            Alert.alert('Import failed', 'Unable to import from media library.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [enqueue]);

  const availableTags = useMemo(() => Array.from(realmTags.sorted('label')), [realmTags]);

  const filteredVideos = useMemo(
    () =>
      queryVideos(realmVideos.realm, {
        searchText,
        tagIds: selectedTagIds,
        sortBy,
      }),
    [realmVideos, searchText, selectedTagIds, sortBy],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      realmVideos.realm.refresh();
      setRefreshing(false);
    }, 250);
  }, [realmVideos.realm]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={[styles.heading, { color: theme.colors.text }]}>Your videos</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.accent }]} onPress={handleAddVideos}>
              <Text style={styles.addButtonLabel}>Add Videos</Text>
            </TouchableOpacity>
            {jobs.length > 0 && (
              <View style={[styles.queueContainer, { backgroundColor: theme.colors.surface }]}> 
                {jobs.map((job) => (
                  <View key={job.id} style={styles.queueRow}>
                    <Text style={[styles.queueText, { color: theme.colors.text }]} numberOfLines={1}>
                      {job.name}
                    </Text>
                    <Text style={[styles.queueStatus, { color: theme.colors.muted }]}>
                      {job.status === 'copying'
                        ? 'Copying'
                        : job.status === 'processing'
                        ? 'Processing'
                        : job.status === 'completed'
                        ? 'Done'
                        : job.status === 'duplicate'
                        ? 'Duplicate'
                        : job.status === 'error'
                        ? 'Error'
                        : job.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Waiting'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Filters
              searchText={searchText}
              onSearchTextChange={setSearchText}
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onToggleTag={toggleTag}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </View>
        }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Import your first training video.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  addButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  queueContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  queueText: {
    flex: 1,
    fontSize: 14,
  },
  queueStatus: {
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default LibraryScreen;
