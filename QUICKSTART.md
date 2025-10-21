# TypeStrike - Quick Start Guide 🚀

## ✅ Working Prototype is Ready!

The game is currently running with a **JavaScript fallback** version that works immediately without needing Rust/WASM compilation.

## 🎮 Play Now

### Option 1: Local Development (Easiest)

```bash
cd /Users/instructor/Downloads/odds/typestrike/web
npm run dev
```

Then open: **http://localhost:3000**

The game should load instantly using the JavaScript fallback!

### Option 2: Build Full WASM Version (Requires Rust)

If you want the optimized WASM version:

1. **Install Rust** (if not installed):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

2. **Build WASM**:
```bash
cd /Users/instructor/Downloads/odds/typestrike/rust-game
chmod +x build.sh
./build.sh
```

3. **Run the game**:
```bash
cd ../web
npm run dev
```

The game will automatically use WASM if available, otherwise fallback to JavaScript.

## 🎯 How to Play

1. **Menu Screen**: Press **SPACE** to start
2. **Gameplay**:
   - Type the letters shown on falling characters
   - Correct letters explode and give you points
   - Don't let letters hit the ground (you lose a life!)
   - Build combos for higher scores
3. **Level Complete**: Press **SPACE** to continue to next level
4. **Game Over**: Press **SPACE** to retry or **M** for menu

## 🎓 Learning Path

The game teaches typing progressively:

- **Level 1-1**: F & J (index fingers, home row)
- **Level 1-2**: Add D & K (middle fingers)
- **Level 1-3**: Add S & L (ring fingers)
- **Level 1-4**: Full home row (A S D F J K L ;)
- **Level 2-1**: Upper row R & U
- **And more!**

## 🤖 AI Coach Configuration

### Choose Your AI Mode

Edit in browser console or localStorage:

```javascript
// Option 1: WebLLM (smaller models, faster)
localStorage.setItem('ai-mode', 'webllm');

// Option 2: Gemma 3 via Transformers.js (better quality, slower)
localStorage.setItem('ai-mode', 'gemma3');

// Option 3: Disabled (use fallback messages)
localStorage.setItem('ai-mode', 'disabled');
```

Then refresh the page.

### WebLLM Models Available:
- **Llama-3.2-1B-Instruct** (Default, ~600MB, fast)
- **Phi-3.5-mini** (~400MB, good quality)
- **SmolLM-360M** (~200MB, very fast)

### Gemma 3 Mode:
- Uses **Transformers.js** with Gemma 2-2B model
- Requires **@xenova/transformers** package (add to package.json if needed)
- Downloads model on first use (~2GB)
- Better quality but slower inference

## 📊 Current Features

✅ **Completed:**
- ✅ Full game engine (JavaScript fallback + Rust/WASM ready)
- ✅ 5 progressive levels (home row → upper row)
- ✅ Scoring system with combos
- ✅ Lives system
- ✅ Visual effects (particles, screen shake, flashes)
- ✅ HUD (lives, score, combo, timer, accuracy)
- ✅ Level progression system
- ✅ IndexedDB statistics tracking
- ✅ Dual AI system (WebLLM + Gemma 3 support)

⏳ **Coming Soon:**
- Sound effects & music
- Achievement system
- Daily challenges
- More levels
- Themes & customization
- Multiplayer mode

## 🔧 Troubleshooting

### Game doesn't load?
- Check console for errors (F12)
- Make sure you're on http://localhost:3000
- Try clearing localStorage: `localStorage.clear()`

### AI not working?
- AI loads in background (can take 30s-2min)
- Check browser console for progress
- WebGPU required for AI (Chrome/Edge recommended)
- Disable AI if needed: `localStorage.setItem('ai-mode', 'disabled')`

### Performance issues?
- Disable particles: Edit `game-fallback.ts` and reduce particle count
- Disable screen shake: Set `screenShake` to 0
- Close other tabs

## 📁 Project Structure

```
typestrike/
├── rust-game/          # Rust/WASM game engine (optional)
│   ├── src/
│   │   ├── game.rs     # Core game logic
│   │   ├── entities.rs # Letters, particles, player
│   │   └── levels.rs   # Level definitions
│   └── Cargo.toml
│
├── web/                # Web application
│   ├── src/
│   │   ├── main.ts           # App entry point
│   │   ├── game-fallback.ts  # JavaScript game (works now!)
│   │   ├── wasm-loader.ts    # WASM loader with fallback
│   │   ├── ai-coach.ts       # WebLLM + Gemma 3 AI
│   │   ├── stats.ts          # IndexedDB stats
│   │   └── config.ts         # Configuration
│   ├── index.html
│   └── package.json
│
└── docs/
    └── typing_game_prd.md    # Full product requirements
```

## 🚀 Next Steps

1. **Play the prototype** at http://localhost:3000
2. **Test AI coaching** (loads in background)
3. **Try different levels** and see progression
4. **Provide feedback** on game feel

## 🎨 Customization

Want to modify the game? Easy!

### Change fall speed:
Edit `/Users/instructor/Downloads/odds/typestrike/web/src/game-fallback.ts`
```typescript
// Line ~233 - adjust fallSpeed
fallSpeed: 100  // Make it 150 for harder, 50 for easier
```

### Add more letters to a level:
```typescript
// Add to letters array
letters: ['F', 'J', 'D', 'K', 'A'] // Add more letters
```

### Change colors:
Search for color codes like `rgb(0,240,255)` and replace

## 📝 Development Commands

```bash
# Install dependencies
cd web && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build WASM (requires Rust)
npm run build:wasm
```

## 🎯 Goals

Build muscle memory for touch typing through engaging gameplay!

**Have fun learning to type! 🚀⌨️**

---

For detailed technical documentation, see:
- `README.md` - Full project documentation
- `docs/typing_game_prd.md` - Complete product requirements
