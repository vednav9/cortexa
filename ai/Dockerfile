# ============================================================
# Cortexa AI — HuggingFace Docker Space
# HF CPU Basic free tier: 2 vCPU, 16 GB RAM
# Port 7860 is required by HuggingFace Spaces platform
# ============================================================

FROM python:3.11-slim

# --- System dependencies ---
# ffmpeg is REQUIRED for openai-whisper (audio processing)
# git is needed by some transformers internals
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# --- Non-root user (required by HuggingFace Spaces) ---
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# --- Install Python dependencies ---
# Copy requirements first so this layer is cached separately from app code.
# If only your code changes (not requirements.txt), this entire layer is reused
# on the next push — no 15-min reinstall.
COPY --chown=user requirements.txt .

RUN pip install --no-cache-dir --user -r requirements.txt

# --- Pre-download all models into the Docker image ---
# This is the KEY trick for HuggingFace Spaces:
#   - Models are downloaded ONCE during 'docker build' on HF's build servers
#   - The resulting Docker layer is cached by HuggingFace
#   - Every future container start uses the cached image — no re-download
#   - Container startup time: ~30 seconds instead of 10+ minutes
#
# Build time for this step: ~10-20 minutes (one-time, on first push only)
# Models downloaded:
#   - paraphrase-MiniLM-L3-v2  (~120 MB)
#   - TinyLlama-1.1B-Chat-v1.0 (~2.2 GB on disk, ~4.4 GB in RAM fp32)
#   - Whisper base              (~140 MB)
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
from transformers import AutoTokenizer; \
from huggingface_hub import snapshot_download; \
import whisper; \
print('--- Downloading sentence-transformers (120 MB) ---'); \
SentenceTransformer('sentence-transformers/paraphrase-MiniLM-L3-v2', cache_folder='/home/user/app/models_cache'); \
print('--- Downloading TinyLlama tokenizer ---'); \
AutoTokenizer.from_pretrained('TinyLlama/TinyLlama-1.1B-Chat-v1.0', cache_dir='/home/user/app/models_cache', trust_remote_code=True); \
print('--- Downloading TinyLlama model weights to disk only (2.2 GB, no RAM loading) ---'); \
snapshot_download(repo_id='TinyLlama/TinyLlama-1.1B-Chat-v1.0', cache_dir='/home/user/app/models_cache'); \
print('--- Downloading Whisper base (140 MB) ---'); \
whisper.load_model('base', download_root='/home/user/app/models_cache/whisper'); \
print('=== All models downloaded successfully ==='); \
"

# --- Copy application code ---
# This is after model download so that code-only changes don't invalidate
# the model download cache layer above.
COPY --chown=user . .

# --- Environment ---
ENV PYTHONPATH=/home/user/app
# HF_HOME tells HuggingFace library to use the pre-baked models_cache
ENV HF_HOME=/home/user/app/models_cache
ENV PORT=7860

# HuggingFace Spaces requires port 7860
EXPOSE 7860

# Start the FastAPI server
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
