"""
Embedding model for document and query vectorization
"""
import torch
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from config import EMBEDDING_MODEL, DEVICE, MODELS_DIR

class EmbeddingModel:
    def __init__(self):
        print(f"Loading embedding model: {EMBEDDING_MODEL}")
        self.model = SentenceTransformer(
            EMBEDDING_MODEL,
            cache_folder=str(MODELS_DIR),
            device=DEVICE
        )
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"✓ Embedding model loaded (dimension: {self.dimension})")
    
    def encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode texts into embeddings
        
        Args:
            texts: List of text strings
            batch_size: Batch size for encoding
            
        Returns:
            Numpy array of embeddings
        """
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True  # L2 normalization for cosine similarity
        )
        return embeddings
    
    def encode_query(self, query: str) -> np.ndarray:
        """
        Encode a single query
        
        Args:
            query: Query string
            
        Returns:
            Numpy array of embedding
        """
        return self.model.encode(
            query,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

# Singleton instance
_embedding_model = None

def get_embedding_model() -> EmbeddingModel:
    """Get or create embedding model instance"""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = EmbeddingModel()
    return _embedding_model
