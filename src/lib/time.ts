/**
 * Convert milliseconds to MM:SS.ss format
 */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Convert MM:SS.ss format to milliseconds
 */
export function parseDuration(timeString: string): number {
  const match = timeString.match(/^(\d{1,2}):(\d{2})(?:\.(\d{2}))?$/);
  if (!match) return 0;
  
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const centiseconds = parseInt(match[3] || '0', 10);
  
  return (minutes * 60 + seconds) * 1000 + centiseconds * 10;
}

/**
 * Convert seconds to MM:SS format (for video currentTime)
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00';
  
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Convert MM:SS format to seconds
 */
export function parseTime(timeString: string): number {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  
  return minutes * 60 + seconds;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}