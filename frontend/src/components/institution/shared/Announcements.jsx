// Announcements.jsx – Bulletin Board Layout
import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiBell, FiPlus, FiTrash2, FiClock, FiX, FiSearch,
    FiAlertCircle, FiInfo, FiBook, FiCalendar, FiZap,
    FiLock, FiCheckCircle,
} from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import { announcementAPI } from "../../../services/api";
import { InstitutionContext } from "../../../context/InstitutionContext";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────────────── */
const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "16, 185, 129";
};

const fmt = (d) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return fmt(d);
};

const PRIORITY = {
    low: { label: "Low", color: "#94a3b8" },
    normal: { label: "Normal", color: "#3b82f6" },
    high: { label: "High", color: "#f59e0b" },
    urgent: { label: "Urgent", color: "#ef4444" },
};

const TYPE = {
    general: { label: "General", Icon: FiInfo, color: "#3b82f6" },
    academic: { label: "Academic", Icon: FiBook, color: "#8b5cf6" },
    event: { label: "Event", Icon: FiCalendar, color: "#10b981" },
    urgent: { label: "Urgent", Icon: FiAlertCircle, color: "#ef4444" },
    exam: { label: "Exam", Icon: FiZap, color: "#f59e0b" },
};

const EMPTY = {
    title: "", content: "", type: "general",
    priority: "normal", targetAudience: ["all"], isPinned: false,
};

const inputFocus = (brand) => (e) => {
    e.target.style.borderColor = brand;
    e.target.style.backgroundColor = "#fff";
};
const inputBlur = (e) => {
    e.target.style.borderColor = "";
    e.target.style.backgroundColor = "";
};

/* ─── Skeleton card ──────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-100 rounded-full" />
            <div className="w-10 h-4 bg-gray-100 rounded-full" />
        </div>
        <div className="h-5 bg-gray-100 rounded-lg w-3/5" />
        <div className="space-y-2">
            <div className="h-3.5 bg-gray-50 rounded w-full" />
            <div className="h-3.5 bg-gray-50 rounded w-4/5" />
        </div>
        <div className="h-3 bg-gray-50 rounded w-1/4 pt-2" />
    </div>
);

/* ════════════════════════════════════════════════════════════════
   ANNOUNCEMENT CARD
════════════════════════════════════════════════════════════════ */
function AnnouncementCard({ a, brand, rgb, isOwn, onDelete, index }) {
    const p = PRIORITY[a.priority] || PRIORITY.normal;
    const t = TYPE[a.type] || TYPE.general;
    const Icon = t.Icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ delay: index * 0.05, duration: 0.28 }}
            className="bg-white rounded-2xl border overflow-hidden group transition-all hover:shadow-[0_6px_28px_-8px_rgba(0,0,0,0.1)]"
            style={{ borderColor: a.isPinned ? `rgba(${rgb},0.25)` : "#f1f5f9" }}
        >
            {/* Priority colour bar on left */}
            <div className="flex">
                <div
                    className="w-[3px] flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                />

                <div className="flex-1 min-w-0 p-5">
                    {/* Top meta row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Type chip */}
                            <span
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: `${t.color}14`, color: t.color }}
                            >
                                <Icon className="w-3 h-3" />
                                {t.label}
                            </span>

                            {/* Priority chip — only if not normal */}
                            {a.priority !== "normal" && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    {p.label}
                                </span>
                            )}

                            {/* Pinned badge */}
                            {a.isPinned && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brand }}
                                >
                                    <BsPinAngleFill className="w-2.5 h-2.5" />
                                    Pinned
                                </span>
                            )}
                        </div>

                        {/* Delete */}
                        {isOwn && (
                            <button
                                onClick={() => onDelete(a._id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                            >
                                <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug mb-2">
                        {a.title}
                    </h3>

                    {/* Content */}
                    <p className="text-[13.5px] text-gray-500 leading-[1.7] whitespace-pre-wrap">
                        {a.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                        {/* Author avatar */}
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
                            style={{ backgroundColor: brand }}
                        >
                            {a.author?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-[12px] font-semibold text-gray-500 flex-1 truncate">
                            {a.author?.name || "Unknown"}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0">
                            <FiClock className="w-3 h-3" />
                            <span title={fmt(a.createdAt)}>{timeAgo(a.createdAt)}</span>
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
export default function Announcements() {
    const { hasAccess } = useOutletContext();
    const { institution } = useContext(InstitutionContext);
    const { user } = useAuth();

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const brand = institution?.branding?.primaryColor || "#10b981";
    const rgb = hexToRgb(brand);
    const canPost = hasAccess && ["admin", "teacher"].includes(user?.role);

    useEffect(() => { fetchAll(); }, [institution]);

    const fetchAll = async () => {
        if (!institution) return;
        try {
            setLoading(true);
            const { data } = await announcementAPI.getAll(institution._id);
            setList(data.announcements || []);
        } catch { toast.error("Couldn't load announcements"); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setBusy(true);
        try {
            await announcementAPI.create({ ...form, institution: institution._id });
            toast.success("Posted!"); setModal(false); setForm(EMPTY); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || "Failed to post"); }
        finally { setBusy(false); }
    };

    const handleDelete = async (id) => {
        try {
            await announcementAPI.delete(id);
            setList(p => p.filter(a => a._id !== id));
            toast.success("Removed");
        } catch { toast.error("Couldn't delete"); }
    };

    /* Derived list */
    const base =
        filter === "pinned" ? list.filter(a => a.isPinned) :
            filter === "urgent" ? list.filter(a => a.priority === "urgent") :
                filter === "high" ? list.filter(a => ["high", "urgent"].includes(a.priority)) :
                    list;

    const searched = search.trim()
        ? base.filter(a =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase()))
        : base;

    const pinned = searched.filter(a => a.isPinned);
    const regular = searched.filter(a => !a.isPinned);

    const stats = {
        total: list.length,
        pinned: list.filter(a => a.isPinned).length,
        urgent: list.filter(a => a.priority === "urgent").length,
        today: list.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length,
    };

    /* ─── FILTERS ─── */
    const FILTERS = [
        { key: "all", label: "All", count: list.length },
        { key: "pinned", label: "Pinned", count: stats.pinned },
        { key: "urgent", label: "Urgent", count: stats.urgent },
        { key: "high", label: "High Priority", count: list.filter(a => ["high", "urgent"].includes(a.priority)).length },
    ];

    return (
        <div className="min-h-screen pb-16" style={{ backgroundColor: `rgba(${rgb},0.03)` }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* ── TOP BAR ────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                >
                    {/* Title */}
                    <div className="flex items-center gap-4">
                        <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `rgba(${rgb},0.12)` }}
                        >
                            <FiBell className="w-5 h-5" style={{ color: brand }} />
                        </div>
                        <div>
                            <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Announcements</h1>
                            <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                                {institution?.name}
                            </p>
                        </div>
                    </div>

                    {/* Right: search + post button */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search posts…"
                                className="pl-8 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white outline-none w-44 transition-all focus:w-56"
                                onFocus={inputFocus(brand)}
                                onBlur={e => { inputBlur(e); }}
                            />
                        </div>

                        {/* New Post */}
                        {canPost && (
                            <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-sm hover:shadow-md transition-all flex-shrink-0"
                                style={{ backgroundColor: brand }}
                            >
                                <FiPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Post</span>
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* ── BODY: sidebar + feed ────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── SIDEBAR ─────────────────────────────────────────── */}
                    <motion.aside
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                        className="w-full lg:w-60 flex-shrink-0 space-y-4"
                    >

                        {/* Filters card */}
                        <div
                            className="bg-white rounded-2xl border p-5"
                            style={{ borderColor: `rgba(${rgb},0.15)` }}
                        >
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filter</p>
                            <div className="space-y-1">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all text-left"
                                        style={
                                            filter === f.key
                                                ? { backgroundColor: `rgba(${rgb},0.10)`, color: brand, fontWeight: 600 }
                                                : { color: "#6b7280", fontWeight: 500 }
                                        }
                                    >
                                        <span>{f.label}</span>
                                        <span
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                            style={
                                                filter === f.key
                                                    ? { backgroundColor: `rgba(${rgb},0.15)`, color: brand }
                                                    : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                                            }
                                        >
                                            {f.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.aside>

                    {/* ── MAIN FEED ───────────────────────────────────────── */}
                    <div className="flex-1 min-w-0">

                        {/* No access */}
                        {!hasAccess && (
                            <div
                                className="bg-white rounded-2xl border p-16 text-center"
                                style={{ borderColor: `rgba(${rgb},0.15)` }}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                    style={{ backgroundColor: `rgba(${rgb},0.08)` }}
                                >
                                    <FiLock className="w-6 h-6" style={{ color: `rgba(${rgb},0.4)` }} />
                                </div>
                                <p className="text-[15px] font-extrabold text-gray-800">Members only</p>
                                <p className="text-[13px] text-gray-400 mt-1">
                                    Join <span className="font-semibold text-gray-600">{institution?.name}</span> to view announcements.
                                </p>
                            </div>
                        )}

                        {/* Loading */}
                        {hasAccess && loading && (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                            </div>
                        )}

                        {/* Empty */}
                        {hasAccess && !loading && searched.length === 0 && (
                            <div
                                className="bg-white rounded-2xl border p-14 text-center"
                                style={{ borderColor: `rgba(${rgb},0.15)` }}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                    style={{ backgroundColor: `rgba(${rgb},0.08)` }}
                                >
                                    <FiBell className="w-6 h-6" style={{ color: `rgba(${rgb},0.35)` }} />
                                </div>
                                <p className="text-[15px] font-extrabold text-gray-800">
                                    {search ? "No results found" : filter !== "all" ? "No matching posts" : "Nothing here yet"}
                                </p>
                                <p className="text-[13px] text-gray-400 mt-1">
                                    {search ? `No posts match "${search}"` : "Check back later for updates."}
                                </p>
                            </div>
                        )}

                        {/* Pinned section */}
                        {hasAccess && !loading && pinned.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pinned</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {pinned.map((a, i) => (
                                            <AnnouncementCard
                                                key={a._id} a={a} brand={brand} rgb={rgb}
                                                isOwn={a.author?._id === user?._id}
                                                onDelete={handleDelete} index={i}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Regular section */}
                        {hasAccess && !loading && regular.length > 0 && (
                            <div>
                                {pinned.length > 0 && (
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recent</span>
                                        <div className="flex-1 h-px bg-gray-100" />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {regular.map((a, i) => (
                                            <AnnouncementCard
                                                key={a._id} a={a} brand={brand} rgb={rgb}
                                                isOwn={a.author?._id === user?._id}
                                                onDelete={handleDelete} index={i}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ CREATE MODAL ══════════════════════════════════════════ */}
            <AnimatePresence>
                {modal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Top brand strip */}
                            <div className="h-[4px]"
                                style={{ background: `linear-gradient(90deg, ${brand}, rgba(${rgb},0.25))` }} />

                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `rgba(${rgb},0.10)` }}>
                                            <FiBell className="w-4 h-4" style={{ color: brand }} />
                                        </div>
                                        <div>
                                            <h2 className="text-[16px] font-extrabold text-gray-900">New Announcement</h2>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Broadcast to all members</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setModal(false)}
                                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Title *</label>
                                        <input
                                            required type="text"
                                            placeholder="Announcement title"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all placeholder:text-gray-300"
                                            onFocus={inputFocus(brand)} onBlur={inputBlur}
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Message *</label>
                                        <textarea
                                            required rows={4}
                                            placeholder="Write your message here..."
                                            value={form.content}
                                            onChange={e => setForm({ ...form, content: e.target.value })}
                                            className="w-full px-4 py-3 text-[14px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none resize-none transition-all placeholder:text-gray-300"
                                            onFocus={inputFocus(brand)} onBlur={inputBlur}
                                        />
                                    </div>

                                    {/* Type + Priority */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { field: "type", label: "Type", opts: ["general", "academic", "event", "exam", "urgent"] },
                                            { field: "priority", label: "Priority", opts: ["low", "normal", "high", "urgent"] },
                                        ].map(({ field, label, opts }) => (
                                            <div key={field}>
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
                                                <select
                                                    value={form[field]}
                                                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                                                    className="w-full px-3 py-3 text-[13px] border-2 border-gray-100 rounded-xl bg-gray-50 outline-none transition-all appearance-none"
                                                    onFocus={e => { e.target.style.borderColor = brand; }}
                                                    onBlur={e => { e.target.style.borderColor = ""; }}
                                                >
                                                    {opts.map(o => (
                                                        <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pin toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isPinned: !form.isPinned })}
                                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all text-left"
                                        style={form.isPinned
                                            ? { borderColor: `rgba(${rgb},0.3)`, backgroundColor: `rgba(${rgb},0.05)` }
                                            : { borderColor: "#f3f4f6", backgroundColor: "#f9fafb" }}
                                    >
                                        <div
                                            className="w-10 h-[22px] rounded-full relative flex-shrink-0 transition-all"
                                            style={{ backgroundColor: form.isPinned ? brand : "#d1d5db" }}
                                        >
                                            <div
                                                className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${form.isPinned ? "left-[22px]" : "left-[3px]"}`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-semibold text-gray-700">Pin to top</p>
                                            <p className="text-[11px] text-gray-400">Always display above regular posts</p>
                                        </div>
                                        {form.isPinned && (
                                            <FiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: brand }} />
                                        )}
                                    </button>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            type="button" onClick={() => setModal(false)}
                                            className="flex-1 py-3 text-[13px] font-semibold text-gray-500 rounded-xl border-2 border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            type="submit" disabled={busy}
                                            whileHover={{ scale: busy ? 1 : 1.02 }}
                                            whileTap={{ scale: busy ? 1 : 0.98 }}
                                            className="flex-1 py-3 text-[13px] font-bold text-white rounded-xl shadow-sm disabled:opacity-60 transition-all"
                                            style={{ backgroundColor: brand }}
                                        >
                                            {busy ? "Posting…" : "Post Announcement"}
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
