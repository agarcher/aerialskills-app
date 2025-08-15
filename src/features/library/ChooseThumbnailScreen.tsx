import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ThumbnailToolbar } from '../../components/ThumbnailToolbar';
import { Filmstrip } from '../../components/Filmstrip';
import { db } from '../../lib/db';
import { updateThumbnail } from '../../lib/thumbnails';
import { navigateToVideoDetail } from '../../app/routes';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ChooseThumbnailScreenProps {
  videoId: string;
}

export const ChooseThumbnailScreen: React.FC<ChooseThumbnailScreenProps> = ({ videoId }) => {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(false);

  // Fetch video details
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => db.getVideoById(videoId),
  });

  // Update thumbnail mutation
  const updateThumbnailMutation = useMutation({
    mutationFn: async (seconds: number) => {
      if (!video) throw new Error('Video not found');
      
      const thumbPath = await updateThumbnail(videoId, video.uri, seconds);
      await db.updateVideo(videoId, { thumbPath });
      
      return thumbPath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      
      // Show success feedback
      Haptics.impact({ style: ImpactStyle.Medium });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigateToVideoDetail(videoId);
      }, 1000);
    },
    onError: (error) => {
      console.error('Failed to update thumbnail:', error);
      alert('Failed to update thumbnail. Please try again.');
    },
  });

  const nudge = (delta: number) => {
    const el = videoRef.current;
    if (!el) return;
    
    el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + delta));
  };

  const useFrame = async () => {
    const el = videoRef.current;
    if (!el || !video) return;
    
    setBusy(true);
    
    try {
      await updateThumbnailMutation.mutateAsync(el.currentTime);
    } finally {
      setBusy(false);
    }
  };

  const handleFilmstripSelect = async (seconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    
    // Seek to the selected time
    el.currentTime = seconds;
    
    // Auto-capture the frame
    await useFrame();
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
                onClick={() => navigateToVideoDetail(videoId)}
                className="mr-4"
              >
                <Icon name="back" size="sm" className="mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Choose Thumbnail
              </h1>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilmstrip(!showFilmstrip)}
            >
              <Icon name="image" size="sm" className="mr-2" />
              {showFilmstrip ? 'Hide' : 'Show'} Quick Select
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Video Player */}
          <div className="bg-white rounded-xl p-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Thumbnail Controls */}
            <ThumbnailToolbar
              onNudge={nudge}
              onUseFrame={useFrame}
              busy={busy || updateThumbnailMutation.isPending}
              disabled={!videoRef.current}
            />
            
            {updateThumbnailMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Icon name="image" size="sm" className="text-green-600 mr-2" />
                  <span className="text-green-800 text-sm">
                    Thumbnail updated successfully! Returning to video details...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              How to choose a thumbnail:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Use the video controls to navigate to your desired frame</li>
              <li>Fine-tune the position using the +/- buttons below</li>
              <li>Click "Use This Frame" to set it as your thumbnail</li>
              <li>Or use "Quick Select" below for pre-generated options</li>
            </ol>
          </div>

          {/* Filmstrip */}
          {showFilmstrip && video.durationMs && (
            <Filmstrip
              videoUri={video.uri}
              durationMs={video.durationMs}
              onThumbnailSelect={handleFilmstripSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};