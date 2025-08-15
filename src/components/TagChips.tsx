import React from 'react';
import { Tag } from '../lib/db';
import { Icon } from './Icon';

interface TagChipsProps {
  tags: Tag[];
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagRemove?: (tagId: string) => void;
  editable?: boolean;
  compact?: boolean;
}

export const TagChips: React.FC<TagChipsProps> = ({
  tags,
  selectedTags = [],
  onTagSelect,
  onTagRemove,
  editable = false,
  compact = false
}) => {
  const getTagTypeColor = (type: string | null) => {
    switch (type) {
      case 'skill':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'instructor':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'me':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (tags.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No tags
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'gap-1' : 'gap-2'}`}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        const colorClass = getTagTypeColor(tag.type);
        
        return (
          <span
            key={tag.id}
            className={`
              inline-flex items-center border rounded-full transition-colors cursor-pointer
              ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
              ${isSelected 
                ? 'bg-primary-100 text-primary-800 border-primary-300' 
                : colorClass
              }
              ${onTagSelect ? 'hover:opacity-80' : ''}
            `}
            onClick={() => onTagSelect?.(tag.id)}
          >
            <Icon name="tag" size="sm" className="mr-1" />
            {tag.label}
            
            {editable && onTagRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagRemove(tag.id);
                }}
                className="ml-1 hover:text-red-600"
              >
                <Icon name="x" size="sm" />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
};