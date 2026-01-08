// GenerateMCQ.jsx - AI-powered MCQ generation for teachers
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
    FiUsers
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

export default function GenerateMCQ() {
    const { user } = useAuth();
    const { currentInstitution } = useOutletContext();
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

    // Generated MCQs
    const [generatedMCQs, setGeneratedMCQs] = useState([]);
    
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

    useEffect(() => {
        if (currentInstitution?._id) {
            fetchCourses();
            fetchSavedMCQSets();
        }
    }, [currentInstitution]);

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

    const fetchSavedMCQSets = async () => {
        try {
            const response = await api.get(
                `/teacher-mcq/mcq/sets?institutionId=${currentInstitution._id}`
            );
            setSavedMCQSets(response.data.mcqSets || []);
        } catch (error) {
            console.error("Fetch MCQ sets error:", error);
        }
    };

    const fetchStudents = async (courseId) => {
        try {
            // Fetch students enrolled in the course
            const response = await api.get(
                `/teacher/students?institutionId=${currentInstitution._id}&courseId=${courseId}`
            );
            setStudents(response.data.students || []);
        } catch (error) {
            console.error("Fetch students error:", error);
            setStudents([]);
        }
    };

    const handleGenerateMCQs = async () => {
        if (!source.trim()) {
            toast.error("Please enter source content");
            return;
        }

        try {
            setGenerating(true);
            const response = await api.post("/teacher-mcq/mcq/generate", {
                sourceType,
                source: source.trim(),
                numQuestions: parseInt(numQuestions),
                difficulty
            });

            setGeneratedMCQs(response.data.mcqs || []);
            toast.success(`Generated ${response.data.count} MCQs!`);
        } catch (error) {
            console.error("Generate MCQs error:", error);
            toast.error(error.response?.data?.error || "Failed to generate MCQs");
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

                await api.post("/teacher-mcq/mcq/save", {
                    title: mcqSetTitle.trim(),
                    description: mcqSetDescription.trim(),
                    courseId: selectedCourse,
                    institutionId: currentInstitution._id,
                    questions: generatedMCQs.map(mcq => ({
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

                await api.post(`/teacher-mcq/mcq/${selectedExistingSet}/add`, {
                    questions: generatedMCQs.map(mcq => ({
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
            await api.post(`/teacher-mcq/mcq/${assignMCQSet._id}/assign`, {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        <HiSparkles className="text-purple-600" />
                        Generate MCQs with AI
                    </h1>
                    <p className="text-gray-600">
                        Create multiple choice questions using artificial intelligence
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Generation Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Course Selection */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Select Course
                            </h2>
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

                        {/* Generation Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Generate Questions
                            </h2>

                            {/* Source Type */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Source Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "document", label: "Document" },
                                        { value: "topic", label: "Topic" }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setSourceType(type.value)}
                                            className={`
                                                px-4 py-2 rounded-lg font-semibold transition-all
                                                ${sourceType === type.value
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }
                                            `}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Source Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {sourceType === "document" && "Document Name"}
                                    {sourceType === "topic" && "Enter Topic"}
                                </label>
                                <textarea
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder={
                                        sourceType === "document"
                                            ? "Enter the document name from uploaded notes..."
                                            : "Enter a topic (e.g., 'Data Structures')..."
                                    }
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                             focus:border-purple-500 focus:ring focus:ring-purple-200 
                                             transition-all resize-none"
                                />
                            </div>

                            {/* Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Number of Questions
                                    </label>
                                    <input
                                        type="number"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(e.target.value)}
                                        min="1"
                                        max="20"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                 focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                 focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                 transition-all"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <motion.button
                                onClick={handleGenerateMCQs}
                                disabled={generating || !selectedCourse}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    w-full py-4 rounded-xl font-bold text-white 
                                    transition-all shadow-lg flex items-center justify-center gap-2
                                    ${generating || !selectedCourse
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl"
                                    }
                                `}
                            >
                                {generating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent 
                                                      rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <HiSparkles className="w-5 h-5" />
                                        Generate MCQs
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Generated MCQs Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Generated MCQs ({generatedMCQs.length})
                            </h2>
                            {generatedMCQs.length > 0 && (
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg 
                                             hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Save
                                </button>
                            )}
                        </div>

                        {generatedMCQs.length === 0 ? (
                            <div className="text-center py-12">
                                <FiCheckSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">
                                    Generated MCQs will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                                {generatedMCQs.map((mcq, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 rounded-xl border-2 border-purple-200 
                                                 bg-purple-50"
                                    >
                                        <h3 className="font-bold text-gray-900 mb-3">
                                            Q{index + 1}. {mcq.question}
                                        </h3>
                                        <div className="space-y-2">
                                            {[
                                                { label: "A", text: mcq.option_a },
                                                { label: "B", text: mcq.option_b },
                                                { label: "C", text: mcq.option_c },
                                                { label: "D", text: mcq.option_d }
                                            ].map((option, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`
                                                        p-3 rounded-lg flex items-center gap-3
                                                        ${idx === mcq.correct_answer
                                                            ? "bg-green-100 border-2 border-green-500"
                                                            : "bg-white border border-gray-300"
                                                        }
                                                    `}
                                                >
                                                    <span className="font-bold text-gray-700">
                                                        {option.label}.
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {option.text}
                                                    </span>
                                                    {idx === mcq.correct_answer && (
                                                        <span className="ml-auto text-green-600 font-semibold">
                                                            ✓ Correct
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {mcq.explanation && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Explanation:</span> {mcq.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Saved MCQ Sets Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-white rounded-2xl shadow-xl p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Saved MCQ Sets
                    </h2>

                    {savedMCQSets.length === 0 ? (
                        <div className="text-center py-12">
                            <FiCheckSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No saved MCQ sets yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedMCQSets.map((set) => (
                                <motion.div
                                    key={set._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-xl border-2 border-gray-200 
                                             hover:border-purple-300 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="font-bold text-gray-900 text-lg 
                                                     group-hover:text-purple-600 transition-colors">
                                            {set.title}
                                        </h3>
                                        {set.isAssigned && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 
                                                         text-xs font-semibold rounded">
                                                Assigned
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-4">
                                        {set.course?.name}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <span>{set.questions?.length || 0} questions</span>
                                        <span>•</span>
                                        <span>{set.duration || 30} mins</span>
                                    </div>

                                    <button
                                        onClick={() => openAssignModal(set)}
                                        disabled={set.isAssigned}
                                        className={`
                                            w-full py-2 rounded-lg font-semibold transition-all
                                            flex items-center justify-center gap-2
                                            ${set.isAssigned
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-purple-600 text-white hover:bg-purple-700"
                                            }
                                        `}
                                    >
                                        <FiSend className="w-4 h-4" />
                                        {set.isAssigned ? "Already Assigned" : "Assign to Students"}
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
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                                 justify-center z-50 p-4"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full 
                                     max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Save MCQ Set
                            </h2>

                            {/* Save Mode Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Save as
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSaveMode("new")}
                                        className={`
                                            px-4 py-2 rounded-lg font-semibold transition-all
                                            ${saveMode === "new"
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }
                                        `}
                                    >
                                        New Set
                                    </button>
                                    <button
                                        onClick={() => setSaveMode("existing")}
                                        className={`
                                            px-4 py-2 rounded-lg font-semibold transition-all
                                            ${saveMode === "existing"
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }
                                        `}
                                    >
                                        Add to Existing
                                    </button>
                                </div>
                            </div>

                            {saveMode === "new" ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={mcqSetTitle}
                                            onChange={(e) => setMcqSetTitle(e.target.value)}
                                            placeholder="E.g., Data Structures Mid-Term"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                     focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                     transition-all"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={mcqSetDescription}
                                            onChange={(e) => setMcqSetDescription(e.target.value)}
                                            placeholder="Brief description of this MCQ set..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                     focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                     transition-all resize-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Select Existing Set *
                                    </label>
                                    <select
                                        value={selectedExistingSet}
                                        onChange={(e) => setSelectedExistingSet(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                 focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                 transition-all"
                                    >
                                        <option value="">Choose a set...</option>
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
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 
                                             rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMCQs}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 
                                             to-blue-600 text-white rounded-xl font-semibold 
                                             hover:shadow-lg transition-all"
                                >
                                    Save
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
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                                 justify-center z-50 p-4"
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full 
                                     max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Assign MCQ Set
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {assignMCQSet.title}
                            </p>

                            {/* Students Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Students *
                                </label>
                                <div className="max-h-60 overflow-y-auto border-2 border-gray-200 
                                              rounded-xl p-4 space-y-2">
                                    {students.map((student) => (
                                        <label
                                            key={student._id}
                                            className="flex items-center gap-3 p-3 rounded-lg 
                                                     hover:bg-purple-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStudents([...selectedStudents, student._id]);
                                                    } else {
                                                        setSelectedStudents(
                                                            selectedStudents.filter(id => id !== student._id)
                                                        );
                                                    }
                                                }}
                                                className="w-5 h-5 text-purple-600 rounded 
                                                         focus:ring-purple-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">
                                                    {student.fullName}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {students.length === 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        No students found for this course
                                    </p>
                                )}
                            </div>

                            {/* Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Due Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                 focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        min="5"
                                        max="180"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                                                 focus:border-purple-500 focus:ring focus:ring-purple-200 
                                                 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 
                                             rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignMCQSet}
                                    disabled={selectedStudents.length === 0 || !dueDate}
                                    className={`
                                        flex-1 px-6 py-3 rounded-xl font-semibold transition-all
                                        ${selectedStudents.length === 0 || !dueDate
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg"
                                        }
                                    `}
                                >
                                    Assign MCQ Set
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
