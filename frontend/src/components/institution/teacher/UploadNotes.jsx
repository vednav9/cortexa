// UploadNotes.jsx - Teacher document upload with drag-and-drop
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import toast from "react-hot-toast";
import api from "../../../services/api";
import {
    FiUpload,
    FiFile,
    FiX,
    FiDownload,
    FiTrash2,
    FiCheckCircle,
    FiAlertCircle
} from "react-icons/fi";

export default function UploadNotes() {
    const { user } = useAuth();
    const { currentInstitution } = useOutletContext();
    const [courses, setCourses] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Form state
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");

    // Fetch courses
    useEffect(() => {
        if (currentInstitution?._id) {
            fetchCourses();
        }
    }, [currentInstitution]);

    // Fetch documents when course is selected
    useEffect(() => {
        if (selectedCourse && currentInstitution?._id) {
            fetchDocuments();
        }
    }, [selectedCourse, currentInstitution]);

    const fetchCourses = async () => {
        try {
            const response = await api.get(
                `/academic/courses?institutionId=${currentInstitution._id}`
            );
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error("Fetch courses error:", error);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `/teacher-mcq/notes/${selectedCourse}?institutionId=${currentInstitution._id}`
            );
            setDocuments(response.data.documents || []);
        } catch (error) {
            console.error("Fetch documents error:", error);
        } finally {
            setLoading(false);
        }
    };

    // File validation
    const validateFile = (file) => {
        const validTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ];

        if (!validTypes.includes(file.type)) {
            toast.error("Only PDF, Word, TXT, and PPT files are allowed");
            return false;
        }

        // 50MB limit
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File size must be less than 50MB");
            return false;
        }

        return true;
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            if (!fileName) {
                setFileName(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    // Drag and drop handlers
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            if (!fileName) {
                setFileName(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    }, [fileName]);

    // Upload document
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file");
            return;
        }

        if (!fileName.trim()) {
            toast.error("Please enter a file name");
            return;
        }

        if (!selectedCourse) {
            toast.error("Please select a course");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("fileName", fileName.trim());
            formData.append("courseId", selectedCourse);
            formData.append("institutionId", currentInstitution._id);

            await api.post("/teacher-mcq/notes/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success("Document uploaded successfully! Processing in background...");
            
            // Reset form
            setSelectedFile(null);
            setFileName("");
            
            // Refresh documents list
            fetchDocuments();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.response?.data?.error || "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    // Delete document
    const handleDelete = async (documentId) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            await api.delete(`/teacher-mcq/notes/${documentId}`);
            toast.success("Document deleted successfully");
            fetchDocuments();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete document");
        }
    };

    // Get file icon
    const getFileIcon = (fileType) => {
        return <FiFile className="w-6 h-6" />;
    };

    // Get file size in readable format
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        <FiUpload className="text-purple-600" />
                        Upload Notes
                    </h1>
                    <p className="text-gray-600">
                        Share study materials with your students
                    </p>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl p-8 mb-8"
                >
                    {/* Course Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Course *
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                     focus:border-purple-500 focus:ring focus:ring-purple-200 
                                     transition-all"
                        >
                            <option value="">Choose a course...</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.name} ({course.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Drag and Drop Area */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative border-4 border-dashed rounded-2xl p-12 
                            transition-all duration-300 text-center
                            ${isDragging 
                                ? "border-purple-500 bg-purple-50" 
                                : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                            }
                        `}
                    >
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                            className="hidden"
                            id="file-upload"
                        />

                        {!selectedFile ? (
                            <>
                                <FiUpload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Drag and drop your file here
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    or browse to choose a file
                                </p>
                                <label htmlFor="file-upload">
                                    <span className="inline-block px-6 py-3 bg-gradient-to-r 
                                                   from-purple-600 to-blue-600 text-white rounded-xl 
                                                   font-semibold cursor-pointer hover:shadow-lg 
                                                   transform hover:scale-105 transition-all">
                                        Browse Files
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-4">
                                    Supported: PDF, Word, TXT, PPT (Max 50MB)
                                </p>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center justify-between bg-purple-50 
                                         rounded-xl p-4"
                            >
                                <div className="flex items-center gap-4">
                                    {getFileIcon(selectedFile.type)}
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5 text-red-600" />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* File Name Input */}
                    {selectedFile && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Display Name *
                            </label>
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="Enter a name for this document..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                         focus:border-purple-500 focus:ring focus:ring-purple-200 
                                         transition-all"
                            />
                        </motion.div>
                    )}

                    {/* Upload Button */}
                    {selectedFile && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleUpload}
                            disabled={uploading || !selectedCourse}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                w-full mt-6 py-4 rounded-xl font-bold text-white 
                                transition-all shadow-lg
                                ${uploading || !selectedCourse
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl"
                                }
                            `}
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent 
                                                  rounded-full animate-spin" />
                                    Uploading & Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FiUpload className="w-5 h-5" />
                                    Upload Document
                                </span>
                            )}
                        </motion.button>
                    )}
                </motion.div>

                {/* Documents List */}
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Uploaded Documents
                        </h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent 
                                              rounded-full animate-spin mx-auto" />
                                <p className="text-gray-600 mt-4">Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FiFile className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {documents.map((doc) => (
                                    <motion.div
                                        key={doc._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-4 rounded-xl 
                                                 border-2 border-gray-200 hover:border-purple-300 
                                                 transition-all group"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            {getFileIcon(doc.fileType)}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 
                                                             transition-colors">
                                                    {doc.fileName}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                    <span>{formatFileSize(doc.fileSize)}</span>
                                                    <span>•</span>
                                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    {doc.isProcessed ? (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <FiCheckCircle className="w-4 h-4" />
                                                            Processed
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-yellow-600">
                                                            <FiAlertCircle className="w-4 h-4" />
                                                            Processing...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <FiDownload className="w-5 h-5 text-blue-600" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc._id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FiTrash2 className="w-5 h-5 text-red-600" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
