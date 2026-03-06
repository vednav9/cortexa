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
    FiAlertCircle,
    FiBook
} from "react-icons/fi";

const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
        : '16, 185, 129';
};

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

    const brandColor = currentInstitution?.branding?.primaryColor || '#10b981';
    const rgb = hexToRgb(brandColor);

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
            const response = await api.get('/teacher/authorized-courses');
            setCourses(response.data.courses || []);

            if (!response.data.courses || response.data.courses.length === 0) {
                toast.error("No courses assigned yet. Please contact your admin.", {
                    duration: 5000
                });
            }
        } catch (error) {
            console.error("❌ Fetch courses error:", error);
            toast.error(error.response?.data?.message || "Failed to load courses");
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/notes/${selectedCourse}`);
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
            formData.append("title", fileName.trim());
            formData.append("courseId", selectedCourse);

            await api.post("/teacher/notes/upload", formData, {
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
            await api.delete(`/teacher/notes/${documentId}`);
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
        <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.02)` }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
                        >
                            <FiUpload className="text-2xl" style={{ color: brandColor }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                Upload Notes
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                Share study materials with your students
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8 mb-8"
                >
                    {/* Course Selection */}
                    <div className="mb-6 max-w-xl">
                        <label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">
                            Select Course <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                            style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                        >
                            <option value="">Choose a course...</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.code} - {course.name}
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
                            relative border-2 border-dashed rounded-2xl p-10 md:p-14 
                            transition-all duration-300 text-center cursor-pointer group
                        `}
                        style={{
                            borderColor: isDragging ? brandColor : 'rgba(0,0,0,0.1)',
                            backgroundColor: isDragging ? `rgba(${rgb},0.04)` : '#fafafa'
                        }}
                        onMouseEnter={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.borderColor = `rgba(${rgb},0.4)`;
                                e.currentTarget.style.backgroundColor = `rgba(${rgb},0.01)`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                                e.currentTarget.style.backgroundColor = '#fafafa';
                            }
                        }}
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
                                <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-1" style={{ backgroundColor: `rgba(${rgb},0.1)` }}>
                                    <FiUpload className="w-7 h-7" style={{ color: brandColor }} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">
                                    Drag and drop your file here
                                </h3>
                                <p className="text-gray-500 font-medium mb-6">
                                    or <label htmlFor="file-upload" className="cursor-pointer hover:underline" style={{ color: brandColor }}>browse to choose a file</label>
                                </p>

                                <label htmlFor="file-upload" className="inline-block px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all cursor-pointer hover:shadow-md border border-gray-100 bg-white text-gray-800 hover:text-gray-900">
                                    Browse Files
                                </label>
                                <p className="text-[12px] font-semibold text-gray-400 mt-5 uppercase tracking-wider">
                                    Supported formats: PDF, Word, TXT, PPT (Max 50MB)
                                </p>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center justify-between rounded-xl p-4 border text-left max-w-xl mx-auto bg-white shadow-sm"
                                style={{ borderColor: `rgba(${rgb},0.2)` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${rgb},0.1)` }}>
                                        {React.cloneElement(getFileIcon(selectedFile.type), { style: { color: brandColor } })}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="font-bold text-gray-900 truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-[12px] font-semibold text-gray-400 mt-0.5">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 border border-transparent hover:border-red-100"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 mt-8">
                        {/* File Name Input */}
                        {selectedFile && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1"
                            >
                                <label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-2">
                                    Display Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder="Enter a name for this document..."
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                                    style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                />
                            </motion.div>
                        )}

                        {/* Upload Button */}
                        {selectedFile && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-end"
                            >
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedCourse}
                                    className={`
                                        w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white 
                                        transition-all flex flex-col items-center justify-center
                                        ${uploading || !selectedCourse
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                            : "hover:-translate-y-0.5"
                                        }
                                    `}
                                    style={{
                                        backgroundColor: uploading || !selectedCourse ? undefined : brandColor,
                                        boxShadow: uploading || !selectedCourse ? undefined : `0 6px 20px -4px rgba(${rgb}, 0.5)`
                                    }}
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2 text-gray-600">
                                            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent 
                                                        rounded-full animate-spin" />
                                            Uploading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiUpload className="w-5 h-5" />
                                            Confirm Upload
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Documents List */}
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-black text-gray-900">
                                Uploaded Documents
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: `rgba(${rgb},0.1)`, color: brandColor }}>
                                {documents.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: `rgba(${rgb}, 0.2)`, borderTopColor: brandColor }} />
                                <p className="text-gray-500 font-medium mt-4">Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50">
                                <FiFile className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No documents uploaded for this course yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.map((doc, index) => (
                                    <motion.div
                                        key={doc._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl 
                                                 border border-gray-100 hover:shadow-md
                                                 transition-all group bg-white hover:border-transparent gap-4"
                                        style={{ hover: { borderColor: brandColor } }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = `rgba(${rgb},0.3)`}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgb(243 244 246)'}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
                                                {React.cloneElement(getFileIcon(doc.fileType), { style: { color: brandColor } })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[14px] font-bold text-gray-900 truncate group-hover:text-[var(--brandColor)] transition-colors" style={{ '--brandColor': brandColor }}>
                                                    {doc.fileName}
                                                </h3>
                                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold text-gray-400 mt-0.5">
                                                    <span>{formatFileSize(doc.fileSize)}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    {doc.isProcessed ? (
                                                        <span className="flex items-center gap-1" style={{ color: brandColor }}>
                                                            <FiCheckCircle className="w-3.5 h-3.5" />
                                                            Processed
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-yellow-600">
                                                            <FiAlertCircle className="w-3.5 h-3.5" />
                                                            Processing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0 w-full sm:w-auto justify-end border-gray-50">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 sm:p-2.5 rounded-lg text-gray-500 hover:text-gray-900 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all font-semibold flex items-center text-xs gap-1.5"
                                            >
                                                <FiDownload className="w-4 h-4" />
                                                <span className="sm:hidden">Download</span>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc._id)}
                                                className="p-2 sm:p-2.5 rounded-lg text-gray-400 hover:text-red-600 border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all flex items-center text-xs font-semibold gap-1.5"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                <span className="sm:hidden text-red-600">Delete</span>
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
