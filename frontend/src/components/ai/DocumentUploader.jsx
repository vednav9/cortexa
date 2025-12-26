import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFile, FiCheck, FiX } from 'react-icons/fi';
import aiService from '../../services/aiService';

export default function DocumentUploader({ institutionId = null, courseId = null, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const fileInputRef = React.useRef(null); // Add ref to access file input directly

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      isFile: selectedFile instanceof File,
      constructor: selectedFile.constructor.name
    });
    
    // Check file type - Allow PDF for sure, relaxed validation
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.txt') && !fileName.endsWith('.docx')) {
      setProgress({ status: 'error', message: 'Only PDF, TXT, and DOCX files are allowed' });
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setProgress({ status: 'error', message: 'File size must be less than 10MB' });
      return;
    }

    // Verify it's a proper File object
    if (!(selectedFile instanceof File)) {
      console.error('Not a File instance:', selectedFile);
      setProgress({ status: 'error', message: 'Invalid file object selected' });
      return;
    }

    setFile(selectedFile);
    setProgress(null); // Clear any previous error messages
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file to upload');
      return;
    }

    // CRITICAL: Get file directly from input as backup
    const inputFile = fileInputRef.current?.files?.[0];
    const fileToUpload = inputFile || file;

    console.log('=== UPLOAD DEBUG ===');
    console.log('State file:', file);
    console.log('Input file:', inputFile);
    console.log('Will upload:', fileToUpload);
    console.log('Upload attempt:', {
      stateFile: file ? {
        name: file.name,
        type: file.type,
        size: file.size,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
        constructor: file.constructor.name,
        proto: Object.getPrototypeOf(file).constructor.name
      } : null,
      inputFile: inputFile ? {
        name: inputFile.name,
        type: inputFile.type,
        size: inputFile.size,
        isFile: inputFile instanceof File,
        isBlob: inputFile instanceof Blob,
        constructor: inputFile.constructor.name,
        proto: Object.getPrototypeOf(inputFile).constructor.name
      } : null,
      usingInputFile: !!inputFile
    });
    console.log('===================');

    // Validate file is a proper File/Blob object
    if (!(fileToUpload instanceof File) && !(fileToUpload instanceof Blob)) {
      console.error('❌ FAILED: File validation failed');
      console.error('File object:', fileToUpload);
      console.error('typeof:', typeof fileToUpload);
      console.error('constructor:', fileToUpload?.constructor?.name);
      setProgress({ status: 'error', message: 'Invalid file object. Please refresh the page and try again.' });
      return;
    }

    console.log('✓ File validation passed, starting upload...');

    setUploading(true);
    setProgress({ status: 'uploading', message: 'Uploading document...' });

    try {
      const response = await aiService.uploadDocument(fileToUpload, institutionId, courseId);
      
      setProgress({ 
        status: 'success', 
        message: `Successfully uploaded! ${response.chunks_added} chunks created.` 
      });

      setTimeout(() => {
        setFile(null);
        setProgress(null);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadComplete) onUploadComplete(response);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setProgress({ status: 'error', message: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(null);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Document</h3>

      {!file && (
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
            <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-400">PDF, TXT, or DOCX (Max 10MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx"
            className="hidden"
          />
        </label>
      )}

      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FiFile className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={handleRemove}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {progress && (
            <div className={`p-4 rounded-lg ${
              progress.status === 'success' ? 'bg-green-50 text-green-700' :
              progress.status === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <div className="flex items-center space-x-2">
                {progress.status === 'success' && <FiCheck className="w-5 h-5" />}
                {progress.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="font-medium">{progress.message}</span>
              </div>
            </div>
          )}

          {!uploading && !progress && (
            <button
              onClick={handleUpload}
              className="w-full px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all"
            >
              Upload Document
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
