// WASM Module Loader for macroquad
import { GameFallback } from './game-fallback';

export async function initWasm(canvas: HTMLCanvasElement): Promise<void> {
  // For now, always use JavaScript fallback
  // WASM version requires building with Rust first
  console.log('ℹ️ Using JavaScript game engine (WASM not built yet)');
  console.log('To build WASM: cd rust-game && ./build.sh');
  return initFallback(canvas);

  // Uncomment below when WASM is built:
  /*
  try {
    const response = await fetch('/wasm/typestrike_game.wasm');

    if (!response.ok) {
      console.warn('WASM not available, using JavaScript fallback');
      return initFallback(canvas);
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Set up macroquad environment
        if (typeof window.miniquad_add_plugin !== 'function') {
          throw new Error('macroquad loader not available');
        }

        window.miniquad_add_plugin({
          register_plugin: (importObject: any) => {
            // Plugin registration (if needed)
          },
          on_init: () => {
            console.log('✓ WASM Game initialized');
            resolve();
          },
        });

        const wasmBytes = await response.arrayBuffer();

        // Set canvas
        (window as any).canvas = canvas;

        // Load and instantiate
        const importObject = {
          env: {
            // Add any required imports here
          },
        };

        await window.miniquad_add_plugin({
          register_plugin: (obj: any) => Object.assign(importObject, obj),
          on_init: () => resolve(),
        });

        const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);

        // Call main if exported
        if (typeof (instance.exports as any).main === 'function') {
          (instance.exports as any).main();
        }

      } catch (error) {
        console.error('WASM loading error, using fallback:', error);
        return initFallback(canvas);
      }
    });
  } catch {
    // WASM not available, use fallback
    return initFallback(canvas);
  }
  */
}

function initFallback(canvas: HTMLCanvasElement): Promise<void> {
  console.log('✓ JavaScript Fallback Game initialized');

  // Create and start the fallback game
  const game = new GameFallback(canvas);
  game.start();

  // Store for cleanup if needed
  (window as any).__gameInstance = game;

  return Promise.resolve();
}

// Declare global types for macroquad
declare global {
  interface Window {
    miniquad_add_plugin: (plugin: {
      register_plugin: (importObject: any) => void;
      on_init: () => void;
    }) => void;
    canvas: HTMLCanvasElement;
  }
}
