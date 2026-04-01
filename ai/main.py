"""
Main script for testing RAG system
"""
from pathlib import Path
from typing import List

from config import DOCUMENTS_DIR
from vectordb.document_processor import DocumentProcessor
from vectordb.mongodb_store import get_mongodb_store
from rag.retriever import get_retriever
from rag.generator import get_generator

def load_documents(file_paths: List[str]):
    """Load documents into JSON store"""
    print("\n" + "="*60)
    print("LOADING DOCUMENTS")
    print("="*60)
    
    processor = DocumentProcessor()
    vector_store = get_mongodb_store()
    
    for file_path in file_paths:
        print(f"\nProcessing: {file_path}")
        
        chunks = processor.process_document(file_path)
        print(f"✓ Created {len(chunks)} chunks")
        
        texts = [chunk.text for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{Path(file_path).stem}_{i}" for i in range(len(chunks))]
        
        vector_store.add_documents(texts, metadatas, ids)
    
    stats = vector_store.get_stats()
    print(f"\n✓ Total chunks in store: {stats.get('total_chunks', 0)}")
    print(f"✓ Total embeddings in store: {stats.get('total_embeddings', 0)}")
    print(f"✓ MongoDB storage size: {stats.get('storage_size_mb', 0):.2f} MB")
    
    # Export chunks only (without embeddings)
    vector_store.export_chunks_only()

def query_system(query: str):
    """Query the RAG system"""
    print("\n" + "="*60)
    print(f"QUERY: {query}")
    print("="*60)
    
    retriever = get_retriever()
    generator = get_generator()
    
    print("\n🔍 Retrieving relevant documents...")
    retrieved_docs = retriever.retrieve(query)
    
    print(f"✓ Found {len(retrieved_docs)} relevant chunks")
    for i, doc in enumerate(retrieved_docs, 1):
        print(f"\n[{i}] {doc['source']} (Chunk {doc['chunk_index']}, Similarity: {doc['similarity']:.3f})")
        print(f"Preview: {doc['text'][:150]}...")
    
    print("\n💬 Generating response...")
    context = retriever.format_context(retrieved_docs)
    answer = generator.generate_response(query, context)
    
    print("\n" + "-"*60)
    print("ANSWER:")
    print("-"*60)
    print(answer)
    print("-"*60)

def interactive_mode():
    """Interactive query mode"""
    print("\n" + "="*60)
    print("INTERACTIVE MODE")
    print("="*60)
    print("Commands:")
    print("  - Type your question to query")
    print("  - Type 'stats' to see store statistics")
    print("  - Type 'quit' or 'exit' to stop")
    print("="*60 + "\n")
    
    vector_store = get_mongodb_store()
    
    while True:
        query = input("\n💬 Your question: ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if query.lower() == 'stats':
            stats = vector_store.get_stats()
            print("\n📊 Store Statistics:")
            for key, value in stats.items():
                print(f"  {key}: {value}")
            continue
        
        if not query:
            continue
        
        query_system(query)

def main():
    """Main function"""
    print("\n🚀 Cortexa RAG System (JSON Storage)")
    print("="*60)
    
    docs = list(DOCUMENTS_DIR.glob("*"))
    docs = [d for d in docs if d.suffix in ['.pdf', '.txt', '.docx']]
    
    if not docs:
        print(f"\n⚠️  No documents found in {DOCUMENTS_DIR}")
        print("Please add PDF, TXT, or DOCX files to the documents folder.")
        return
    
    print(f"\n📄 Found {len(docs)} documents:")
    for doc in docs:
        print(f"  - {doc.name}")
    
    load_choice = input("\nLoad documents into store? (y/n): ").strip().lower()
    if load_choice == 'y':
        load_documents([str(d) for d in docs])
    
    print("\nStarting interactive query mode...")
    interactive_mode()

if __name__ == "__main__":
    main()
