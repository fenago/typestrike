// Settings UI Component

import { ConfigManager, GEMMA_MODELS, type GemmaModel } from '../config';
import { audioManager } from '../audio';

export class SettingsUI {
  private config: ConfigManager;
  private isOpen = false;
  private overlay: HTMLElement | null = null;

  constructor(config: ConfigManager) {
    this.config = config;
    this.createSettingsButton();
  }

  private createSettingsButton() {
    const button = document.createElement('button');
    button.id = 'settings-button';
    button.innerHTML = '⚙️';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(0, 240, 255, 0.2);
      border: 2px solid rgba(0, 240, 255, 0.5);
      color: #00f0ff;
      font-size: 24px;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s ease;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 240, 255, 0.4)';
      button.style.transform = 'rotate(90deg)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 240, 255, 0.2)';
      button.style.transform = 'rotate(0deg)';
    });

    button.addEventListener('click', () => this.toggle());

    document.body.appendChild(button);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.createOverlay();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const panel = this.createPanel();
    overlay.appendChild(panel);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Close on ESC key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: linear-gradient(135deg, #0a0e27 0%, #1a1e3f 100%);
      border: 2px solid rgba(0, 240, 255, 0.5);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 40px rgba(0, 240, 255, 0.3);
    `;

    const currentConfig = this.config.getConfig();
    console.log('⚙️ Settings Panel - Current Config:', currentConfig);
    console.log('   aiMode:', currentConfig.aiMode);
    console.log('   gemmaModel:', currentConfig.gemmaModel);

    panel.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .settings-title {
          font-size: 36px;
          color: #00f0ff;
          margin-bottom: 30px;
          text-align: center;
          font-family: 'Courier New', monospace;
          text-shadow: 0 0 10px #00f0ff;
        }

        .settings-section {
          margin-bottom: 30px;
        }

        .settings-section-title {
          font-size: 20px;
          color: #ff006e;
          margin-bottom: 15px;
          font-family: 'Courier New', monospace;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin-bottom: 10px;
          transition: background 0.2s;
        }

        .setting-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .setting-label {
          color: #fff;
          font-size: 16px;
          font-family: 'Courier New', monospace;
        }

        .setting-control {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .toggle-button {
          width: 60px;
          height: 30px;
          border-radius: 15px;
          background: #333;
          border: 2px solid #666;
          cursor: pointer;
          position: relative;
          transition: all 0.3s;
        }

        .toggle-button.active {
          background: #00f0ff;
          border-color: #00f0ff;
        }

        .toggle-button::after {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          top: 2px;
          left: 2px;
          transition: all 0.3s;
        }

        .toggle-button.active::after {
          left: 32px;
        }

        select {
          padding: 8px 15px;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.5);
          border-radius: 5px;
          color: #00f0ff;
          font-family: 'Courier New', monospace;
          cursor: pointer;
        }

        select option {
          background: #0a0e27;
          color: #00f0ff;
        }

        .slider {
          width: 150px;
          height: 6px;
          border-radius: 3px;
          background: #333;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00f0ff;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00f0ff;
          cursor: pointer;
          border: none;
        }

        .close-button {
          display: block;
          margin: 30px auto 0;
          padding: 15px 40px;
          background: linear-gradient(135deg, #00f0ff, #ff006e);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .close-button:hover {
          transform: scale(1.05);
        }

        .setting-description {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }
      </style>

      <h1 class="settings-title">⚙️ SETTINGS</h1>

      <div class="settings-section">
        <h2 class="settings-section-title">🤖 AI Coach</h2>

        <div class="setting-item">
          <div>
            <div class="setting-label">AI Mode</div>
            <div class="setting-description">Choose your AI coaching engine</div>
          </div>
          <div class="setting-control">
            <select id="ai-mode-select">
              <option value="mediapipe" ${currentConfig.aiMode === 'mediapipe' ? 'selected' : ''}>MediaPipe (Gemma 3/3n) ⭐ RECOMMENDED</option>
              <option value="webllm" ${currentConfig.aiMode === 'webllm' ? 'selected' : ''}>WebLLM (Llama 3.2)</option>
              <option value="disabled" ${currentConfig.aiMode === 'disabled' ? 'selected' : ''}>Disabled (No AI)</option>
            </select>
          </div>
        </div>

        <div class="setting-item" id="gemma-model-container" style="${currentConfig.aiMode !== 'mediapipe' ? 'display: none;' : ''}">
          <div>
            <div class="setting-label">Gemma Model</div>
            <div class="setting-description">Select model variant (requires reload)</div>
          </div>
          <div class="setting-control">
            <select id="gemma-model-select">
              <option value="gemma-3n-270m" ${currentConfig.gemmaModel === 'gemma-3n-270m' ? 'selected' : ''}>Gemma 3n 270M (~200MB)</option>
              <option value="gemma-3n-e2b" ${currentConfig.gemmaModel === 'gemma-3n-e2b' ? 'selected' : ''}>Gemma 3n E2B (~1.5GB)</option>
              <option value="gemma-3n-e4b" ${currentConfig.gemmaModel === 'gemma-3n-e4b' ? 'selected' : ''}>Gemma 3n E4B ⭐ (~3GB)</option>
              <option value="gemma-3-4b" ${currentConfig.gemmaModel === 'gemma-3-4b' ? 'selected' : ''}>Gemma 3 4B (~3GB)</option>
              <option value="gemma-3-12b" ${currentConfig.gemmaModel === 'gemma-3-12b' ? 'selected' : ''}>Gemma 3 12B (~8GB)</option>
            </select>
          </div>
        </div>

        <div class="setting-item" id="gemma-model-info" style="font-size: 12px; color: #aaa; display: ${currentConfig.aiMode !== 'mediapipe' ? 'none' : 'block'}; padding-top: 10px;">
          <strong>Current Model:</strong> ${GEMMA_MODELS[currentConfig.gemmaModel].name}<br>
          <strong>Size:</strong> ${GEMMA_MODELS[currentConfig.gemmaModel].size}<br>
          <strong>Multimodal:</strong> ${GEMMA_MODELS[currentConfig.gemmaModel].multimodal ? 'Yes (text + images + audio) ✨' : 'No (text only)'}<br>
          <strong>Description:</strong> ${GEMMA_MODELS[currentConfig.gemmaModel].description}
        </div>

        <div class="setting-item" style="font-size: 13px; color: #aaa; display: block;">
          <strong>MediaPipe:</strong> Google's official Gemma 3 & 3n models, multimodal support ⭐<br>
          <strong>WebLLM:</strong> Llama-3.2-1B, ~600MB, faster alternative<br>
          <strong>Disabled:</strong> No AI, uses pre-written messages (instant)
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">🔊 Audio</h2>

        <div class="setting-item">
          <div class="setting-label">Background Music</div>
          <div class="setting-control">
            <div class="toggle-button ${currentConfig.sound ? 'active' : ''}" id="music-toggle"></div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">Sound Effects</div>
          <div class="setting-control">
            <div class="toggle-button ${currentConfig.sound ? 'active' : ''}" id="sfx-toggle"></div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">Master Volume</div>
          <div class="setting-control">
            <input type="range" min="0" max="100" value="${audioManager.getMasterVolume() * 100}" class="slider" id="volume-slider">
            <span id="volume-value" style="color: #00f0ff; min-width: 40px;">${Math.round(audioManager.getMasterVolume() * 100)}%</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">🎨 Visual Effects</h2>

        <div class="setting-item">
          <div class="setting-label">Particles</div>
          <div class="setting-control">
            <div class="toggle-button ${currentConfig.particles ? 'active' : ''}" id="particles-toggle"></div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">Screen Shake</div>
          <div class="setting-control">
            <div class="toggle-button ${currentConfig.screenShake ? 'active' : ''}" id="shake-toggle"></div>
          </div>
        </div>
      </div>

      <button class="close-button" id="close-settings">CLOSE</button>
    `;

    // Add event listeners
    this.attachEventListeners(panel);

    return panel;
  }

  private attachEventListeners(panel: HTMLElement) {
    // AI Mode
    const aiModeSelect = panel.querySelector('#ai-mode-select') as HTMLSelectElement;
    const gemmaModelContainer = panel.querySelector('#gemma-model-container') as HTMLElement;
    const gemmaModelInfo = panel.querySelector('#gemma-model-info') as HTMLElement;

    aiModeSelect?.addEventListener('change', () => {
      const mode = aiModeSelect.value as 'mediapipe' | 'webllm' | 'disabled';
      this.config.setAIMode(mode);

      // Show/hide Gemma model selector based on mode
      if (gemmaModelContainer && gemmaModelInfo) {
        if (mode === 'mediapipe') {
          gemmaModelContainer.style.display = '';
          gemmaModelInfo.style.display = 'block';
        } else {
          gemmaModelContainer.style.display = 'none';
          gemmaModelInfo.style.display = 'none';
        }
      }
    });

    // Gemma Model selection
    const gemmaModelSelect = panel.querySelector('#gemma-model-select') as HTMLSelectElement;
    gemmaModelSelect?.addEventListener('change', () => {
      const model = gemmaModelSelect.value as GemmaModel;
      const modelInfo = GEMMA_MODELS[model];

      this.config.setGemmaModel(model);

      // Show reload prompt with model info
      alert(`✓ Model changed to ${modelInfo.name} (${modelInfo.size})\n\nReload the page to start using this model.`);

      // Re-render panel to update info display
      this.close();
      this.open();
    });

    // Music toggle
    const musicToggle = panel.querySelector('#music-toggle');
    musicToggle?.addEventListener('click', () => {
      const newState = !audioManager.getMusicEnabled();
      audioManager.setMusicEnabled(newState);
      this.config.saveConfig({ sound: newState });
      musicToggle.classList.toggle('active', newState);
    });

    // SFX toggle
    const sfxToggle = panel.querySelector('#sfx-toggle');
    sfxToggle?.addEventListener('click', () => {
      const newState = !audioManager.getSFXEnabled();
      audioManager.setSFXEnabled(newState);
      sfxToggle.classList.toggle('active', newState);

      // Play test sound
      if (newState) {
        audioManager.playSFX('letterHit');
      }
    });

    // Volume slider
    const volumeSlider = panel.querySelector('#volume-slider') as HTMLInputElement;
    const volumeValue = panel.querySelector('#volume-value');
    volumeSlider?.addEventListener('input', () => {
      const volume = parseInt(volumeSlider.value) / 100;
      audioManager.setMasterVolume(volume);
      if (volumeValue) {
        volumeValue.textContent = `${Math.round(volume * 100)}%`;
      }
    });

    // Particles toggle
    const particlesToggle = panel.querySelector('#particles-toggle');
    const currentParticles = this.config.getConfig().particles;
    particlesToggle?.addEventListener('click', () => {
      const newState = !this.config.getConfig().particles;
      this.config.saveConfig({ particles: newState });
      particlesToggle.classList.toggle('active', newState);
    });

    // Screen shake toggle
    const shakeToggle = panel.querySelector('#shake-toggle');
    shakeToggle?.addEventListener('click', () => {
      const newState = !this.config.getConfig().screenShake;
      this.config.saveConfig({ screenShake: newState });
      shakeToggle.classList.toggle('active', newState);
    });

    // Close button
    const closeButton = panel.querySelector('#close-settings');
    closeButton?.addEventListener('click', () => this.close());
  }
}
