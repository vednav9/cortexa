import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
    : '16, 185, 129';
};

const LectureRecorder = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext();
  const activeInstitution = outletContext?.currentInstitution || outletContext?.institution;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
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

  const brandColor = activeInstitution?.branding?.primaryColor || '#10b981';
  const rgb = hexToRgb(brandColor);

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
      if (activeInstitution?._id) formData.append('institution_id', activeInstitution._id);
      if (courseId) formData.append('course_id', courseId);

      // Call AI API
      const response = await fetch('http://localhost:8000/speech/transcribe-and-upload', {
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

  // Download formatted document
  const handleDownload = async () => {
    if (!transcription) return;

    try {
      const docxUrl = transcription.downloads?.docx;
      if (docxUrl) {
        window.open(`http://localhost:8000${docxUrl}`, '_blank');
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
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.02)` }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm"
              style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
            >
              <FiMic className="text-2xl" style={{ color: brandColor }} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Voice To Text Leture
              </h1>
              <p className="text-gray-500 mt-1 font-medium">
                Record your lecture and generate AI-powered transcriptions
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lecture Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6"
          >
            <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider mb-5">
              Lecture Details
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Lecture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="e.g. Introduction to Machine Learning"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                  style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                  disabled={isRecording || isProcessing}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="e.g. CS-101"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                  style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
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
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Recording Time overlay */}
            <div className="absolute top-4 right-4 z-10">
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 shadow-sm">
                      <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2.5 h-2.5 bg-red-500 rounded-full"
                      />
                      <span className="text-[13px] font-bold text-red-600 font-mono tracking-wider">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center justify-center h-full w-full py-6">
              {/* Record Button */}
              {!isRecording && !audioBlob && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  disabled={!lectureTitle.trim()}
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: lectureTitle.trim() ? `0 10px 30px -5px rgba(${rgb}, 0.5)` : undefined
                  }}
                >
                  <div className="absolute inset-0 rounded-full scale-110 opacity-20 group-hover:animate-ping" style={{ backgroundColor: brandColor }} />
                  <FiMic className="w-10 h-10 text-white relative z-10" />
                </motion.button>
              )}

              {/* Stop Button */}
              {isRecording && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(239,68,68,0.5)] transition-all relative"
                >
                  <div className="absolute inset-0 rounded-full scale-125 opacity-20 animate-ping bg-red-500" />
                  <div className="w-8 h-8 rounded-sm bg-white relative z-10" />
                </motion.button>
              )}

              {/* Complete Icon */}
              {!isRecording && audioBlob && (
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200 mb-2">
                  <FiCheckCircle className="w-10 h-10 text-green-500" />
                </div>
              )}

              {/* Status Text */}
              <p className="mt-6 text-sm font-bold text-gray-500 text-center uppercase tracking-wider">
                {!isRecording && !audioBlob && 'Click to Start Recording'}
                {isRecording && 'Recording in progress...'}
                {!isRecording && audioBlob && 'Recording completed'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Audio Preview */}
        <AnimatePresence>
          {audioUrl && !transcription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
                    <FiClock className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 border-b border-transparent">Audio Preview</h4>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Duration: {formatTime(recordingTime)}</p>
                  </div>
                </div>
              </div>

              <audio controls className="w-full mb-6 outline-none" src={audioUrl} />

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTranscribe}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px 0 rgba(${rgb}, 0.39)` }}
                >
                  {isProcessing ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      Processing Audio...
                    </>
                  ) : (
                    <>
                      <HiSparkles className="w-5 h-5" />
                      Transcribe & Process AI
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="px-6 py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Discard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white rounded-2xl border border-green-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiCheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Transcription Complete</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                        <span>{transcription.duration_seconds}s</span>
                        <span>•</span>
                        <span>{transcription.word_count} Words</span>
                        <span>•</span>
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">+{transcription.rag_system?.chunks_added || 0} Knowledge Chunks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownload}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-md transition-all text-sm hover:-translate-y-0.5"
                    >
                      <FiDownload className="w-4 h-4" />
                      Download DOCX
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                    >
                      <FiX className="w-4 h-4" />
                      New Record
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Formatted Text */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 p-5 px-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border shadow-sm" style={{ borderColor: `rgba(${rgb},0.2)` }}>
                        <FiFileText className="w-5 h-5" style={{ color: brandColor }} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900">AI Transcript</h3>
                        <p className="text-[12px] font-semibold text-gray-400 mt-0.5">Formatted text output</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all text-sm w-full sm:w-auto"
                    >
                      {isEditing ? (
                        <>
                          <FiSave className="w-4 h-4 text-green-600" />
                          Save Edits
                        </>
                      ) : (
                        <>
                          <FiEdit3 className="w-4 h-4 text-gray-500" />
                          Edit Transcript
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  {isEditing ? (
                    <textarea
                      value={formattedText}
                      onChange={(e) => setFormattedText(e.target.value)}
                      className="w-full min-h-[400px] px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white font-medium text-[14px] leading-relaxed transition-all resize-y"
                      style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                    />
                  ) : (
                    <div className="prose prose-lg max-w-none text-gray-800 bg-gray-50/30 p-6 rounded-xl border border-gray-100/50">
                      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-loose text-gray-700">
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
    </div>
  );
};

export default LectureRecorder;
