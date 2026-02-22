"""
FastAPI server for RAG system with Voice-to-Text
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import shutil
from pathlib import Path

from config import DOCUMENTS_DIR, AUDIO_DIR, TRANSCRIPTS_DIR
from vectordb.document_processor import DocumentProcessor
from vectordb.json_store import get_json_store
from rag.retriever import get_retriever
from rag.generator import get_generator
from mcq.generator import get_mcq_generator
from mcq.validator import MCQValidator
from hybrid.assistant import get_hybrid_assistant

# NEW: Import speech modules
from speech.transcriber import get_transcriber
from speech.formatter import TextFormatter
from speech.audio_handler import AudioHandler


app = FastAPI(title="Cortexa RAG API", version="2.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.on_event("startup")
# async def startup_event():
#     """Pre-load models on startup"""
#     print("="*60)
#     print("🚀 Starting Cortexa AI Server...")
#     print("="*60)
#     print("📦 Loading AI models (this may take 30-60 seconds)...")
#     print("✅ Models loaded successfully!")
#     print("🌐 Server ready at http://localhost:8000")
#     print("📚 API docs at http://localhost:8000/docs")
#     print("="*60)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

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


# NEW: Speech-to-Text Models
class TranscribeRequest(BaseModel):
    audio_filename: str
    include_timestamps: bool = True
    format_text: bool = True
    export_format: str = "both"  # "markdown", "docx", "both"


class TranscribeResponse(BaseModel):
    status: str
    text: str
    duration: float
    formatted_text: Optional[str] = None
    download_links: Dict[str, str] = {}
    segments: Optional[List[Dict]] = None


# ============================================================================
# GLOBAL LAZY LOADING INSTANCES
# ============================================================================

# Existing instances
_doc_processor = None
_vector_store = None
_retriever = None
_generator = None
_mcq_generator = None
_mcq_validator = None
_hybrid_assistant = None

# NEW: Speech module instances
_transcriber = None
_audio_handler = None
_text_formatter = None


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


# NEW: Speech module getters
def get_transcriber_instance():
    global _transcriber
    if _transcriber is None:
        _transcriber = get_transcriber()
    return _transcriber


def get_audio_handler():
    global _audio_handler
    if _audio_handler is None:
        _audio_handler = AudioHandler()
    return _audio_handler


def get_text_formatter():
    global _text_formatter
    if _text_formatter is None:
        _text_formatter = TextFormatter()
    return _text_formatter


# ============================================================================
# BASIC ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {
        "message": "Cortexa RAG API with Voice-to-Text", 
        "status": "running",
        "version": "2.0.0",
        "features": [
            "Document RAG",
            "MCQ Generation",
            "Hybrid Assistant",
            "Voice-to-Text Transcription"
        ]
    }


@app.get("/health")
def health_check():
    try:
        vector_store = get_vector_store()
        stats = vector_store.get_stats()
        return {"status": "healthy", "store": stats}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# ============================================================================
# DOCUMENT UPLOAD & QUERY ENDPOINTS
# ============================================================================

@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    institution_id: Optional[str] = None,
    course_id: Optional[str] = None
):
    """Upload and process document for RAG system"""
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
    """Query RAG system with semantic search"""
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
    """Delete all documents from vector store"""
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


# ============================================================================
# MCQ GENERATION ENDPOINTS
# ============================================================================

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


# ============================================================================
# HYBRID ASSISTANT ENDPOINT
# ============================================================================

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


# ============================================================================
# VOICE-TO-TEXT ENDPOINTS (NEW)
# ============================================================================

@app.post("/speech/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    teacher_id: Optional[str] = Form(None),
    lecture_title: Optional[str] = Form(None)
):
    """
    Upload audio file for transcription
    
    Supported formats: .wav, .mp3, .m4a, .ogg, .flac
    Max size: 100MB (configurable in config.py)
    """
    try:
        audio_handler = get_audio_handler()
        
        # Save uploaded file
        file_path = AUDIO_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Validate audio
        audio_handler.validate_audio(str(file_path))
        duration = audio_handler.get_audio_duration(str(file_path))
        
        return {
            "status": "success",
            "filename": file.filename,
            "path": str(file_path),
            "duration_seconds": round(duration, 2),
            "size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
            "teacher_id": teacher_id,
            "lecture_title": lecture_title,
            "message": "Audio uploaded successfully. Use /speech/transcribe to convert to text."
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/speech/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcribe uploaded audio to text
    
    Features:
    - Converts speech to English text using Whisper
    - Optional formatting with headings/structure using LLM
    - Export to Markdown and/or DOCX format
    - Returns timestamps for each segment
    """
    try:
        audio_path = AUDIO_DIR / request.audio_filename
        
        if not audio_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Audio file not found: {request.audio_filename}"
            )
        
        # Step 1: Transcribe audio
        print(f"🎙️ Starting transcription: {request.audio_filename}")
        transcriber = get_transcriber_instance()
        result = transcriber.transcribe_audio(
            str(audio_path),
            include_timestamps=request.include_timestamps
        )
        
        raw_text = result["text"]
        segments = result.get("segments", [])
        duration = result.get("duration", 0)
        
        # Step 2: Format text if requested
        formatted_text = None
        download_links = {}
        
        if request.format_text:
            print("📝 Formatting text with structure...")
            formatter = get_text_formatter()
            formatted_text = formatter.format_as_structured_text(raw_text, segments)
            
            # Export to requested formats
            base_filename = Path(request.audio_filename).stem
            
            if request.export_format in ["markdown", "both"]:
                md_path = formatter.export_to_markdown(
                    formatted_text,
                    base_filename,
                    title=f"Lecture: {base_filename}"
                )
                download_links["markdown"] = f"/speech/download/{Path(md_path).name}"
            
            if request.export_format in ["docx", "both"]:
                docx_path = formatter.export_to_docx(
                    formatted_text,
                    base_filename,
                    title=f"Lecture: {base_filename}",
                    segments=segments
                )
                download_links["docx"] = f"/speech/download/{Path(docx_path).name}"
        
        return TranscribeResponse(
            status="success",
            text=raw_text,
            duration=round(duration, 2),
            formatted_text=formatted_text,
            download_links=download_links,
            segments=segments if request.include_timestamps else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/speech/transcribe-and-upload")
async def transcribe_and_upload_to_rag(
    audio_file: UploadFile = File(...),
    institution_id: Optional[str] = Form(None),
    course_id: Optional[str] = Form(None),
    lecture_title: Optional[str] = Form("Untitled Lecture"),
    teacher_id: Optional[str] = Form(None)
):
    """
    Complete workflow for teachers: Upload audio → Transcribe → Format → Add to RAG
    
    This is the main endpoint for lecture recording feature:
    1. Uploads audio file
    2. Transcribes to English text using Whisper
    3. Formats with headings/structure using LLM
    4. Exports to DOCX document
    5. Adds transcript to RAG system for student queries
    6. Returns formatted text for immediate display
    """
    try:
        # Step 1: Save audio
        print(f"📤 Uploading audio: {audio_file.filename}")
        audio_path = AUDIO_DIR / audio_file.filename
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        
        # Step 2: Validate audio
        audio_handler = get_audio_handler()
        audio_handler.validate_audio(str(audio_path))
        
        # Step 3: Transcribe
        print(f"🎙️ Transcribing: {audio_file.filename}")
        transcriber = get_transcriber_instance()
        result = transcriber.transcribe_audio(str(audio_path))
        raw_text = result["text"]
        duration = result.get("duration", 0)
        segments = result.get("segments", [])
        
        print(f"✅ Transcription complete! Duration: {duration:.2f}s")
        
        # Step 4: Format with structure
        print("📝 Formatting transcript with headings...")
        formatter = get_text_formatter()
        formatted_text = formatter.format_as_structured_text(raw_text, segments)
        
        # Step 5: Export to DOCX
        base_filename = Path(audio_file.filename).stem
        docx_path = formatter.export_to_docx(
            formatted_text,
            base_filename,
            title=lecture_title,
            segments=segments
        )
        
        # Step 6: Add transcript to RAG system
        print("🔄 Adding transcript to RAG knowledge base...")
        doc_processor = get_doc_processor()
        vector_store = get_vector_store()
        
        metadata = {
            'institution_id': institution_id,
            'course_id': course_id,
            'lecture_title': lecture_title,
            'teacher_id': teacher_id,
            'content_type': 'lecture_transcript',
            'audio_filename': audio_file.filename,
            'duration': duration
        }
        
        chunks = doc_processor.process_document(docx_path, metadata)
        texts = [chunk.text for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{base_filename}_transcript_{i}" for i in range(len(chunks))]
        
        vector_store.add_documents(texts, metadatas, ids)
        
        print(f"✅ Complete! Added {len(chunks)} chunks to knowledge base.")
        
        return {
            "status": "success",
            "message": "Lecture transcribed, formatted, and added to knowledge base",
            "transcription": {
                "raw_text": raw_text,
                "formatted_text": formatted_text,
                "duration_seconds": round(duration, 2),
                "word_count": len(raw_text.split()),
                "segments_count": len(segments)
            },
            "rag_system": {
                "chunks_added": len(chunks),
                "document_name": Path(docx_path).name,
                "document_path": str(docx_path)
            },
            "metadata": {
                "institution_id": institution_id,
                "course_id": course_id,
                "lecture_title": lecture_title,
                "teacher_id": teacher_id
            },
            "downloads": {
                "docx": f"/speech/download/{Path(docx_path).name}"
            }
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"❌ Error in transcribe-and-upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/speech/download/{filename}")
async def download_transcript(filename: str):
    """
    Download formatted transcript (Markdown or DOCX)
    """
    file_path = TRANSCRIPTS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    
    # Determine media type
    if filename.endswith('.docx'):
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    elif filename.endswith('.md'):
        media_type = 'text/markdown'
    else:
        media_type = 'application/octet-stream'
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )


@app.get("/speech/transcripts")
def list_transcripts():
    """List all available transcripts"""
    transcripts = []
    
    for file_path in TRANSCRIPTS_DIR.glob("*"):
        if file_path.is_file():
            transcripts.append({
                "filename": file_path.name,
                "size_kb": round(file_path.stat().st_size / 1024, 2),
                "format": file_path.suffix,
                "created": file_path.stat().st_ctime
            })
    
    # Sort by creation time (newest first)
    transcripts.sort(key=lambda x: x['created'], reverse=True)
    
    return {
        "status": "success",
        "transcripts": transcripts,
        "total": len(transcripts)
    }


@app.get("/speech/audio-files")
def list_audio_files():
    """List all uploaded audio files"""
    audio_files = []
    
    for file_path in AUDIO_DIR.glob("*"):
        if file_path.is_file():
            audio_files.append({
                "filename": file_path.name,
                "size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
                "format": file_path.suffix,
                "created": file_path.stat().st_ctime
            })
    
    # Sort by creation time (newest first)
    audio_files.sort(key=lambda x: x['created'], reverse=True)
    
    return {
        "status": "success",
        "audio_files": audio_files,
        "total": len(audio_files)
    }


@app.delete("/speech/audio/{filename}")
def delete_audio(filename: str):
    """Delete audio file"""
    try:
        audio_path = AUDIO_DIR / filename
        if audio_path.exists():
            audio_path.unlink()
            return {
                "status": "success",
                "message": f"Deleted audio file: {filename}"
            }
        else:
            raise HTTPException(status_code=404, detail="Audio file not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/speech/transcript/{filename}")
def delete_transcript(filename: str):
    """Delete transcript file"""
    try:
        transcript_path = TRANSCRIPTS_DIR / filename
        if transcript_path.exists():
            transcript_path.unlink()
            return {
                "status": "success",
                "message": f"Deleted transcript: {filename}"
            }
        else:
            raise HTTPException(status_code=404, detail="Transcript not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SERVER STARTUP
# ============================================================================

# if __name__ == "__main__":
#     import uvicorn
#     print("\n" + "="*60)
#     print("🚀 Starting Cortexa AI Server with Voice-to-Text")
#     print("="*60)
    
#     uvicorn.run(
#         app, 
#         host="0.0.0.0", 
#         port=8000,
#         timeout_keep_alive=300,  # 5 minutes for long audio processing
#         timeout_graceful_shutdown=30
#     )
