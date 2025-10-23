// Pure JavaScript/Canvas game implementation (fallback when WASM not available)

import { audioManager } from './audio';
import { achievementManager } from './achievements';
import { shareManager } from './share';

interface Letter {
  char: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  targeted: boolean;
  isWord?: boolean;  // True if this is a complete word (worth more points)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface Level {
  id: string;
  number: number;
  name: string;
  letters: string[];
  words?: string[];  // Optional words for advanced levels
  fallSpeed: number;
  spawnRate: number;
  duration: number;
  description: string;
  hint: string;  // AI hint shown before level
  easterEgg?: string;  // Hidden surprise for this level
}

enum GameState {
  Menu,
  LevelStart,  // Show hint before level begins
  Playing,
  LevelComplete,
  GameOver,
}

export class GameFallback {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = GameState.Menu;
  private letters: Letter[] = [];
  private particles: Particle[] = [];
  private lives = 5;
  private maxLives = 5;
  private score = 0;
  private combo = 0;
  private correctCount = 0;
  private totalCount = 0;
  private currentLevel = 0;
  private level: Level;
  private spawnTimer = 0;
  private levelTimer = 0;
  private screenShake = 0;
  private flashTimer = 0;
  private flashColor = 'rgba(0,0,0,0)';
  private lastTime = 0;
  private animationId: number | null = null;
  private aiFeedback = 'Great work! Keep practicing!';
  private previousWpm = 0;
  private isLoadingFeedback = false;
  private currentWordInput = '';  // Track multi-character input for words
  private easterEggBuffer = '';   // Track last few keys for easter egg detection
  private activeEasterEggs: Set<string> = new Set();  // Currently active easter eggs
  private wordsTypedThisSession = 0;  // Track words for achievements
  private maxComboThisSession = 0;    // Track best combo for achievements

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.level = this.getLevel(0);
    this.setupInput();
  }

  private getLevel(num: number): Level {
    const levels: Level[] = [
      // HOME ROW (Levels 1-4)
      {
        id: '1-1',
        number: 1,
        name: 'Home Row: F & J',
        letters: ['F', 'J'],
        fallSpeed: 100,
        spawnRate: 2.0,
        duration: 30,
        description: 'Place your index fingers on F and J!',
        hint: 'Keep your fingers on the home row bumps. Feel the small ridges on F and J? Those are your home base!',
      },
      {
        id: '1-2',
        number: 2,
        name: 'Home Row: D & K',
        letters: ['F', 'J', 'D', 'K'],
        fallSpeed: 110,
        spawnRate: 1.8,
        duration: 30,
        description: 'Add your middle fingers on D and K.',
        hint: 'Middle fingers control D and K. Keep all four fingers hovering just above the keys.',
      },
      {
        id: '1-3',
        number: 3,
        name: 'Home Row: S & L',
        letters: ['F', 'J', 'D', 'K', 'S', 'L'],
        fallSpeed: 120,
        spawnRate: 1.6,
        duration: 30,
        description: 'Ring fingers on S and L.',
        hint: 'Ring fingers are weaker - that\'s normal! Practice makes perfect.',
        easterEgg: 'Type "SOS" quickly to activate a shield!',
      },
      {
        id: '1-4',
        number: 4,
        name: 'Full Home Row',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        fallSpeed: 140,
        spawnRate: 1.3,
        duration: 60,
        description: 'Master the home row!',
        hint: 'All 8 home row keys! Keep your wrists straight and fingers curved.',
      },

      // UPPER ROW (Levels 5-8)
      {
        id: '2-1',
        number: 5,
        name: 'Upper Row: R & U',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U'],
        fallSpeed: 150,
        spawnRate: 1.2,
        duration: 45,
        description: 'Index fingers reach up to R and U.',
        hint: 'Reach up with your index fingers. Return to home row after each key.',
      },
      {
        id: '2-2',
        number: 6,
        name: 'Upper Row: E & I',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U', 'E', 'I'],
        fallSpeed: 160,
        spawnRate: 1.1,
        duration: 45,
        description: 'Middle fingers reach for E and I.',
        hint: 'E and I are directly above D and K. Small reach, quick return!',
      },
      {
        id: '2-3',
        number: 7,
        name: 'Upper Row: W & O',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U', 'E', 'I', 'W', 'O'],
        fallSpeed: 170,
        spawnRate: 1.0,
        duration: 45,
        description: 'Ring fingers stretch to W and O.',
        hint: 'Bigger stretch for ring fingers! Keep your palms steady.',
        easterEgg: 'Type "WOW" for a surprise combo boost!',
      },
      {
        id: '2-4',
        number: 8,
        name: 'Full Upper Row',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        fallSpeed: 180,
        spawnRate: 0.9,
        duration: 60,
        description: 'Complete upper row mastery!',
        hint: 'Q, T, Y, and P added! Pinky fingers get a workout.',
      },

      // LOWER ROW (Levels 9-11)
      {
        id: '3-1',
        number: 9,
        name: 'Lower Row: V & M',
        letters: ['F', 'J', 'V', 'M'],
        fallSpeed: 190,
        spawnRate: 1.5,
        duration: 40,
        description: 'Index fingers drop to V and M.',
        hint: 'Reach down this time! V and M are below F and J.',
      },
      {
        id: '3-2',
        number: 10,
        name: 'Lower Row: C & ,',
        letters: ['F', 'J', 'V', 'M', 'C', ','],
        fallSpeed: 200,
        spawnRate: 1.3,
        duration: 40,
        description: 'Middle fingers reach for C and comma.',
        hint: 'The comma key is lower-right. Practice finding it without looking!',
      },
      {
        id: '3-3',
        number: 11,
        name: 'Full Lower Row',
        letters: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
        fallSpeed: 210,
        spawnRate: 1.0,
        duration: 60,
        description: 'Master all lower keys!',
        hint: 'Z and slash (/) use your pinkies. Take your time!',
        easterEgg: 'Type "ZEN" to enter focus mode!',
      },

      // ALL LETTERS (Levels 12-13)
      {
        id: '4-1',
        number: 12,
        name: 'All Letters Mixed',
        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
        fallSpeed: 220,
        spawnRate: 0.8,
        duration: 90,
        description: 'Every letter on the keyboard!',
        hint: 'Random letters from the full alphabet. Stay calm and trust your muscle memory.',
      },
      {
        id: '4-2',
        number: 13,
        name: 'Speed Challenge',
        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
        fallSpeed: 250,
        spawnRate: 0.6,
        duration: 60,
        description: 'Fast-paced letter assault!',
        hint: 'Speed test! Focus on accuracy first, speed will follow.',
      },

      // NUMBERS (Levels 14-16)
      {
        id: '5-1',
        number: 14,
        name: 'Numbers: 1-5',
        letters: ['1', '2', '3', '4', '5'],
        fallSpeed: 180,
        spawnRate: 1.5,
        duration: 40,
        description: 'Top row numbers, left hand.',
        hint: 'Numbers require reaching up high. Use your pinky to ring finger.',
      },
      {
        id: '5-2',
        number: 15,
        name: 'Numbers: 6-0',
        letters: ['6', '7', '8', '9', '0'],
        fallSpeed: 180,
        spawnRate: 1.5,
        duration: 40,
        description: 'Top row numbers, right hand.',
        hint: 'Right hand numbers! 0 is where your right pinky reaches.',
      },
      {
        id: '5-3',
        number: 16,
        name: 'All Numbers',
        letters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        fallSpeed: 200,
        spawnRate: 1.2,
        duration: 60,
        description: 'Full number row!',
        hint: 'Practice numbers for coding and data entry. Very useful skill!',
        easterEgg: 'Type "007" for secret agent mode!',
      },

      // WORDS (Levels 17-20)
      {
        id: '6-1',
        number: 17,
        name: 'Common Words',
        letters: ['T','H','E','A','N','D','I','S','O','F'],
        words: ['the', 'and', 'is', 'of', 'to', 'in', 'it', 'you', 'that', 'he', 'was', 'for'],
        fallSpeed: 160,
        spawnRate: 1.8,
        duration: 60,
        description: 'Type complete words!',
        hint: 'Whole words now! Type them quickly - they\'re worth bonus points!',
      },
      {
        id: '6-2',
        number: 18,
        name: 'Action Words',
        letters: ['R','U','N','J','M','P','F','L','Y'],
        words: ['run', 'jump', 'fly', 'code', 'type', 'play', 'move', 'stop', 'go', 'win'],
        fallSpeed: 180,
        spawnRate: 1.5,
        duration: 60,
        description: 'Action verbs for speed!',
        hint: 'Action words! Type them fast to match the energy!',
        easterEgg: 'Type "RUSH" during combo to trigger turbo mode!',
      },
      {
        id: '6-3',
        number: 19,
        name: 'Tech Words',
        letters: ['C','O','D','E','B','U','G','A','P','I'],
        words: ['code', 'bug', 'api', 'git', 'dev', 'web', 'app', 'data', 'test', 'debug'],
        fallSpeed: 200,
        spawnRate: 1.3,
        duration: 60,
        description: 'Programming vocabulary!',
        hint: 'Tech terms! Perfect for developers. Every word builds coding muscle memory!',
      },
      {
        id: '6-4',
        number: 20,
        name: 'Ultimate Challenge',
        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9','0'],
        words: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'code', 'ninja', 'master', 'level'],
        fallSpeed: 280,
        spawnRate: 0.5,
        duration: 120,
        description: 'Everything you\'ve learned!',
        hint: 'Final boss! Letters, numbers, and words. Show everything you\'ve mastered!',
        easterEgg: 'Type "GODMODE" for invincibility!',
      },
    ];

    return levels[num] || levels[levels.length - 1];
  }

  private setupInput() {
    document.addEventListener('keydown', (e) => {
      if (this.state === GameState.Menu) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.state = GameState.LevelStart; // Show hint first
        }
      } else if (this.state === GameState.LevelStart) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startGame();
        }
      } else if (this.state === GameState.Playing) {
        const key = e.key.toUpperCase();
        if (/^[A-Z0-9;,./]$/.test(key)) { // Added numbers and punctuation
          this.handleLetterTyped(key);
        }
      } else if (this.state === GameState.LevelComplete) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.nextLevel();
        } else if (e.key.toLowerCase() === 'm') {
          this.state = GameState.Menu;
        } else if (e.key.toLowerCase() === 's') {
          this.shareScore(true);
        }
      } else if (this.state === GameState.GameOver) {
        if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
          this.currentLevel = 0;
          this.level = this.getLevel(0);
          this.state = GameState.LevelStart;
        } else if (e.key.toLowerCase() === 'm') {
          this.state = GameState.Menu;
        } else if (e.key.toLowerCase() === 's') {
          this.shareScore(false);
        }
      }
    });
  }

  private startGame() {
    this.state = GameState.Playing;
    this.lives = this.maxLives;
    this.letters = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.correctCount = 0;
    this.totalCount = 0;
    this.spawnTimer = 0;
    this.levelTimer = 0;
  }

  private nextLevel() {
    this.currentLevel++;
    if (this.currentLevel >= 20) this.currentLevel = 19; // 20 levels total
    this.level = this.getLevel(this.currentLevel);
    this.state = GameState.LevelStart; // Show hint before starting
  }

  private handleLetterTyped(char: string) {
    this.totalCount++;

    // Track for easter eggs
    this.easterEggBuffer += char;
    if (this.easterEggBuffer.length > 10) {
      this.easterEggBuffer = this.easterEggBuffer.slice(-10);
    }
    this.checkEasterEggs();

    // Track for word input
    this.currentWordInput += char;
    if (this.currentWordInput.length > 10) {
      this.currentWordInput = this.currentWordInput.slice(-10);
    }

    // Try to match a word first
    let foundIndex = -1;
    let maxY = -1;
    let isWordMatch = false;

    for (let i = 0; i < this.letters.length; i++) {
      if (this.letters[i].isWord) {
        // Check if current input matches this word
        if (this.letters[i].char === this.currentWordInput && this.letters[i].y > maxY) {
          foundIndex = i;
          maxY = this.letters[i].y;
          isWordMatch = true;
        }
      }
    }

    // If no word match, try single letter
    if (foundIndex === -1) {
      for (let i = 0; i < this.letters.length; i++) {
        if (!this.letters[i].isWord && this.letters[i].char === char && this.letters[i].y > maxY) {
          foundIndex = i;
          maxY = this.letters[i].y;
          isWordMatch = false;
        }
      }
    }

    if (foundIndex !== -1) {
      // Correct!
      const letter = this.letters.splice(foundIndex, 1)[0];
      this.correctCount++;
      this.combo++;

      // Words are worth 3x points
      const basePoints = isWordMatch ? 30 : 10;
      const multiplier = 1 + Math.floor(this.combo / 10);
      this.score += basePoints * multiplier;

      // Reset word input on success
      if (isWordMatch) {
        this.currentWordInput = '';
        this.wordsTypedThisSession++;
      }

      // Track max combo
      if (this.combo > this.maxComboThisSession) {
        this.maxComboThisSession = this.combo;
      }

      // More particles for words
      const particleCount = isWordMatch ? 30 : 15;
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(this.createParticle(letter.x, letter.y));
      }

      this.screenShake = isWordMatch ? 4 : 2;
      this.triggerFlash(isWordMatch ? 'rgba(255,215,0,100)' : 'rgba(57,255,20,80)');

      // Sound effects
      if (!isWordMatch) {
        audioManager.playLetterNote(char);
      }
      audioManager.playSFX(isWordMatch ? 'achievementUnlock' : 'letterHit');

      // Combo milestone sounds
      if (this.combo > 0 && this.combo % 10 === 0) {
        audioManager.playSFX('comboMilestone');
      }
    } else {
      // Wrong!
      this.combo = 0;
      this.currentWordInput = '';  // Reset word input on miss
      this.score = Math.max(0, this.score - 2);
      this.triggerFlash('rgba(255,51,102,150)');

      // Sound effect for wrong letter
      audioManager.playSFX('wrongLetter');
    }
  }

  private checkEasterEggs() {
    const buffer = this.easterEggBuffer;

    // Check each easter egg
    if (buffer.includes('SOS') && !this.activeEasterEggs.has('SOS')) {
      this.activateEasterEgg('SOS', 'Shield activated! Extra life!');
      this.lives = Math.min(this.maxLives, this.lives + 1);
    }
    if (buffer.includes('WOW') && !this.activeEasterEggs.has('WOW')) {
      this.activateEasterEgg('WOW', 'Combo boost! +50 combo!');
      this.combo += 50;
    }
    if (buffer.includes('ZEN') && !this.activeEasterEggs.has('ZEN')) {
      this.activateEasterEgg('ZEN', 'Focus mode! Slow motion activated!');
      // Slow down all letters temporarily
      this.letters.forEach(l => l.speed *= 0.7);
    }
    if (buffer.includes('007') && !this.activeEasterEggs.has('007')) {
      this.activateEasterEgg('007', 'Secret agent mode! Double points!');
      this.score *= 2;
    }
    if (buffer.includes('RUSH') && !this.activeEasterEggs.has('RUSH')) {
      this.activateEasterEgg('RUSH', 'Turbo mode! Max speed!');
      this.letters.forEach(l => l.speed *= 1.5);
    }
    if (buffer.includes('GODMODE') && !this.activeEasterEggs.has('GODMODE')) {
      this.activateEasterEgg('GODMODE', 'Invincibility! Infinite lives!');
      this.lives = 999;
    }
  }

  private activateEasterEgg(code: string, message: string) {
    this.activeEasterEggs.add(code);
    this.triggerFlash('rgba(255,215,0,150)');
    audioManager.playSFX('achievementUnlock');

    // Show easter egg message
    console.log(`🎉 EASTER EGG: ${message}`);

    // Track for achievements
    achievementManager.checkEasterEgg();
  }

  private async shareScore(completed: boolean) {
    const accuracy = this.totalCount > 0
      ? Math.floor((this.correctCount / this.totalCount) * 100)
      : 100;

    const scoreData = {
      levelNumber: this.level.number,
      levelName: this.level.name,
      score: this.score,
      wpm: this.calculateWPM(),
      accuracy: accuracy,
      combo: this.maxComboThisSession,
      completed: completed,
    };

    // Try native share API first (mobile)
    const shared = await shareManager.share(scoreData);
    if (shared) {
      console.log('✓ Shared via native API');
      return;
    }

    // Fallback: copy text and show notification
    const copied = await shareManager.copyText(scoreData);
    if (copied) {
      console.log('✓ Score copied to clipboard!');
      alert('Score copied to clipboard! Share it with your friends!');
    } else {
      // Final fallback: download image
      shareManager.downloadImage(scoreData);
      console.log('✓ Score image downloaded!');
    }
  }

  private createParticle(x: number, y: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 200;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 5,
    };
  }

  private triggerFlash(color: string) {
    this.flashTimer = 0.2;
    this.flashColor = color;
  }

  private calculateWPM(): number {
    if (this.levelTimer === 0) return 0;
    const minutes = this.levelTimer / 60;
    const words = this.correctCount / 5; // Standard: 5 characters = 1 word
    return Math.round(words / minutes);
  }

  private async requestAIFeedback() {
    // Check if AI coach is available
    const aiCoach = (window as any).__aiCoach;
    if (!aiCoach || this.isLoadingFeedback) {
      this.aiFeedback = `Great job! You scored ${this.score} points!`;
      await this.recordSessionStats(); // Record stats even without AI
      return;
    }

    this.isLoadingFeedback = true;

    try {
      const stats = {
        duration: Math.round(this.levelTimer),
        total: this.totalCount,
        accuracy: this.totalCount > 0 ? Math.round((this.correctCount / this.totalCount) * 100) : 100,
        wpm: this.calculateWPM(),
        weakLetters: [], // Could track per-letter accuracy later
        previousWpm: this.previousWpm,
      };

      this.aiFeedback = await aiCoach.getSessionFeedback(stats);
      this.previousWpm = stats.wpm;

      // Record stats after getting feedback
      await this.recordSessionStats();
    } catch (error) {
      console.warn('AI feedback failed:', error);
      this.aiFeedback = `Great job! You scored ${this.score} points!`;
      await this.recordSessionStats(); // Record stats even if AI fails
    } finally {
      this.isLoadingFeedback = false;
    }
  }

  private async recordSessionStats() {
    // Save session to stats manager and refresh UI
    const statsManager = (window as any).__statsManager;
    if (!statsManager) return;

    const accuracy = this.totalCount > 0
      ? Math.floor((this.correctCount / this.totalCount) * 100)
      : 100;
    const wpm = this.calculateWPM();

    await statsManager.recordSession({
      score: this.score,
      wpm: wpm,
      accuracy: accuracy,
      level: this.level.name,
      duration: Math.round(this.levelTimer),
    });

    // Check achievements
    await achievementManager.checkSessionAchievements({
      wpm: wpm,
      accuracy: accuracy,
      level: this.level.number,
      combo: this.maxComboThisSession,
      totalLetters: this.totalCount,
      wordsTyped: this.wordsTypedThisSession,
    });

    // Trigger stats refresh in UI
    const refreshEvent = new CustomEvent('stats-updated');
    window.dispatchEvent(refreshEvent);
  }

  private spawnLetter() {
    if (this.level.letters.length === 0) return;

    const margin = 60;
    const x = margin + Math.random() * (this.canvas.width - margin * 2);

    // 30% chance to spawn a word if words are available
    const shouldSpawnWord = this.level.words && Math.random() < 0.3;

    if (shouldSpawnWord && this.level.words && this.level.words.length > 0) {
      const word = this.level.words[Math.floor(Math.random() * this.level.words.length)];
      this.letters.push({
        char: word.toUpperCase(),
        x,
        y: -50,
        speed: this.level.fallSpeed * 0.8, // Slightly slower for words
        size: 30,
        targeted: false,
        isWord: true,
      });
    } else {
      const char = this.level.letters[Math.floor(Math.random() * this.level.letters.length)];
      this.letters.push({
        char,
        x,
        y: -50,
        speed: this.level.fallSpeed,
        size: 40,
        targeted: false,
        isWord: false,
      });
    }
  }

  public start() {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private gameLoop = () => {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.update(delta);
    this.draw();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(delta: number) {
    if (this.state === GameState.Playing) {
      this.levelTimer += delta;
      this.spawnTimer += delta;
      this.screenShake = Math.max(0, this.screenShake - delta * 5);
      this.flashTimer = Math.max(0, this.flashTimer - delta * 3);

      // Spawn letters
      if (this.spawnTimer >= this.level.spawnRate) {
        this.spawnLetter();
        this.spawnTimer = 0;
      }

      // Update letters
      for (const letter of this.letters) {
        letter.y += letter.speed * delta;
      }

      // Remove letters that hit ground
      for (let i = this.letters.length - 1; i >= 0; i--) {
        if (this.letters[i].y > this.canvas.height + 50) {
          this.letters.splice(i, 1);
          this.lives--;
          this.combo = 0;
          this.triggerFlash('rgba(255,51,102,100)');

          // Sound effect for life lost
          audioManager.playSFX('lifeLost');

          if (this.lives <= 0) {
            this.state = GameState.GameOver;
            // Sound effect for game over
            audioManager.playSFX('gameOver');
            // Request AI feedback asynchronously
            this.requestAIFeedback();
          }
        }
      }

      // Update particles
      for (const p of this.particles) {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 300 * delta; // gravity
        p.life -= delta;
      }
      this.particles = this.particles.filter(p => p.life > 0);

      // Check level completion
      if (this.levelTimer >= this.level.duration && this.lives > 0) {
        this.state = GameState.LevelComplete;
        // Sound effect for level complete
        audioManager.playSFX('levelComplete');
        // Request AI feedback asynchronously
        this.requestAIFeedback();
      }
    }
  }

  private draw() {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 4;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 4;
      ctx.translate(shakeX, shakeY);
    }

    // Clear
    ctx.fillStyle = 'rgb(10, 14, 39)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw based on state
    if (this.state === GameState.Menu) {
      this.drawMenu();
    } else if (this.state === GameState.LevelStart) {
      this.drawLevelStart();
    } else {
      this.drawStarfield();
      this.drawParticles();
      this.drawLetters();
      this.drawPlayer();
      this.drawGroundLine();
      this.drawHUD();

      if (this.state === GameState.LevelComplete) {
        this.drawLevelComplete();
      } else if (this.state === GameState.GameOver) {
        this.drawGameOver();
      }
    }

    ctx.restore();

    // Flash overlay
    if (this.flashTimer > 0) {
      const alpha = Math.min(255, this.flashTimer * 255 * 5) / 255;
      const match = this.flashColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        ctx.fillStyle = `rgba(${match[1]},${match[2]},${match[3]},${alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  private drawStarfield() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';

    for (let i = 0; i < 50; i++) {
      const x = (i * 127) % this.canvas.width;
      const y = (i * 211) % this.canvas.height;
      const size = 1 + (i % 3);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles() {
    const ctx = this.ctx;

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(0,240,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLetters() {
    const ctx = this.ctx;

    for (const letter of this.letters) {
      if (letter.isWord) {
        // Words: Draw as rounded rectangle
        const textWidth = ctx.measureText(letter.char).width;
        const padding = 15;
        const width = textWidth + padding * 2;
        const height = letter.size + padding;

        // Glow
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.fillRect(letter.x - width/2 - 5, letter.y - height/2 - 5, width + 10, height + 10);

        // Background
        ctx.fillStyle = 'rgba(255,140,0,0.8)';
        ctx.fillRect(letter.x - width/2, letter.y - height/2, width, height);

        // Word
        ctx.fillStyle = 'white';
        ctx.font = `bold ${letter.size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter.char, letter.x, letter.y);

        // Word indicator
        ctx.fillStyle = 'gold';
        ctx.font = `12px "Courier New", monospace`;
        ctx.fillText('×3', letter.x, letter.y - height/2 - 10);
      } else {
        // Single letters: Draw as circles
        // Glow
        ctx.fillStyle = 'rgba(0,240,255,0.2)';
        ctx.beginPath();
        ctx.arc(letter.x, letter.y, letter.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Background
        ctx.fillStyle = 'rgba(0,100,120,0.8)';
        ctx.beginPath();
        ctx.arc(letter.x, letter.y, letter.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Letter
        ctx.fillStyle = 'white';
        ctx.font = `bold ${letter.size * 1.2}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter.char, letter.x, letter.y);
      }

      // Targeting
      if (letter.targeted) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (letter.isWord) {
          const textWidth = ctx.measureText(letter.char).width;
          ctx.strokeRect(letter.x - textWidth/2 - 20, letter.y - letter.size - 10, textWidth + 40, letter.size * 2 + 20);
        } else {
          ctx.arc(letter.x, letter.y, letter.size * 0.9, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    }
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const x = this.canvas.width / 2;
    const y = this.canvas.height - 50;

    // Turret
    ctx.fillStyle = 'rgb(0,240,255)';
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 20);
    ctx.lineTo(x + 30, y + 20);
    ctx.lineTo(x, y - 40);
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.fillStyle = 'rgb(255,0,110)';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = 'rgba(255,0,110,0.2)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGroundLine() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height - 20);
    ctx.lineTo(this.canvas.width, this.canvas.height - 20);
    ctx.stroke();
  }

  private drawHUD() {
    const ctx = this.ctx;
    const margin = 20;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Lives
    ctx.fillStyle = 'red';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText(`Lives: ${this.lives}`, margin, margin);

    // Score
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Score: ${this.score}`, margin, margin + 30);

    // Combo
    if (this.combo > 0) {
      ctx.fillStyle = this.combo >= 10 ? 'rgb(57,255,20)' : 'white';
      ctx.fillText(`Combo: ${this.combo}x`, margin, margin + 60);
    }

    // Level info
    ctx.textAlign = 'right';
    ctx.fillStyle = 'skyblue';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(`Level ${this.level.number}: ${this.level.name}`, this.canvas.width - margin, margin);

    // Timer
    const timeLeft = Math.max(0, this.level.duration - this.levelTimer);
    ctx.fillStyle = 'white';
    ctx.fillText(`Time: ${timeLeft.toFixed(0)}s`, this.canvas.width - margin, margin + 30);

    // Accuracy
    const accuracy = this.totalCount > 0
      ? Math.floor((this.correctCount / this.totalCount) * 100)
      : 100;
    ctx.fillStyle = accuracy >= 90 ? 'lime' : accuracy >= 70 ? 'yellow' : 'red';
    ctx.fillText(`Accuracy: ${accuracy}%`, this.canvas.width - margin, margin + 60);

    // AI Model Indicator (bottom right, subtle)
    const aiCoach = (window as any).__aiCoach;
    const config = (window as any).__config;
    if (config) {
      const aiMode = config.getConfig().aiMode;
      let modelText = '';
      let modelColor = 'rgba(0, 240, 255, 0.5)';

      if (aiMode === 'gemma3') {
        if (aiCoach && aiCoach.isReady) {
          modelText = '🤖 Gemma 3 (1B)';
          modelColor = 'rgba(0, 255, 100, 0.8)';  // Green when loaded
        } else {
          modelText = '🤖 Gemma 3 (Loading...)';
          modelColor = 'rgba(255, 200, 0, 0.6)';  // Yellow when loading
        }
      } else if (aiMode === 'webllm') {
        if (aiCoach && aiCoach.isReady) {
          modelText = '🤖 Llama 3.2';
          modelColor = 'rgba(0, 255, 100, 0.8)';
        } else {
          modelText = '🤖 Llama 3.2 (Loading...)';
          modelColor = 'rgba(255, 200, 0, 0.6)';
        }
      } else {
        modelText = '💬 No AI';
        modelColor = 'rgba(150, 150, 150, 0.5)';
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = modelColor;
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(modelText, this.canvas.width - margin, this.canvas.height - margin);
    }
  }

  private drawMenu() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    ctx.fillStyle = 'rgb(0,240,255)';
    ctx.font = 'bold 80px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TYPE STRIKE', cx, cy - 100);

    ctx.fillStyle = 'rgb(255,0,110)';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText('AI-Powered Typing Trainer', cx, cy - 40);

    ctx.fillStyle = 'white';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText('Press SPACE to Start', cx, cy + 50);

    ctx.fillStyle = 'gray';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Type the falling letters to destroy them!', cx, cy + 120);
  }

  private drawLevelStart() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Background
    ctx.fillStyle = 'rgb(10, 14, 39)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Level number and name
    ctx.fillStyle = 'rgb(0,240,255)';
    ctx.font = 'bold 50px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${this.level.number}`, cx, cy - 120);

    ctx.fillStyle = 'rgb(255,0,110)';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(this.level.name, cx, cy - 70);

    // Description
    ctx.fillStyle = 'white';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(this.level.description, cx, cy - 30);

    // AI Hint
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'italic 18px "Courier New", monospace';
    const hintLines = this.wrapText(this.level.hint, 600);
    hintLines.forEach((line, i) => {
      ctx.fillText(line, cx, cy + 10 + i * 25);
    });

    // Easter egg hint (if exists)
    if (this.level.easterEgg) {
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(`✨ Secret: ${this.level.easterEgg}`, cx, cy + 80);
    }

    // Start prompt
    ctx.fillStyle = 'lime';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText('Press SPACE when ready!', cx, cy + 130);
  }

  private drawLevelComplete() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = 'lime';
    ctx.font = 'bold 60px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEVEL COMPLETE!', cx, cy - 140);

    const accuracy = this.totalCount > 0
      ? Math.floor((this.correctCount / this.totalCount) * 100)
      : 100;
    const wpm = this.calculateWPM();

    ctx.fillStyle = 'yellow';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(`Score: ${this.score}`, cx, cy - 60);

    ctx.fillStyle = 'white';
    ctx.fillText(`Accuracy: ${accuracy}%`, cx, cy - 20);
    ctx.fillText(`WPM: ${wpm}`, cx, cy + 20);

    // AI Feedback
    ctx.fillStyle = '#00f0ff';
    ctx.font = '18px "Courier New", monospace';
    const feedbackLines = this.wrapText(this.aiFeedback, 500);
    feedbackLines.forEach((line, i) => {
      ctx.fillText(line, cx, cy + 60 + i * 25);
    });

    ctx.fillStyle = 'skyblue';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText('Press SPACE for next level', cx, cy + 140);

    ctx.fillStyle = 'gold';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Press S to share score', cx, cy + 170);

    ctx.fillStyle = 'gray';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('Press M for menu', cx, cy + 200);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private drawGameOver() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = 'red';
    ctx.font = 'bold 60px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', cx, cy - 140);

    const accuracy = this.totalCount > 0
      ? Math.floor((this.correctCount / this.totalCount) * 100)
      : 100;
    const wpm = this.calculateWPM();

    ctx.fillStyle = 'yellow';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(`Final Score: ${this.score}`, cx, cy - 60);

    ctx.fillStyle = 'white';
    ctx.fillText(`Accuracy: ${accuracy}%`, cx, cy - 20);
    ctx.fillText(`WPM: ${wpm}`, cx, cy + 20);

    // AI Feedback
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '18px "Courier New", monospace';
    const feedbackLines = this.wrapText(this.aiFeedback, 500);
    feedbackLines.forEach((line, i) => {
      ctx.fillText(line, cx, cy + 60 + i * 25);
    });

    ctx.fillStyle = 'white';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText('Press SPACE to retry', cx, cy + 140);

    ctx.fillStyle = 'gray';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Press M for menu', cx, cy + 170);
  }
}
