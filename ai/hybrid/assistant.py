"""
Hybrid AI Assistant - RAG + Web Search
"""
from typing import List, Dict, Optional
from models.llm import get_llm_model
from rag.retriever import get_retriever
from hybrid.web_search import get_web_searcher
from config import SIMILARITY_THRESHOLD

class HybridAssistant:
    def __init__(self):
        self.llm = get_llm_model()
        self.retriever = get_retriever()
        self.web_searcher = get_web_searcher()
    
    def answer(
        self,
        query: str,
        use_web: bool = True,
        min_similarity: float = SIMILARITY_THRESHOLD
    ) -> Dict:
        """
        Answer query using RAG + Web fallback
        
        Args:
            query: User query
            use_web: Whether to use web search as fallback
            min_similarity: Minimum similarity for document retrieval
            
        Returns:
            Answer with sources and metadata
        """
        print(f"\n🔍 Processing query: {query}")
        
        # Step 1: Try RAG (local documents)
        print("📚 Searching local documents...")
        doc_results = self.retriever.retrieve(
            query=query,
            min_similarity=min_similarity
        )
        
        sources = []
        answer = None
        search_method = None
        
        # Check if we have good document results
        if doc_results and len(doc_results) > 0:
            print(f"✓ Found {len(doc_results)} relevant documents")
            
            # Generate answer from documents
            context = self.retriever.format_context(doc_results)
            answer = self._generate_answer(query, context, source_type="documents")
            
            # Format sources
            sources = [
                {
                    'type': 'document',
                    'source': doc['source'],
                    'chunk_index': doc['chunk_index'],
                    'similarity': doc['similarity'],
                    'text_preview': doc['text'][:200]
                }
                for doc in doc_results
            ]
            
            search_method = "rag"
        
        # Step 2: Fallback to web search if no good docs found
        elif use_web:
            print("🌐 No relevant documents found. Searching the web...")
            
            web_results = self.web_searcher.search(query, max_results=5)
            
            if web_results:
                print(f"✓ Found {len(web_results)} web results")
                
                # Create context from web results
                context = self._format_web_context(web_results)
                answer = self._generate_answer(query, context, source_type="web")
                
                # Format sources
                sources = [
                    {
                        'type': 'web',
                        'title': result['title'],
                        'url': result['url'],
                        'snippet': result['snippet']
                    }
                    for result in web_results
                ]
                
                search_method = "web"
            else:
                print("❌ No web results found")
                answer = "I couldn't find relevant information to answer your question. Please try rephrasing or ask something else."
                search_method = "none"
        
        else:
            answer = "I don't have enough information in my knowledge base to answer this question."
            search_method = "none"
        
        return {
            'query': query,
            'answer': answer,
            'sources': sources,
            'search_method': search_method,
            'num_sources': len(sources)
        }
    
    def _format_web_context(self, web_results: List[Dict]) -> str:
        """Format web search results into context"""
        context_parts = []
        
        for i, result in enumerate(web_results, 1):
            context_parts.append(
                f"[Web Source {i}: {result['title']}]\n"
                f"URL: {result['url']}\n"
                f"{result['snippet']}\n"
            )
        
        return "\n".join(context_parts)
    
    def _generate_answer(
        self,
        query: str,
        context: str,
        source_type: str
    ) -> str:
        """Generate answer from context"""
        
        if source_type == "documents":
            prompt = f"""You are a helpful AI assistant. Answer the question using ONLY the information from the provided context.

Context from uploaded documents:
{context}

Question: {query}

Instructions:
- Answer based on the context above
- Cite sources using [Source 1], [Source 2], etc.
- If the context doesn't fully answer the question, say so
- Be concise and accurate

Answer:"""
        
        else:  # web sources
            prompt = f"""You are a helpful AI assistant. Answer the question using the information from web search results.

Web search results:
{context}

Question: {query}

Instructions:
- Synthesize information from the web sources
- Cite sources using [Web Source 1], [Web Source 2], etc.
- Provide accurate and helpful information
- Be concise

Answer:"""
        
        response = self.llm.generate(
            prompt=prompt,
            max_new_tokens=512,
            temperature=0.7
        )
        
        return response.strip()

# Singleton
_hybrid_assistant = None

def get_hybrid_assistant() -> HybridAssistant:
    """Get or create HybridAssistant instance"""
    global _hybrid_assistant
    if _hybrid_assistant is None:
        _hybrid_assistant = HybridAssistant()
    return _hybrid_assistant
