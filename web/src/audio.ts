// Sound System using Web Audio API

export type SoundEffect =
  | 'letterHit'
  | 'wrongLetter'
  | 'comboMilestone'
  | 'levelComplete'
  | 'gameOver'
  | 'achievementUnlock'
  | 'lifeLost'
  | 'powerUp';

export class AudioManager {
  private context: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private masterVolume = 0.7;

  // Musical notes for letters (C major scale)
  private noteFrequencies: { [key: string]: number } = {
    'A': 261.63, // C4
    'S': 293.66, // D4
    'D': 329.63, // E4
    'F': 349.23, // F4
    'J': 392.00, // G4
    'K': 440.00, // A4
    'L': 493.88, // B4
    ';': 523.25, // C5
    'R': 587.33, // D5
    'U': 659.25, // E5
    'E': 293.66, // D4
    'I': 440.00, // A4
  };

  constructor() {
    // Audio context created on first user interaction
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create gain nodes for volume control
      this.musicGainNode = this.context.createGain();
      this.sfxGainNode = this.context.createGain();

      this.musicGainNode.connect(this.context.destination);
      this.sfxGainNode.connect(this.context.destination);

      this.updateVolumes();
    }
  }

  private updateVolumes() {
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicEnabled ? this.masterVolume * 0.3 : 0;
    }
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.sfxEnabled ? this.masterVolume : 0;
    }
  }

  // Play musical note for letter
  playLetterNote(letter: string) {
    if (!this.sfxEnabled) return;

    this.ensureContext();
    if (!this.context || !this.sfxGainNode) return;

    const frequency = this.noteFrequencies[letter.toUpperCase()] || 440;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // ADSR envelope
    const now = this.context.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Decay + Release

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Play sound effect
  playSFX(effect: SoundEffect) {
    if (!this.sfxEnabled) return;

    this.ensureContext();
    if (!this.context || !this.sfxGainNode) return;

    const now = this.context.currentTime;

    switch (effect) {
      case 'letterHit':
        this.playExplosion();
        break;

      case 'wrongLetter':
        this.playBuzz();
        break;

      case 'comboMilestone':
        this.playAscendingChime();
        break;

      case 'levelComplete':
        this.playVictoryFanfare();
        break;

      case 'gameOver':
        this.playDefeatSound();
        break;

      case 'achievementUnlock':
        this.playAchievementJingle();
        break;

      case 'lifeLost':
        this.playWarningSound();
        break;

      case 'powerUp':
        this.playPowerUpSound();
        break;
    }
  }

  private playExplosion() {
    if (!this.context || !this.sfxGainNode) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    const now = this.context.currentTime;

    // Explosion sound (noise burst)
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  private playBuzz() {
    if (!this.context || !this.sfxGainNode) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    const now = this.context.currentTime;

    oscillator.frequency.value = 100;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  private playAscendingChime() {
    if (!this.context || !this.sfxGainNode) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = this.context.currentTime;

    notes.forEach((freq, i) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode!);

      const startTime = now + i * 0.1;

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  private playVictoryFanfare() {
    if (!this.context || !this.sfxGainNode) return;

    const melody = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.15 },  // E5
      { freq: 783.99, time: 0.3 },   // G5
      { freq: 1046.5, time: 0.5 },   // C6
    ];

    const now = this.context.currentTime;

    melody.forEach(({ freq, time }) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode!);

      const startTime = now + time;

      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  }

  private playDefeatSound() {
    if (!this.context || !this.sfxGainNode) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    const now = this.context.currentTime;

    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  private playAchievementJingle() {
    if (!this.context || !this.sfxGainNode) return;

    const melody = [
      { freq: 659.25, time: 0 },     // E5
      { freq: 783.99, time: 0.1 },   // G5
      { freq: 1046.5, time: 0.2 },   // C6
      { freq: 1318.5, time: 0.35 },  // E6
    ];

    const now = this.context.currentTime;

    melody.forEach(({ freq, time }) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode!);

      const startTime = now + time;

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  private playWarningSound() {
    if (!this.context || !this.sfxGainNode) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    const now = this.context.currentTime;

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.setValueAtTime(0, now + 0.1);
    gainNode.gain.setValueAtTime(0.2, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  private playPowerUpSound() {
    if (!this.context || !this.sfxGainNode) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    const now = this.context.currentTime;

    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  // Background music (simple ambient loop)
  playBackgroundMusic() {
    if (!this.musicEnabled) return;

    this.ensureContext();
    if (!this.context || !this.musicGainNode) return;

    // Simple ambient pad (plays continuously)
    const oscillator1 = this.context.createOscillator();
    const oscillator2 = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.musicGainNode);

    oscillator1.frequency.value = 130.81; // C3
    oscillator2.frequency.value = 164.81; // E3
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    gainNode.gain.value = 0.05;

    oscillator1.start();
    oscillator2.start();

    // Store for stopping later
    (this as any)._musicOscillators = [oscillator1, oscillator2];
  }

  stopBackgroundMusic() {
    if ((this as any)._musicOscillators) {
      (this as any)._musicOscillators.forEach((osc: OscillatorNode) => osc.stop());
      (this as any)._musicOscillators = null;
    }
  }

  // Settings
  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.updateVolumes();

    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  setSFXEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    this.updateVolumes();
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }
}

// Global instance
export const audioManager = new AudioManager();
