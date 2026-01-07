"""
Format transcribed text into structured documents
"""
from typing import Dict, List
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from pathlib import Path
from models.llm import get_llm
from config import TRANSCRIPTS_DIR

class TextFormatter:
    """Format transcribed text into structured documents"""
    
    def __init__(self):
        """Initialize formatter with LLM for structure detection"""
        self.llm = get_llm()
    
    def format_as_structured_text(self, text: str, segments: List[Dict] = None) -> str:
        """
        Format text with basic structure using LLM
        
        Args:
            text: Transcribed text
            segments: Optional timestamp segments
            
        Returns:
            Formatted text with headings
        """
        prompt = f"""Format the following lecture transcript into a well-structured document with headings and subheadings.

Rules:
1. Add main headings (##) for major topics
2. Add subheadings (###) for subtopics
3. Keep the original text content intact
4. Organize into logical paragraphs
5. Do not add any extra content

Transcript:
{text}

Formatted Document:"""

        try:
            # Generate structured version
            formatted = self.llm.generate_response(prompt, max_tokens=2048)
            return formatted
        except Exception as e:
            print(f"⚠️ LLM formatting failed: {e}. Using basic formatting.")
            return self._basic_format(text)
    
    def _basic_format(self, text: str) -> str:
        """Basic formatting without LLM"""
        lines = text.split('. ')
        formatted = []
        
        for i, line in enumerate(lines):
            if i % 5 == 0 and i > 0:  # Add paragraph breaks
                formatted.append('\n')
            formatted.append(line.strip() + '.')
        
        return '\n'.join(formatted)
    
    def export_to_docx(
        self,
        text: str,
        filename: str,
        title: str = "Lecture Transcript",
        segments: List[Dict] = None
    ) -> str:
        """
        Export formatted text to DOCX document
        
        Args:
            text: Formatted text
            filename: Output filename
            title: Document title
            segments: Optional timestamp segments
            
        Returns:
            Path to saved document
        """
        doc = Document()
        
        # Add title
        title_para = doc.add_heading(title, level=0)
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Add content
        for line in text.split('\n'):
            if line.strip():
                if line.startswith('##'):
                    doc.add_heading(line.replace('##', '').strip(), level=1)
                elif line.startswith('###'):
                    doc.add_heading(line.replace('###', '').strip(), level=2)
                else:
                    doc.add_paragraph(line.strip())
        
        # Save document
        output_path = TRANSCRIPTS_DIR / f"{filename}.docx"
        doc.save(output_path)
        
        print(f"📄 Document saved: {output_path}")
        return str(output_path)
    
    def export_to_markdown(
        self,
        text: str,
        filename: str,
        title: str = "Lecture Transcript"
    ) -> str:
        """
        Export formatted text to Markdown
        
        Args:
            text: Formatted text
            filename: Output filename
            title: Document title
            
        Returns:
            Path to saved document
        """
        output_path = TRANSCRIPTS_DIR / f"{filename}.md"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(text)
        
        print(f"📝 Markdown saved: {output_path}")
        return str(output_path)
