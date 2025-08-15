import React from 'react';
import { Video } from '../lib/db';
import { formatDuration, formatFileSize } from '../lib/time';
import { Icon } from './Icon';
import { Capacitor } from '@capacitor/core';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  tags?: string[];
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, tags = [] }) => {
  const getThumbnailSrc = () => {
    if (video.thumbPath) {
      return Capacitor.convertFileSrc(video.thumbPath);
    }
    return null;
  };

  const thumbnailSrc = getThumbnailSrc();

  return (
    <div 
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
        {thumbnailSrc ? (
          <img 
            src={thumbnailSrc}
            alt={video.displayName || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Icon name="video" size="lg" className="text-gray-400" />
          </div>
        )}
        
        {/* Duration overlay */}
        {video.durationMs && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.durationMs)}
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20">
          <div className="bg-white bg-opacity-90 rounded-full p-3">
            <Icon name="play" size="lg" className="text-primary-600" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1">
          {video.displayName || 'Untitled Video'}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          {video.sizeBytes && (
            <span>{formatFileSize(video.sizeBytes)}</span>
          )}
          {video.createdAt && (
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          )}
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500">+{tags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Notes preview */}
        {video.notes && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {video.notes}
          </p>
        )}
      </div>
    </div>
  );
};