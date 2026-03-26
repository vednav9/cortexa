// RAGChatbot.jsx – Premium Inline AI Assistant
import React, { useState, useRef, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend, FiFile, FiLoader, FiZap,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useOutletContext } from "react-router-dom";
import { InstitutionContext } from "../../../context/InstitutionContext";
import { useAuth } from "../../../context/authcontext";
import api from "../../../services/api";
import aiService from "../../../services/aiService";

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "16, 185, 129";
};

const SUGGESTIONS = [
  "What are the key concepts in this subject?",
  "Summarize the uploaded documents",
  "Generate 5 MCQs for practice",
  "Explain the latest topics covered",
];

/* ─── Typing dots ─── */
const TypingDots = ({ color }) => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

/* ─── Single message bubble ─── */
const Message = ({ msg, brand, rgb }) => {
  const isUser = msg.type === "user";
  const isError = msg.type === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `rgba(${rgb},0.12)` }}
        >
          <HiSparkles className="w-4 h-4" style={{ color: brand }} />
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-[13.5px] leading-[1.65] whitespace-pre-wrap ${isUser ? "text-white rounded-tr-sm"
            : isError ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-sm"
              : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
            }`}
          style={isUser ? { backgroundColor: brand } : {}}
        >
          {msg.content}

          {/* Sources */}
          {msg.sources?.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Sources · {msg.searchMethod}
              </p>
              {msg.sources.slice(0, 3).map((src, i) => (
                <div key={i} className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  {src.type === "document" ? (
                    <>
                      <FiFile className="w-3 h-3 flex-shrink-0" style={{ color: brand }} />
                      <span className="truncate">
                        {src.document_name || src.source}
                        {src.page_number ? ` (p.${src.page_number})` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <FiZap className="w-3 h-3 flex-shrink-0 text-amber-400" />
                      <a
                        href={src.url} target="_blank" rel="noopener noreferrer"
                        className="truncate hover:underline" style={{ color: brand }}
                      >
                        {src.title || src.document_name || "Web source"}
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-300 mt-1 mx-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════ */
export default function RAGChatbot() {
  const { currentInstitution } = useOutletContext();
  const { institution } = useContext(InstitutionContext);
  const { user } = useAuth();

  const inst = institution || currentInstitution;
  const brand = inst?.branding?.primaryColor || "#10b981";
  const rgb = hexToRgb(brand);

  /* Chat state */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);

  /* Upload panel state */
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      if (user?.role !== "teacher") return;
      try {
        const res = await api.get("/teacher/authorized-courses");
        const list = Array.isArray(res?.data?.courses) ? res.data.courses : [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0]._id);
        }
      } catch (_) {
        setCourses([]);
      }
    };

    fetchTeacherCourses();
  }, [user?.role]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!selectedCourse || user?.role !== "teacher") {
        setDocuments([]);
        return;
      }
      try {
        setDocsLoading(true);
        const res = await api.get(`/teacher/notes/${selectedCourse}`, {
          params: { _ts: Date.now() },
          headers: { 'Cache-Control': 'no-cache' },
        });
        const list = Array.isArray(res?.data?.documents) ? res.data.documents : [];
        setDocuments(list);
        setSelectedDocIds(list.map((doc) => String(doc._id)));
      } catch {
        setDocuments([]);
        setSelectedDocIds([]);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedCourse, user?.role]);

  useEffect(() => {
    if (!chatScrollRef.current || (!loading && messages.length === 0)) return;
    // Keep scrolling inside chat panel only, avoiding full-page jump on tab open.
    requestAnimationFrame(() => {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    });
  }, [messages, loading]);

  /* ── Send message ── */
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!selectedCourse) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: "error",
        content: "Please select a course first so I can answer from that course documents.",
        timestamp: new Date(),
      }]);
      return;
    }
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: "error",
        content: "Please select at least one document from the Available Docs panel.",
        timestamp: new Date(),
      }]);
      return;
    }
    const text = input.trim();
    setInput("");
    const userMsg = { id: Date.now(), type: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await aiService.queryStudentRAG(
        text,
        inst?._id || null,
        selectedCourse,
        selectedDocIds
      );
      setMessages(prev => [...prev, {
        id: Date.now() + 1, type: "ai",
        content: res.answer, sources: res.sources,
        searchMethod: res.search_method || "rag", timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, type: "error",
        content: err.message || "Something went wrong.", timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleDocSelection = (docId) => {
    const id = String(docId);
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    setSelectedDocIds(documents.map((doc) => String(doc._id)));
  };

  const clearAllDocs = () => {
    setSelectedDocIds([]);
  };

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: `rgba(${rgb},0.03)` }}
    >

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full mb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
            >
              <HiSparkles className="text-2xl" style={{ color: brand }} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Assistant</h1>
              <p className="text-gray-500 mt-1 font-medium">RAG-powered answers from your notes and web context</p>
            </div>
          </div>

          {/* Documents toggle */}
          <button
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold border-2 transition-all"
            style={showUpload
              ? { borderColor: brand, backgroundColor: `rgba(${rgb},0.08)`, color: brand }
              : { borderColor: "#e5e7eb", backgroundColor: "white", color: "#6b7280" }
            }
          >
            <FiFile className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showUpload ? "Hide Docs" : "Available Docs"}</span>
          </button>
        </motion.div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 max-w-7xl mx-auto w-full">

        {/* ── CHAT PANEL ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: `rgba(${rgb},0.15)` }}>

          {/* Top strip */}
          <div className="h-[3px]"
            style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

          {/* Messages area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-[400px] max-h-[calc(100vh-300px)]"
          >

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center pt-8 pb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `rgba(${rgb},0.10)` }}
                >
                  <HiSparkles className="w-8 h-8" style={{ color: brand }} />
                </div>
                <h3 className="text-[15px] font-extrabold text-gray-800 mb-1">Ask me anything</h3>
                <p className="text-[12px] text-gray-400 mb-6">
                  I search your uploaded documents and the web to find answers.
                </p>
                {/* Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-left px-3.5 py-2.5 rounded-xl text-[12px] font-medium border-2 border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all text-gray-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} brand={brand} rgb={rgb} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `rgba(${rgb},0.12)` }}
                >
                  <HiSparkles className="w-4 h-4" style={{ color: brand }} />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots color={brand} />
                </div>
              </div>
            )}

          </div>

          {/* Input bar */}
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: `rgba(${rgb},0.10)` }}
          >
            <div
              className="flex items-end gap-2 bg-gray-50 border-2 rounded-2xl px-4 py-3 transition-all"
              style={{ borderColor: "transparent" }}
              onFocus={() => { }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Ask a question… (Enter to send)"
                disabled={loading}
                className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder:text-gray-300 outline-none resize-none leading-relaxed max-h-32 disabled:opacity-50"
                style={{ minHeight: "24px" }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                style={{ backgroundColor: brand }}
              >
                {loading
                  ? <FiLoader className="w-4 h-4 text-white animate-spin" />
                  : <FiSend className="w-4 h-4 text-white" />
                }
              </motion.button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-2">
              Shift + Enter for new line · AI may make mistakes
            </p>
          </div>
        </div>

        {/* ── DOCUMENTS PANEL ───────────────────────────────────── */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full lg:w-72 flex-shrink-0 bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: `rgba(${rgb},0.15)` }}
            >
              <div className="h-[3px]"
                style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `rgba(${rgb},0.10)` }}>
                    <FiFile className="w-4 h-4" style={{ color: brand }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-gray-900">Available Docs</p>
                    <p className="text-[10px] text-gray-400">Used for course-specific answers</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-700 bg-white"
                  >
                    {courses.length === 0 ? (
                      <option value="">No courses found</option>
                    ) : (
                      courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {docsLoading ? (
                  <div className="py-4 text-[12px] text-gray-500 flex items-center gap-2">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Loading documents...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[12px] text-gray-500">
                    No documents available for this course.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {selectedDocIds.length} of {documents.length} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllDocs}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Select all
                        </button>
                        <button
                          onClick={clearAllDocs}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => toggleDocSelection(doc._id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedDocIds.includes(String(doc._id))
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(String(doc._id))}
                            onChange={() => toggleDocSelection(doc._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">{doc.fileName}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                              <span>{formatFileSize(doc.fileSize || 0)}</span>
                              <span>•</span>
                              <span>{Number(doc.chunksCount || 0)} chunks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
