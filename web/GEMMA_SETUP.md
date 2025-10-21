# Setting Up Gemma 3/3n Models (Optional)

TypeStrike supports Google's Gemma 3 and 3n models via MediaPipe for advanced AI coaching. However, these models require manual setup due to licensing requirements.

## ⚡ Quick Start (No Setup Required)

**By default, TypeStrike uses WebLLM with Llama 3.2**, which works immediately without any downloads!

Just run `npm run dev` and start playing. The AI coach will automatically load and provide feedback.

---

## 🔧 Advanced: Using Gemma Models

If you want to use Google's Gemma models for potentially better coaching quality:

### Step 1: Accept Gemma Terms

1. Visit: https://www.kaggle.com/models/google/gemma-3n
2. Click "Accept" to agree to Google's Gemma terms of use
3. Sign in to Kaggle (free account required)

### Step 2: Download Models

Choose one or more models to download:

| Model | Size | Speed | Quality | Multimodal | Recommended |
|-------|------|-------|---------|------------|-------------|
| **Gemma 3n 270M** | ~200MB | ⚡⚡⚡ | ⭐⭐ | ❌ | Good for testing |
| **Gemma 3n E2B** | ~1.5GB | ⚡⚡ | ⭐⭐⭐ | ✅ | Balanced |
| **Gemma 3n E4B** | ~3GB | ⚡ | ⭐⭐⭐⭐ | ✅ | **Best overall** |
| Gemma 3 4B | ~3GB | ⚡ | ⭐⭐⭐⭐ | ❌ | Alternative |
| Gemma 3 12B | ~8GB | 🐌 | ⭐⭐⭐⭐⭐ | ❌ | Highest quality |

**Download Links:**
- [Gemma 3n 270M](https://www.kaggle.com/models/google/gemma-3n/litert/gemma-3-270m-it)
- [Gemma 3n E2B](https://www.kaggle.com/models/google/gemma-3n/litert/gemma-3n-e2b-it)
- [Gemma 3n E4B](https://www.kaggle.com/models/google/gemma-3n/litert/gemma-3n-e4b-it) ⭐ **Recommended**
- [Gemma 3 4B](https://www.kaggle.com/models/google/gemma-3/litert/gemma-3-4b-it)
- [Gemma 3 12B](https://www.kaggle.com/models/google/gemma-3/litert/gemma-3-12b-it)

Look for files ending in `-int4-Web.litertlm` (these are optimized for web browsers).

### Step 3: Install Models

1. Create a `public/models` directory in the `web` folder:
   ```bash
   mkdir -p web/public/models
   ```

2. Copy the downloaded `.litertlm` files to `web/public/models/`

3. Verify the files are in the right place:
   ```
   web/
   ├── public/
   │   └── models/
   │       ├── gemma-3-270m-it-int4-Web.litertlm       (optional)
   │       ├── gemma-3n-E2B-it-int4-Web.litertlm       (optional)
   │       ├── gemma-3n-E4B-it-int4-Web.litertlm       ⭐ recommended
   │       ├── Gemma3-4B-IT-int4-Web.litertlm          (optional)
   │       └── Gemma3-12B-IT-int4-Web.litertlm         (optional)
   ```

### Step 4: Enable MediaPipe in Settings

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Click ⚙️ **Settings** (top-right)
4. Change **AI Mode** to **"MediaPipe (Gemma 3/3n)"**
5. A second dropdown appears - select your downloaded model
6. Reload the page

The model will load from your local files (instant after first load, cached by browser).

---

## 🎮 How to Use

Once configured:

1. **Play a level** - Type the falling letters
2. **Complete the level** - Finish or run out of time
3. **See AI feedback** - Gemma analyzes your performance and provides personalized coaching

Example feedback:
> "Great work! Your 95% accuracy shows excellent form. Try to increase your speed by keeping your fingers on the home row between keystrokes. Aim for 45 WPM next session!"

---

## 🔍 Troubleshooting

### "AI Coach failed to load"
- **Check**: Are the model files in `web/public/models/`?
- **Check**: Are the filenames exactly as shown above?
- **Check**: Did you reload the page after changing settings?

### Browser not supported
- Gemma requires **Chrome 113+** or **Edge 113+** (WebGPU required)
- Firefox and Safari are not yet supported by MediaPipe

### Model takes forever to load
- First load downloads the model from your server to browser cache (~200MB-3GB depending on model)
- Subsequent loads are instant (cached)
- Use Gemma 3n 270M for fastest initial load

---

## 💡 Model Comparison

### WebLLM (Default - No Setup)
- ✅ Works immediately, no downloads
- ✅ ~600MB Llama 3.2 model
- ✅ Good coaching quality
- ⚡ Fast inference
- 📦 Auto-downloads from CDN

### MediaPipe + Gemma (Optional - Manual Setup)
- 🔧 Requires manual download and setup
- 📊 Multiple model sizes (200MB-8GB)
- 🎯 Potentially better quality
- ✨ **Multimodal** support (E2B/E4B models can analyze images/audio)
- 🌐 Runs locally from your files

---

## 📝 Summary

**For most users:** Stick with the default **WebLLM** mode - it works great!

**For advanced users:** Download Gemma models if you want:
- Multimodal capabilities
- More model size options
- Potentially higher quality coaching
- Complete local control

---

## 🔗 Resources

- [Gemma Models on Kaggle](https://www.kaggle.com/models/google/gemma-3n)
- [MediaPipe Documentation](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
- [Gemma 3n Technical Details](https://ai.google.dev/gemma/docs/gemma-3n)
