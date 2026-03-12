// QASection.jsx – Consistent Brand-Themed Design
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle, FiSend, FiThumbsUp, FiCheckCircle,
  FiClock, FiSearch, FiUser, FiBookOpen, FiEye,
  FiX, FiAlertCircle, FiPlus, FiChevronDown,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../../context/authcontext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { qaAPI, academicAPI } from "../../../services/api";
import { InstitutionContext } from "../../../context/InstitutionContext";

/* ─── Helpers ─────────────────────────────────────────────────── */
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "59, 130, 246";
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const inputFocus = (brand) => (e) => { e.target.style.borderColor = brand; e.target.style.backgroundColor = "#fff"; };
const inputBlur = (e) => { e.target.style.borderColor = ""; e.target.style.backgroundColor = ""; };

/* ─── Status config ─────────────────────────────────────────── */
const STATUS = {
  open: { label: "Open", dot: "#f59e0b", pill: "bg-amber-50 text-amber-600" },
  "in-progress": { label: "In Progress", dot: "#3b82f6", pill: "bg-blue-50 text-blue-600" },
  resolved: { label: "Resolved", dot: "#10b981", pill: "bg-emerald-50 text-emerald-600" },
  closed: { label: "Closed", dot: "#94a3b8", pill: "bg-slate-100 text-slate-500" },
};
const PRIORITY = {
  low: { label: "Low", dot: "#94a3b8", pill: "bg-slate-100 text-slate-500" },
  normal: { label: "Normal", dot: "#3b82f6", pill: "bg-blue-50 text-blue-600" },
  high: { label: "High", dot: "#f59e0b", pill: "bg-amber-50 text-amber-600" },
  urgent: { label: "Urgent", dot: "#ef4444", pill: "bg-red-50 text-red-600" },
};
const CATEGORIES = ["general", "technical", "academic", "assignment", "exam", "other"];

const EMPTY_Q = { title: "", description: "", category: "general", priority: "normal", tags: [], isAnonymous: false };

/* ─── Skeleton ──────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 flex overflow-hidden animate-pulse">
        <div className="w-[3px] bg-gray-100 flex-shrink-0" />
        <div className="flex-1 p-5 space-y-3">
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-gray-100 rounded-full" />
            <div className="h-4 w-12 bg-gray-100 rounded-full" />
          </div>
          <div className="h-5 w-2/3 bg-gray-100 rounded-lg" />
          <div className="h-3.5 w-full bg-gray-50 rounded-lg" />
          <div className="h-3.5 w-4/5 bg-gray-50 rounded-lg" />
          <div className="h-3 w-1/4 bg-gray-50 rounded-lg mt-2" />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Question card ─────────────────────────────────────────── */
function QACard({ qa, brand, rgb, index, onClick, onUpvote }) {
  const s = STATUS[qa.status] || STATUS.open;
  const p = PRIORITY[qa.priority] || PRIORITY.normal;
  const hasAccepted = qa.answers?.some(a => a.isAccepted);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      onClick={() => onClick(qa)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] transition-all group"
    >
      <div className="flex">
        {/* Priority bar */}
        <div className="w-[3px] flex-shrink-0" style={{ backgroundColor: p.dot }} />

        <div className="flex-1 min-w-0 p-5">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.pill}`}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
              {s.label}
            </span>
            {qa.priority !== "normal" && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${p.pill}`}>{p.label}</span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 capitalize">
              {qa.category}
            </span>
            {hasAccepted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="w-3 h-3" /> Answered
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug mb-1.5 group-hover:text-gray-700 transition-colors">
            {qa.title}
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {qa.description}
          </p>

          {/* Tags */}
          {qa.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {qa.tags.map((tag, i) => (
                <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-3 text-[12px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                  style={{ backgroundColor: brand }}>
                  {(qa.isAnonymous ? "A" : qa.askedBy?.name?.charAt(0) || "?").toUpperCase()}
                </div>
                <span className="font-semibold text-gray-500">
                  {qa.isAnonymous ? "Anonymous" : qa.askedBy?.name}
                </span>
              </div>
              <span className="text-gray-200">·</span>
              <div className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                <span>{timeAgo(qa.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FiEye className="w-3 h-3" />
                <span>{qa.views}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[12px] text-gray-400">
              <button
                onClick={e => { e.stopPropagation(); onUpvote(qa._id); }}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
              >
                <FiThumbsUp className="w-3.5 h-3.5" />
                <span>{qa.upvotes?.length || 0}</span>
              </button>
              <div className="flex items-center gap-1">
                <FiMessageCircle className="w-3.5 h-3.5" />
                <span>{qa.answers?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function QASection() {
  const { user } = useAuth();
  const ctx = useOutletContext();
  const instCtx = React.useContext(InstitutionContext);
  const institution = ctx?.institution || instCtx?.institution;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [qas, setQas] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [showAskModal, setAskModal] = useState(false);
  const [selectedQA, setSelectedQA] = useState(null);
  const [newQ, setNewQ] = useState(EMPTY_Q);
  const [newAnswer, setNewAnswer] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [tagInput, setTagInput] = useState("");

  const brand = institution?.branding?.primaryColor || "#3b82f6";
  const rgb = hexToRgb(brand);
  const canAnswer = ["teacher", "admin"].includes(user?.role);

  /* ── Data fetching ── */
  useEffect(() => { if (institution?._id) fetchCourses(); }, [institution?._id]);
  useEffect(() => { if (selectedCourse?._id) { fetchQAs(); fetchStats(); } }, [selectedCourse?._id, filter, catFilter, search, sortBy]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const { data } = await academicAPI.getCourses(institution._id, {});
      const list = data.courses || [];
      setCourses(list);
      if (list.length > 0) setSelectedCourse(list[0]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load courses");
    } finally { setLoadingCourses(false); }
  };

  const fetchQAs = async () => {
    if (!selectedCourse?._id) return;
    try {
      setLoading(true);
      const { data } = await qaAPI.getByCourse(selectedCourse._id, {
        status: filter !== "all" ? filter : undefined,
        category: catFilter !== "all" ? catFilter : undefined,
        search: search || undefined,
        sort: sortBy,
      });
      setQas(data.qas || []);
    } catch { toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    if (!selectedCourse?._id) return;
    try {
      const { data } = await qaAPI.getStatsByCourse(selectedCourse._id);
      setStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 });
    } catch { }
  };

  /* ── Actions ── */
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!selectedCourse?._id) { toast.error("Select a course first"); return; }
    try {
      const { data } = await qaAPI.create(selectedCourse._id, { ...newQ, tags: newQ.tags.filter(t => t.trim()) });
      setQas(prev => [data.qa, ...prev]);
      toast.success("Question posted!");
      setAskModal(false);
      setNewQ(EMPTY_Q);
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post"); }
  };

  const handleAnswer = async () => {
    if (!canAnswer) { toast.error("Only teachers can answer"); return; }
    if (!newAnswer.trim()) { toast.error("Please enter an answer"); return; }
    try {
      const { data } = await qaAPI.addAnswer(selectedQA._id, { text: newAnswer });
      setSelectedQA(data.qa);
      setQas(qas.map(q => q._id === selectedQA._id ? data.qa : q));
      setNewAnswer("");
      toast.success("Answer posted!");
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post answer"); }
  };

  const handleUpvoteQA = async (id) => {
    try {
      const { data } = await qaAPI.upvoteQA(id);
      const updated = q => q._id === id ? { ...q, upvotes: Array(data.upvotes).fill(null) } : q;
      setQas(prev => prev.map(updated));
      if (selectedQA?._id === id) setSelectedQA(q => ({ ...q, upvotes: Array(data.upvotes).fill(null) }));
    } catch { toast.error("Failed to upvote"); }
  };

  const handleUpvoteAnswer = async (qaId, answerId) => {
    try {
      await qaAPI.upvoteAnswer(qaId, answerId);
      const { data } = await qaAPI.getById(qaId);
      setSelectedQA(data.qa);
      setQas(prev => prev.map(q => q._id === qaId ? data.qa : q));
    } catch { toast.error("Failed to upvote"); }
  };

  const handleAccept = async (answerId) => {
    try {
      const { data } = await qaAPI.acceptAnswer(selectedQA._id, answerId);
      setSelectedQA(data.qa);
      setQas(prev => prev.map(q => q._id === selectedQA._id ? data.qa : q));
      toast.success("Answer accepted!");
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleStatusChange = async (qaId, status) => {
    if (!canAnswer) { toast.error("Only teachers can update status"); return; }
    try {
      const { data } = await qaAPI.updateStatus(qaId, status);
      setQas(prev => prev.map(q => q._id === qaId ? data.qa : q));
      if (selectedQA?._id === qaId) setSelectedQA(data.qa);
      toast.success("Status updated!");
      fetchStats();
    } catch { toast.error("Failed to update status"); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !newQ.tags.includes(t)) { setNewQ({ ...newQ, tags: [...newQ.tags, t] }); setTagInput(""); }
  };

  /* ── Loading states ── */
  if (loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.03)` }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: `rgba(${rgb},0.2)`, borderTopColor: brand }} />
          <p className="text-[13px] text-gray-400 font-medium">Loading courses…</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: `rgba(${rgb},0.03)` }}>
        <div className="bg-white rounded-2xl border p-14 text-center max-w-sm" style={{ borderColor: `rgba(${rgb},0.15)` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
            <FiBookOpen className="w-6 h-6" style={{ color: `rgba(${rgb},0.4)` }} />
          </div>
          <p className="text-[15px] font-extrabold text-gray-800">No Courses Yet</p>
          <p className="text-[13px] text-gray-400 mt-1">Create courses in the Academic Structure section first.</p>
        </div>
      </div>
    );
  }

  /* ── FILTERS sidebar config ── */
  const STATUS_FILTERS = [
    { key: "all", label: `All  ·  ${qas.length}` },
    { key: "open", label: `Open  ·  ${stats.open}` },
    { key: "in-progress", label: `In Progress  ·  ${stats.inProgress}` },
    { key: "resolved", label: `Resolved  ·  ${stats.resolved}` },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.03)` }}>
      <div className="max-w-7xl mx-auto">

        {/* ── TOP BAR ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          {/* Title */}
          <div className="flex items-center gap-4">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
            >
              <FiMessageCircle className="text-2xl" style={{ color: brand }} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Q&amp;A</h1>
              <p className="text-gray-500 mt-1 font-medium">{institution?.name}</p>
            </div>
          </div>

          {/* Right: course selector + ask button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Course selector */}
            <div className="relative">
              <select
                value={selectedCourse?._id || ""}
                onChange={e => { const c = courses.find(c => c._id === e.target.value); setSelectedCourse(c); }}
                className="appearance-none pl-4 pr-8 py-2.5 text-[13px] font-semibold border-2 border-gray-100 rounded-xl bg-white outline-none transition-all text-gray-700"
                onFocus={e => { e.target.style.borderColor = brand; }}
                onBlur={e => { e.target.style.borderColor = ""; }}
              >
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Ask button */}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => { if (!selectedCourse) { toast.error("Select a course first"); return; } setAskModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-sm hover:shadow-md transition-all flex-shrink-0"
              style={{ backgroundColor: brand }}
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Question</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── BODY ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="w-full lg:w-56 flex-shrink-0 space-y-4"
          >
            {/* Status filter */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: `rgba(${rgb},0.15)` }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Status</p>
              <div className="space-y-1">
                {STATUS_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all text-left"
                    style={filter === f.key
                      ? { backgroundColor: `rgba(${rgb},0.10)`, color: brand, fontWeight: 600 }
                      : { color: "#6b7280", fontWeight: 500 }
                    }>
                    <span>{f.label.split("·")[0].trim()}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={filter === f.key
                        ? { backgroundColor: `rgba(${rgb},0.15)`, color: brand }
                        : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                      }>
                      {f.label.split("·")[1]?.trim() || ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: `rgba(${rgb},0.15)` }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Category</p>
              <div className="space-y-1">
                {["all", ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className="w-full px-3 py-2 rounded-xl text-[13px] transition-all text-left capitalize"
                    style={catFilter === c
                      ? { backgroundColor: `rgba(${rgb},0.10)`, color: brand, fontWeight: 600 }
                      : { color: "#6b7280", fontWeight: 500 }
                    }>
                    {c === "all" ? "All Categories" : c}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* ── MAIN FEED ─── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Search + sort bar */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full pl-9 pr-4 py-2.5 text-[13px] border-2 border-gray-100 rounded-xl bg-white outline-none transition-all"
                  onFocus={inputFocus(brand)} onBlur={inputBlur}
                />
              </div>
              <select
                value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 text-[13px] font-medium border-2 border-gray-100 rounded-xl bg-white outline-none appearance-none transition-all text-gray-600"
                onFocus={e => { e.target.style.borderColor = brand; }}
                onBlur={e => { e.target.style.borderColor = ""; }}
              >
                <option value="-createdAt">Newest</option>
                <option value="createdAt">Oldest</option>
                <option value="-views">Most Viewed</option>
                <option value="-upvotes">Most Upvoted</option>
              </select>
            </div>

            {/* Loading */}
            {loading && <Skeleton />}

            {/* Empty */}
            {!loading && qas.length === 0 && (
              <div className="bg-white rounded-2xl border p-14 text-center" style={{ borderColor: `rgba(${rgb},0.15)` }}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
                  <FiMessageCircle className="w-6 h-6" style={{ color: `rgba(${rgb},0.4)` }} />
                </div>
                <p className="text-[15px] font-extrabold text-gray-800">No questions yet</p>
                <p className="text-[13px] text-gray-400 mt-1 mb-5">Be the first to ask something!</p>
                <button onClick={() => setAskModal(true)}
                  className="px-5 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-sm"
                  style={{ backgroundColor: brand }}>
                  Ask Question
                </button>
              </div>
            )}

            {/* Cards */}
            {!loading && qas.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {qas.map((qa, i) => (
                    <QACard key={qa._id} qa={qa} brand={brand} rgb={rgb} index={i}
                      onClick={setSelectedQA} onUpvote={handleUpvoteQA} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ASK QUESTION MODAL ═══════════════════════════════════ */}
      <AnimatePresence>
        {showAskModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAskModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="h-[4px] flex-shrink-0" style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

              {/* Header */}
              <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.10)` }}>
                    <FiMessageCircle className="w-4 h-4" style={{ color: brand }} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-gray-900">Ask a Question</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedCourse?.code} — {selectedCourse?.name}</p>
                  </div>
                </div>
                <button onClick={() => setAskModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAsk} className="overflow-y-auto px-7 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Title *</label>
                  <input required type="text" placeholder="What's your question?"
                    value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })}
                    className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all placeholder:text-gray-300"
                    onFocus={inputFocus(brand)} onBlur={inputBlur}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description *</label>
                  <textarea required rows={4} placeholder="Provide more context…"
                    value={newQ.description} onChange={e => setNewQ({ ...newQ, description: e.target.value })}
                    className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none resize-none transition-all placeholder:text-gray-300"
                    onFocus={inputFocus(brand)} onBlur={inputBlur}
                  />
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: "category", label: "Category", opts: CATEGORIES },
                    { field: "priority", label: "Priority", opts: ["low", "normal", "high", "urgent"] },
                  ].map(({ field, label, opts }) => (
                    <div key={field}>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
                      <select value={newQ[field]} onChange={e => setNewQ({ ...newQ, [field]: e.target.value })}
                        className="w-full px-3 py-3 text-[13px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all appearance-none capitalize"
                        onFocus={e => { e.target.style.borderColor = brand; }}
                        onBlur={e => { e.target.style.borderColor = ""; }}
                      >
                        {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tags</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. arrays, sorting…"
                      value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      className="flex-1 px-4 py-2.5 text-[13px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all placeholder:text-gray-300"
                      onFocus={inputFocus(brand)} onBlur={inputBlur}
                    />
                    <button type="button" onClick={addTag}
                      className="px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-gray-50 border-2 border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                      Add
                    </button>
                  </div>
                  {newQ.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {newQ.tags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}>
                          #{t}
                          <button type="button" onClick={() => setNewQ({ ...newQ, tags: newQ.tags.filter(x => x !== t) })}>
                            <FiX className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous */}
                <button type="button" onClick={() => setNewQ({ ...newQ, isAnonymous: !newQ.isAnonymous })}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all text-left"
                  style={newQ.isAnonymous
                    ? { borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.05)` }
                    : { borderColor: "#f3f4f6", backgroundColor: "#f9fafb" }}
                >
                  <div className="w-10 h-[22px] rounded-full relative flex-shrink-0 transition-all"
                    style={{ backgroundColor: newQ.isAnonymous ? brand : "#d1d5db" }}>
                    <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${newQ.isAnonymous ? "left-[22px]" : "left-[3px]"}`} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-700">Post anonymously</p>
                    <p className="text-[11px] text-gray-400">Your name won't be shown</p>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex gap-3 pt-1 pb-2">
                  <button type="button" onClick={() => setAskModal(false)}
                    className="flex-1 py-3 text-[13px] font-semibold text-gray-500 rounded-xl border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <motion.button type="submit"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 text-[13px] font-bold text-white rounded-xl shadow-sm transition-all"
                    style={{ backgroundColor: brand }}>
                    Post Question
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ QA DETAIL MODAL ═════════════════════════════════════ */}
      <AnimatePresence>
        {selectedQA && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedQA(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="h-[4px] flex-shrink-0" style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

              {/* Question header */}
              <div className="px-7 pt-6 pb-5 flex-shrink-0 border-b" style={{ borderColor: `rgba(${rgb},0.08)` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {(() => {
                        const s = STATUS[selectedQA.status] || STATUS.open;
                        const p = PRIORITY[selectedQA.priority] || PRIORITY.normal;
                        return <>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.pill}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                            {s.label}
                          </span>
                          {selectedQA.priority !== "normal" && (
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${p.pill}`}>{p.label}</span>
                          )}
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 capitalize">
                            {selectedQA.category}
                          </span>
                          {canAnswer && (
                            <select value={selectedQA.status}
                              onChange={e => handleStatusChange(selectedQA._id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="text-[11px] px-2.5 py-0.5 border border-gray-200 rounded-lg outline-none bg-white text-gray-500"
                              onFocus={e => { e.target.style.borderColor = brand; }}
                              onBlur={e => { e.target.style.borderColor = ""; }}
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}
                        </>;
                      })()}
                    </div>

                    <h2 className="text-[18px] font-extrabold text-gray-900 leading-snug mb-2">{selectedQA.title}</h2>
                    <p className="text-[13.5px] text-gray-600 leading-[1.7] whitespace-pre-wrap mb-3">{selectedQA.description}</p>

                    {/* Tags */}
                    {selectedQA.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedQA.tags.map((t, i) => (
                          <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}>#{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[12px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                          style={{ backgroundColor: brand }}>
                          {(selectedQA.isAnonymous ? "A" : selectedQA.askedBy?.name?.charAt(0) || "?").toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-500">
                          {selectedQA.isAnonymous ? "Anonymous" : selectedQA.askedBy?.name}
                        </span>
                      </div>
                      <span className="text-gray-200">·</span>
                      <span>{timeAgo(selectedQA.createdAt)}</span>
                      <span className="text-gray-200">·</span>
                      <span>{selectedQA.views} views</span>
                      <button onClick={() => handleUpvoteQA(selectedQA._id)}
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors ml-1">
                        <FiThumbsUp className="w-3.5 h-3.5" />
                        <span>{selectedQA.upvotes?.length || 0}</span>
                      </button>
                    </div>
                  </div>

                  <button onClick={() => setSelectedQA(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Answers */}
              <div className="flex-1 overflow-y-auto px-7 py-5">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {selectedQA.answers?.length || 0} Answer{selectedQA.answers?.length !== 1 ? "s" : ""}
                </p>

                {!selectedQA.answers?.length ? (
                  <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: `rgba(${rgb},0.04)` }}>
                    <FiMessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: `rgba(${rgb},0.3)` }} />
                    <p className="text-[13px] font-semibold text-gray-600">No answers yet</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {canAnswer ? "Be the first to answer!" : "Only teachers can answer questions."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedQA.answers.map(ans => (
                      <div key={ans._id}
                        className={`rounded-2xl border p-5 transition-all ${ans.isAccepted
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-gray-100 bg-gray-50"
                          }`}
                      >
                        {ans.isAccepted && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mb-2">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Accepted Answer
                          </div>
                        )}
                        <p className="text-[13.5px] text-gray-700 leading-[1.7] whitespace-pre-wrap mb-4">{ans.text}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[12px] text-gray-400">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                              style={{ backgroundColor: brand }}>
                              {ans.answeredBy?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <span className="font-semibold text-gray-600">{ans.answeredBy?.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                              style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}>
                              {ans.answeredBy?.userType}
                            </span>
                            <span className="text-gray-200">·</span>
                            <span>{timeAgo(ans.answeredAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpvoteAnswer(selectedQA._id, ans._id)}
                              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:border-blue-200 hover:text-blue-500 transition-all text-gray-400">
                              <FiThumbsUp className="w-3.5 h-3.5" /> {ans.upvotes?.length || 0}
                            </button>
                            {!ans.isAccepted && (selectedQA.askedBy?.userId === user?.id || canAnswer) && (
                              <button onClick={() => handleAccept(ans._id)}
                                className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 transition-all font-semibold">
                                <FiCheckCircle className="w-3.5 h-3.5" /> Accept
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Answer input (teacher/admin) */}
              {canAnswer && (
                <div className="px-7 py-5 border-t flex-shrink-0" style={{ borderColor: `rgba(${rgb},0.08)`, backgroundColor: `rgba(${rgb},0.02)` }}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Answer</label>
                  <textarea rows={3} value={newAnswer} onChange={e => setNewAnswer(e.target.value)}
                    placeholder="Type your answer… (Ctrl+Enter to submit)"
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAnswer(); }}
                    className="w-full px-4 py-3 text-[13.5px] border-2 border-gray-100 rounded-xl bg-white outline-none resize-none placeholder:text-gray-300 transition-all"
                    onFocus={inputFocus(brand)} onBlur={inputBlur}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[11px] text-gray-300">Ctrl + Enter to submit</p>
                    <motion.button onClick={handleAnswer} disabled={!newAnswer.trim()}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white rounded-xl shadow-sm disabled:opacity-40 transition-all"
                      style={{ backgroundColor: brand }}>
                      <FiSend className="w-3.5 h-3.5" /> Post Answer
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Student notice */}
              {!canAnswer && (
                <div className="px-7 py-4 border-t flex-shrink-0 flex items-center justify-center gap-2 text-[12px] text-gray-400"
                  style={{ borderColor: `rgba(${rgb},0.08)` }}>
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Only teachers and admins can answer questions. You can upvote helpful answers.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
