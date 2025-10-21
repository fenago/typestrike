// Statistics Manager using IndexedDB

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TypeStrikeDB extends DBSchema {
  stats: {
    key: string;
    value: {
      sessions: number;
      bestScore: number;
      totalWpm: number;
      sessionCount: number;
      lastPlayed: number;
    };
  };
  sessions: {
    key: number;
    value: {
      timestamp: number;
      score: number;
      wpm: number;
      accuracy: number;
      level: string;
      duration: number;
    };
  };
}

export class StatsManager {
  private db: IDBPDatabase<TypeStrikeDB> | null = null;

  async init() {
    this.db = await openDB<TypeStrikeDB>('typestrike-db', 1, {
      upgrade(db) {
        // Create stats store
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats');
        }

        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', {
            keyPath: 'timestamp',
            autoIncrement: true,
          });
        }
      },
    });
  }

  async getStats() {
    if (!this.db) {
      return { sessions: 0, bestScore: 0, averageWpm: 0 };
    }

    const stats = await this.db.get('stats', 'overall');

    if (!stats) {
      return { sessions: 0, bestScore: 0, averageWpm: 0 };
    }

    return {
      sessions: stats.sessions,
      bestScore: stats.bestScore,
      averageWpm: stats.sessionCount > 0
        ? stats.totalWpm / stats.sessionCount
        : 0,
    };
  }

  async recordSession(session: {
    score: number;
    wpm: number;
    accuracy: number;
    level: string;
    duration: number;
  }) {
    if (!this.db) return;

    // Save session
    await this.db.add('sessions', {
      timestamp: Date.now(),
      ...session,
    });

    // Update overall stats
    const stats = await this.db.get('stats', 'overall') || {
      sessions: 0,
      bestScore: 0,
      totalWpm: 0,
      sessionCount: 0,
      lastPlayed: 0,
    };

    stats.sessions += 1;
    stats.bestScore = Math.max(stats.bestScore, session.score);
    stats.totalWpm += session.wpm;
    stats.sessionCount += 1;
    stats.lastPlayed = Date.now();

    await this.db.put('stats', stats, 'overall');
  }

  async getRecentSessions(limit: number = 10) {
    if (!this.db) return [];

    const sessions = await this.db.getAll('sessions');
    return sessions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}
