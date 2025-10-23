// Achievement System using IndexedDB

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;  // For progressive achievements
  target?: number;    // Goal for progressive achievements
}

interface AchievementsDB extends DBSchema {
  achievements: {
    key: string;
    value: Achievement;
  };
}

export class AchievementManager {
  private db: IDBPDatabase<AchievementsDB> | null = null;
  private achievements: Map<string, Achievement> = new Map();

  async init() {
    this.db = await openDB<AchievementsDB>('typestrike-achievements', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('achievements')) {
          db.createObjectStore('achievements', { keyPath: 'id' });
        }
      },
    });

    // Initialize default achievements
    await this.initializeAchievements();
  }

  private async initializeAchievements() {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-session',
        name: 'First Steps',
        description: 'Complete your first typing session',
        icon: '🎯',
        unlocked: false,
      },
      {
        id: 'speed-demon-50',
        name: 'Speed Demon I',
        description: 'Reach 50 WPM',
        icon: '⚡',
        unlocked: false,
      },
      {
        id: 'speed-demon-75',
        name: 'Speed Demon II',
        description: 'Reach 75 WPM',
        icon: '⚡⚡',
        unlocked: false,
      },
      {
        id: 'speed-demon-100',
        name: 'Speed Master',
        description: 'Reach 100 WPM',
        icon: '🚀',
        unlocked: false,
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a level with 100% accuracy',
        icon: '💎',
        unlocked: false,
      },
      {
        id: 'accuracy-master',
        name: 'Accuracy Master',
        description: 'Maintain 95%+ accuracy for 5 levels',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'marathon-runner',
        name: 'Marathon Runner',
        description: 'Type 1000 letters in total',
        icon: '🏃',
        unlocked: false,
        progress: 0,
        target: 1000,
      },
      {
        id: 'combo-king-50',
        name: 'Combo King',
        description: 'Reach a 50x combo',
        icon: '👑',
        unlocked: false,
      },
      {
        id: 'combo-master-100',
        name: 'Combo Master',
        description: 'Reach a 100x combo',
        icon: '🔥',
        unlocked: false,
      },
      {
        id: 'level-5',
        name: 'Upper Row Adept',
        description: 'Complete Level 5',
        icon: '📈',
        unlocked: false,
      },
      {
        id: 'level-10',
        name: 'Lower Row Master',
        description: 'Complete Level 10',
        icon: '📊',
        unlocked: false,
      },
      {
        id: 'level-15',
        name: 'Number Ninja',
        description: 'Complete Level 15',
        icon: '🔢',
        unlocked: false,
      },
      {
        id: 'level-20',
        name: 'Ultimate Champion',
        description: 'Complete Level 20 (Final Boss)',
        icon: '🏆',
        unlocked: false,
      },
      {
        id: 'word-wizard',
        name: 'Word Wizard',
        description: 'Type 50 words correctly',
        icon: '📝',
        unlocked: false,
        progress: 0,
        target: 50,
      },
      {
        id: 'easter-egg-hunter',
        name: 'Easter Egg Hunter',
        description: 'Discover 3 easter eggs',
        icon: '🥚',
        unlocked: false,
        progress: 0,
        target: 3,
      },
      {
        id: 'week-warrior',
        name: 'Week Warrior',
        description: 'Play for 7 days in a row',
        icon: '📅',
        unlocked: false,
        progress: 0,
        target: 7,
      },
    ];

    // Load existing achievements or create new ones
    for (const achievement of defaultAchievements) {
      const existing = await this.db?.get('achievements', achievement.id);
      if (existing) {
        this.achievements.set(achievement.id, existing);
      } else {
        await this.db?.put('achievements', achievement);
        this.achievements.set(achievement.id, achievement);
      }
    }
  }

  async checkAndUnlock(id: string): Promise<boolean> {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) return false;

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();

    await this.db?.put('achievements', achievement);
    this.achievements.set(id, achievement);

    // Trigger UI notification
    this.notifyAchievementUnlocked(achievement);

    return true;
  }

  async updateProgress(id: string, progress: number): Promise<boolean> {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) return false;

    achievement.progress = progress;

    // Check if target reached
    if (achievement.target && progress >= achievement.target) {
      return await this.checkAndUnlock(id);
    }

    await this.db?.put('achievements', achievement);
    this.achievements.set(id, achievement);

    return false;
  }

  async incrementProgress(id: string, amount: number = 1): Promise<boolean> {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) return false;

    const newProgress = (achievement.progress || 0) + amount;
    return await this.updateProgress(id, newProgress);
  }

  getAll(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlocked(): Achievement[] {
    return this.getAll().filter(a => a.unlocked);
  }

  getProgress(id: string): number {
    return this.achievements.get(id)?.progress || 0;
  }

  private notifyAchievementUnlocked(achievement: Achievement) {
    // Dispatch custom event for UI to catch
    const event = new CustomEvent('achievement-unlocked', {
      detail: achievement,
    });
    window.dispatchEvent(event);

    console.log(`🏆 ACHIEVEMENT UNLOCKED: ${achievement.icon} ${achievement.name}`);
  }

  // Check achievements after each session
  async checkSessionAchievements(stats: {
    wpm: number;
    accuracy: number;
    level: number;
    combo: number;
    totalLetters: number;
    wordsTyped?: number;
  }) {
    // First session
    await this.checkAndUnlock('first-session');

    // Speed achievements
    if (stats.wpm >= 100) {
      await this.checkAndUnlock('speed-demon-100');
      await this.checkAndUnlock('speed-demon-75');
      await this.checkAndUnlock('speed-demon-50');
    } else if (stats.wpm >= 75) {
      await this.checkAndUnlock('speed-demon-75');
      await this.checkAndUnlock('speed-demon-50');
    } else if (stats.wpm >= 50) {
      await this.checkAndUnlock('speed-demon-50');
    }

    // Accuracy achievements
    if (stats.accuracy === 100) {
      await this.checkAndUnlock('perfectionist');
    }

    if (stats.accuracy >= 95) {
      await this.incrementProgress('accuracy-master', 1);
    }

    // Combo achievements
    if (stats.combo >= 100) {
      await this.checkAndUnlock('combo-master-100');
      await this.checkAndUnlock('combo-king-50');
    } else if (stats.combo >= 50) {
      await this.checkAndUnlock('combo-king-50');
    }

    // Level achievements
    if (stats.level >= 20) {
      await this.checkAndUnlock('level-20');
      await this.checkAndUnlock('level-15');
      await this.checkAndUnlock('level-10');
      await this.checkAndUnlock('level-5');
    } else if (stats.level >= 15) {
      await this.checkAndUnlock('level-15');
      await this.checkAndUnlock('level-10');
      await this.checkAndUnlock('level-5');
    } else if (stats.level >= 10) {
      await this.checkAndUnlock('level-10');
      await this.checkAndUnlock('level-5');
    } else if (stats.level >= 5) {
      await this.checkAndUnlock('level-5');
    }

    // Progressive achievements
    await this.incrementProgress('marathon-runner', stats.totalLetters);

    if (stats.wordsTyped) {
      await this.incrementProgress('word-wizard', stats.wordsTyped);
    }
  }

  async checkEasterEgg() {
    await this.incrementProgress('easter-egg-hunter', 1);
  }

  async checkDailyStreak(lastPlayed: number) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const daysSince = Math.floor((now - lastPlayed) / oneDayMs);

    if (daysSince === 1) {
      // Consecutive day
      await this.incrementProgress('week-warrior', 1);
    } else if (daysSince > 1) {
      // Streak broken
      await this.updateProgress('week-warrior', 0);
    }
  }
}

// Global instance
export const achievementManager = new AchievementManager();
