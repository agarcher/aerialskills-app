import { create } from 'zustand';
import { Video, Tag } from './db';

interface FilterState {
  searchTerm: string;
  selectedTags: string[];
  setSearchTerm: (term: string) => void;
  setSelectedTags: (tags: string[]) => void;
  addSelectedTag: (tagId: string) => void;
  removeSelectedTag: (tagId: string) => void;
  clearFilters: () => void;
}

interface UIState {
  isLoading: boolean;
  currentScreen: 'library' | 'video-detail' | 'choose-thumbnail' | 'tag-manager';
  currentVideoId: string | null;
  setLoading: (loading: boolean) => void;
  setCurrentScreen: (screen: UIState['currentScreen']) => void;
  setCurrentVideoId: (videoId: string | null) => void;
}

interface VideoState {
  videos: Video[];
  tags: Tag[];
  setVideos: (videos: Video[]) => void;
  setTags: (tags: Tag[]) => void;
  addVideo: (video: Video) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;
  removeVideo: (videoId: string) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
}

// Filter store
export const useFilterStore = create<FilterState>((set) => ({
  searchTerm: '',
  selectedTags: [],
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  addSelectedTag: (tagId) => set((state) => ({
    selectedTags: [...state.selectedTags, tagId]
  })),
  removeSelectedTag: (tagId) => set((state) => ({
    selectedTags: state.selectedTags.filter(id => id !== tagId)
  })),
  clearFilters: () => set({ searchTerm: '', selectedTags: [] }),
}));

// UI state store
export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  currentScreen: 'library',
  currentVideoId: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setCurrentVideoId: (videoId) => set({ currentVideoId: videoId }),
}));

// Video data store
export const useVideoStore = create<VideoState>((set) => ({
  videos: [],
  tags: [],
  setVideos: (videos) => set({ videos }),
  setTags: (tags) => set({ tags }),
  addVideo: (video) => set((state) => ({
    videos: [video, ...state.videos]
  })),
  updateVideo: (videoId, updates) => set((state) => ({
    videos: state.videos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    )
  })),
  removeVideo: (videoId) => set((state) => ({
    videos: state.videos.filter(video => video.id !== videoId)
  })),
  addTag: (tag) => set((state) => ({
    tags: [...state.tags, tag]
  })),
  removeTag: (tagId) => set((state) => ({
    tags: state.tags.filter(tag => tag.id !== tagId)
  })),
}));

// Selectors
export const useFilteredVideos = () => {
  const videos = useVideoStore((state) => state.videos);
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const selectedTags = useFilterStore((state) => state.selectedTags);

  return videos.filter(video => {
    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = video.displayName?.toLowerCase().includes(searchLower);
      const matchesNotes = video.notes?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesNotes) {
        return false;
      }
    }

    // Tag filter (would need to implement tag fetching)
    if (selectedTags.length > 0) {
      // This would need to be implemented with actual tag relationships
      // For now, we'll skip tag filtering in the selector
    }

    return true;
  });
};