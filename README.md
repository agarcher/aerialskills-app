# Aerial Silks Video Library

A mobile-first Capacitor + React application for cataloging local video files, adding tags, and setting custom thumbnails from chosen frames.

## Features

- 📱 **Mobile-First Design** - Built with Capacitor for iOS and Android
- 🎬 **Video Import** - Pick videos from device gallery using native file picker
- 🖼️ **Custom Thumbnails** - Set thumbnails from any video frame with precision controls
- 🏷️ **Smart Tagging** - Organize videos with categorized tags (skills, cues, instructors, etc.)
- 🔍 **Search & Filter** - Find videos by name, notes, or tags
- 📝 **Notes** - Add detailed notes to each video
- 💾 **Offline Storage** - SQLite database for fast, offline operation

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Mobile**: Capacitor (iOS + Android)
- **UI**: Tailwind CSS with custom components
- **State**: React Query + Zustand
- **Database**: SQLite via `@capacitor-community/sqlite`
- **Plugins**:
  - `@capawesome/capacitor-file-picker` - Video file selection
  - `@capacitor/filesystem` - File system access
  - `@whiteguru/capacitor-plugin-video-editor` - Native thumbnail extraction
  - `@capacitor/haptics` - Tactile feedback
  - `@capacitor/preferences` - App settings
  - `@capacitor/share` - Share functionality

## Installation

### Prerequisites

- Node.js 18+ and npm
- For iOS: Xcode 14+ and iOS Simulator
- For Android: Android Studio and Android SDK

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd aerial-silks-video-library
   npm install --legacy-peer-deps
   ```

2. **Build the web assets**:
   ```bash
   npm run build
   ```

3. **Add mobile platforms**:
   ```bash
   # Add iOS platform
   npx cap add ios
   
   # Add Android platform  
   npx cap add android
   ```

4. **Sync platforms with latest code**:
   ```bash
   npx cap sync
   ```

## Development

### Web Development
```bash
# Start development server
npm run dev

# Build for production
npm run build
```

### Mobile Development

#### iOS
```bash
# Open in Xcode
npm run ios
# OR
npx cap run ios

# Sync changes
npx cap sync ios
```

#### Android
```bash
# Open in Android Studio
npm run android
# OR
npx cap run android

# Sync changes
npx cap sync android
```

## Permissions Configuration

### iOS (Info.plist)
The following permissions are already configured:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Allow access to choose and read videos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Allow saving thumbnails locally.</string>
```

### Android (AndroidManifest.xml)
The following permissions are already configured:

```xml
<!-- For SDK 33+ -->
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<!-- For SDK < 33 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

## Usage Guide

### Importing Videos
1. Tap "Add Videos" on the main screen
2. Select videos from your device gallery
3. Videos are automatically processed for metadata and default thumbnails

### Managing Thumbnails
1. Open any video from the library
2. Tap "Change Thumbnail"
3. Use video controls to navigate to desired frame
4. Use +/- buttons for precise positioning
5. Tap "Use This Frame" to set thumbnail
6. Optional: Use "Quick Select" for pre-generated options

### Organizing with Tags
1. Open video details
2. Add tags in the Tags section
3. Create new tags or use existing ones
4. Tags are categorized by type:
   - **Skills**: Aerial moves and techniques
   - **Cues**: Teaching points and corrections
   - **Instructors**: Teacher or performer names
   - **Personal**: Your own videos and practice
   - **General**: Any other categorization

### Search and Filter
- Use the search bar to find videos by name or notes
- Filter by tags (coming in future updates)

## Project Structure

```
/src
  /app
    App.tsx                    # Main app component with routing
    routes.ts                  # Simple client-side routing
  /components
    Button.tsx                 # Reusable button component
    Icon.tsx                   # Icon component with SVG icons
    VideoCard.tsx              # Video thumbnail card
    Filmstrip.tsx              # Multi-thumbnail selector
    ThumbnailToolbar.tsx       # Frame selection controls
    TagChips.tsx               # Tag display and management
  /features/library
    LibraryScreen.tsx          # Main video grid screen
    VideoDetailScreen.tsx      # Video player and details
    ChooseThumbnailScreen.tsx  # Thumbnail selection interface
  /features/tags
    TagManagerSheet.tsx        # Tag creation and management
  /lib
    db.ts                      # SQLite database operations
    schema.sql                 # Database schema
    filePaths.ts               # File system utilities
    videoMeta.ts               # Video metadata extraction
    thumbnails.ts              # Thumbnail generation
    picker.ts                  # File picker utilities
    time.ts                    # Time formatting utilities
    store.ts                   # Zustand state management
  /providers
    QueryProvider.tsx          # React Query setup
  /styles
    index.css                  # Tailwind CSS and custom styles
```

## Database Schema

### Videos Table
- `id` - Unique identifier
- `uri` - Original file URI
- `displayName` - Video filename
- `durationMs` - Duration in milliseconds
- `sizeBytes` - File size
- `createdAt` - Import timestamp
- `hash` - Content hash for deduplication
- `thumbPath` - Path to thumbnail image
- `notes` - User notes

### Tags Table
- `id` - Unique identifier
- `label` - Tag name
- `type` - Category (skill, cue, instructor, me, general)

### Video_Tags Table
- Junction table linking videos to tags

### Markers Table (Future)
- `id` - Unique identifier
- `videoId` - Associated video
- `tStartMs` - Start time in milliseconds
- `tEndMs` - End time (optional)
- `notes` - Marker description

## Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run sync` - Sync Capacitor platforms
- `npm run ios` - Open iOS project in Xcode
- `npm run android` - Open Android project in Android Studio

## Troubleshooting

### Dependencies
If you encounter dependency conflicts, use:
```bash
npm install --legacy-peer-deps
```

### Platform Sync Issues
If platforms get out of sync:
```bash
npx cap sync --deployment
```

### iOS Build Issues
- Ensure Xcode Command Line Tools are installed
- Check iOS deployment target in Xcode project settings

### Android Build Issues
- Verify Android SDK and build tools are installed
- Check `android/variables.gradle` for correct SDK versions

## Next Steps

### Planned Features
1. **Advanced Search** - Full-text search with tag filtering
2. **Animated Previews** - Server-side FFmpeg integration for GIF previews
3. **Video Markers** - Timestamp bookmarks within videos
4. **Cloud Sync** - Optional cloud backup and sync
5. **Export/Import** - Backup and restore functionality
6. **Batch Operations** - Multi-select for bulk tagging

### Performance Optimizations
1. **Virtual Scrolling** - Handle large video libraries
2. **Lazy Loading** - Progressive thumbnail loading
3. **Background Processing** - Queue thumbnail generation
4. **Caching** - Intelligent thumbnail cache management

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed description and steps to reproduce
