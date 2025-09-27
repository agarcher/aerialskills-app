import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Tag } from '../../lib/db/models';
import type { SortOption } from '../../lib/db/repositories';
import { useAppTheme } from '../../styles/theme';

export type FiltersProps = {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
};

const sortOptions: SortOption[] = ['createdAt', 'displayName', 'filesize'];

const Filters: React.FC<FiltersProps> = ({
  searchText,
  onSearchTextChange,
  availableTags,
  selectedTagIds,
  onToggleTag,
  sortBy,
  onSortChange,
}) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search videos"
        placeholderTextColor={theme.colors.muted}
        value={searchText}
        onChangeText={onSearchTextChange}
        style={[styles.searchInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
      />
      <View style={styles.sortRow}>
        {sortOptions.map((option) => {
          const selected = option === sortBy;
          return (
            <Pressable
              key={option}
              onPress={() => onSortChange(option)}
              style={[styles.sortPill, selected && { backgroundColor: theme.colors.accent }]}
            >
              <Text
                style={[
                  styles.sortLabel,
                  { color: selected ? '#fff' : theme.colors.text },
                ]}
              >
                {option === 'createdAt' ? 'Newest' : option === 'displayName' ? 'Name' : 'Size'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {availableTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {availableTags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => onToggleTag(tag.id)}
                style={[styles.tagChip, { borderColor: theme.colors.accent }, selected && { backgroundColor: theme.colors.accent }]}
              >
                <Text style={[styles.tagLabel, { color: selected ? '#fff' : theme.colors.accent }]}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default Filters;
