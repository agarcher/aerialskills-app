CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  uri TEXT NOT NULL,              -- original content:// or file://
  displayName TEXT,
  durationMs INTEGER,
  sizeBytes INTEGER,
  createdAt INTEGER,
  hash TEXT,                      -- path+size+duration hash (fast surrogate)
  thumbPath TEXT,                 -- app data path to cached JPEG
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  type TEXT                       -- e.g., 'skill' | 'cue' | 'instructor' | 'me'
);

CREATE TABLE IF NOT EXISTS video_tags (
  videoId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (videoId, tagId),
  FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId)   REFERENCES tags(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS markers (
  id TEXT PRIMARY KEY,
  videoId TEXT NOT NULL,
  tStartMs INTEGER NOT NULL,
  tEndMs INTEGER,
  notes TEXT,
  FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_hash ON videos(hash);
CREATE INDEX IF NOT EXISTS idx_video_tags_videoId ON video_tags(videoId);