// Pure JavaScript/Canvas game implementation (fallback when WASM not available)

import { audioManager } from './audio';

interface Letter {
  char: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  targeted: boolean;
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
  name: string;
  letters: string[];
  fallSpeed: number;
  spawnRate: number;
  duration: number;
  description: string;
}

enum GameState {
  Menu,
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
      {
        id: '1-1',
        name: 'Home Row: F & J',
        letters: ['F', 'J'],
        fallSpeed: 100,
        spawnRate: 2.0,
        duration: 30,
        description: 'Place your index fingers on F and J!',
      },
      {
        id: '1-2',
        name: 'Home Row: D & K',
        letters: ['F', 'J', 'D', 'K'],
        fallSpeed: 110,
        spawnRate: 1.8,
        duration: 30,
        description: 'Add your middle fingers on D and K.',
      },
      {
        id: '1-3',
        name: 'Home Row: S & L',
        letters: ['F', 'J', 'D', 'K', 'S', 'L'],
        fallSpeed: 120,
        spawnRate: 1.6,
        duration: 30,
        description: 'Ring fingers on S and L.',
      },
      {
        id: '1-4',
        name: 'Full Home Row',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        fallSpeed: 140,
        spawnRate: 1.3,
        duration: 60,
        description: 'Master the home row!',
      },
      {
        id: '2-1',
        name: 'Upper Row: R & U',
        letters: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'R', 'U'],
        fallSpeed: 150,
        spawnRate: 1.2,
        duration: 45,
        description: 'Index fingers reach up to R and U.',
      },
    ];

    return levels[num] || levels[levels.length - 1];
  }

  private setupInput() {
    document.addEventListener('keydown', (e) => {
      if (this.state === GameState.Menu) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startGame();
        }
      } else if (this.state === GameState.Playing) {
        const key = e.key.toUpperCase();
        if (/^[A-Z;]$/.test(key)) {
          this.handleLetterTyped(key);
        }
      } else if (this.state === GameState.LevelComplete) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.nextLevel();
        } else if (e.key.toLowerCase() === 'm') {
          this.state = GameState.Menu;
        }
      } else if (this.state === GameState.GameOver) {
        if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
          this.startGame();
        } else if (e.key.toLowerCase() === 'm') {
          this.state = GameState.Menu;
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
    if (this.currentLevel >= 5) this.currentLevel = 4;
    this.level = this.getLevel(this.currentLevel);
    this.startGame();
  }

  private handleLetterTyped(char: string) {
    this.totalCount++;

    // Find matching letter (closest to ground)
    let foundIndex = -1;
    let maxY = -1;

    for (let i = 0; i < this.letters.length; i++) {
      if (this.letters[i].char === char && this.letters[i].y > maxY) {
        foundIndex = i;
        maxY = this.letters[i].y;
      }
    }

    if (foundIndex !== -1) {
      // Correct!
      const letter = this.letters.splice(foundIndex, 1)[0];
      this.correctCount++;
      this.combo++;

      const basePoints = 10;
      const multiplier = 1 + Math.floor(this.combo / 10);
      this.score += basePoints * multiplier;

      // Particles
      for (let i = 0; i < 15; i++) {
        this.particles.push(this.createParticle(letter.x, letter.y));
      }

      this.screenShake = 2;
      this.triggerFlash('rgba(57,255,20,80)');

      // Sound effects
      audioManager.playLetterNote(char);
      audioManager.playSFX('letterHit');

      // Combo milestone sounds
      if (this.combo > 0 && this.combo % 10 === 0) {
        audioManager.playSFX('comboMilestone');
      }
    } else {
      // Wrong!
      this.combo = 0;
      this.score = Math.max(0, this.score - 2);
      this.triggerFlash('rgba(255,51,102,150)');

      // Sound effect for wrong letter
      audioManager.playSFX('wrongLetter');
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
    } catch (error) {
      console.warn('AI feedback failed:', error);
      this.aiFeedback = `Great job! You scored ${this.score} points!`;
    } finally {
      this.isLoadingFeedback = false;
    }
  }

  private spawnLetter() {
    if (this.level.letters.length === 0) return;

    const char = this.level.letters[Math.floor(Math.random() * this.level.letters.length)];
    const margin = 60;
    const x = margin + Math.random() * (this.canvas.width - margin * 2);

    this.letters.push({
      char,
      x,
      y: -50,
      speed: this.level.fallSpeed,
      size: 40,
      targeted: false,
    });
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

      // Targeting
      if (letter.targeted) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(letter.x, letter.y, letter.size * 0.9, 0, Math.PI * 2);
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
    ctx.fillText(`Level: ${this.level.name}`, this.canvas.width - margin, margin);

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

    ctx.fillStyle = 'gray';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Press M for menu', cx, cy + 170);
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
    ctx.fillText('GAME OVER', cx, cy - 80);

    ctx.fillStyle = 'yellow';
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(`Final Score: ${this.score}`, cx, cy);

    ctx.fillStyle = 'white';
    ctx.font = '25px "Courier New", monospace';
    ctx.fillText('Press SPACE to retry', cx, cy + 60);

    ctx.fillStyle = 'gray';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Press M for menu', cx, cy + 90);
  }
}
