import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VideoCard } from "../../components/VideoCard";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { db, Video } from "../../lib/db";
import { pickVideos } from "../../lib/picker";
import { getVideoMetadata, createVideoHash } from "../../lib/videoMeta";
import { ensureDefaultThumbnail } from "../../lib/thumbnails";
import { copyVideoToAppStorage } from "../../lib/filePaths";
import { useFilterStore } from "../../lib/store";
import { navigateToVideoDetail } from "../../app/routes";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const LibraryScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const { searchTerm, setSearchTerm } = useFilterStore();

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => db.getVideos(),
  });

  // Filter videos based on search term
  const filteredVideos = useMemo(() => {
    if (!searchTerm) {
      return videos;
    }

    const searchLower = searchTerm.toLowerCase();
    return videos.filter((video) => {
      const matchesName = video.displayName
        ?.toLowerCase()
        .includes(searchLower);
      const matchesNotes = video.notes?.toLowerCase().includes(searchLower);
      return matchesName || matchesNotes;
    });
  }, [videos, searchTerm]);

  // Import videos mutation
  const importMutation = useMutation({
    mutationFn: async (
      videoFiles: Array<{ uri: string; name: string; size?: number }>
    ) => {
      const results = [];

      for (const file of videoFiles) {
        try {
          console.log("Processing video file:", file);

          // Get video metadata from the temporary file
          const metadata = await getVideoMetadata(file.uri);
          console.log("Video metadata:", metadata);

          // Create video record with temporary URI first (we'll update it after copying)
          const video: Omit<Video, "id"> = {
            uri: file.uri, // Temporary - will be updated after copying
            displayName: file.name,
            durationMs: metadata.duration,
            sizeBytes: file.size || null,
            createdAt: Date.now(),
            hash: createVideoHash(file.uri, file.size, metadata.duration),
            thumbPath: null,
            notes: null,
          };

          // Save to database to get the video ID
          const savedVideo = await db.createVideo(video);
          console.log("Video saved to database with ID:", savedVideo.id);

          // Copy video file to permanent app storage
          try {
            const permanentUri = await copyVideoToAppStorage(
              savedVideo.id,
              file.uri,
              file.name
            );

            // Update the video record with the permanent URI
            await db.updateVideo(savedVideo.id, { uri: permanentUri });
            savedVideo.uri = permanentUri;
            console.log("Video copied to permanent storage:", permanentUri);
          } catch (copyError) {
            console.error(
              "Failed to copy video to permanent storage:",
              copyError
            );
            // If copying fails, we'll keep the original URI and hope it works
            // In a production app, you might want to delete the database record here
          }

          // Generate default thumbnail
          try {
            const thumbPath = await ensureDefaultThumbnail(
              savedVideo.id,
              savedVideo.uri,
              savedVideo.durationMs || 0
            );

            if (thumbPath) {
              await db.updateVideo(savedVideo.id, { thumbPath });
              savedVideo.thumbPath = thumbPath;
            }
          } catch (thumbError) {
            console.error("Failed to generate thumbnail:", thumbError);
          }

          results.push(savedVideo);
        } catch (error) {
          console.error(`Failed to import video ${file.name}:`, error);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      Haptics.impact({ style: ImpactStyle.Light });
    },
  });

  const handleImportVideos = async () => {
    setImporting(true);

    try {
      const selectedFiles = await pickVideos();
      if (selectedFiles.length > 0) {
        await importMutation.mutateAsync(selectedFiles);
      }
    } catch (error) {
      console.error("Error importing videos:", error);
      alert("Failed to import videos. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    Haptics.impact({ style: ImpactStyle.Light });
    navigateToVideoDetail(video.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Aerial Silks Video Library
              </h1>

              <Button
                variant="primary"
                onClick={handleImportVideos}
                loading={importing}
                disabled={importing}
              >
                <Icon name="plus" size="sm" className="mr-2" />
                Add Videos
              </Button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              name="video"
              size="lg"
              className="text-gray-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No videos yet
            </h3>
            <p className="text-gray-500 mb-6">
              Import your aerial silks videos to get started
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleImportVideos}
              loading={importing}
            >
              <Icon name="plus" size="sm" className="mr-2" />
              Import Videos
            </Button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {filteredVideos.length} of {videos.length} videos
                {searchTerm && (
                  <span className="ml-1">matching "{searchTerm}"</span>
                )}
              </p>
            </div>

            {/* Video grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                />
              ))}
            </div>

            {filteredVideos.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <Icon
                  name="search"
                  size="lg"
                  className="text-gray-300 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No videos found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
