import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TagChips } from '../../components/TagChips';
import { db, Tag } from '../../lib/db';
import { navigateToLibrary } from '../../app/routes';

export const TagManagerSheet: React.FC = () => {
  const queryClient = useQueryClient();
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagType, setNewTagType] = useState<string>('');

  // Fetch all tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => db.getTags(),
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tag: Omit<Tag, 'id'>) => db.createTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagLabel('');
      setNewTagType('');
    },
  });

  const handleCreateTag = () => {
    if (newTagLabel.trim()) {
      createTagMutation.mutate({
        label: newTagLabel.trim(),
        type: newTagType || null,
      });
    }
  };

  const tagTypes = [
    { value: '', label: 'General' },
    { value: 'skill', label: 'Skill' },
    { value: 'cue', label: 'Cue' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'me', label: 'Personal' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center">
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
              Manage Tags
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Create New Tag */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create New Tag
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Label
                </label>
                <input
                  type="text"
                  placeholder="Enter tag name..."
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Type
                </label>
                <select
                  value={newTagType}
                  onChange={(e) => setNewTagType(e.target.value)}
                  className="input w-full"
                >
                  {tagTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                variant="primary"
                onClick={handleCreateTag}
                disabled={!newTagLabel.trim() || createTagMutation.isPending}
                loading={createTagMutation.isPending}
              >
                <Icon name="plus" size="sm" className="mr-2" />
                Create Tag
              </Button>
            </div>
          </div>

          {/* Existing Tags */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Existing Tags ({tags.length})
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading tags...</p>
              </div>
            ) : tags.length > 0 ? (
              <div className="space-y-4">
                {/* Group by type */}
                {tagTypes.map((type) => {
                  const typeTags = tags.filter(tag => (tag.type || '') === type.value);
                  if (typeTags.length === 0) return null;
                  
                  return (
                    <div key={type.value}>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {type.label}
                      </h3>
                      <TagChips tags={typeTags} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-8">
                No tags created yet. Create your first tag above.
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              About Tags
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Skills:</strong> Aerial moves and techniques (e.g., "Cartwheel", "Stag")</li>
              <li><strong>Cues:</strong> Teaching points and corrections (e.g., "Point toes", "Engage core")</li>
              <li><strong>Instructor:</strong> Teacher or performer names</li>
              <li><strong>Personal:</strong> Your own videos and practice sessions</li>
              <li><strong>General:</strong> Any other categorization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};