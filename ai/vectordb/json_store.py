"""
Refactored JSON Store: Now securely acts as a MongoDB Vector Store proxy.
Uses the URI passed via the API header so HF doesn't need ENV variables.
"""
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime
from pymongo import MongoClient

from config import TOP_K
from models.embeddings import get_embedding_model

class JSONStore:
    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.client = None
        self.mongo_uri = None
        self.collection = None
        print("✓ MongoDB Vector Proxy initialized")
        
    def set_mongo_uri(self, mongo_uri: str):
        """Dynamically configures the DB connection per request context."""
        if mongo_uri and self.mongo_uri != mongo_uri:
            self.mongo_uri = mongo_uri
            self.client = MongoClient(mongo_uri)
            try:
                db = self.client.get_database()
            except Exception:
                db = self.client['cortexa'] # Fallback
            # Collection where chunks & vectors will be permanently stored
            self.collection = db['document_chunks'] 

    def _check_connection(self):
        if self.collection is None:
            raise ValueError("Missing x-mongo-uri header from the backend request.")

    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str] = None):
        self._check_connection()
        if not texts:
            return
        
        print(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_model.encode(texts)
        
        if ids is None:
            timestamp = int(datetime.now().timestamp())
            ids = [f"doc_{timestamp}_{i}" for i in range(len(texts))]
        
        documents = []
        for i, (text, metadata, doc_id, embedding) in enumerate(zip(texts, metadatas, ids, embeddings)):
            documents.append({
                'chunk_id': doc_id,
                'text': text,
                'metadata': metadata,
                'embedding': embedding.tolist(), # Storing vector native to Mongo
                'added_at': datetime.utcnow()
            })
        
        if documents:
            self.collection.insert_many(documents)
        print(f"✓ Added {len(texts)} chunks & embeddings to MongoDB")

    def search(self, query: str, top_k: int = TOP_K, filter_metadata: Dict = None) -> Tuple[List[str], List[Dict], List[float]]:
        self._check_connection()
        if self.collection.count_documents({}) == 0:
            return [], [], []
        
        query_embedding = self.embedding_model.encode_query(query)
        
        db_query = {}
        if filter_metadata:
            for k, v in filter_metadata.items():
                db_query[f"metadata.{k}"] = v
        
        cursor = self.collection.find(db_query)
        
        results = []
        for doc in cursor:
            if 'embedding' not in doc:
                continue
            
            doc_embedding = np.array(doc['embedding'])
            similarity = np.dot(query_embedding, doc_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
            )
            distance = 1 - similarity
            
            results.append({
                'text': doc['text'],
                'metadata': doc.get('metadata', {}),
                'distance': distance,
                'similarity': similarity
            })
        
        results.sort(key=lambda x: x['distance'])
        results = results[:top_k]
        
        texts = [r['text'] for r in results]
        metadatas = [r['metadata'] for r in results]
        distances = [r['distance'] for r in results]
        
        return texts, metadatas, distances

    def delete_all(self):
        if self.collection is not None:
            self.collection.delete_many({})
            print("✓ Deleted all documents from MongoDB")

    def get_stats(self) -> Dict:
        count = self.collection.count_documents({}) if self.collection is not None else 0
        model_name = getattr(self.embedding_model.model, '_model_name_or_path', 
                            getattr(self.embedding_model.model, 'name_or_path', 'unknown'))
        return {
            'total_documents': count,
            'embedding_dimension': self.embedding_model.dimension,
            'embedding_model': model_name,
            'storage': 'MongoDB via Header Proxy'
        }
    
    def export_chunks_only(self, output_file: str = None):
        pass # Optional/Not strictly needed anymore since they exist in Mongo Atlas UI directly

# Singleton instance
_json_store = None

def get_json_store() -> JSONStore:
    global _json_store
    if _json_store is None:
        _json_store = JSONStore()
    return _json_store