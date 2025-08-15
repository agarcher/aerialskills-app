import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TagChips } from '../../components/TagChips';
import { db, Video } from '../../lib/db';
import { formatDuration, formatFileSize } from '../../lib/time';
import { navigateToLibrary, navigateToChooseThumbnail } from '../../app/routes';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface VideoDetailScreenProps {
  videoId: string;
}

export const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ videoId }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [newTagLabel, setNewTagLabel] = useState('');

  // Fetch video details
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => db.getVideoById(videoId),
  });

  // Fetch video tags
  const { data: videoTags = [] } = useQuery({
    queryKey: ['video-tags', videoId],
    queryFn: () => db.getTagsByVideoId(videoId),
  });

  // Fetch all tags
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => db.getTags(),
  });

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: (updates: Partial<Video>) => db.updateVideo(videoId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tagLabel: string) => {
      // Check if tag already exists
      let tag = allTags.find(t => t.label.toLowerCase() === tagLabel.toLowerCase());
      
      if (!tag) {
        // Create new tag
        tag = await db.createTag({ label: tagLabel, type: null });
      }
      
      // Associate with video
      await db.addVideoTag(videoId, tag.id);
      return tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-tags', videoId] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagLabel('');
      Haptics.impact({ style: ImpactStyle.Light });
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => db.removeVideoTag(videoId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-tags', videoId] });
      Haptics.impact({ style: ImpactStyle.Light });
    },
  });

  const handleSaveNotes = () => {
    updateVideoMutation.mutate({ notes: editedNotes });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTagLabel.trim()) {
      addTagMutation.mutate(newTagLabel.trim());
    }
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagMutation.mutate(tagId);
  };

  const startEditingNotes = () => {
    setEditedNotes(video?.notes || '');
    setIsEditing(true);
  };

  if (isLoading || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  const videoSrc = Capacitor.convertFileSrc(video.uri);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToLibrary()}
                className="mr-4"
              >
                <Icon name="back" size="sm" className="mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {video.displayName || 'Untitled Video'}
              </h1>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateToChooseThumbnail(videoId)}
            >
              <Icon name="image" size="sm" className="mr-2" />
              Change Thumbnail
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                src={videoSrc}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Video Info */}
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center">
                  <Icon name="clock" size="sm" className="mr-1" />
                  {video.durationMs ? formatDuration(video.durationMs) : 'Unknown'}
                </span>
                {video.sizeBytes && (
                  <span>{formatFileSize(video.sizeBytes)}</span>
                )}
              </div>
              
              {video.createdAt && (
                <p className="text-sm text-gray-500">
                  Added {new Date(video.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="space-y-6">
            {/* Tags Section */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              
              <TagChips
                tags={videoTags}
                editable
                onTagRemove={handleRemoveTag}
              />
              
              {/* Add new tag */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="input flex-1"
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTagLabel.trim() || addTagMutation.isPending}
                  loading={addTagMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingNotes}
                  >
                    <Icon name="edit" size="sm" className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add your notes about this video..."
                    rows={6}
                    className="input w-full resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleSaveNotes}
                      loading={updateVideoMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {video.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {video.notes}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">
                      No notes yet. Click Edit to add some.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};