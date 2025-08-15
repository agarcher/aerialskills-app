import React, { useState, useEffect } from 'react';
import { generateFilmstrip, ThumbnailResult } from '../lib/thumbnails';
import { Button } from './Button';
import { Icon } from './Icon';

interface FilmstripProps {
  videoUri: string;
  durationMs: number;
  onThumbnailSelect: (seconds: number) => void;
  className?: string;
}

export const Filmstrip: React.FC<FilmstripProps> = ({
  videoUri,
  durationMs,
  onThumbnailSelect,
  className = ''
}) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateThumbnails();
  }, [videoUri, durationMs]);

  const generateThumbnails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await generateFilmstrip(videoUri, durationMs);
      setThumbnails(results);
    } catch (err) {
      console.error('Error generating filmstrip:', err);
      setError('Failed to generate thumbnails');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailClick = (index: number) => {
    const frameCount = 6;
    const progress = (index + 1) / (frameCount + 1);
    const timeSeconds = (durationMs / 1000) * progress;
    onThumbnailSelect(timeSeconds);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Icon name="image" className="animate-pulse text-gray-400" />
          <span className="ml-2 text-gray-500">Generating thumbnails...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg p-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={generateThumbnails} size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Quick Select Thumbnail
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        {thumbnails.map((thumbnail, index) => (
          <button
            key={index}
            onClick={() => handleThumbnailClick(index)}
            className="aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
          >
            <img
              src={thumbnail.src}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Tap any thumbnail to use it for your video
      </p>
    </div>
  );
};