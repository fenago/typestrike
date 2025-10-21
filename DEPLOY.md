# Deploying TypeStrike to Netlify

This guide walks you through deploying TypeStrike to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (free tier works!)
- Your code pushed to GitHub

## Quick Deploy (Recommended)

### Option 1: Deploy from GitHub

1. **Go to Netlify**: https://app.netlify.com/
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to GitHub** and select your `typestrike` repository
4. **Configure build settings**:
   - Build command: `chmod +x build-netlify.sh && ./build-netlify.sh`
   - Publish directory: `web/dist`
   - Base directory: (leave empty)
5. **Click "Deploy"**

Netlify will automatically:
- Install Rust
- Build the WASM module
- Build the web app
- Deploy to a live URL

### Option 2: Deploy Button

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/fenago/typestrike)

Click the button above and follow the prompts!

## Manual Deploy (Advanced)

### Using Netlify CLI

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**:
```bash
netlify login
```

3. **Initialize the site**:
```bash
netlify init
```

4. **Deploy**:
```bash
netlify deploy --prod
```

## Build Configuration

The build is configured in `netlify.toml`:

```toml
[build]
  command = "chmod +x build-netlify.sh && ./build-netlify.sh"
  publish = "web/dist"
  base = "."

[build.environment]
  NODE_VERSION = "18"
  RUST_VERSION = "1.70.0"
```

## Build Process

The `build-netlify.sh` script:
1. ✅ Installs Rust (if not present)
2. ✅ Adds wasm32-unknown-unknown target
3. ✅ Installs wasm-bindgen-cli
4. ✅ Builds Rust WASM game engine
5. ✅ Installs Node.js dependencies
6. ✅ Builds web application with Vite

## Important Notes

### Model Files

⚠️ **Gemma model files are NOT included in the deployment** (they're too large for Git).

Users will need to download models manually after deployment. The app will show instructions on first load.

To host models:
1. Upload models to Netlify's CDN or external storage
2. Update `web/src/config.ts` with new URLs
3. Rebuild and redeploy

### Environment Variables

No environment variables are required for basic deployment!

The app runs 100% in the browser with no backend.

### Build Time

First build takes **5-10 minutes** due to:
- Rust installation
- WASM compilation
- npm dependencies

Subsequent builds are faster (~2-3 minutes) thanks to caching.

## Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow DNS configuration instructions
4. SSL certificate is added automatically!

## Troubleshooting

### Build fails with "rustc not found"

The build script should install Rust automatically. If it fails:
1. Check Netlify build logs
2. Ensure `build-netlify.sh` has execute permissions
3. Try adding Netlify Rust plugin to `netlify.toml`:
   ```toml
   [[plugins]]
     package = "@netlify/plugin-rust"
   ```

### "Module not found" errors

Clear Netlify's build cache:
1. Go to **Site settings** → **Build & deploy**
2. Scroll to **Build settings**
3. Click **Clear cache and retry deploy**

### WASM file not loading

Check that:
1. `rust-game/build.sh` copied WASM to `web/public/wasm/`
2. Build logs show "WASM build complete!"
3. Headers in `netlify.toml` set `Content-Type: application/wasm`

### Model files 404

This is expected! Models must be downloaded locally by users.

To fix:
1. Host models on external CDN
2. Update `GEMMA_MODELS` URLs in `web/src/config.ts`
3. Redeploy

## Deployment Checklist

Before deploying to production:

- [ ] Test locally: `npm run build && npm run preview`
- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Connect repository to Netlify
- [ ] Verify build settings in Netlify dashboard
- [ ] Deploy!
- [ ] Test deployed site
- [ ] Configure custom domain (optional)
- [ ] Set up branch deploys for preview (optional)

## Continuous Deployment

Once connected to GitHub, Netlify automatically deploys:
- **Main branch** → Production site
- **Pull requests** → Preview deployments (with unique URLs)

Every push triggers a new build automatically!

## Performance

Expected metrics after deployment:
- **Lighthouse Score**: 90+
- **First Load**: 2-3s (without AI model)
- **With AI Model**: +5-10s for model download (one-time, cached)
- **FPS**: 60fps on modern devices

## Support

- **Netlify Docs**: https://docs.netlify.com/
- **Netlify Community**: https://answers.netlify.com/
- **TypeStrike Issues**: https://github.com/fenago/typestrike/issues

---

Happy deploying! 🚀
