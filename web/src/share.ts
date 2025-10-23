// Share Score Utility

export interface ScoreData {
  levelNumber: number;
  levelName: string;
  score: number;
  wpm: number;
  accuracy: number;
  combo: number;
  completed: boolean;
}

export class ShareManager {
  // Generate shareable text
  generateShareText(data: ScoreData): string {
    const status = data.completed ? '✓ Complete!' : 'Game Over';

    return `🚀 TYPE STRIKE 🚀

Level ${data.levelNumber}: ${data.levelName}
${status}

📊 Score: ${data.score.toLocaleString()}
⚡ WPM: ${data.wpm}
🎯 Accuracy: ${data.accuracy}%
🔥 Best Combo: ${data.combo}x

Beat me at: https://typestrike.netlify.app
#TypeStrike #TypingGame`;
  }

  // Generate score image (canvas-based)
  generateShareImage(data: ScoreData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 500);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(1, '#1a1e3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);

    // Border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 780, 480);

    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 60px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TYPE STRIKE', 400, 80);

    // Status
    const status = data.completed ? '✓ LEVEL COMPLETE' : '✗ GAME OVER';
    const statusColor = data.completed ? '#39ff14' : '#ff3366';
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText(status, 400, 130);

    // Level info
    ctx.fillStyle = '#ff006e';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText(`Level ${data.levelNumber}: ${data.levelName}`, 400, 170);

    // Stats box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(100, 200, 600, 200);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 200, 600, 200);

    // Individual stats
    const stats = [
      { label: 'Score', value: data.score.toLocaleString(), icon: '📊' },
      { label: 'WPM', value: data.wpm.toString(), icon: '⚡' },
      { label: 'Accuracy', value: `${data.accuracy}%`, icon: '🎯' },
      { label: 'Best Combo', value: `${data.combo}x`, icon: '🔥' },
    ];

    let yPos = 250;
    stats.forEach((stat, i) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#888';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText(`${stat.icon} ${stat.label}:`, 130, yPos);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillText(stat.value, 670, yPos);

      yPos += 40;
    });

    // Call to action
    ctx.fillStyle = '#888';
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Beat me at:', 400, 445);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('typestrike.netlify.app', 400, 475);

    return canvas;
  }

  // Download image
  downloadImage(data: ScoreData) {
    const canvas = this.generateShareImage(data);
    const dataUrl = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `typestrike-level-${data.levelNumber}-score.png`;
    link.href = dataUrl;
    link.click();
  }

  // Copy text to clipboard
  async copyText(data: ScoreData): Promise<boolean> {
    const text = this.generateShareText(data);

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Copy image to clipboard (modern browsers only)
  async copyImage(data: ScoreData): Promise<boolean> {
    const canvas = this.generateShareImage(data);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      return true;
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      return false;
    }
  }

  // Share via Web Share API (mobile-friendly)
  async share(data: ScoreData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    const text = this.generateShareText(data);

    try {
      await navigator.share({
        title: 'TypeStrike Score',
        text: text,
        url: 'https://typestrike.netlify.app',
      });
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }
}

// Global instance
export const shareManager = new ShareManager();
