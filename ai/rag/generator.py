"""
Response generation component
"""
from models.llm import get_llm_model
from rag.retriever import get_retriever
from typing import List, Dict

class ResponseGenerator:
    def __init__(self):
        self.llm = get_llm_model()
        self.retriever = get_retriever()
    
    def create_prompt(self, query: str, context: str) -> str:
        """
        Create prompt for LLM with context and query
        
        Args:
            query: User query
            context: Retrieved context
            
        Returns:
            Formatted prompt
        """
        prompt = f"""You are a helpful AI assistant that answers questions based on the provided context.

Context Information:
{context}

Question: {query}

Instructions:
1. Answer the question using ONLY the information from the context above
2. If the context doesn't contain enough information, say "I don't have enough information to answer this question."
3. Cite the source numbers (e.g., [Source 1]) when providing information
4. Be concise and accurate

Answer:"""
        
        return prompt
    
    def generate_response(
        self,
        query: str,
        context: str = None,
        max_tokens: int = 512
    ) -> str:
        """
        Generate response using LLM
        
        Args:
            query: User query
            context: Retrieved context (optional, will retrieve if not provided)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated response
        """
        # Retrieve context if not provided
        if context is None:
            retrieved_docs = self.retriever.retrieve(query)
            context = self.retriever.format_context(retrieved_docs)
        
        # Create prompt
        prompt = self.create_prompt(query, context)
        
        # Generate response
        response = self.llm.generate(
            prompt=prompt,
            max_new_tokens=max_tokens
        )
        
        return response.strip()

# Singleton instance
_generator = None

def get_generator() -> ResponseGenerator:
    """Get or create ResponseGenerator instance"""
    global _generator
    if _generator is None:
        _generator = ResponseGenerator()
    return _generator
