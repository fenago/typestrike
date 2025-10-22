// TypeStrike Web App
import { initWasm } from './wasm-loader';
import { AICoach } from './ai-coach';
import { StatsManager } from './stats';
import { ConfigManager } from './config';
import { SettingsUI } from './components/settings';

class TypeStrikeApp {
  private aiCoach: AICoach;
  private stats: StatsManager;
  private config: ConfigManager;

  constructor() {
    // Initialize configuration
    this.config = new ConfigManager();

    // Configure AI from config
    const { aiMode, gemmaModel } = this.config.getConfig();

    this.aiCoach = new AICoach({
      mode: aiMode,
      gemmaModel: gemmaModel
    });
    this.stats = new StatsManager();

    // Initialize settings UI
    new SettingsUI(this.config);

    // Expose AI coach and config globally for game access
    (window as any).__aiCoach = this.aiCoach;
    (window as any).__config = this.config;
  }

  async init() {
    try {
      // Update loading progress
      this.updateLoadingProgress(0, 'Initializing...');

      // Load stats
      await this.stats.init();
      this.updateLoadingProgress(20, 'Loading game data...');

      // Initialize WASM game
      await this.initGame();
      this.updateLoadingProgress(60, 'Starting game engine...');

      // Initialize AI in background (non-blocking)
      this.initAI();

      // Show game
      this.updateLoadingProgress(100, 'Ready!');
      setTimeout(() => this.showGame(), 500);

    } catch (error) {
      console.error('Initialization error:', error);
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  private async initGame() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    try {
      // Load game (WASM or fallback)
      await initWasm(canvas);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw new Error('Could not start game engine. Check console for details.');
    }
  }

  private async initAI() {
    const aiStatus = document.getElementById('ai-status');
    const { aiMode } = this.config.getConfig();

    if (!aiStatus || aiMode === 'disabled') {
      if (aiStatus) aiStatus.style.display = 'none';
      return;
    }

    // Get model info from AI coach
    const modelInfo = this.aiCoach.getModelInfo();
    const modelName = aiMode === 'mediapipe'
      ? modelInfo.name
      : 'Llama 3.2 (1B)';

    aiStatus.className = 'loading pulse';
    aiStatus.textContent = `🤖 Loading ${modelName}...`;

    try {
      await this.aiCoach.init((progress, status) => {
        const percent = Math.round(progress * 100);
        if (status) {
          aiStatus.textContent = `🤖 ${status}`;
        } else if (percent < 30) {
          aiStatus.textContent = `🤖 Initializing ${modelName}... ${percent}%`;
        } else {
          aiStatus.textContent = `🤖 Downloading ${modelName}... ${percent}%`;
        }
      });

      aiStatus.className = 'ready';
      aiStatus.textContent = `🤖 ${modelName}`;

      // Keep visible to show active model
      aiStatus.style.display = 'block';

    } catch (error) {
      console.warn('AI initialization failed (continuing without AI):', error);
      aiStatus.className = '';
      aiStatus.textContent = `⚠️ ${modelName} failed to load (using fallback)`;
      setTimeout(() => {
        if (aiStatus) aiStatus.style.display = 'none';
      }, 5000);
    }
  }

  private updateLoadingProgress(percent: number, text: string) {
    const progress = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');

    if (progress) {
      progress.style.width = `${percent}%`;
    }

    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  private showGame() {
    const loading = document.getElementById('loading');
    const canvas = document.getElementById('game-canvas');
    const statsPanel = document.getElementById('stats-panel');

    if (loading) loading.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (statsPanel) {
      statsPanel.style.display = 'block';
      this.updateStatsDisplay();
    }
  }

  private async updateStatsDisplay() {
    const stats = await this.stats.getStats();

    const sessionsEl = document.getElementById('stat-sessions');
    const bestScoreEl = document.getElementById('stat-best-score');
    const wpmEl = document.getElementById('stat-wpm');

    if (sessionsEl) sessionsEl.textContent = stats.sessions.toString();
    if (bestScoreEl) bestScoreEl.textContent = stats.bestScore.toString();
    if (wpmEl) wpmEl.textContent = stats.averageWpm.toFixed(1);
  }

  private showError(message: string) {
    const container = document.getElementById('container');
    if (!container) return;

    container.innerHTML = `
      <div class="error">
        <h2>⚠️ Error Loading Game</h2>
        <p>${message}</p>
        <p style="margin-top: 10px; font-size: 0.9em; color: #888;">
          Please make sure you're using a modern browser (Chrome, Firefox, or Edge).
        </p>
      </div>
    `;
  }
}

// Start the app
const app = new TypeStrikeApp();
app.init();
