export type Screen = 'library' | 'video-detail' | 'choose-thumbnail' | 'tag-manager';

export interface RouteParams {
  videoId?: string;
  tagId?: string;
}

export interface Route {
  screen: Screen;
  params?: RouteParams;
}

// Simple navigation state
let currentRoute: Route = { screen: 'library' };
let navigationListeners: ((route: Route) => void)[] = [];

export const router = {
  // Get current route
  getCurrentRoute: (): Route => currentRoute,
  
  // Navigate to a new route
  navigate: (screen: Screen, params?: RouteParams) => {
    currentRoute = { screen, params };
    navigationListeners.forEach(listener => listener(currentRoute));
  },
  
  // Go back (simplified - just go to library)
  goBack: () => {
    router.navigate('library');
  },
  
  // Subscribe to route changes
  subscribe: (listener: (route: Route) => void) => {
    navigationListeners.push(listener);
    return () => {
      navigationListeners = navigationListeners.filter(l => l !== listener);
    };
  },
};

// Navigation helpers
export const navigateToLibrary = () => router.navigate('library');
export const navigateToVideoDetail = (videoId: string) => router.navigate('video-detail', { videoId });
export const navigateToChooseThumbnail = (videoId: string) => router.navigate('choose-thumbnail', { videoId });
export const navigateToTagManager = () => router.navigate('tag-manager');