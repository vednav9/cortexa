"""
FastAPI server for RAG system
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import shutil

from config import DOCUMENTS_DIR
from vectordb.document_processor import DocumentProcessor
from vectordb.json_store import get_json_store  # Changed from chroma_store
from rag.retriever import get_retriever
from rag.generator import get_generator
from mcq.generator import get_mcq_generator
from mcq.validator import MCQValidator
from hybrid.assistant import get_hybrid_assistant

app = FastAPI(title="Cortexa RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Pre-load models on startup"""
    print("="*60)
    print("🚀 Starting Cortexa AI Server...")
    print("="*60)
    print("📦 Loading AI models (this may take 30-60 seconds)...")
    # Models are already initialized globally above
    print("✅ Models loaded successfully!")
    print("🌐 Server ready at http://localhost:8000")
    print("📚 API docs at http://localhost:8000/docs")
    print("="*60)

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    institution_id: Optional[str] = None

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[dict]
    context: str

class DocumentUploadResponse(BaseModel):
    filename: str
    chunks_added: int
    status: str

class MCQGenerateRequest(BaseModel):
    source_type: str  # "text", "document", "topic"
    source: str  # text content, document name, or topic
    num_questions: int = 5
    difficulty: str = "medium"

class MCQScoreRequest(BaseModel):
    mcqs: List[dict]
    user_answers: Dict[int, str]

class HybridQueryRequest(BaseModel):
    query: str
    use_web_fallback: bool = True

# Global variables for lazy loading
_doc_processor = None
_vector_store = None
_retriever = None
_generator = None
_mcq_generator = None
_mcq_validator = None
_hybrid_assistant = None

def get_doc_processor():
    global _doc_processor
    if _doc_processor is None:
        _doc_processor = DocumentProcessor()
    return _doc_processor

def get_vector_store():
    global _vector_store
    if _vector_store is None:
        _vector_store = get_json_store()
    return _vector_store

def get_retriever_instance():
    global _retriever
    if _retriever is None:
        _retriever = get_retriever()
    return _retriever

def get_generator_instance():
    global _generator
    if _generator is None:
        _generator = get_generator()
    return _generator

def get_mcq_generator_instance():
    global _mcq_generator
    if _mcq_generator is None:
        _mcq_generator = get_mcq_generator()
    return _mcq_generator

def get_mcq_validator_instance():
    global _mcq_validator
    if _mcq_validator is None:
        _mcq_validator = MCQValidator()
    return _mcq_validator

def get_hybrid_assistant_instance():
    global _hybrid_assistant
    if _hybrid_assistant is None:
        _hybrid_assistant = get_hybrid_assistant()
    return _hybrid_assistant

@app.get("/")
def root():
    return {"message": "Cortexa RAG API", "status": "running"}

@app.get("/health")
def health_check():
    try:
        vector_store = get_vector_store()
        stats = vector_store.get_stats()
        return {"status": "healthy", "store": stats}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    institution_id: Optional[str] = None,
    course_id: Optional[str] = None
):
    try:
        doc_processor = get_doc_processor()
        vector_store = get_vector_store()
        
        file_path = DOCUMENTS_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        metadata = {
            'institution_id': institution_id,
            'course_id': course_id
        }
        
        chunks = doc_processor.process_document(str(file_path), metadata)
        
        texts = [chunk.text for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{file.filename}_{i}" for i in range(len(chunks))]
        
        vector_store.add_documents(texts, metadatas, ids)
        
        return DocumentUploadResponse(
            filename=file.filename,
            chunks_added=len(chunks),
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    try:
        retriever = get_retriever_instance()
        generator = get_generator_instance()
        
        filter_metadata = None
        if request.institution_id:
            filter_metadata = {'institution_id': request.institution_id}
        
        retrieved_docs = retriever.retrieve(
            query=request.query,
            top_k=request.top_k,
            filter_metadata=filter_metadata
        )
        
        context = retriever.format_context(retrieved_docs)
        answer = generator.generate_response(request.query, context)
        
        sources = [
            {
                'source': doc['source'],
                'chunk_index': doc['chunk_index'],
                'similarity': doc['similarity'],
                'text_preview': doc['text'][:200] + "..."
            }
            for doc in retrieved_docs
        ]
        
        return QueryResponse(
            query=request.query,
            answer=answer,
            sources=sources,
            context=context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/all")
def delete_all_documents():
    try:
        vector_store = get_vector_store()
        vector_store.delete_all()
        return {"status": "success", "message": "All documents deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/chunks")
def export_chunks():
    """Export chunks without embeddings"""
    try:
        vector_store = get_vector_store()
        vector_store.export_chunks_only()
        return {"status": "success", "message": "Chunks exported to chunks_only.json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# MCQ
@app.post("/mcq/generate")
async def generate_mcqs(request: MCQGenerateRequest):
    """Generate MCQs from text, document, or topic"""
    try:
        mcq_generator = get_mcq_generator_instance()
        mcq_validator = get_mcq_validator_instance()
        
        if request.source_type == "text":
            mcqs = mcq_generator.generate_from_text(
                text=request.source,
                num_questions=request.num_questions,
                difficulty=request.difficulty
            )
        elif request.source_type == "document":
            mcqs = mcq_generator.generate_from_document(
                document_name=request.source,
                num_questions=request.num_questions,
                difficulty=request.difficulty
            )
        elif request.source_type == "topic":
            mcqs = mcq_generator.generate_from_topic(
                topic=request.source,
                num_questions=request.num_questions,
                difficulty=request.difficulty
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid source_type")
        
        # Filter valid MCQs
        valid_mcqs = [mcq for mcq in mcqs if mcq_validator.validate_mcq(mcq)]
        
        return {
            "status": "success",
            "total_generated": len(mcqs),
            "valid_mcqs": len(valid_mcqs),
            "mcqs": valid_mcqs
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mcq/score")
async def score_mcqs(request: MCQScoreRequest):
    """Score user answers"""
    try:
        mcq_validator = get_mcq_validator_instance()
        result = mcq_validator.score_answers(
            mcqs=request.mcqs,
            user_answers=request.user_answers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assistant")
async def hybrid_query(request: HybridQueryRequest):
    """
    Hybrid AI Assistant - Searches documents first, then web if needed
    """
    try:
        print(f"📥 Received query: {request.query[:50]}...")
        print(f"🌐 Web fallback: {request.use_web_fallback}")
        
        hybrid_assistant = get_hybrid_assistant_instance()
        result = hybrid_assistant.answer(
            query=request.query,
            use_web=request.use_web_fallback
        )
        
        print(f"✅ Query successful! Method: {result.get('search_method', 'unknown')}")
        return result
    except Exception as e:
        print(f"❌ Query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Increase timeout for AI operations
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        timeout_keep_alive=300,  # 5 minutes keep-alive
        timeout_graceful_shutdown=30
    )