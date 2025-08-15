import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface Video {
  id: string;
  uri: string;
  displayName: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  createdAt: number;
  hash: string | null;
  thumbPath: string | null;
  notes: string | null;
}

export interface Tag {
  id: string;
  label: string;
  type: string | null;
}

export interface VideoTag {
  videoId: string;
  tagId: string;
}

export interface Marker {
  id: string;
  videoId: string;
  tStartMs: number;
  tEndMs: number | null;
  notes: string | null;
}

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if platform supports SQLite
      const platform = Capacitor.getPlatform();
      if (platform === 'web') {
        // For web, we need to use a different approach or mock
        console.warn('SQLite not fully supported on web platform');
        return;
      }

      // Create or open database
      const dbName = 'aerialsilks.db';
      this.db = await this.sqlite.createConnection(
        dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();

      // Run schema migration
      await this.runMigrations();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        uri TEXT NOT NULL,
        displayName TEXT,
        durationMs INTEGER,
        sizeBytes INTEGER,
        createdAt INTEGER,
        hash TEXT,
        thumbPath TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL UNIQUE,
        type TEXT
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
    `;

    await this.db.execute(schema);
  }

  // Video CRUD operations
  async createVideo(video: Omit<Video, 'id'>): Promise<Video> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = crypto.randomUUID();
    const newVideo: Video = { id, ...video };
    
    const query = `
      INSERT INTO videos (id, uri, displayName, durationMs, sizeBytes, createdAt, hash, thumbPath, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.run(query, [
      newVideo.id,
      newVideo.uri,
      newVideo.displayName,
      newVideo.durationMs,
      newVideo.sizeBytes,
      newVideo.createdAt,
      newVideo.hash,
      newVideo.thumbPath,
      newVideo.notes
    ]);
    
    return newVideo;
  }

  async getVideos(searchTerm?: string): Promise<Video[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM videos';
    const params: any[] = [];
    
    if (searchTerm) {
      query += ' WHERE displayName LIKE ? OR notes LIKE ?';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const result = await this.db.query(query, params);
    return result.values || [];
  }

  async getVideoById(id: string): Promise<Video | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.query('SELECT * FROM videos WHERE id = ?', [id]);
    return result.values?.[0] || null;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Video]);
    
    const query = `UPDATE videos SET ${setClause} WHERE id = ?`;
    await this.db.run(query, [...values, id]);
  }

  async deleteVideo(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run('DELETE FROM videos WHERE id = ?', [id]);
  }

  // Tag CRUD operations
  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = crypto.randomUUID();
    const newTag: Tag = { id, ...tag };
    
    await this.db.run(
      'INSERT INTO tags (id, label, type) VALUES (?, ?, ?)',
      [newTag.id, newTag.label, newTag.type]
    );
    
    return newTag;
  }

  async getTags(): Promise<Tag[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.query('SELECT * FROM tags ORDER BY label');
    return result.values || [];
  }

  async getTagsByVideoId(videoId: string): Promise<Tag[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const query = `
      SELECT t.* FROM tags t
      JOIN video_tags vt ON t.id = vt.tagId
      WHERE vt.videoId = ?
      ORDER BY t.label
    `;
    
    const result = await this.db.query(query, [videoId]);
    return result.values || [];
  }

  // Video-Tag associations
  async addVideoTag(videoId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.run(
      'INSERT OR IGNORE INTO video_tags (videoId, tagId) VALUES (?, ?)',
      [videoId, tagId]
    );
  }

  async removeVideoTag(videoId: string, tagId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.run(
      'DELETE FROM video_tags WHERE videoId = ? AND tagId = ?',
      [videoId, tagId]
    );
  }

  // Marker CRUD operations
  async createMarker(marker: Omit<Marker, 'id'>): Promise<Marker> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = crypto.randomUUID();
    const newMarker: Marker = { id, ...marker };
    
    await this.db.run(
      'INSERT INTO markers (id, videoId, tStartMs, tEndMs, notes) VALUES (?, ?, ?, ?, ?)',
      [newMarker.id, newMarker.videoId, newMarker.tStartMs, newMarker.tEndMs, newMarker.notes]
    );
    
    return newMarker;
  }

  async getMarkersByVideoId(videoId: string): Promise<Marker[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.query(
      'SELECT * FROM markers WHERE videoId = ? ORDER BY tStartMs',
      [videoId]
    );
    return result.values || [];
  }

  async deleteMarker(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run('DELETE FROM markers WHERE id = ?', [id]);
  }
}

export const db = new DatabaseService();