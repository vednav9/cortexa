"""
Handle audio file operations
"""
import os
from pathlib import Path
from typing import Optional
from pydub import AudioSegment
from config import AUDIO_DIR, MAX_AUDIO_SIZE_MB, SUPPORTED_AUDIO_FORMATS

class AudioHandler:
    """Handle audio file processing and validation"""
    
    @staticmethod
    def validate_audio(file_path: str) -> bool:
        """
        Validate audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            True if valid
        """
        path = Path(file_path)
        
        # Check if file exists
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > MAX_AUDIO_SIZE_MB:
            raise ValueError(f"Audio file too large: {size_mb:.2f}MB > {MAX_AUDIO_SIZE_MB}MB")
        
        # Check format
        if path.suffix.lower() not in SUPPORTED_AUDIO_FORMATS:
            raise ValueError(f"Unsupported format: {path.suffix}. Supported: {SUPPORTED_AUDIO_FORMATS}")
        
        return True
    
    @staticmethod
    def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> str:
        """
        Convert audio to WAV format (best for Whisper)
        
        Args:
            input_path: Path to input audio
            output_path: Optional output path
            
        Returns:
            Path to converted WAV file
        """
        input_path = Path(input_path)
        
        if output_path is None:
            output_path = AUDIO_DIR / f"{input_path.stem}.wav"
        
        print(f"🔄 Converting {input_path.name} to WAV...")
        
        # Load audio
        audio = AudioSegment.from_file(str(input_path))
        
        # Export as WAV
        audio.export(str(output_path), format="wav")
        
        print(f"✅ Converted to: {output_path}")
        return str(output_path)
    
    @staticmethod
    def get_audio_duration(file_path: str) -> float:
        """
        Get audio duration in seconds
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Duration in seconds
        """
        audio = AudioSegment.from_file(file_path)
        return len(audio) / 1000.0  # Convert ms to seconds
