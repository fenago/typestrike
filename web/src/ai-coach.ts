// AI Coach with MediaPipe Gemma 3/3n support + WebLLM fallback

import { GEMMA_MODELS, type GemmaModel } from './config';

export interface SessionStats {
  duration: number;
  total: number;
  accuracy: number;
  wpm: number;
  weakLetters: string[];
  previousWpm: number;
}

export type AIMode = 'mediapipe' | 'webllm' | 'disabled';

export interface AIConfig {
  mode: AIMode;
  gemmaModel?: GemmaModel;
}

export class AICoach {
  private engine: any = null;
  private isLoading = false;
  public isReady = false;
  private mode: AIMode;
  private gemmaModel: GemmaModel;

  constructor(config: AIConfig = { mode: 'mediapipe', gemmaModel: 'gemma-3n-e4b' }) {
    this.mode = config.mode;
    this.gemmaModel = config.gemmaModel || 'gemma-3n-e4b';
  }

  async init(onProgress?: (progress: number, status?: string) => void): Promise<void> {
    if (this.isReady || this.isLoading || this.mode === 'disabled') return;

    this.isLoading = true;

    try {
      if (this.mode === 'mediapipe') {
        await this.initMediaPipe(onProgress);
      } else if (this.mode === 'webllm') {
        await this.initWebLLM(onProgress);
      }

      this.isReady = true;
      this.isLoading = false;
      console.log(`✅ AI Coach initialized (${this.mode})!`);

    } catch (error) {
      console.error('Failed to initialize AI:', error);
      this.isLoading = false;
      throw error;
    }
  }

  private async initMediaPipe(onProgress?: (progress: number, status?: string) => void): Promise<void> {
    try {
      const modelInfo = GEMMA_MODELS[this.gemmaModel];
      console.log(`🤖 Loading ${modelInfo.name} via MediaPipe...`);
      console.log(`   Model size: ${modelInfo.size}`);
      console.log(`   Multimodal: ${modelInfo.multimodal ? 'Yes (text + images + audio)' : 'No (text only)'}`);

      onProgress?.(0.1, 'Importing MediaPipe library...');

      // Dynamically import MediaPipe
      const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

      onProgress?.(0.2, 'Initializing WebAssembly runtime...');

      // Initialize the GenAI fileset
      const genai = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
      );

      onProgress?.(0.3, `Downloading ${modelInfo.name} model...`);

      // Create LLM Inference with the selected Gemma model
      const options: any = {
        baseOptions: {
          modelAssetPath: modelInfo.url
        },
        maxTokens: 100,      // Shorter for concise feedback
        topK: 20,            // More focused responses
        temperature: 0.7,    // Less randomness
        randomSeed: Math.floor(Math.random() * 10000),
      };

      // Enable multimodal features for E2B/E4B models
      if (modelInfo.multimodal) {
        options.maxNumImages = 5;
        options.supportAudio = true;
      }

      // Track download progress (MediaPipe doesn't provide granular progress, so we simulate it)
      const progressInterval = setInterval(() => {
        const currentProgress = Math.min(0.95, (onProgress as any).lastProgress + 0.05);
        (onProgress as any).lastProgress = currentProgress;
        onProgress?.(currentProgress, 'Loading model weights...');
      }, 500);

      try {
        this.engine = await LlmInference.createFromOptions(genai, options);
        clearInterval(progressInterval);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      onProgress?.(1.0, `${modelInfo.name} ready!`);
      console.log(`✅ ${modelInfo.name} loaded successfully!`);

    } catch (error) {
      console.error('MediaPipe loading failed:', error);
      throw new Error(
        `Failed to load ${GEMMA_MODELS[this.gemmaModel].name}. ` +
        `This browser may not support WebGPU. ` +
        `Please use Chrome 113+ or Edge 113+.`
      );
    }
  }

  private async initWebLLM(onProgress?: (progress: number, status?: string) => void): Promise<void> {
    // WebLLM fallback for older browsers
    const webllm = await import('@mlc-ai/web-llm');

    const initProgressCallback = (report: any) => {
      console.log(`WebLLM Loading: ${report.text} - ${(report.progress * 100).toFixed(0)}%`);
      onProgress?.(report.progress, report.text);
    };

    const availableModels = [
      'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      'Phi-3.5-mini-instruct-q4f16_1-MLC',
      'SmolLM-360M-Instruct-q4f16_1-MLC',
    ];

    this.engine = await webllm.CreateMLCEngine(
      availableModels[0],
      {
        initProgressCallback,
        logLevel: 'WARN',
      }
    );
  }

  async getSessionFeedback(stats: SessionStats): Promise<string> {
    console.log('🤖 AI Coach getSessionFeedback called');
    console.log('   isReady:', this.isReady);
    console.log('   mode:', this.mode);
    console.log('   model:', this.gemmaModel);

    if (!this.isReady || !this.engine) {
      console.log('⚠️ AI not ready, using fallback feedback');
      return this.getFallbackFeedback(stats);
    }

    const prompt = this.generateFeedbackPrompt(stats);
    console.log('📝 Generating AI feedback...');

    try {
      if (this.mode === 'mediapipe') {
        console.log('🎯 Using MediaPipe for feedback generation');
        return await this.getMediaPipeFeedback(prompt);
      } else if (this.mode === 'webllm') {
        console.log('🎯 Using WebLLM for feedback generation');
        return await this.getWebLLMFeedback(prompt);
      }

      return this.getFallbackFeedback(stats);

    } catch (error) {
      console.error('AI generation error:', error);
      return this.getFallbackFeedback(stats);
    }
  }

  private async getMediaPipeFeedback(prompt: string): Promise<string> {
    try {
      // Gemma chat template format
      const systemPrompt = `You are TypeBot, a helpful and encouraging typing coach. Give brief, specific feedback in 2-3 sentences. Be positive and actionable.`;

      // Use proper Gemma 3 chat template
      const fullPrompt = `<start_of_turn>user
${systemPrompt}

${prompt}

Give me encouraging feedback about my typing performance in 2-3 sentences.<end_of_turn>
<start_of_turn>model
`;

      console.log('🔄 Calling MediaPipe generateResponse...');

      // Generate response with proper parameters
      const response = await this.engine.generateResponse(fullPrompt);

      console.log('✅ MediaPipe response received:', response.substring(0, 100) + '...');

      // Clean up the response - remove any template artifacts
      let cleaned = response.trim();

      // Remove common artifacts
      cleaned = cleaned.replace(/<end_of_turn>/g, '');
      cleaned = cleaned.replace(/<start_of_turn>/g, '');
      cleaned = cleaned.replace(/\*\*/g, ''); // Remove markdown bold

      // Get only the first few sentences (stop at 3 sentences max)
      const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
      const limitedResponse = sentences.slice(0, 3).join(' ').trim();

      return limitedResponse || cleaned.substring(0, 200); // Fallback to first 200 chars
    } catch (error) {
      console.error('❌ MediaPipe inference error:', error);
      throw error;
    }
  }

  private async getWebLLMFeedback(prompt: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are TypeBot, an encouraging and concise typing coach. Provide brief feedback in 2-3 sentences. Be warm, specific, and actionable. Never be negative or discouraging.`,
      },
      { role: 'user', content: prompt },
    ];

    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.8,
      max_tokens: 100,
      top_p: 0.9,
    });

    return reply.choices[0]?.message?.content || '';
  }

  private generateFeedbackPrompt(stats: SessionStats): string {
    const improvement = stats.wpm - stats.previousWpm;
    const improvementText = improvement > 0
      ? `+${improvement.toFixed(1)}`
      : improvement.toFixed(1);

    return `
Session Performance:
- Duration: ${stats.duration}s
- Letters typed: ${stats.total}
- Accuracy: ${stats.accuracy}%
- WPM: ${stats.wpm}
- Weak letters (< 85%): ${stats.weakLetters.join(', ') || 'None'}
- Previous WPM: ${stats.previousWpm}
- Improvement: ${improvementText} WPM

Provide encouraging feedback highlighting one strength and one specific tip for improvement.
    `.trim();
  }

  private getFallbackFeedback(stats: SessionStats): string {
    const templates = [
      `Great session! You typed ${stats.total} letters at ${stats.wpm.toFixed(1)} WPM. Keep practicing those home row keys!`,
      `Nice work! Your accuracy of ${stats.accuracy}% is solid. Focus on building consistent speed next.`,
      `You're improving! ${stats.wpm.toFixed(1)} WPM is progress. Remember to keep your fingers on the home row - F and J!`,
      `Excellent effort! With ${stats.accuracy}% accuracy, you're building good habits. Speed will come naturally.`,
      `Strong performance! ${stats.total} letters typed with ${stats.accuracy}% accuracy. Try to maintain this consistency!`,
    ];

    // Pick based on accuracy
    const index = stats.accuracy >= 95 ? 0 :
                  stats.accuracy >= 90 ? 1 :
                  stats.accuracy >= 80 ? 2 : 3;

    return templates[index] || templates[templates.length - 1];
  }

  // Change model at runtime (requires re-initialization)
  async changeModel(newModel: GemmaModel, onProgress?: (progress: number, status?: string) => void): Promise<void> {
    if (this.mode !== 'mediapipe') {
      throw new Error('Model selection only available in MediaPipe mode');
    }

    console.log(`🔄 Switching to ${GEMMA_MODELS[newModel].name}...`);

    // Reset state
    this.isReady = false;
    this.isLoading = false;
    this.engine = null;
    this.gemmaModel = newModel;

    // Re-initialize with new model
    await this.init(onProgress);
  }

  getModelInfo() {
    return GEMMA_MODELS[this.gemmaModel];
  }

  getCurrentModel(): GemmaModel {
    return this.gemmaModel;
  }

  getMode(): AIMode {
    return this.mode;
  }

  // For future multimodal features
  async getMultimodalFeedback(
    stats: SessionStats,
    images?: string[],
    audio?: AudioBuffer
  ): Promise<string> {
    if (!this.isReady || !this.engine) {
      return this.getFallbackFeedback(stats);
    }

    const modelInfo = GEMMA_MODELS[this.gemmaModel];
    if (!modelInfo.multimodal) {
      console.warn(`${modelInfo.name} doesn't support multimodal inputs. Using text-only mode.`);
      return this.getSessionFeedback(stats);
    }

    // Future: Use multimodal prompting for advanced feedback with screenshots
    const prompt = this.generateFeedbackPrompt(stats);

    const multimodalPrompt: any[] = [
      '<start_of_turn>user\n',
      prompt,
    ];

    if (images && images.length > 0) {
      images.forEach(imgSrc => {
        multimodalPrompt.push({ imageSource: imgSrc });
      });
    }

    if (audio) {
      multimodalPrompt.push({ audioSource: audio });
    }

    multimodalPrompt.push('<end_of_turn>\n<start_of_turn>model\n');

    try {
      const response = await this.engine.generateResponse(multimodalPrompt);
      return response.trim();
    } catch (error) {
      console.error('Multimodal inference error:', error);
      return this.getFallbackFeedback(stats);
    }
  }
}
