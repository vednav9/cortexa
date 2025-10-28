"""
Test script for RAG system
"""
import unittest
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.embeddings import get_embedding_model
from models.llm import get_llm_model
from vectordb.document_processor import DocumentProcessor
# from vectordb.chroma_store import get_chroma_store
from rag.retriever import get_retriever
from rag.generator import get_generator

class TestRAGSystem(unittest.TestCase):
    
    def test_embeddings(self):
        """Test embedding model"""
        print("\n🧪 Testing embedding model...")
        model = get_embedding_model()
        
        texts = ["This is a test", "Another test sentence"]
        embeddings = model.encode(texts)
        
        self.assertEqual(len(embeddings), 2)
        self.assertEqual(embeddings.shape[1], model.dimension)
        print("✓ Embeddings test passed")
    
    def test_document_processor(self):
        """Test document processing"""
        print("\n🧪 Testing document processor...")
        processor = DocumentProcessor()
        
        text = "This is a test document. " * 100
        chunks = processor.chunk_text(text, chunk_size=100, overlap=20)
        
        self.assertGreater(len(chunks), 0)
        print(f"✓ Created {len(chunks)} chunks")
    
    def test_retrieval(self):
        """Test document retrieval"""
        print("\n🧪 Testing retrieval...")
        retriever = get_retriever()
        
        query = "test query"
        results = retriever.retrieve(query, top_k=3)
        
        self.assertIsInstance(results, list)
        print(f"✓ Retrieved {len(results)} documents")
    
    def test_generation(self):
        """Test response generation"""
        print("\n🧪 Testing generation...")
        generator = get_generator()
        
        query = "What is machine learning?"
        context = "Machine learning is a subset of artificial intelligence."
        
        response = generator.generate_response(query, context, max_tokens=50)
        
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)
        print(f"✓ Generated response: {response[:100]}...")

if __name__ == "__main__":
    unittest.main(verbosity=2)
