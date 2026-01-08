"""
Handle audio file operations
"""
import os
from pathlib import Path
from typing import Optional
import subprocess
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
    def get_audio_duration(file_path: str) -> float:
        """
        Get audio duration in seconds using ffprobe (part of ffmpeg)
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Duration in seconds
        """
        try:
            # Use ffprobe to get duration
            result = subprocess.run(
                [
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    file_path
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                duration = float(result.stdout.strip())
                return duration
            else:
                # Fallback: estimate based on file size (very rough estimate)
                print("⚠️ Could not get exact duration, using estimate")
                return 0.0
                
        except (subprocess.TimeoutExpired, FileNotFoundError, ValueError) as e:
            print(f"⚠️ Could not determine audio duration: {e}")
            # Return 0 if we can't determine duration
            return 0.0
    
    @staticmethod
    def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> str:
        """
        Convert audio to WAV format using ffmpeg (optional, Whisper handles most formats)
        
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
        
        try:
            # Use ffmpeg to convert
            subprocess.run(
                [
                    'ffmpeg',
                    '-i', str(input_path),
                    '-ar', '16000',  # 16kHz sample rate (good for speech)
                    '-ac', '1',  # Mono
                    '-y',  # Overwrite output
                    str(output_path)
                ],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300
            )
            
            print(f"✅ Converted to: {output_path}")
            return str(output_path)
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Conversion failed: {e}")
            raise ValueError(f"Could not convert audio file: {e}")
        except FileNotFoundError:
            raise ValueError("FFmpeg not found. Please install FFmpeg to convert audio files.")


# Simplified version that doesn't require ffmpeg for basic validation
class SimpleAudioHandler:
    """Simplified audio handler without external dependencies"""
    
    @staticmethod
    def validate_audio(file_path: str) -> bool:
        """Basic validation without ffmpeg"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > MAX_AUDIO_SIZE_MB:
            raise ValueError(f"Audio file too large: {size_mb:.2f}MB > {MAX_AUDIO_SIZE_MB}MB")
        
        if path.suffix.lower() not in SUPPORTED_AUDIO_FORMATS:
            raise ValueError(f"Unsupported format: {path.suffix}. Supported: {SUPPORTED_AUDIO_FORMATS}")
        
        return True
    
    @staticmethod
    def get_audio_duration(file_path: str) -> float:
        """Return 0.0 as we can't determine without external tools"""
        return 0.0
    
    @staticmethod
    def convert_to_wav(input_path: str, output_path: Optional[str] = None) -> str:
        """No conversion, just return input path (Whisper handles most formats)"""
        return str(input_path)
