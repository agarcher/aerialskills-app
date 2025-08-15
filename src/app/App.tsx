import React, { useEffect, useState } from 'react';
import { QueryProvider } from '../providers/QueryProvider';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { VideoDetailScreen } from '../features/library/VideoDetailScreen';
import { ChooseThumbnailScreen } from '../features/library/ChooseThumbnailScreen';
import { TagManagerSheet } from '../features/tags/TagManagerSheet';
import { db } from '../lib/db';
import { router, Route } from './routes';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>(router.getCurrentRoute());
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database
    const initializeApp = async () => {
      try {
        await db.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Subscribe to route changes
    const unsubscribe = router.subscribe((route) => {
      setCurrentRoute(route);
    });

    return unsubscribe;
  }, []);

  const renderScreen = () => {
    switch (currentRoute.screen) {
      case 'library':
        return <LibraryScreen />;
      
      case 'video-detail':
        if (!currentRoute.params?.videoId) {
          router.navigate('library');
          return <LibraryScreen />;
        }
        return <VideoDetailScreen videoId={currentRoute.params.videoId} />;
      
      case 'choose-thumbnail':
        if (!currentRoute.params?.videoId) {
          router.navigate('library');
          return <LibraryScreen />;
        }
        return <ChooseThumbnailScreen videoId={currentRoute.params.videoId} />;
      
      case 'tag-manager':
        return <TagManagerSheet />;
      
      default:
        return <LibraryScreen />;
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initialization Error
          </h1>
          <p className="text-gray-600 mb-4 max-w-md">
            {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Aerial Silks Video Library
          </h1>
          <p className="text-gray-600">
            Initializing app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
      <div className="min-h-screen">
        {renderScreen()}
      </div>
    </QueryProvider>
  );
};

export default App;