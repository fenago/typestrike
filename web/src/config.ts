// TypeStrike Configuration

export type GemmaModel =
  | 'gemma-3n-270m'   // 270M - Fastest, smallest
  | 'gemma-3n-e2b'    // 2B - Good balance
  | 'gemma-3n-e4b'    // 4B - Recommended (multimodal)
  | 'gemma-3-4b'      // 4B - Alternative variant
  | 'gemma-3-12b';    // 12B - Highest quality

export interface ModelInfo {
  name: string;
  size: string;
  description: string;
  url: string;
  multimodal: boolean;
  recommended?: boolean;
}

// Gemma models - can be hosted locally or loaded from HuggingFace
// To host locally: Download from https://huggingface.co/litert-community
// and place in web/public/models/ folder
export const GEMMA_MODELS: Record<GemmaModel, ModelInfo> = {
  'gemma-3n-270m': {
    name: 'Gemma 3n 270M',
    size: '~276MB',
    description: 'Ultra-fast, smallest model - great for quick feedback',
    url: '/models/gemma3-270m-it-q8-web.task', // Host locally - use the -web.task file!
    multimodal: false,
  },
  'gemma-3n-e2b': {
    name: 'Gemma 3n E2B',
    size: '~1.5GB',
    description: 'Good balance of speed and quality (multimodal: text + images + audio)',
    url: '/models/gemma-3n-E2B-it-int4-Web.litertlm', // Host locally - matches downloaded file
    multimodal: true,
  },
  'gemma-3n-e4b': {
    name: 'Gemma 3n E4B',
    size: '~3GB',
    description: 'Best all-around model (multimodal: text + images + audio)',
    url: '/models/gemma-3n-e4b-it-int4-Web.litertlm', // Host locally
    multimodal: true,
    recommended: true,
  },
  'gemma-3-4b': {
    name: 'Gemma 3 4B',
    size: '~3GB',
    description: 'Alternative 4B variant - text only',
    url: '/models/Gemma3-4B-IT-int4-Web.litertlm', // Host locally
    multimodal: false,
  },
  'gemma-3-12b': {
    name: 'Gemma 3 12B',
    size: '~8GB',
    description: 'Highest quality, slower - for advanced users only',
    url: '/models/Gemma3-12B-IT-int4-Web.litertlm', // Host locally
    multimodal: false,
  },
};

export interface GameConfig {
  aiMode: 'mediapipe' | 'webllm' | 'disabled';
  gemmaModel: GemmaModel;
  sound: boolean;
  particles: boolean;
  screenShake: boolean;
}

export const defaultConfig: GameConfig = {
  aiMode: 'mediapipe',         // Use MediaPipe with Gemma 3 by default
  gemmaModel: 'gemma-3n-270m', // Start with smallest model (270M, ~200MB)
  sound: true,
  particles: true,
  screenShake: true,
};

export class ConfigManager {
  private config: GameConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): GameConfig {
    const stored = localStorage.getItem('typestrike-config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Migration: Convert old 'gemma3' to 'mediapipe'
        if (parsed.aiMode === 'gemma3') {
          parsed.aiMode = 'mediapipe';
          console.log('🔄 Migrated aiMode from "gemma3" to "mediapipe"');
        }

        return { ...defaultConfig, ...parsed };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  }

  saveConfig(config: Partial<GameConfig>) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('typestrike-config', JSON.stringify(this.config));
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  setAIMode(mode: 'mediapipe' | 'webllm' | 'disabled') {
    this.saveConfig({ aiMode: mode });
  }

  getAIMode(): 'mediapipe' | 'webllm' | 'disabled' {
    return this.config.aiMode;
  }

  setGemmaModel(model: GemmaModel) {
    this.saveConfig({ gemmaModel: model });
  }

  getGemmaModel(): GemmaModel {
    return this.config.gemmaModel;
  }

  getModelInfo(): ModelInfo {
    return GEMMA_MODELS[this.config.gemmaModel];
  }
}
