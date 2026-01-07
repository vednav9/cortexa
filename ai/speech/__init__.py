"""
Speech-to-Text module for lecture transcription
"""
from .transcriber import LectureTranscriber, get_transcriber
from .formatter import TextFormatter
from .audio_handler import AudioHandler

__all__ = [
    'LectureTranscriber',
    'get_transcriber',
    'TextFormatter',
    'AudioHandler'
]
