"""
JSON-based vector store for document embeddings
"""
import json
import numpy as np
from typing import List, Dict, Tuple
from pathlib import Path
from datetime import datetime

from config import EMBEDDINGS_JSON, TOP_K, PROCESSED_DIR
from models.embeddings import get_embedding_model

class JSONStore:
    def __init__(self):
        self.embeddings_file = EMBEDDINGS_JSON
        self.embedding_model = get_embedding_model()
        self.data = self._load_data()
        print(f"✓ JSON Store initialized ({len(self.data['documents'])} documents loaded)")
    
    def _load_data(self) -> Dict:
        """Load data from JSON file"""
        if self.embeddings_file.exists():
            with open(self.embeddings_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Convert embeddings back to numpy arrays
                for doc in data['documents']:
                    doc['embedding'] = np.array(doc['embedding'])
                return data
        else:
            model_name = getattr(self.embedding_model.model, '_model_name_or_path', 
                                getattr(self.embedding_model.model, 'name_or_path', 
                                'unknown'))
            
            return {
                'documents': [],
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'embedding_model': model_name,
                    'embedding_dimension': self.embedding_model.dimension
                }
            }
    
    def _save_data(self):
        """Save data to JSON file"""
        # Convert numpy arrays to lists for JSON serialization
        save_data = {
            'documents': [],
            'metadata': self.data['metadata']
        }
        
        for doc in self.data['documents']:
            doc_copy = doc.copy()
            doc_copy['embedding'] = doc['embedding'].tolist()
            save_data['documents'].append(doc_copy)
        
        # Ensure directory exists
        self.embeddings_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.embeddings_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)
    
    def add_documents(
        self,
        texts: List[str],
        metadatas: List[Dict],
        ids: List[str] = None
    ):
        """
        Add documents to store
        
        Args:
            texts: List of document texts
            metadatas: List of metadata dicts
            ids: Optional list of document IDs
        """
        if not texts:
            return
        
        # Generate embeddings
        print(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_model.encode(texts)
        
        # Generate IDs if not provided
        if ids is None:
            existing_count = len(self.data['documents'])
            ids = [f"doc_{existing_count + i}" for i in range(len(texts))]
        
        # Add documents
        for i, (text, metadata, doc_id, embedding) in enumerate(zip(texts, metadatas, ids, embeddings)):
            self.data['documents'].append({
                'id': doc_id,
                'text': text,
                'metadata': metadata,
                'embedding': embedding,
                'added_at': datetime.now().isoformat()
            })
        
        # Save to file
        self._save_data()
        print(f"✓ Added {len(texts)} chunks to JSON store")
    
    def search(
        self,
        query: str,
        top_k: int = TOP_K,
        filter_metadata: Dict = None
    ) -> Tuple[List[str], List[Dict], List[float]]:
        """
        Search for similar documents using cosine similarity
        
        Args:
            query: Search query
            top_k: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            Tuple of (texts, metadatas, distances)
        """
        if not self.data['documents']:
            return [], [], []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode_query(query)
        
        # Calculate similarities
        results = []
        for doc in self.data['documents']:
            # Apply metadata filter if provided
            if filter_metadata:
                match = all(
                    doc['metadata'].get(k) == v 
                    for k, v in filter_metadata.items()
                )
                if not match:
                    continue
            
            # Calculate cosine similarity
            doc_embedding = doc['embedding']
            similarity = np.dot(query_embedding, doc_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
            )
            
            # Convert similarity to distance (1 - similarity for consistency)
            distance = 1 - similarity
            
            results.append({
                'text': doc['text'],
                'metadata': doc['metadata'],
                'distance': distance,
                'similarity': similarity
            })
        
        # Sort by distance (ascending)
        results.sort(key=lambda x: x['distance'])
        
        # Get top_k results
        results = results[:top_k]
        
        # Extract components
        texts = [r['text'] for r in results]
        metadatas = [r['metadata'] for r in results]
        distances = [r['distance'] for r in results]
        
        return texts, metadatas, distances
    
    def delete_all(self):
        """Delete all documents"""
        self.data = {
            'documents': [],
            'metadata': self.data['metadata']
        }
        self._save_data()
        print("✓ Deleted all documents")

    def remove_document_chunks(self, source_filename: str) -> int:
        """
        Remove all stored chunks that belong to the given file.

        Matches on two criteria (either is sufficient):
          1. doc['id'].startswith(source_filename + '_')   – ID convention used by /upload
          2. doc['metadata'].get('source') == source_filename

        Returns the number of chunks removed.
        """
        prefix = source_filename + '_'
        before = len(self.data['documents'])
        self.data['documents'] = [
            doc for doc in self.data['documents']
            if not (
                doc.get('id', '').startswith(prefix) or
                doc.get('metadata', {}).get('source') == source_filename
            )
        ]
        removed = before - len(self.data['documents'])
        if removed:
            self._save_data()
            print(f"✓ Removed {removed} existing chunks for '{source_filename}'")
        return removed
    
    def get_stats(self) -> Dict:
        """Get store statistics"""
        file_size_mb = 0
        if self.embeddings_file.exists():
            file_size_mb = self.embeddings_file.stat().st_size / (1024 * 1024)
        
        return {
            'total_documents': len(self.data['documents']),
            'embedding_dimension': self.data['metadata']['embedding_dimension'],
            'embedding_model': self.data['metadata']['embedding_model'],
            'file_path': str(self.embeddings_file),
            'file_size_mb': round(file_size_mb, 2)
        }
    
    def export_chunks_only(self, output_file: str = None):
        """
        Export only text chunks and metadata (without embeddings) to JSON
        
        Args:
            output_file: Output file path (optional)
        """
        if output_file is None:
            output_file = Path(PROCESSED_DIR) / "chunks_only.json"
        else:
            output_file = Path(output_file)
        
        chunks_data = {
            'total_chunks': len(self.data['documents']),
            'created_at': datetime.now().isoformat(),
            'chunks': [
                {
                    'id': doc['id'],
                    'text': doc['text'],
                    'metadata': doc['metadata']
                }
                for doc in self.data['documents']
            ]
        }
        
        # Ensure directory exists
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chunks_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Exported {len(chunks_data['chunks'])} chunks to {output_file}")

# Singleton instance
_json_store = None

def get_json_store() -> JSONStore:
    """Get or create JSONStore instance"""
    global _json_store
    if _json_store is None:
        _json_store = JSONStore()
    return _json_store
