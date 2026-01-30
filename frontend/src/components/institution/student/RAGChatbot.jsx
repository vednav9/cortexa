import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiBook, FiUpload, FiMessageSquare } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useOutletContext } from "react-router-dom";
import AIChat from "../../ai/AIChat";
import DocumentUploader from "../../ai/DocumentUploader";

export default function RAGChatbot() {
  const { currentInstitution } = useOutletContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const handleUploadComplete = (response) => {
    console.log("Upload complete:", response);
    setShowUploader(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <HiSparkles className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl font-black text-gray-900">RAG Chatbot</h1>
          </div>
          <p className="text-gray-600">
            Chat with AI about your course materials using Retrieval-Augmented Generation
          </p>
          <div className="mt-2 flex items-center space-x-2 text-sm text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Connected directly to AI server (No page refresh needed)</span>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Chat Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500"
            onClick={() => setIsChatOpen(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <FiMessageSquare className="w-12 h-12 text-emerald-600" />
              <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                Start Chat
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600 mb-4">
              Ask questions about your documents or get web-based answers
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Document search with RAG</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>Web search fallback</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span>No page refresh needed</span>
              </li>
            </ul>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500"
            onClick={() => setShowUploader(!showUploader)}
          >
            <div className="flex items-center justify-between mb-4">
              <FiUpload className="w-12 h-12 text-emerald-600" />
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {showUploader ? "Hide" : "Show"}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-gray-600 mb-4">
              Add your study materials to the knowledge base
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>PDF, TXT, DOCX supported</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Automatic chunking & embedding</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Instant search availability</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Document Uploader */}
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DocumentUploader
              institutionId={currentInstitution?._id}
              onUploadComplete={handleUploadComplete}
            />
          </motion.div>
        )}

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-lg p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <HiSparkles className="w-6 h-6" />
            <span>How It Works</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-bold mb-2">1</div>
              <h4 className="font-semibold mb-2">Upload Documents</h4>
              <p className="text-emerald-100 text-sm">
                Add your PDFs, notes, or study materials
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2</div>
              <h4 className="font-semibold mb-2">AI Processing</h4>
              <p className="text-emerald-100 text-sm">
                Documents are chunked and embedded for semantic search
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <h4 className="font-semibold mb-2">Ask Questions</h4>
              <p className="text-emerald-100 text-sm">
                Get accurate answers from your documents or the web
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Chat Modal */}
      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        institutionId={currentInstitution?._id}
        brandColor="#10b981"
      />
    </div>
  );
}
