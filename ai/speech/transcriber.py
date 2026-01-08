"""
Whisper-based transcription for lecture audio
"""
import whisper
import torch
from pathlib import Path
from typing import Dict, List, Optional
from config import WHISPER_MODEL, DEVICE, WHISPER_LANGUAGE

class LectureTranscriber:
    """Transcribe audio using OpenAI Whisper"""
    
    def __init__(self, model_name: str = WHISPER_MODEL):
        """
        Initialize Whisper model
        
        Args:
            model_name: Whisper model size (tiny, base, small, medium, large)
        """
        print(f"🎙️ Loading Whisper model '{model_name}'...")
        self.model = whisper.load_model(model_name, device=DEVICE)
        self.language = WHISPER_LANGUAGE
        print(f"✅ Whisper model loaded on {DEVICE}")
    
    def transcribe_audio(
        self,
        audio_path: str,
        language: Optional[str] = None,
        include_timestamps: bool = True
    ) -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Language code (default: 'en')
            include_timestamps: Include word-level timestamps
            
        Returns:
            Dict with transcription results
        """
        try:
            print(f"🎧 Transcribing: {Path(audio_path).name}")
            
            result = self.model.transcribe(
                audio_path,
                language=language or self.language,
                task="transcribe",
                verbose=False,
                word_timestamps=include_timestamps
            )
            
            print(f"✅ Transcription complete!")
            
            return {
                "text": result["text"].strip(),
                "segments": result.get("segments", []),
                "language": result.get("language", language or self.language),
                "duration": self._calculate_duration(result.get("segments", []))
            }
            
        except Exception as e:
            print(f"❌ Transcription failed: {str(e)}")
            raise
    
    def transcribe_with_timestamps(self, audio_path: str) -> List[Dict]:
        """
        Transcribe with detailed timestamps for each segment
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            List of segments with timestamps
        """
        result = self.transcribe_audio(audio_path, include_timestamps=True)
        
        segments = []
        for seg in result.get("segments", []):
            segments.append({
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
                "text": seg.get("text", "").strip()
            })
        
        return segments
    
    def _calculate_duration(self, segments: List[Dict]) -> float:
        """Calculate total audio duration from segments"""
        if not segments:
            return 0.0
        return segments[-1].get("end", 0)


# Global instance for lazy loading
_transcriber = None

def get_transcriber(model_name: str = WHISPER_MODEL) -> LectureTranscriber:
    """Get or create transcriber instance"""
    global _transcriber
    if _transcriber is None:
        _transcriber = LectureTranscriber(model_name)
    return _transcriber
