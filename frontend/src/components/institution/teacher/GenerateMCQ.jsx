import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import toast from "react-hot-toast";
import api from "../../../services/api";
import {
    FiCheckSquare,
    FiPlus,
    FiSave,
    FiSend,
    FiTrash2,
    FiEdit2,
    FiClock,
    FiUsers,
    FiX
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
        : '16, 185, 129';
};

const getMcqClientTimeoutMs = (count, difficulty = "medium") => {
    return 600000;
};

export default function GenerateMCQ() {
    const { user } = useAuth();
    const outletContext = useOutletContext();
    const activeInstitution = outletContext?.currentInstitution || outletContext?.institution;
    const [courses, setCourses] = useState([]);
    const [savedMCQSets, setSavedMCQSets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Generation form state
    const [sourceType, setSourceType] = useState("document"); // document, topic
    const [source, setSource] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState("medium");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [courseDocuments, setCourseDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

    // Generated MCQs
    const [generatedMCQs, setGeneratedMCQs] = useState([]);
    const [editingMcqIndex, setEditingMcqIndex] = useState(null);

    // Save modal
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveMode, setSaveMode] = useState("new"); // new or existing
    const [mcqSetTitle, setMcqSetTitle] = useState("");
    const [mcqSetDescription, setMcqSetDescription] = useState("");
    const [selectedExistingSet, setSelectedExistingSet] = useState("");

    // Assignment modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignMCQSet, setAssignMCQSet] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [dueDate, setDueDate] = useState("");
    const [duration, setDuration] = useState(30);

    const brandColor = activeInstitution?.branding?.primaryColor || '#10b981';
    const rgb = hexToRgb(brandColor);

    useEffect(() => {
        if (user?.role === 'teacher') {
            fetchCourses();
            fetchSavedMCQSets();
        }
    }, [user]);

    useEffect(() => {
        const fetchCourseDocuments = async () => {
            if (!selectedCourse || user?.role !== 'teacher') {
                setCourseDocuments([]);
                setSelectedDocumentIds([]);
                return;
            }

            try {
                setDocumentsLoading(true);
                const response = await api.get(`/teacher/notes/${selectedCourse}`, {
                    params: { _ts: Date.now() },
                    headers: { 'Cache-Control': 'no-cache' },
                });
                const docs = Array.isArray(response.data?.documents) ? response.data.documents : [];
                setCourseDocuments(docs);
                setSelectedDocumentIds([]);
            } catch (error) {
                console.error("Fetch course documents error:", error);
                setCourseDocuments([]);
                setSelectedDocumentIds([]);
            } finally {
                setDocumentsLoading(false);
            }
        };

        fetchCourseDocuments();
    }, [selectedCourse, user?.role]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/teacher/authorized-courses');
            const coursesData = response.data.courses || [];
            setCourses(coursesData);

            if (!selectedCourse && coursesData.length > 0) {
                setSelectedCourse(coursesData[0]._id);
            }

            if (coursesData.length === 0) {
                toast.error('No authorized courses found. Contact your admin.');
            }
        } catch (error) {
            console.error("Fetch courses error:", error);
            toast.error(error.response?.data?.message || "Failed to load courses");
        }
    };

    const fetchSavedMCQSets = async () => {
        try {
            const response = await api.get('/teacher/mcq/sets');
            setSavedMCQSets(response.data.mcqSets || []);
        } catch (error) {
            console.error("Fetch MCQ sets error:", error);
        }
    };

    const fetchStudents = async (courseId) => {
        try {
            const response = await api.get(`/teacher/students?courseId=${courseId}`);
            setStudents(response.data.students || []);
        } catch (error) {
            console.error("Fetch students error:", error);
            setStudents([]);
        }
    };

    const handleGenerateMCQs = async () => {
        if (sourceType === "topic" && !source.trim()) {
            toast.error("Please enter topic details");
            return;
        }

        if (sourceType === "document" && selectedDocumentIds.length === 0) {
            toast.error("Please select at least one document");
            return;
        }

        try {
            setGenerating(true);
            const normalizedTopic = source.trim();
            const requestTimeoutMs = getMcqClientTimeoutMs(numQuestions, difficulty);
            const response = await api.post(
                "/teacher/mcq/generate",
                {
                    courseId: selectedCourse,
                    topic: normalizedTopic || "Generate MCQs from selected documents",
                    count: parseInt(numQuestions),
                    difficulty,
                    sourceType,
                    documentId: selectedDocumentIds[0] || null,
                    documentIds: selectedDocumentIds,
                },
                {
                    timeout: requestTimeoutMs,
                }
            );

            const normalizedMcqs = normalizeGeneratedMcqs(response.data.mcqs || []);
            setGeneratedMCQs(normalizedMcqs);
            toast.success(`Generated ${normalizedMcqs.length || 0} MCQs!`);
        } catch (error) {
            console.error("Generate MCQs error:", {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            });
            const serverMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to generate MCQs";
            toast.error(serverMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveMCQs = async () => {
        if (generatedMCQs.length === 0) {
            toast.error("No MCQs to save");
            return;
        }

        if (!selectedCourse) {
            toast.error("Please select a course");
            return;
        }

        try {
            if (saveMode === "new") {
                if (!mcqSetTitle.trim()) {
                    toast.error("Please enter a title");
                    return;
                }

                await api.post("/teacher/mcq/save", {
                    title: mcqSetTitle.trim(),
                    description: mcqSetDescription.trim(),
                    courseId: selectedCourse,
                    mcqs: generatedMCQs.map(mcq => ({
                        question: mcq.question,
                        options: [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d],
                        correctAnswer: mcq.correct_answer,
                        explanation: mcq.explanation || "",
                        difficulty: mcq.difficulty || difficulty
                    }))
                });

                toast.success("MCQ set saved successfully!");
            } else {
                if (!selectedExistingSet) {
                    toast.error("Please select an existing set");
                    return;
                }

                await api.post(`/teacher/mcq/${selectedExistingSet}/add`, {
                    mcqs: generatedMCQs.map(mcq => ({
                        question: mcq.question,
                        options: [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d],
                        correctAnswer: mcq.correct_answer,
                        explanation: mcq.explanation || "",
                        difficulty: mcq.difficulty || difficulty
                    }))
                });

                toast.success("Questions added to existing set!");
            }

            // Reset and refresh
            setShowSaveModal(false);
            setGeneratedMCQs([]);
            setSource("");
            setMcqSetTitle("");
            setMcqSetDescription("");
            fetchSavedMCQSets();
        } catch (error) {
            console.error("Save MCQs error:", error);
            toast.error(error.response?.data?.error || "Failed to save MCQs");
        }
    };

    const handleAssignMCQSet = async () => {
        if (selectedStudents.length === 0) {
            toast.error("Please select at least one student");
            return;
        }

        if (!dueDate) {
            toast.error("Please set a due date");
            return;
        }

        try {
            await api.post(`/teacher/mcq/${assignMCQSet._id}/assign`, {
                studentIds: selectedStudents,
                dueDate,
                duration: parseInt(duration)
            });

            toast.success("MCQ set assigned successfully!");
            setShowAssignModal(false);
            setAssignMCQSet(null);
            setSelectedStudents([]);
            fetchSavedMCQSets();
        } catch (error) {
            console.error("Assign MCQ error:", error);
            toast.error(error.response?.data?.error || "Failed to assign MCQ set");
        }
    };

    const openAssignModal = (mcqSet) => {
        setAssignMCQSet(mcqSet);
        fetchStudents(mcqSet.course._id);
        setShowAssignModal(true);
    };

    const toggleDocument = (docId) => {
        const id = String(docId);
        setSelectedDocumentIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAllDocuments = () => {
        setSelectedDocumentIds(courseDocuments.map((doc) => String(doc._id)));
    };

    const clearSelectedDocuments = () => {
        setSelectedDocumentIds([]);
    };

    const normalizeCorrectAnswerIndex = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return Math.max(0, Math.min(3, Math.floor(value)));
        }
        if (typeof value === "string") {
            const v = value.trim().toUpperCase();
            if (/^[A-D]$/.test(v)) return v.charCodeAt(0) - 65;
            const n = Number(v);
            if (Number.isFinite(n)) return Math.max(0, Math.min(3, Math.floor(n)));
        }
        return 0;
    };

    const normalizeGeneratedMcqs = (mcqs = []) => {
        if (!Array.isArray(mcqs)) return [];

        return mcqs
            .filter((mcq) => mcq && typeof mcq === 'object')
            .map((mcq) => {
                // Backend can return options as:
                //   1. Array   ["opt a", "opt b", "opt c", "opt d"]
                //   2. Dict    {A: "opt a", B: "opt b", C: "opt c", D: "opt d"}
                //   3. Flat    option_a / option_b / option_c / option_d fields
                let optA = '', optB = '', optC = '', optD = '';

                if (Array.isArray(mcq?.options)) {
                    const arr = mcq.options.map((o) => String(o ?? '').trim());
                    optA = arr[0] ?? '';
                    optB = arr[1] ?? '';
                    optC = arr[2] ?? '';
                    optD = arr[3] ?? '';
                } else if (mcq?.options && typeof mcq.options === 'object') {
                    optA = String(mcq.options.A ?? mcq.options.a ?? '').trim();
                    optB = String(mcq.options.B ?? mcq.options.b ?? '').trim();
                    optC = String(mcq.options.C ?? mcq.options.c ?? '').trim();
                    optD = String(mcq.options.D ?? mcq.options.d ?? '').trim();
                }

                // Fall back to flat fields if dict/array left something empty
                optA = optA || String(mcq?.option_a ?? '').trim();
                optB = optB || String(mcq?.option_b ?? '').trim();
                optC = optC || String(mcq?.option_c ?? '').trim();
                optD = optD || String(mcq?.option_d ?? '').trim();

                // Derive the correct answer index (0-3)
                // backend returns either a letter ("A") or an index (0)
                const rawCorrect = mcq?.correct_answer ?? mcq?.correctAnswer;
                const correctIndex = normalizeCorrectAnswerIndex(rawCorrect);

                return {
                    ...mcq,
                    question: String(mcq?.question || 'Question').trim(),
                    option_a: optA || 'Option A',
                    option_b: optB || 'Option B',
                    option_c: optC || 'Option C',
                    option_d: optD || 'Option D',
                    correct_answer: correctIndex,
                    explanation: String(mcq?.explanation || '').trim(),
                    difficulty: String(mcq?.difficulty || difficulty).toLowerCase(),
                };
            })
            .filter((mcq) => mcq.question && mcq.option_a);
    };

    const updateGeneratedMcqField = (index, field, value) => {
        setGeneratedMCQs((prev) =>
            prev.map((mcq, i) => (i === index ? { ...mcq, [field]: value } : mcq))
        );
    };

    return (
        <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.02)` }}>
            <div className="max-w-7xl mx-auto">
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
                            <HiSparkles className="text-2xl" style={{ color: brandColor }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                Generate MCQs
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                Create multiple choice questions powered by artificial intelligence
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* left column: Input Form */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Course Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6"
                        >
                            <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider mb-4">
                                1. Select Course
                            </h2>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                                style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                            >
                                <option value="">Choose a course...</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.code} - {course.name}
                                    </option>
                                ))}
                            </select>
                        </motion.div>

                        {/* Generation Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 flex flex-col"
                        >
                            <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider mb-5">
                                2. AI Parameters
                            </h2>

                            {/* Source Type */}
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                    Source Type
                                </label>
                                <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-gray-50/80 border border-gray-100">
                                    {[
                                        { value: "document", label: "Document" },
                                        { value: "topic", label: "Topic" }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setSourceType(type.value)}
                                            className={`
                                                px-4 py-2.5 rounded-lg font-bold text-[13px] transition-all
                                                ${sourceType === type.value
                                                    ? "shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                }
                                            `}
                                            style={{
                                                backgroundColor: sourceType === type.value ? brandColor : 'transparent',
                                                color: sourceType === type.value ? '#ffffff' : undefined,
                                            }}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Source Input (Topic mode only) */}
                            {sourceType === "topic" && (
                                <div className="mb-5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Topic Details
                                    </label>
                                    <textarea
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        placeholder="Enter a topic (e.g., 'Data Structures')..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all resize-none"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                    />
                                </div>
                            )}

                            {sourceType === "document" && (
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Available Documents
                                        </label>
                                        {courseDocuments.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={selectAllDocuments}
                                                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                                                >
                                                    Select all
                                                </button>
                                                <button
                                                    onClick={clearSelectedDocuments}
                                                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {documentsLoading ? (
                                        <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-500">
                                            Loading course documents...
                                        </div>
                                    ) : courseDocuments.length === 0 ? (
                                        <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-500">
                                            No uploaded documents found for selected course.
                                        </div>
                                    ) : (
                                        <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 space-y-1.5">
                                            {courseDocuments.map((doc) => {
                                                const id = String(doc._id);
                                                const checked = selectedDocumentIds.includes(id);
                                                return (
                                                    <label
                                                        key={id}
                                                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${checked ? "bg-white border-emerald-200" : "border-transparent hover:bg-white"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleDocument(id)}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[12px] font-semibold text-gray-800 truncate">
                                                                {doc.originalName || doc.fileName || "Document"}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                                {Number(doc.chunksCount || 0)} chunks
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <p className="mt-2 text-[11px] text-gray-500 font-medium">
                                        {selectedDocumentIds.length} document(s) selected
                                    </p>
                                </div>
                            )}

                            {/* Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Quantity
                                    </label>
                                    <select
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-bold text-[14px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-bold text-[14px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateMCQs}
                                disabled={generating || !selectedCourse}
                                className={`
                                    w-full py-4 rounded-xl font-bold text-white 
                                    transition-all flex items-center justify-center gap-2 mt-auto
                                    ${generating || !selectedCourse
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                        : "hover:-translate-y-0.5"
                                    }
                                `}
                                style={{
                                    backgroundColor: generating || !selectedCourse ? undefined : brandColor,
                                    boxShadow: generating || !selectedCourse ? undefined : `0 6px 20px -4px rgba(${rgb}, 0.5)`
                                }}
                            >
                                {generating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <HiSparkles className="w-5 h-5" />
                                        Generate Questions
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>

                    {/* right column: Generated MCQs Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8 flex flex-col h-[calc(100vh-140px)] min-h-[600px]"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider">
                                    3. Preview Generated Content
                                </h2>
                                <p className="text-xs font-semibold text-gray-400 mt-1">Review the AI output before saving</p>
                            </div>
                            {generatedMCQs.length > 0 && (
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center gap-2 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Save This Set
                                </button>
                            )}
                        </div>

                        {generatedMCQs.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `rgba(${rgb},0.08)` }}>
                                    <FiCheckSquare className="w-8 h-8 opacity-50" style={{ color: brandColor }} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700">Empty Output</h3>
                                <p className="text-sm font-medium text-gray-400 mt-1 max-w-sm text-center">
                                    Fill out the parameters and click "Generate Questions" to see the AI output here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
                                {generatedMCQs.map((mcq, index) => (
                                    <div
                                        key={index}
                                        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: brandColor }} />
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500 shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3 mb-4 mt-1">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Question {index + 1}
                                                    </p>
                                                    <button
                                                        onClick={() => setEditingMcqIndex(editingMcqIndex === index ? null : index)}
                                                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5"
                                                    >
                                                        <FiEdit2 className="w-3.5 h-3.5" />
                                                        {editingMcqIndex === index ? "Done" : "Edit"}
                                                    </button>
                                                </div>

                                                {editingMcqIndex === index ? (
                                                    <textarea
                                                        value={mcq.question}
                                                        onChange={(e) => updateGeneratedMcqField(index, "question", e.target.value)}
                                                        rows={3}
                                                        className="w-full mb-4 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 text-[14px] font-semibold"
                                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                                    />
                                                ) : (
                                                    <h3 className="font-bold text-gray-900 mb-4 leading-relaxed text-[15px]">
                                                        {mcq.question}
                                                    </h3>
                                                )}

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {[
                                                        { label: "A", field: "option_a", text: mcq.option_a },
                                                        { label: "B", field: "option_b", text: mcq.option_b },
                                                        { label: "C", field: "option_c", text: mcq.option_c },
                                                        { label: "D", field: "option_d", text: mcq.option_d }
                                                    ].map((option, idx) => {
                                                        const isCorrect = idx === mcq.correct_answer;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`
                                                                    p-3.5 rounded-xl flex items-start gap-3 border-2 transition-all
                                                                    ${isCorrect
                                                                        ? "bg-green-50/50 border-green-500"
                                                                        : "bg-gray-50 border-transparent"
                                                                    }
                                                                `}
                                                            >
                                                                <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-white text-gray-500 shadow-sm"}`}>
                                                                    {option.label}
                                                                </span>
                                                                {editingMcqIndex === index ? (
                                                                    <div className="flex-1 min-w-0 space-y-2">
                                                                        <input
                                                                            value={option.text}
                                                                            onChange={(e) => updateGeneratedMcqField(index, option.field, e.target.value)}
                                                                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:ring-2"
                                                                            style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                                                        />
                                                                        <div className="flex items-center justify-between">
                                                                            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 whitespace-nowrap">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`correct-answer-${index}`}
                                                                                    checked={isCorrect}
                                                                                    onChange={() => updateGeneratedMcqField(index, "correct_answer", idx)}
                                                                                />
                                                                                Mark as correct
                                                                            </label>
                                                                            {isCorrect && (
                                                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                                                    Correct
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className={`text-[13px] mt-0.5 font-medium ${isCorrect ? "text-green-900" : "text-gray-700"}`}>
                                                                        {option.text}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* AI Explanation hidden per user request */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Saved MCQ Sets Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">
                                Your Saved Question Sets
                            </h2>
                            <p className="text-gray-500 font-medium mt-1">
                                Manage and assign your generated question sets
                            </p>
                        </div>
                    </div>

                    {savedMCQSets.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50">
                            <FiSave className="w-10 h-10 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 font-bold">No question sets saved yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedMCQSets.map((set) => (
                                <motion.div
                                    key={set._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all group flex flex-col h-full hover:border-transparent"
                                    style={{ hover: { borderColor: brandColor } }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[var(--brandColor)] transition-colors pr-2 break-words" style={{ '--brandColor': brandColor }}>
                                            {set.title}
                                        </h3>
                                        {set.isAssigned && (
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-green-100 text-green-700 shrink-0 mt-1">
                                                Assigned
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 pb-4 border-b border-gray-50">
                                        {set.course?.code} - {set.course?.name}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mb-6 mt-auto">
                                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                                            <FiCheckSquare className="w-4 h-4 text-gray-400" />
                                            {set.questions?.length || 0} QS
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                                            <FiClock className="w-4 h-4 text-gray-400" />
                                            {set.duration || 30}m
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openAssignModal(set)}
                                        disabled={set.isAssigned}
                                        className={`
                                            w-full py-3 rounded-xl font-bold transition-all
                                            flex items-center justify-center gap-2
                                            ${set.isAssigned
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-transparent"
                                                : "text-white hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                            }
                                        `}
                                        style={{
                                            backgroundColor: set.isAssigned ? undefined : brandColor
                                        }}
                                    >
                                        <FiSend className="w-4 h-4" />
                                        {set.isAssigned ? "Assigned" : "Assign to Students"}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Save Modal */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <h2 className="text-xl font-black text-gray-900">
                                    Save Question Set
                                </h2>
                                <button onClick={() => setShowSaveModal(false)} className="p-2 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Save Mode Selection */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                    Action
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-gray-50">
                                    <button
                                        onClick={() => setSaveMode("new")}
                                        className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${saveMode === "new" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                                    >
                                        Create New
                                    </button>
                                    <button
                                        onClick={() => setSaveMode("existing")}
                                        className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${saveMode === "existing" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                                    >
                                        Add to Existing
                                    </button>
                                </div>
                            </div>

                            {saveMode === "new" ? (
                                <>
                                    <div className="mb-5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={mcqSetTitle}
                                            onChange={(e) => setMcqSetTitle(e.target.value)}
                                            placeholder="e.g. Midterm Rev.1"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                                            style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                        />
                                    </div>
                                    <div className="mb-8">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Description <span className="text-gray-400 font-semibold normal-case">(optional)</span>
                                        </label>
                                        <textarea
                                            value={mcqSetDescription}
                                            onChange={(e) => setMcqSetDescription(e.target.value)}
                                            placeholder="Enter context..."
                                            rows={2}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all resize-none"
                                            style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Select Target Set <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedExistingSet}
                                        onChange={(e) => setSelectedExistingSet(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[14px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                    >
                                        <option value="">Choose...</option>
                                        {savedMCQSets
                                            .filter(set => set.course._id === selectedCourse)
                                            .map((set) => (
                                                <option key={set._id} value={set._id}>
                                                    {set.title} ({set.questions?.length || 0} questions)
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMCQs}
                                    className="flex-1 px-4 py-3.5 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    Confirm Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && assignMCQSet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-black text-gray-900">
                                    Issue Assignment
                                </h2>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[13px] font-bold text-gray-400 mb-6 uppercase tracking-wider">
                                {assignMCQSet.title}
                            </p>

                            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                                {/* Settings */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Due Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[13px] transition-all"
                                            style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Duration limit
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                min="5"
                                                max="180"
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[13px] transition-all outline-none"
                                                style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Students Selection */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Enrolled Students <span className="text-red-500">*</span>
                                        </label>
                                        {students.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (selectedStudents.length === students.length) {
                                                        setSelectedStudents([]);
                                                    } else {
                                                        setSelectedStudents(students.map(s => s._id));
                                                    }
                                                }}
                                                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 border px-2 py-0.5 rounded-md"
                                            >
                                                {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                        <div className="max-h-52 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                                            {students.map((student) => {
                                                const isSelected = selectedStudents.includes(student._id);
                                                return (
                                                    <label
                                                        key={student._id}
                                                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${isSelected ? "bg-white border-transparent shadow-sm" : "border-transparent hover:bg-gray-100/50"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedStudents([...selectedStudents, student._id]);
                                                                } else {
                                                                    setSelectedStudents(
                                                                        selectedStudents.filter(id => id !== student._id)
                                                                    );
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-1"
                                                            style={{ accentColor: brandColor, '--tw-ring-color': brandColor }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-[14px] text-gray-900 truncate">
                                                                {student.fullName}
                                                            </p>
                                                            <p className="text-[12px] font-semibold text-gray-400 truncate mt-0.5">
                                                                {student.email}
                                                            </p>
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                            {students.length === 0 && (
                                                <div className="p-6 text-center text-sm font-bold text-gray-400">
                                                    No students enrolled in this course.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignMCQSet}
                                    disabled={selectedStudents.length === 0 || !dueDate}
                                    className={`
                                        flex-1 px-4 py-3.5 rounded-xl font-bold transition-all shadow-md
                                        ${selectedStudents.length === 0 || !dueDate
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                            : "text-white hover:-translate-y-0.5 hover:shadow-lg"
                                        }
                                    `}
                                    style={{ backgroundColor: selectedStudents.length === 0 || !dueDate ? undefined : brandColor }}
                                >
                                    Assign Set
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
