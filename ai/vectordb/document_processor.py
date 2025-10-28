"""
Document processing and chunking
"""
import os
from pathlib import Path
from typing import List, Dict
import PyPDF2
import pdfplumber
from docx import Document
from config import CHUNK_SIZE, CHUNK_OVERLAP

class DocumentChunk:
    def __init__(
        self,
        text: str,
        metadata: Dict,
        chunk_id: int
    ):
        self.text = text
        self.metadata = metadata
        self.chunk_id = chunk_id

class DocumentProcessor:
    def __init__(self):
        self.supported_formats = ['.pdf', '.txt', '.docx']
    
    def load_document(self, file_path: str) -> str:
        """Load document content based on file type"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = path.suffix.lower()
        
        if ext == '.pdf':
            return self._load_pdf(file_path)
        elif ext == '.txt':
            return self._load_txt(file_path)
        elif ext == '.docx':
            return self._load_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    
    def _load_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        try:
            # Try pdfplumber first (better for tables)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except:
            # Fallback to PyPDF2
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        
        return text.strip()
    
    def _load_txt(self, file_path: str) -> str:
        """Load text file"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _load_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    
    def chunk_text(
        self,
        text: str,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP
    ) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Input text
            chunk_size: Maximum chunk size in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        # Split by sentences first (simple approach)
        sentences = text.replace('\n', ' ').split('. ')
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip() + ". "
            
            # If adding this sentence exceeds chunk size
            if len(current_chunk) + len(sentence) > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap
                    words = current_chunk.split()
                    overlap_words = words[-overlap:] if len(words) > overlap else words
                    current_chunk = " ".join(overlap_words) + " " + sentence
                else:
                    # Sentence itself is longer than chunk_size
                    chunks.append(sentence[:chunk_size])
                    current_chunk = sentence[chunk_size:]
            else:
                current_chunk += sentence
        
        # Add last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def process_document(
        self,
        file_path: str,
        metadata: Dict = None
    ) -> List[DocumentChunk]:
        """
        Process document into chunks with metadata
        
        Args:
            file_path: Path to document
            metadata: Additional metadata
            
        Returns:
            List of DocumentChunk objects
        """
        # Load document
        text = self.load_document(file_path)
        
        # Create metadata
        file_metadata = {
            'source': str(Path(file_path).name),
            'file_path': str(file_path),
            'file_type': Path(file_path).suffix,
            'total_chars': len(text)
        }
        
        if metadata:
            file_metadata.update(metadata)
        
        # Chunk text
        chunks = self.chunk_text(text)
        
        # Create DocumentChunk objects
        doc_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = file_metadata.copy()
            chunk_metadata['chunk_index'] = i
            chunk_metadata['total_chunks'] = len(chunks)
            
            doc_chunks.append(
                DocumentChunk(
                    text=chunk,
                    metadata=chunk_metadata,
                    chunk_id=i
                )
            )
        
        return doc_chunks
