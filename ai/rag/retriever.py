"""
Document retrieval component
"""
from typing import List, Dict
from vectordb.json_store import get_json_store
from config import TOP_K, SIMILARITY_THRESHOLD

class DocumentRetriever:
    def __init__(self):
        self.vector_store = get_json_store()
    
    def retrieve(
        self,
        query: str,
        top_k: int = TOP_K,
        filter_metadata: Dict = None,
        min_similarity: float = SIMILARITY_THRESHOLD
    ) -> List[Dict]:
        """
        Retrieve relevant documents for a query
        """
        # Search vector store
        documents, metadatas, distances = self.vector_store.search(
            query=query,
            top_k=top_k,
            filter_metadata=filter_metadata
        )
        
        # Format results
        results = []
        for doc, metadata, distance in zip(documents, metadatas, distances):
            similarity = 1 - distance
            
            if similarity >= min_similarity:
                results.append({
                    'text': doc,
                    'metadata': metadata,
                    'similarity': similarity,
                    'source': metadata.get('source', 'Unknown'),
                    'chunk_index': metadata.get('chunk_index', 0)
                })
        
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results
    
    def format_context(self, retrieved_docs: List[Dict]) -> str:
        """Format retrieved documents into context string"""
        if not retrieved_docs:
            return "No relevant information found."
        
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            source = doc['metadata'].get('source', 'Unknown')
            chunk_idx = doc['metadata'].get('chunk_index', 0)
            similarity = doc['similarity']
            
            context_parts.append(
                f"[Source {i}: {source}, Chunk {chunk_idx}, Relevance: {similarity:.2f}]\n"
                f"{doc['text']}\n"
            )
        
        return "\n".join(context_parts)

_retriever = None

def get_retriever() -> DocumentRetriever:
    global _retriever
    if _retriever is None:
        _retriever = DocumentRetriever()
    return _retriever
