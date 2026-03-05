"""
Configuration file for RAG system
"""
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models_cache"

# NEW: Audio storage
AUDIO_DIR = DATA_DIR / "audio"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"

# Create directories if they don't exist
for dir_path in [DATA_DIR, DOCUMENTS_DIR, PROCESSED_DIR, MODELS_DIR, AUDIO_DIR, TRANSCRIPTS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# JSON storage file
EMBEDDINGS_JSON = PROCESSED_DIR / "embeddings_store.json"

# Model configurations
EMBEDDING_MODEL = "sentence-transformers/paraphrase-MiniLM-L3-v2"  # 120 MB
LLM_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # 1.1 GB
WHISPER_MODEL = "base"  # Options: tiny, base, small, medium, large

# Alternative faster models (uncomment to use):
# LLM_MODEL = "distilgpt2"  # 350 MB - RECOMMENDED: 3-5x faster!
# LLM_MODEL = "gpt2"  # 500 MB - 2x faster than TinyLlama
# NEW: Whisper model configuration
# Model sizes:
# - tiny: ~75MB, fastest
# - base: ~140MB, good balance (RECOMMENDED)
# - small: ~470MB, better accuracy
# - medium: ~1.5GB, high accuracy
# - large: ~3GB, best accuracy

# Chunking settings
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
MAX_CHUNKS_PER_DOC = 1000

# Retrieval settings
TOP_K = 3  # Reduced from 5 for faster retrieval
SIMILARITY_THRESHOLD = 0.3

# Generation settings
MAX_NEW_TOKENS = 256  # Reduced from 512 for faster generation
TEMPERATURE = 0.7
TOP_P = 0.9

# MCQ Generation settings (optimized for speed)
MCQ_MAX_TOKENS_PER_QUESTION = 150  # ~150 tokens per MCQ
MCQ_MAX_CONTEXT_LENGTH = 1000  # Shorter context = faster generation

# Audio/Transcription settings
MAX_AUDIO_SIZE_MB = 100  # Maximum audio file size
SUPPORTED_AUDIO_FORMATS = ['.wav', '.mp3', '.m4a', '.ogg', '.flac']
WHISPER_LANGUAGE = "en"  # English only as per requirement

# Device settings
DEVICE = "cpu"  # Render free tier has no GPU

# Performance settings
USE_FAST_TOKENIZER = True
LOW_CPU_MEM_USAGE = True
