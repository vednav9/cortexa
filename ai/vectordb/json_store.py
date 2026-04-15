"""
Refactored Vector Store Proxy: 
Splits storage across two collections in MongoDB:
- 'documentchunks' (Stores text, metadata, and chunk_id)
- 'embeddingstores' (Stores the vector embedding tied to the chunk_id)
"""
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime
from pymongo import MongoClient
import os

from config import TOP_K
from models.embeddings import get_embedding_model

class JSONStore:
    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.client = None
        self.mongo_uri = None
        self.chunks_collection = None
        self.embeddings_collection = None

        # Fallback for direct AI calls (e.g., browser -> HF Space) where
        # x-mongo-uri header is not present. Header-based URI still takes precedence.
        fallback_uri = (os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "").strip()
        if fallback_uri:
            try:
                self.set_mongo_uri(fallback_uri)
                print("✓ MongoDB fallback URI loaded from environment")
            except Exception as e:
                print(f"⚠️ Failed to initialize MongoDB from environment: {e}")

        print("✓ MongoDB Vector Proxy initialized (Dual Collections)")
        
    def set_mongo_uri(self, mongo_uri: str):
        """Dynamically configures the DB connection per request context."""
        if mongo_uri and self.mongo_uri != mongo_uri:
            self.mongo_uri = mongo_uri
            self.client = MongoClient(mongo_uri)
            try:
                db = self.client.get_database()
            except Exception:
                db = self.client['cortexa'] # Fallback
            
            # Initialize both collections
            self.chunks_collection = db['documentchunks'] 
            self.embeddings_collection = db['embeddingstores']

    def _check_connection(self):
        if self.chunks_collection is None or self.embeddings_collection is None:
            raise ValueError("MongoDB is not configured. Provide x-mongo-uri header or set MONGO_URI/MONGODB_URI in AI environment.")

    def remove_document_chunks(self, document_identifier: str):
        """Clears old chunks and embeddings from MongoDB before re-indexing a document."""
        self._check_connection()
        
        # 1. Find all chunk IDs associated with this document
        query = {
            "$or": [
                {"metadata.source": document_identifier},
                {"metadata.document_id": document_identifier},
                {"metadata.filename": document_identifier}
            ]
        }
        
        # Get IDs to delete from the embeddings collection
        chunks_to_delete = list(self.chunks_collection.find(query, {"chunk_id": 1}))
        chunk_ids = [doc["chunk_id"] for doc in chunks_to_delete]
        
        if chunk_ids:
            # 2. Delete the embeddings linked to those chunk IDs
            emb_result = self.embeddings_collection.delete_many({"chunk_id": {"$in": chunk_ids}})
            # 3. Delete the actual chunks
            chunk_result = self.chunks_collection.delete_many(query)
            
            print(f"✓ Removed {chunk_result.deleted_count} old chunks and {emb_result.deleted_count} embeddings for {document_identifier}")
        else:
            print(f"✓ No existing chunks found to remove for {document_identifier}")

    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str] = None):
        self._check_connection()
        if not texts:
            return
        
        print(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_model.encode(texts)
        
        if ids is None:
            timestamp = int(datetime.now().timestamp())
            ids = [f"doc_{timestamp}_{i}" for i in range(len(texts))]
        
        chunks_data = []
        embeddings_data = []
        
        for i, (text, metadata, doc_id, embedding) in enumerate(zip(texts, metadatas, ids, embeddings)):
            # 1. Prepare data for the chunks collection (No heavy vectors)
            chunks_data.append({
                'chunk_id': doc_id,
                'text': text,
                'metadata': metadata,
                'added_at': datetime.utcnow()
            })
            
            # 2. Prepare data for the embeddings collection (Vectors only, linked by ID)
            embeddings_data.append({
                'chunk_id': doc_id,
                'embedding': embedding.tolist(), 
                'added_at': datetime.utcnow()
            })
        
        # Insert into both collections separately
        if chunks_data and embeddings_data:
            self.chunks_collection.insert_many(chunks_data)
            self.embeddings_collection.insert_many(embeddings_data)
            
        print(f"✓ Added {len(texts)} chunks to 'documentchunks' & {len(embeddings_data)} vectors to 'embeddingstores'")

    def search(self, query: str, top_k: int = TOP_K, filter_metadata: Dict = None) -> Tuple[List[str], List[Dict], List[float]]:
        self._check_connection()
        
        if self.chunks_collection.count_documents({}) == 0:
            return [], [], []
        
        query_embedding = self.embedding_model.encode_query(query)
        
        # 1. Find all matching chunks based on metadata filters
        db_query = {}
        if filter_metadata:
            for k, v in filter_metadata.items():
                db_query[f"metadata.{k}"] = v
        
        chunk_cursor = self.chunks_collection.find(db_query)
        chunks_dict = {doc['chunk_id']: doc for doc in chunk_cursor}
        
        if not chunks_dict:
            return [], [], []

        # 2. Fetch the corresponding embeddings for the filtered chunks
        chunk_ids = list(chunks_dict.keys())
        embeddings_cursor = self.embeddings_collection.find({"chunk_id": {"$in": chunk_ids}})
        
        results = []
        for emb_doc in embeddings_cursor:
            chunk_id = emb_doc['chunk_id']
            if chunk_id not in chunks_dict:
                continue
                
            chunk_data = chunks_dict[chunk_id]
            doc_embedding = np.array(emb_doc['embedding'])
            
            # Compute cosine similarity
            similarity = np.dot(query_embedding, doc_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
            )
            distance = 1 - similarity
            
            results.append({
                'text': chunk_data['text'],
                'metadata': chunk_data.get('metadata', {}),
                'distance': distance,
                'similarity': similarity
            })
        
        # Sort by best match
        results.sort(key=lambda x: x['distance'])
        results = results[:top_k]
        
        texts = [r['text'] for r in results]
        metadatas = [r['metadata'] for r in results]
        distances = [r['distance'] for r in results]
        
        return texts, metadatas, distances

    def delete_all(self):
        if self.chunks_collection is not None and self.embeddings_collection is not None:
            self.chunks_collection.delete_many({})
            self.embeddings_collection.delete_many({})
            print("✓ Deleted all documents from both collections")

    def get_stats(self) -> Dict:
        count = self.chunks_collection.count_documents({}) if self.chunks_collection is not None else 0
        model_name = getattr(self.embedding_model.model, '_model_name_or_path', 
                            getattr(self.embedding_model.model, 'name_or_path', 'unknown'))
        return {
            'total_documents': count,
            'embedding_dimension': self.embedding_model.dimension,
            'embedding_model': model_name,
            'storage': 'MongoDB Dual Collection Proxy'
        }
    
    def export_chunks_only(self, output_file: str = None):
        pass 

# Singleton instance
_json_store = None

def get_json_store() -> JSONStore:
    global _json_store
    if _json_store is None:
        _json_store = JSONStore()
    return _json_store