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

### Model Files - CRITICAL FOR DEPLOYMENT

⚠️ **Gemma model files are NOT included in Git** (they're 276MB to 8GB in size).

**This is the core feature of TypeStrike** - without models, users cannot use the AI coach.

You have **3 options** for hosting models in production:

#### Option 1: HuggingFace Direct URLs (Recommended for Testing)

**Pros**: No hosting costs, easy setup, always up-to-date
**Cons**: Requires user to accept Google's terms on HuggingFace, may be slower

Update `web/src/config.ts` to use HuggingFace URLs:

```typescript
'gemma-3n-e2b': {
  name: 'Gemma 3n E2B',
  size: '~1.5GB',
  description: 'Good balance of speed and quality (multimodal)',
  url: 'https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/resolve/main/gemma-3n-E2B-it-int4.litertlm',
  multimodal: true,
},
```

**All HuggingFace URLs:**
- 270M: `https://huggingface.co/litert-community/gemma-3-270m-it/resolve/main/gemma3-270m-it-q8-web.task`
- E2B (1.5GB): `https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/resolve/main/gemma-3n-E2B-it-int4.litertlm`
- E4B (3GB): `https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/resolve/main/gemma-3n-E4B-it-int4.litertlm`
- 4B: `https://huggingface.co/litert-community/Gemma3-4B-IT/resolve/main/Gemma3-4B-IT-int4-Web.litertlm`
- 12B: `https://huggingface.co/litert-community/Gemma3-12B-IT/resolve/main/Gemma3-12B-IT-int4-Web.litertlm`

Then rebuild: `npm run build`

#### Option 2: External CDN (Recommended for Production)

**Pros**: Fast, reliable, you control the files
**Cons**: Small hosting cost (~$1-5/month for bandwidth)

**Step-by-step with Cloudflare R2 (Free tier: 10GB storage, 10M requests/month):**

1. **Create Cloudflare R2 bucket:**
   - Go to https://dash.cloudflare.com/
   - Navigate to R2 Object Storage
   - Create a bucket (e.g., `typestrike-models`)
   - Enable Public Access

2. **Download models locally:**
   ```bash
   cd web/public/models

   # Download E2B (recommended starting model - 1.5GB)
   wget https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/resolve/main/gemma-3n-E2B-it-int4.litertlm

   # Download E4B (best quality - 3GB)
   wget https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/resolve/main/gemma-3n-E4B-it-int4.litertlm
   ```

3. **Upload to R2:**
   ```bash
   # Use Cloudflare dashboard or rclone
   # Upload: gemma-3n-E2B-it-int4.litertlm
   # Upload: gemma-3n-E4B-it-int4.litertlm
   ```

4. **Get public URLs** from R2 dashboard (e.g., `https://pub-xxxxx.r2.dev/gemma-3n-E2B-it-int4.litertlm`)

5. **Update config.ts:**
   ```typescript
   'gemma-3n-e2b': {
     name: 'Gemma 3n E2B',
     size: '~1.5GB',
     description: 'Good balance of speed and quality (multimodal)',
     url: 'https://pub-xxxxx.r2.dev/gemma-3n-E2B-it-int4.litertlm',
     multimodal: true,
   },
   ```

6. **Rebuild and deploy:**
   ```bash
   npm run build
   git add . && git commit -m "Update model URLs to Cloudflare R2"
   git push
   ```

**Alternative CDN providers:**
- **AWS S3** ($0.09/GB storage + $0.09/GB transfer)
- **Google Cloud Storage** ($0.02/GB storage + $0.12/GB transfer)
- **Backblaze B2** ($0.005/GB storage + free egress with Cloudflare)

#### Option 3: Netlify Large Media (Git LFS)

**Pros**: Models stored with code, easy to version
**Cons**: Expensive ($19/month Pro plan required for large files)

1. Install Netlify Large Media: `netlify lm:install`
2. Track model files: `git lfs track "*.litertlm" "*.task"`
3. Add and commit models to Git
4. Push to GitHub

**Not recommended** due to cost, but works if you're already on Netlify Pro.

---

### Recommended Deployment Strategy

For production, we recommend **Option 2 (Cloudflare R2)** with the following setup:

1. Host **E2B model (1.5GB)** as the default - good balance of quality and speed
2. Optionally host **270M model (276MB)** for users on slower connections
3. Let users download larger models (E4B, 12B) manually if needed

This gives users immediate AI coaching while keeping bandwidth costs low (~$2-3/month).

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

This happens when model URLs are set to `/models/...` (local paths) but files aren't hosted.

**Quick fix for testing** - Use HuggingFace direct URLs:
1. Edit `web/src/config.ts`
2. Change URLs from `/models/...` to HuggingFace `resolve/main` URLs (see "Option 1" above)
3. Rebuild: `npm run build`
4. Push to GitHub

**Production fix** - Host on CDN:
1. See "Model Files - CRITICAL FOR DEPLOYMENT" section above
2. Follow Option 2 (Cloudflare R2) for best results
3. Update config.ts with your CDN URLs
4. Redeploy

## Deployment Checklist

Before deploying to production:

- [ ] **CRITICAL: Set up model hosting** (see "Model Files" section above)
  - [ ] Choose hosting option (HuggingFace/CDN/Git LFS)
  - [ ] Update `web/src/config.ts` with model URLs
  - [ ] Test model loading locally
- [ ] Test locally: `npm run build && npm run preview`
- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Connect repository to Netlify
- [ ] Verify build settings in Netlify dashboard
- [ ] Deploy!
- [ ] Test deployed site (especially AI coach functionality)
- [ ] Verify models load correctly in production
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
