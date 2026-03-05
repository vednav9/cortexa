// dashboard/QueryDesk.jsx – Consistent Brand-Themed Design
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHelpCircle, FiPlus, FiSearch, FiCheck, FiClock,
  FiAlertCircle, FiMessageSquare, FiSend, FiX, FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../../context/authcontext";
import api from "../../services/api";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────────────── */
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "16, 185, 129";
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

/* ─── Config ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  open: { label: "Open", dot: "#f59e0b", pill: "bg-amber-50 text-amber-600" },
  "in-progress": { label: "In Progress", dot: "#3b82f6", pill: "bg-blue-50 text-blue-600" },
  resolved: { label: "Resolved", dot: "#10b981", pill: "bg-emerald-50 text-emerald-600" },
  closed: { label: "Closed", dot: "#94a3b8", pill: "bg-slate-100 text-slate-500" },
};
const PRIORITY_CFG = {
  low: { label: "Low", dot: "#94a3b8", bar: "#94a3b8" },
  normal: { label: "Normal", dot: "#3b82f6", bar: "#3b82f6" },
  high: { label: "High", dot: "#f59e0b", bar: "#f59e0b" },
  urgent: { label: "Urgent", dot: "#ef4444", bar: "#ef4444" },
};
const CATEGORIES = ["general", "technical", "academic", "administrative"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const EMPTY_QUERY = { title: "", description: "", category: "general", priority: "normal" };

/* ─── Skeleton card ─────────────────────────────────────────── */
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
          <div className="h-5 w-3/5 bg-gray-100 rounded-lg" />
          <div className="h-3.5 w-full bg-gray-50 rounded-lg" />
          <div className="h-3 w-1/4 bg-gray-50 rounded-lg mt-2" />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Query card ────────────────────────────────────────────── */
function QueryCard({ query, brand, rgb, index, onClick }) {
  const s = STATUS_CFG[query.status] || STATUS_CFG.open;
  const p = PRIORITY_CFG[query.priority] || PRIORITY_CFG.normal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      onClick={() => onClick(query)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] transition-all group"
    >
      <div className="flex">
        {/* Priority bar */}
        <div className="w-[3px] flex-shrink-0" style={{ backgroundColor: p.bar }} />

        <div className="flex-1 min-w-0 p-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.pill}`}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
              {s.label}
            </span>
            {query.priority !== "normal" && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500">
                {p.label}
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 capitalize">
              {query.category}
            </span>
          </div>

          {/* Title + description */}
          <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug mb-1.5 group-hover:text-gray-700 transition-colors">
            {query.title}
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {query.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                style={{ backgroundColor: brand }}>
                {query.createdBy?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="font-semibold text-gray-500">{query.createdBy?.name}</span>
              <span className="text-gray-200">·</span>
              <div className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                <span>{timeAgo(query.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
              <FiMessageSquare className="w-3.5 h-3.5" />
              <span>{query.replies?.length || 0}</span>
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
export default function QueryDesk({ institution }) {
  const { user } = useAuth();

  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedQ, setSelectedQ] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newQuery, setNewQuery] = useState(EMPTY_QUERY);
  const [replyText, setReplyText] = useState("");

  const brand = institution?.branding?.primaryColor || "#10b981";
  const rgb = hexToRgb(brand);
  const isStaff = ["admin", "teacher"].includes(user?.role);

  /* ── Fetch ── */
  const fetchQueries = async () => {
    if (!institution?._id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data } = await api.get(`/queries/institution/${institution._id}`, {
        params: { status: filterStatus, search },
      });
      setQueries(data.queries || []);
    } catch { toast.error("Failed to load queries"); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    if (!institution?._id) return;
    try {
      const { data } = await api.get(`/queries/institution/${institution._id}/stats`);
      setStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 });
    } catch { }
  };

  useEffect(() => { fetchQueries(); fetchStats(); }, [institution?._id, filterStatus, search]);

  /* ── Actions ── */
  const handleSubmit = async () => {
    if (!institution?._id) { toast.error("Institution not loaded"); return; }
    if (!newQuery.title.trim() || !newQuery.description.trim()) {
      toast.error("Please fill in all required fields"); return;
    }
    try {
      const { data } = await api.post(`/queries/institution/${institution._id}`, newQuery);
      setQueries(prev => [data.query, ...prev]);
      setNewQuery(EMPTY_QUERY);
      setShowNew(false);
      toast.success("Query submitted!");
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to submit"); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) { toast.error("Please enter a reply"); return; }
    try {
      const { data } = await api.post(`/queries/${selectedQ._id}/reply`, { text: replyText });
      setQueries(prev => prev.map(q => q._id === selectedQ._id ? data.query : q));
      setSelectedQ(data.query);
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send reply"); }
  };

  const handleStatusChange = async (queryId, status) => {
    try {
      const { data } = await api.patch(`/queries/${queryId}/status`, { status });
      setQueries(prev => prev.map(q => q._id === queryId ? data.query : q));
      if (selectedQ?._id === queryId) setSelectedQ(data.query);
      toast.success("Status updated!");
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update status"); }
  };

  /* ── Filter config ── */
  const FILTERS = [
    { key: "all", label: "All", count: stats.total },
    { key: "open", label: "Open", count: stats.open },
    { key: "in-progress", label: "In Progress", count: stats.inProgress },
    { key: "resolved", label: "Resolved", count: stats.resolved },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: `rgba(${rgb},0.03)` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── TOP BAR ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `rgba(${rgb},0.12)` }}>
              <FiHelpCircle className="w-5 h-5" style={{ color: brand }} />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Query Desk</h1>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">{institution?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search queries…"
                className="pl-9 pr-4 py-2.5 text-[13px] border-2 border-gray-100 rounded-xl bg-white outline-none w-44 transition-all focus:w-56"
                onFocus={inputFocus(brand)} onBlur={inputBlur}
              />
            </div>

            {/* New Query */}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-sm hover:shadow-md transition-all flex-shrink-0"
              style={{ backgroundColor: brand }}
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Query</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── BODY: sidebar + feed ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="w-full lg:w-56 flex-shrink-0"
          >
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: `rgba(${rgb},0.15)` }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filter</p>
              <div className="space-y-1">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all text-left"
                    style={filterStatus === f.key
                      ? { backgroundColor: `rgba(${rgb},0.10)`, color: brand, fontWeight: 600 }
                      : { color: "#6b7280", fontWeight: 500 }
                    }>
                    <span>{f.label}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={filterStatus === f.key
                        ? { backgroundColor: `rgba(${rgb},0.15)`, color: brand }
                        : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                      }>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* ── MAIN FEED ─── */}
          <div className="flex-1 min-w-0">
            {loading && <Skeleton />}

            {!loading && queries.length === 0 && (
              <div className="bg-white rounded-2xl border p-14 text-center" style={{ borderColor: `rgba(${rgb},0.15)` }}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
                  <FiHelpCircle className="w-6 h-6" style={{ color: `rgba(${rgb},0.4)` }} />
                </div>
                <p className="text-[15px] font-extrabold text-gray-800">No queries yet</p>
                <p className="text-[13px] text-gray-400 mt-1 mb-5">
                  {filterStatus !== "all" ? "No queries match this filter." : "Submit a query to get support from your institution."}
                </p>
                {filterStatus === "all" && (
                  <button onClick={() => setShowNew(true)}
                    className="px-5 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-sm"
                    style={{ backgroundColor: brand }}>
                    New Query
                  </button>
                )}
              </div>
            )}

            {!loading && queries.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {queries.map((q, i) => (
                    <QueryCard key={q._id} query={q} brand={brand} rgb={rgb}
                      index={i} onClick={setSelectedQ} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ NEW QUERY MODAL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-[4px]" style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `rgba(${rgb},0.10)` }}>
                      <FiHelpCircle className="w-4 h-4" style={{ color: brand }} />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-extrabold text-gray-900">New Query</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5">Send a support request to the institution</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNew(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject *</label>
                    <input type="text" placeholder="Brief title of your query"
                      value={newQuery.title} onChange={e => setNewQuery({ ...newQuery, title: e.target.value })}
                      className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all placeholder:text-gray-300"
                      onFocus={inputFocus(brand)} onBlur={inputBlur}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description *</label>
                    <textarea rows={4} placeholder="Describe your issue in detail…"
                      value={newQuery.description} onChange={e => setNewQuery({ ...newQuery, description: e.target.value })}
                      className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none resize-none transition-all placeholder:text-gray-300"
                      onFocus={inputFocus(brand)} onBlur={inputBlur}
                    />
                  </div>

                  {/* Category + Priority */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "category", label: "Category", opts: CATEGORIES },
                      { field: "priority", label: "Priority", opts: PRIORITIES },
                    ].map(({ field, label, opts }) => (
                      <div key={field}>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
                        <select value={newQuery[field]}
                          onChange={e => setNewQuery({ ...newQuery, [field]: e.target.value })}
                          className="w-full px-3 py-3 text-[13px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all appearance-none capitalize"
                          onFocus={e => { e.target.style.borderColor = brand; }}
                          onBlur={e => { e.target.style.borderColor = ""; }}
                        >
                          {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowNew(false)}
                      className="flex-1 py-3 text-[13px] font-semibold text-gray-500 rounded-xl border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <motion.button onClick={handleSubmit}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 text-[13px] font-bold text-white rounded-xl shadow-sm transition-all"
                      style={{ backgroundColor: brand }}>
                      Submit Query
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ QUERY DETAIL PANEL (slide-in from right) ════════════ */}
      <AnimatePresence>
        {selectedQ && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedQ(null)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed top-0 right-0 h-full w-full max-w-[560px] bg-white shadow-2xl z-50 flex flex-col border-l"
              style={{ borderColor: `rgba(${rgb},0.15)` }}
            >
              {/* Brand strip */}
              <div className="h-[4px] flex-shrink-0"
                style={{ background: `linear-gradient(90deg,${brand},rgba(${rgb},0.25))` }} />

              {/* Header */}
              <div className="px-7 pt-6 pb-5 flex-shrink-0 border-b" style={{ borderColor: `rgba(${rgb},0.08)` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {(() => {
                        const s = STATUS_CFG[selectedQ.status] || STATUS_CFG.open;
                        const p = PRIORITY_CFG[selectedQ.priority] || PRIORITY_CFG.normal;
                        return <>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.pill}`}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                            {s.label}
                          </span>
                          {selectedQ.priority !== "normal" && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500">{p.label}</span>
                          )}
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 capitalize">
                            {selectedQ.category}
                          </span>
                          {isStaff && (
                            <select value={selectedQ.status}
                              onChange={e => handleStatusChange(selectedQ._id, e.target.value)}
                              className="text-[11px] px-2.5 py-0.5 border border-gray-200 rounded-lg outline-none bg-white text-gray-500 appearance-none"
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

                    <h2 className="text-[18px] font-extrabold text-gray-900 leading-snug mb-1.5">{selectedQ.title}</h2>
                    <p className="text-[13.5px] text-gray-600 leading-[1.7] whitespace-pre-wrap">{selectedQ.description}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-3 text-[12px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                          style={{ backgroundColor: brand }}>
                          {selectedQ.createdBy?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-gray-500">{selectedQ.createdBy?.name}</span>
                      </div>
                      <span className="text-gray-200">·</span>
                      <span>{timeAgo(selectedQ.createdAt)}</span>
                    </div>
                  </div>

                  <button onClick={() => setSelectedQ(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto px-7 py-5 space-y-3"
                style={{ backgroundColor: `rgba(${rgb},0.015)` }}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {selectedQ.replies?.length || 0} Repl{selectedQ.replies?.length !== 1 ? "ies" : "y"}
                </p>

                {!selectedQ.replies?.length ? (
                  <div className="text-center py-12 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: `rgba(${rgb},0.15)` }}>
                    <FiMessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: `rgba(${rgb},0.3)` }} />
                    <p className="text-[13px] font-semibold text-gray-600">No replies yet</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">Awaiting response from the institution.</p>
                  </div>
                ) : (
                  selectedQ.replies.map(reply => (
                    <div key={reply._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0"
                          style={{ backgroundColor: brand }}>
                          {reply.repliedBy?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[13px] font-extrabold text-gray-800">{reply.repliedBy?.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                              style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}>
                              {reply.repliedBy?.userType || "member"}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-auto flex-shrink-0">{timeAgo(reply.repliedAt)}</span>
                          </div>
                          <p className="text-[13.5px] text-gray-600 leading-[1.7]">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply input */}
              {(isStaff || selectedQ.createdBy?.userId === user?._id) && (
                <div className="px-7 py-5 border-t flex-shrink-0"
                  style={{ borderColor: `rgba(${rgb},0.08)`, backgroundColor: `rgba(${rgb},0.02)` }}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reply</label>
                  <div className="flex gap-3">
                    <input type="text" value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleReply(); }}
                      placeholder="Type your reply… (Enter to send)"
                      className="flex-1 px-4 py-3 text-[13.5px] border-2 border-gray-100 rounded-xl bg-white outline-none transition-all placeholder:text-gray-300"
                      onFocus={inputFocus(brand)} onBlur={inputBlur}
                    />
                    <motion.button onClick={handleReply} disabled={!replyText.trim()}
                      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
                      style={{ backgroundColor: brand }}>
                      <FiSend className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
