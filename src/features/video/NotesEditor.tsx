import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRealm } from '../../lib/db/realm';
import { Video } from '../../lib/db/models';
import { updateVideoNotes } from '../../lib/db/repositories';
import { useAppTheme } from '../../styles/theme';

export type NotesEditorProps = {
  video: Video;
};

const NotesEditor: React.FC<NotesEditorProps> = ({ video }) => {
  const theme = useAppTheme();
  const realm = useRealm();
  const [notes, setNotes] = useState(video.notes ?? '');

  useEffect(() => {
    setNotes(video.notes ?? '');
  }, [video.notes]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateVideoNotes(realm, video.id, notes);
    }, 600);
    return () => clearTimeout(timeout);
  }, [notes, realm, video.id]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Notes</Text>
      <TextInput
        multiline
        numberOfLines={6}
        placeholder="Add reminders, cues, or highlights"
        placeholderTextColor={theme.colors.muted}
        value={notes}
        onChangeText={setNotes}
        style={[styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 160,
  },
});

export default NotesEditor;
