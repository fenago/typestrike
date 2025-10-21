#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for TypeStrike..."

# Check if Rust is installed, if not install it
if ! command -v rustc &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.70.0
    source $HOME/.cargo/env
else
    echo "✅ Rust already installed"
fi

# Always source cargo env and set default toolchain
source $HOME/.cargo/env 2>/dev/null || true

# Set default toolchain if not set
if ! rustup default &> /dev/null; then
    echo "🔧 Setting default Rust toolchain..."
    rustup default 1.70.0
fi

echo "✅ Rust version: $(rustc --version)"

# Add wasm32 target
echo "🎯 Adding wasm32-unknown-unknown target..."
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen-cli if not present
if ! command -v wasm-bindgen &> /dev/null; then
    echo "📦 Installing wasm-bindgen-cli..."
    cargo install wasm-bindgen-cli --version 0.2.87
else
    echo "✅ wasm-bindgen already installed"
fi

# Build Rust WASM game engine
echo "🦀 Building Rust WASM game engine..."
cd rust-game
chmod +x build.sh
./build.sh
cd ..

# Install Node.js dependencies and build web app
echo "📦 Installing Node.js dependencies..."
cd web
npm install

echo "🏗️ Building web application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Output directory: web/dist"

# List the build output
ls -lh dist/
