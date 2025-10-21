#!/bin/bash
set -e

echo "Building TypeStrike WASM..."

# Build for web
cargo build --target wasm32-unknown-unknown --release

# Copy to web directory
mkdir -p ../web/public/wasm
cp target/wasm32-unknown-unknown/release/typestrike_game.wasm ../web/public/wasm/

echo "✓ WASM build complete!"
echo "File: $(ls -lh target/wasm32-unknown-unknown/release/typestrike_game.wasm | awk '{print $5}')"
