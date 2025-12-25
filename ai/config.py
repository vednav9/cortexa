"""
Configuration file for RAG system
"""
import torch
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models_cache"

# Create directories if they don't exist
for dir_path in [DATA_DIR, DOCUMENTS_DIR, PROCESSED_DIR, MODELS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# JSON storage file
EMBEDDINGS_JSON = PROCESSED_DIR / "embeddings_store.json"

# Model configurations
EMBEDDING_MODEL = "sentence-transformers/paraphrase-MiniLM-L3-v2"  # 120 MB
LLM_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # 1.1 GB

# Alternative faster models (uncomment to use):
# LLM_MODEL = "distilgpt2"  # 350 MB - Much faster
# LLM_MODEL = "gpt2"  # 500 MB - Faster than TinyLlama

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

# Device settings
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Performance settings
USE_FAST_TOKENIZER = True
LOW_CPU_MEM_USAGE = True
