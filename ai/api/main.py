"""
FastAPI server for RAG system
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil

from config import DOCUMENTS_DIR
from vectordb.document_processor import DocumentProcessor
from vectordb.json_store import get_json_store  # Changed from chroma_store
from rag.retriever import get_retriever
from rag.generator import get_generator

app = FastAPI(title="Cortexa RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

doc_processor = DocumentProcessor()
vector_store = get_json_store()
retriever = get_retriever()
generator = get_generator()

@app.get("/")
def root():
    return {"message": "Cortexa RAG API", "status": "running"}

@app.get("/health")
def health_check():
    stats = vector_store.get_stats()
    return {"status": "healthy", "store": stats}

@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    institution_id: Optional[str] = None,
    course_id: Optional[str] = None
):
    try:
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
        vector_store.delete_all()
        return {"status": "success", "message": "All documents deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/chunks")
def export_chunks():
    """Export chunks without embeddings"""
    try:
        vector_store.export_chunks_only()
        return {"status": "success", "message": "Chunks exported to chunks_only.json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
