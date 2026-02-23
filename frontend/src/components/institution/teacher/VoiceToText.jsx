import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../../config/api';
import {
  FiMic,
  FiStopCircle,
  FiDownload,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiLoader,
  FiEdit3,
  FiSave,
  FiX
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/authcontext';
import { useOutletContext } from 'react-router-dom';

const LectureRecorder = () => {
  const { user } = useAuth();
  const { institution } = useOutletContext();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [formattedText, setFormattedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Lecture metadata
  const [lectureTitle, setLectureTitle] = useState('');
  const [courseId, setCourseId] = useState('');

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started!');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      toast.success('Recording stopped!');
    }
  };

  // Upload and transcribe
  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast.error('No audio recording found');
      return;
    }

    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    setIsProcessing(true);

    try {
      // Create FormData
      const formData = new FormData();
      const audioFile = new File([audioBlob], `lecture_${Date.now()}.wav`, {
        type: 'audio/wav'
      });
      
      formData.append('audio_file', audioFile);
      formData.append('lecture_title', lectureTitle);
      formData.append('teacher_id', user.id);
      formData.append('institution_id', institution._id);
      if (courseId) formData.append('course_id', courseId);

      // Call through backend API
      const response = await fetch(`${API_BASE_URL}/ai/speech/transcribe-and-upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      setTranscription(result.transcription);
      setFormattedText(result.transcription.formatted_text);

      toast.success('Lecture transcribed successfully!');
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Failed to transcribe lecture');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save edited text
  const handleSaveEdits = () => {
    setIsEditing(false);
    toast.success('Edits saved!');
  };

  // Download formatted document
  const handleDownload = async () => {
    if (!transcription) return;

    try {
      const docxUrl = transcription.downloads?.docx;
      if (docxUrl) {
        window.open(`${API_BASE_URL}/ai/speech/download/${docxUrl.split('/').pop()}`, '_blank');
        toast.success('Downloading document...');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  // Reset all
  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription(null);
    setFormattedText('');
    setRecordingTime(0);
    setLectureTitle('');
    setCourseId('');
    setIsEditing(false);
    audioChunksRef.current = [];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <HiSparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Lecture Recorder</h1>
              <p className="text-purple-100 mt-1">
                Record your lecture and get AI-powered transcription
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lecture Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Lecture Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="Introduction to Machine Learning"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isRecording || isProcessing}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course ID (Optional)
            </label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="CS-101"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isRecording || isProcessing}
            />
          </div>
        </div>
      </motion.div>

      {/* Recording Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 shadow-lg p-8"
      >
        <div className="flex flex-col items-center">
          {/* Recording Time */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-6"
              >
                <div className="flex items-center gap-3 bg-red-100 border-2 border-red-300 rounded-full px-6 py-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-4 h-4 bg-red-500 rounded-full"
                  />
                  <span className="text-2xl font-bold text-red-600 font-mono">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Record Button */}
          {!isRecording && !audioBlob && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={!lectureTitle.trim()}
              className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMic className="w-16 h-16 text-white" />
            </motion.button>
          )}

          {/* Stop Button */}
          {isRecording && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-red-500/50 transition-all"
            >
              <FiStopCircle className="w-16 h-16 text-white" />
            </motion.button>
          )}

          {/* Status Text */}
          <p className="mt-6 text-gray-600 text-center">
            {!isRecording && !audioBlob && 'Click the microphone to start recording'}
            {isRecording && 'Recording in progress...'}
            {!isRecording && audioBlob && 'Recording completed'}
          </p>
        </div>

        {/* Audio Preview */}
        <AnimatePresence>
          {audioUrl && !transcription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-4"
            >
              <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FiClock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Audio Preview</h4>
                    <p className="text-sm text-gray-600">Duration: {formatTime(recordingTime)}</p>
                  </div>
                </div>
                
                <audio controls className="w-full mb-4" src={audioUrl} />
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTranscribe}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <HiSparkles className="w-5 h-5" />
                        Transcribe & Format
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transcription Result */}
      <AnimatePresence>
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900">Transcription Complete!</h3>
                  <p className="text-green-700 mt-1">
                    Duration: {transcription.duration_seconds}s | 
                    Words: {transcription.word_count} | 
                    Added {transcription.rag_system?.chunks_added || 0} chunks to knowledge base
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all"
                  >
                    <FiDownload className="w-5 h-5" />
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all"
                  >
                    <FiX className="w-5 h-5" />
                    New Recording
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Formatted Text */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <FiFileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-900">Formatted Transcript</h3>
                      <p className="text-sm text-purple-600">AI-structured with headings and paragraphs</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all"
                  >
                    {isEditing ? (
                      <>
                        <FiSave className="w-4 h-4" />
                        Save
                      </>
                    ) : (
                      <>
                        <FiEdit3 className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="p-8">
                {isEditing ? (
                  <textarea
                    value={formattedText}
                    onChange={(e) => setFormattedText(e.target.value)}
                    className="w-full min-h-[500px] px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                      {formattedText}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LectureRecorder;
