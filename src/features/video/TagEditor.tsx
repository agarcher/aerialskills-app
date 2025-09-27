import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRealm } from '../../lib/db/realm';
import { Video } from '../../lib/db/models';
import { attachTagToVideo, detachTagFromVideo, listTags, upsertTag } from '../../lib/db/repositories';
import { useAppTheme } from '../../styles/theme';

export type TagEditorProps = {
  video: Video;
};

const TagEditor: React.FC<TagEditorProps> = ({ video }) => {
  const realm = useRealm();
  const theme = useAppTheme();
  const [input, setInput] = useState('');
  const existingTags = listTags(realm);

  const handleAddTag = useCallback(() => {
    const label = input.trim();
    if (!label) {
      return;
    }
    const tag = upsertTag(realm, label);
    attachTagToVideo(realm, video, tag);
    setInput('');
  }, [input, realm, video]);

  const handleToggleExisting = useCallback(
    (tagId: string) => {
      const isAttached = video.tags.find((entry) => entry.tag.id === tagId);
      if (isAttached) {
        detachTagFromVideo(realm, video, tagId);
        return;
      }
      const tag = existingTags.find((entry) => entry.id === tagId);
      if (tag) {
        attachTagToVideo(realm, video, tag);
      }
    },
    [existingTags, realm, video],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tags</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Add or create tag"
          placeholderTextColor={theme.colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAddTag}
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
        />
        <Pressable style={[styles.addButton, { backgroundColor: theme.colors.accent }]} onPress={handleAddTag}>
          <Text style={styles.addButtonLabel}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.tagList}>
        {existingTags.map((tag) => {
          const attached = video.tags.find((entry) => entry.tag.id === tag.id);
          return (
            <Pressable
              key={tag.id}
              style={[
                styles.tagChip,
                { borderColor: theme.colors.accent },
                attached && { backgroundColor: theme.colors.accent },
              ]}
              onPress={() => handleToggleExisting(tag.id)}
            >
              <Text style={[styles.tagLabel, { color: attached ? '#fff' : theme.colors.accent }]}>{tag.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  tagList: {
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

export default TagEditor;
