# Gemma Models - Download Instructions

This folder should contain Gemma 3/3n model files for MediaPipe.

## 📥 Quick Start (Smallest Model - 200MB)

1. **Accept Gemma Terms:**
   - Visit: https://huggingface.co/google/gemma-3
   - Click "Accept" and sign in to HuggingFace

2. **Download Gemma 3n 270M** (fastest, smallest):
   - Visit: https://huggingface.co/litert-community/gemma-3-270m-it/tree/main
   - Download: `gemma3-270m-it-q8.litertlm` (~304MB)
   - **Move it to this folder**

3. **Refresh the app** - Model will load instantly from local file!

---

## 📦 All Available Models

Download ONE or MORE of these models and place them in this folder:

| Model File | Size | Download From |
|------------|------|---------------|
| **gemma3-270m-it-q8.litertlm** ⚡ | ~304MB | [Download](https://huggingface.co/litert-community/gemma-3-270m-it/blob/main/gemma3-270m-it-q8.litertlm) |
| **gemma-3n-e2b-it-int4-Web.litertlm** | ~1.5GB | [Download](https://huggingface.co/litert-community/gemma-3n-e2b-it/blob/main/gemma-3n-e2b-it-int4-Web.litertlm) |
| **gemma-3n-e4b-it-int4-Web.litertlm** ⭐ | ~3GB | [Download](https://huggingface.co/litert-community/gemma-3n-e4b-it/blob/main/gemma-3n-e4b-it-int4-Web.litertlm) |
| **Gemma3-4B-IT-int4-Web.litertlm** | ~3GB | [Download](https://huggingface.co/litert-community/Gemma3-4B-IT/blob/main/Gemma3-4B-IT-int4-Web.litertlm) |
| **Gemma3-12B-IT-int4-Web.litertlm** | ~8GB | [Download](https://huggingface.co/litert-community/Gemma3-12B-IT/blob/main/Gemma3-12B-IT-int4-Web.litertlm) |

**⭐ = Recommended** | **⚡ = Fastest to download**

---

## 📋 File Structure

After downloading, your folder should look like:

```
web/public/models/
├── README.md (this file)
├── gemma3-270m-it-q8.litertlm              (304MB - start here!)
├── gemma-3n-e2b-it-int4-Web.litertlm       (1.5GB - optional)
├── gemma-3n-e4b-it-int4-Web.litertlm       (3GB - recommended)
├── Gemma3-4B-IT-int4-Web.litertlm          (3GB - optional)
└── Gemma3-12B-IT-int4-Web.litertlm         (8GB - optional)
```

**Note:** You only need to download ONE model to get started. The 270M model is perfect for testing!

---

## 🎮 How to Use

1. **Download at least ONE model file** (start with 270M)
2. **Place it in this folder**
3. **Refresh the TypeStrike app** (http://localhost:3000)
4. **Play a level** and complete it
5. **See AI-generated feedback!**

To switch models:
1. Click ⚙️ **Settings**
2. Select **MediaPipe** mode
3. Choose your model from the dropdown
4. Reload the page

---

## ❓ Troubleshooting

### "Failed to load model"
- Check the filename matches exactly (case-sensitive!)
- Make sure the file is in `web/public/models/`
- Reload the page with Cmd+Shift+R (hard refresh)

### "401 Unauthorized" errors
- This means you're trying to load from HuggingFace
- Make sure the file is downloaded locally
- The config should use `/models/filename.litertlm` not `https://...`

### Which model should I download?
- **Testing/Development:** 270M (fastest download, good quality)
- **Production:** E4B (best quality, multimodal)
- **Budget:** E2B (good balance)

---

## 🔗 Official Resources

- [LiteRT Community on HuggingFace](https://huggingface.co/litert-community)
- [Gemma 3 Official Docs](https://ai.google.dev/gemma/docs/gemma-3)
- [MediaPipe LLM Inference](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
