# TypeStrike 🚀

An AI-powered browser-based typing trainer game. Learn to type like a pro while defending Earth from Typo Invaders!

## Features

- 🎮 **Space Invaders-style gameplay** - Type letters to shoot them out of the sky
- 🤖 **AI-powered coaching** - Gemma 3/3n via MediaPipe provides personalized feedback
- ✋ **Progressive learning** - Starts with home row (F & J), gradually expands
- 💥 **Satisfying effects** - Particles, explosions, combos, and screen shake
- 📊 **Progress tracking** - Statistics stored in browser (IndexedDB)
- 🌐 **100% browser-based** - No downloads, runs entirely via WebAssembly
- 🎨 **Multimodal AI ready** - E2B/E4B models support vision + audio analysis

## Tech Stack

- **Game Engine**: Rust + macroquad (compiled to WASM)
- **Frontend**: TypeScript + Vite
- **AI**: Gemma 3/3n via MediaPipe (browser-based inference) + WebLLM fallback
- **Storage**: IndexedDB (via idb)

## Development

### Prerequisites

- Rust (1.70+) with wasm32 target: `rustup target add wasm32-unknown-unknown`
- Node.js (18+)

### Setup

1. **Install dependencies**:
```bash
# Rust dependencies (handled by Cargo)
cd rust-game

# Web dependencies
cd ../web
npm install
```

2. **Build WASM game engine**:
```bash
cd rust-game
chmod +x build.sh
./build.sh
```

3. **Run development server**:
```bash
cd web
npm run dev
```

4. **Open browser**:
```
http://localhost:3000
```

### Building for Production

```bash
# Build WASM
cd rust-game
./build.sh

# Build web app
cd ../web
npm run build
```

Output will be in `web/dist/`

## Game Controls

- **Type letters** to destroy them
- **SPACE** or **ENTER** to start/continue
- **M** to return to menu
- **R** to retry

## Levels

1. **Level 1-1**: Home Row - F & J (index fingers)
2. **Level 1-2**: Add D & K (middle fingers)
3. **Level 1-3**: Add S & L (ring fingers)
4. **Level 1-4**: Add A & ; (pinkies)
5. **Level 1-5**: Full home row practice
6. **Level 2-1**: Upper row - R & U
7. **Level 2-2**: Add E & I
8. **Level 2-3**: Speed challenge!
9. **Endless Mode**: Survive as long as you can!

## Architecture

```
typestrike/
├── rust-game/          # WASM game engine
│   ├── src/
│   │   ├── lib.rs      # Entry point
│   │   ├── game.rs     # Core game loop
│   │   ├── entities.rs # Letters, particles, player
│   │   └── levels.rs   # Level definitions
│   └── Cargo.toml
├── web/                # TypeScript web app
│   ├── src/
│   │   ├── main.ts     # App initialization
│   │   ├── wasm-loader.ts
│   │   ├── ai-coach.ts # MediaPipe + WebLLM integration
│   │   ├── config.ts   # Gemma model selection
│   │   └── stats.ts    # IndexedDB storage
│   └── package.json
└── assets/             # Audio, images (future)
```

## Browser Compatibility

- ✅ Chrome/Edge 113+ (WebGPU for MediaPipe AI)
- ✅ Firefox 88+ (WebLLM fallback)
- ✅ Safari 15+ (WebGPU for AI)
- Requires WebAssembly support

## AI Models

TypeStrike supports 5 Gemma model variants:
- **Gemma 3n 270M** (~276MB) - Fastest, text-only
- **Gemma 3n E2B** (~1.5GB) - Multimodal (text + images + audio)
- **Gemma 3n E4B** (~3GB) - Best multimodal quality ⭐
- **Gemma 3 4B** (~3GB) - Text-only variant
- **Gemma 3 12B** (~8GB) - Highest quality (advanced users)

Download models from [LiteRT Community](https://huggingface.co/litert-community) and place in `web/public/models/`

## Roadmap

- [x] Core gameplay mechanics
- [x] Progressive level system
- [x] Visual effects (particles, screen shake)
- [x] Statistics tracking
- [x] **Gemma 3/3n AI coaching via MediaPipe** ✨
- [ ] Multimodal features (camera, microphone analysis)
- [ ] Sound effects & music
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Gamification features
- [ ] Multiple themes
- [ ] Multiplayer mode

## License

MIT

## Credits

Built with ❤️ using Rust, macroquad, MediaPipe, and Gemma 3
