import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle,
  FiSend,
  FiThumbsUp,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiUser,
  FiBookOpen,
  FiEye,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../../context/authcontext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { qaAPI, academicAPI } from "../../../services/api";

export default function QASection() {
  const { user } = useAuth();
  const { institution } = useOutletContext();
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [qas, setQas] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedQA, setSelectedQA] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "normal",
    tags: [],
    isAnonymous: false,
  });
  const [newAnswer, setNewAnswer] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [tagInput, setTagInput] = useState("");

  const brandColor = institution?.branding?.primaryColor || "#3b82f6";
  const canAnswer = user?.role === 'teacher' || user?.role === 'admin';

  const categories = [
    { value: "general", label: "General", color: "blue" },
    { value: "technical", label: "Technical", color: "purple" },
    { value: "academic", label: "Academic", color: "green" },
    { value: "assignment", label: "Assignment", color: "orange" },
    { value: "exam", label: "Exam", color: "red" },
    { value: "other", label: "Other", color: "gray" },
  ];

  const priorities = [
    { value: "low", label: "Low", color: "gray" },
    { value: "normal", label: "Normal", color: "blue" },
    { value: "high", label: "High", color: "orange" },
    { value: "urgent", label: "Urgent", color: "red" },
  ];

  // Fetch courses for the institution
  useEffect(() => {
    if (institution?._id) {
      fetchCourses();
    }
  }, [institution?._id]);

  // Fetch Q&As when course changes
  useEffect(() => {
    if (selectedCourse?._id) {
      fetchQAs();
      fetchStats();
    }
  }, [selectedCourse?._id, filter, categoryFilter, searchQuery, sortBy]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      console.log("Fetching courses for institution:", institution._id);
      
      const response = await academicAPI.getCourses(institution._id, {});
      console.log("Courses API response:", response.data);
      
      const coursesData = response.data.courses || [];
      console.log("Courses found:", coursesData.length);
      
      setCourses(coursesData);
      
      // Auto-select first course if available
      if (coursesData.length > 0) {
        console.log("Auto-selecting first course:", coursesData[0].name);
        setSelectedCourse(coursesData[0]);
      } else {
        console.warn("No courses available in institution");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };
  

  const fetchQAs = async () => {
    if (!selectedCourse?._id) return;

    try {
      setLoading(true);
      
      const params = {
        status: filter !== "all" ? filter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: searchQuery || undefined,
        sort: sortBy,
      };

      const response = await qaAPI.getByCourse(selectedCourse._id, params);
      setQas(response.data.qas || []);
    } catch (error) {
      console.error("Error fetching Q&As:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedCourse?._id) return;

    try {
      const response = await qaAPI.getStatsByCourse(selectedCourse._id);
      setStats(response.data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!selectedCourse?._id) {
      toast.error("Please select a course first");
      return;
    }

    if (!newQuestion.title.trim() || !newQuestion.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await qaAPI.create(selectedCourse._id, {
        ...newQuestion,
        tags: newQuestion.tags.filter(tag => tag.trim() !== ""),
      });

      setQas([response.data.qa, ...qas]);
      toast.success("Question posted successfully!");
      setShowAskModal(false);
      setNewQuestion({
        title: "",
        description: "",
        category: "general",
        priority: "normal",
        tags: [],
        isAnonymous: false,
      });
      fetchStats();
    } catch (error) {
      console.error("Error posting question:", error);
      toast.error(error.response?.data?.message || "Failed to post question");
    }
  };

  const handleAddAnswer = async () => {
    if (!canAnswer) {
      toast.error("Only teachers and admins can answer questions");
      return;
    }

    if (!newAnswer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      const response = await qaAPI.addAnswer(selectedQA._id, { text: newAnswer });
      
      setSelectedQA(response.data.qa);
      setQas(qas.map(qa => qa._id === selectedQA._id ? response.data.qa : qa));
      
      setNewAnswer("");
      toast.success("Answer posted successfully!");
      fetchStats();
    } catch (error) {
      console.error("Error posting answer:", error);
      toast.error(error.response?.data?.message || "Failed to post answer");
    }
  };

  const handleUpvoteQA = async (qaId) => {
    try {
      const response = await qaAPI.upvoteQA(qaId);
      
      setQas(qas.map(qa => 
        qa._id === qaId 
          ? { ...qa, upvotes: Array(response.data.upvotes).fill(null) } 
          : qa
      ));

      if (selectedQA?._id === qaId) {
        setSelectedQA({ ...selectedQA, upvotes: Array(response.data.upvotes).fill(null) });
      }
    } catch (error) {
      console.error("Error upvoting:", error);
      toast.error("Failed to upvote");
    }
  };

  const handleUpvoteAnswer = async (qaId, answerId) => {
    try {
      await qaAPI.upvoteAnswer(qaId, answerId);
      
      const updatedQA = await qaAPI.getById(qaId);
      setSelectedQA(updatedQA.data.qa);
      setQas(qas.map(qa => qa._id === qaId ? updatedQA.data.qa : qa));
    } catch (error) {
      console.error("Error upvoting answer:", error);
      toast.error("Failed to upvote answer");
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      const response = await qaAPI.acceptAnswer(selectedQA._id, answerId);
      
      setSelectedQA(response.data.qa);
      setQas(qas.map(qa => qa._id === selectedQA._id ? response.data.qa : qa));
      
      toast.success("Answer accepted!");
      fetchStats();
    } catch (error) {
      console.error("Error accepting answer:", error);
      toast.error(error.response?.data?.message || "Failed to accept answer");
    }
  };

  const handleUpdateStatus = async (qaId, newStatus) => {
    if (!canAnswer) {
      toast.error("Only teachers and admins can update status");
      return;
    }

    try {
      const response = await qaAPI.updateStatus(qaId, newStatus);
      
      setQas(qas.map(qa => qa._id === qaId ? response.data.qa : qa));
      if (selectedQA?._id === qaId) {
        setSelectedQA(response.data.qa);
      }
      
      toast.success("Status updated!");
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newQuestion.tags.includes(tagInput.trim())) {
      setNewQuestion({
        ...newQuestion,
        tags: [...newQuestion.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewQuestion({
      ...newQuestion,
      tags: newQuestion.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-yellow-100 text-yellow-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "closed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "normal": return "bg-blue-100 text-blue-700";
      case "low": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: brandColor }}
          />
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Available</h2>
          <p className="text-gray-600">Please create courses in the Academic Structure section first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Course Selector */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-gray-900 mb-4 flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <HiSparkles style={{ color: brandColor }} className="w-6 h-6" />
              </div>
              <span>Q&A Section</span>
            </h1>

            {/* Course Selector */}
            <div className="bg-white rounded-xl p-4 shadow-lg max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse?._id || ""}
                onChange={(e) => {
                  const course = courses.find(c => c._id === e.target.value);
                  setSelectedCourse(course);
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
              >
                <option value="">-- Select a Course --</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            {!canAnswer && (
              <p className="text-sm text-orange-600 mt-3">
                💡 Only teachers can answer questions. You can ask questions and upvote answers.
              </p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!selectedCourse) {
                toast.error("Please select a course first");
                return;
              }
              setShowAskModal(true);
            }}
            className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            style={{ backgroundColor: brandColor }}
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>Ask Question</span>
          </motion.button>
        </div>

        {/* Only show content if course is selected */}
        {!selectedCourse ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Course Selected</h3>
            <p className="text-gray-600">Please select a course from the dropdown above to view Q&A section</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", value: stats.total, icon: FiMessageCircle, color: "blue" },
                { label: "Open", value: stats.open, icon: FiAlertCircle, color: "yellow" },
                { label: "In Progress", value: stats.inProgress, icon: FiClock, color: "blue" },
                { label: "Resolved", value: stats.resolved, icon: FiCheckCircle, color: "green" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col gap-4">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all"
                  />
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "open", label: "Open" },
                    { value: "in-progress", label: "In Progress" },
                    { value: "resolved", label: "Resolved" },
                  ].map((filterOption) => (
                    <button
                      key={filterOption.value}
                      onClick={() => setFilter(filterOption.value)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filter === filterOption.value
                          ? "text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={filter === filterOption.value ? { backgroundColor: brandColor } : {}}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      categoryFilter === "all"
                        ? "text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    style={categoryFilter === "all" ? { backgroundColor: brandColor } : {}}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategoryFilter(cat.value)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        categoryFilter === cat.value
                          ? "text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={categoryFilter === cat.value ? { backgroundColor: brandColor } : {}}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none"
                  >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="-views">Most Viewed</option>
                    <option value="-upvotes">Most Upvoted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="text-center py-12">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                  style={{ borderColor: brandColor }}
                />
                <p className="mt-4 text-gray-600">Loading questions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qas.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Found</h3>
                    <p className="text-gray-600 mb-6">Be the first to ask a question!</p>
                    <button
                      onClick={() => setShowAskModal(true)}
                      className="px-6 py-3 text-white rounded-xl font-semibold"
                      style={{ backgroundColor: brandColor }}
                    >
                      Ask Question
                    </button>
                  </div>
                ) : (
                  qas.map((qa, index) => (
                    <motion.div
                      key={qa._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedQA(qa)}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                    >
                      <div className="p-6">
                        {/* Question Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(qa.status)}`}>
                                {qa.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(qa.priority)}`}>
                                {qa.priority}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700`}>
                                {qa.category}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 hover:underline">
                              {qa.title}
                            </h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{qa.description}</p>

                            {/* Tags */}
                            {qa.tags && qa.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {qa.tags.map((tag, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <FiUser className="w-4 h-4" />
                                <span>{qa.isAnonymous ? "Anonymous" : qa.askedBy.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FiClock className="w-4 h-4" />
                                <span>{getTimeAgo(qa.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FiEye className="w-4 h-4" />
                                <span>{qa.views} views</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <FiThumbsUp className="w-4 h-4" />
                                <span>{qa.upvotes?.length || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FiMessageCircle className="w-4 h-4" />
                                <span>{qa.answers?.length || 0}</span>
                              </div>
                            </div>
                            {qa.answers?.some(a => a.isAccepted) && (
                              <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                                <FiCheckCircle className="w-4 h-4" />
                                <span>Accepted</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpvoteQA(qa._id);
                            }}
                            className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm font-medium transition-all"
                          >
                            <FiThumbsUp className="w-4 h-4" />
                            <span>Upvote</span>
                          </button>
                          <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-all">
                            <FiMessageCircle className="w-4 h-4" />
                            <span>View ({qa.answers?.length || 0})</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ask Question Modal */}
      <AnimatePresence>
        {showAskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-900">Ask a Question</h2>
                  <button
                    onClick={() => setShowAskModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Course: <span className="font-semibold">{selectedCourse?.code} - {selectedCourse?.name}</span>
                </p>
              </div>

              <form onSubmit={handleAskQuestion} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="What's your question?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                    placeholder="Provide more details about your question..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={newQuestion.priority}
                      onChange={(e) => setNewQuestion({ ...newQuestion, priority: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      {priorities.map(pri => (
                        <option key={pri.value} value={pri.value}>{pri.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tags (e.g., arrays, sorting)..."
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {newQuestion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newQuestion.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg flex items-center gap-2">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-600 transition-colors"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={newQuestion.isAnonymous}
                    onChange={(e) => setNewQuestion({ ...newQuestion, isAnonymous: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                    Post anonymously
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAskModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    <FiSend className="w-5 h-5" />
                    <span>Post Question</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Q&A Details Modal */}
      <AnimatePresence>
        {selectedQA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedQA(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedQA.status)}`}>
                        {selectedQA.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedQA.priority)}`}>
                        {selectedQA.priority}
                      </span>
                      {canAnswer && (
                        <select
                          value={selectedQA.status}
                          onChange={(e) => handleUpdateStatus(selectedQA._id, e.target.value)}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedQA.title}</h2>
                    <p className="text-gray-600 mb-3">{selectedQA.description}</p>
                    
                    {/* Tags */}
                    {selectedQA.tags && selectedQA.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedQA.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {selectedQA.isAnonymous ? "Anonymous" : selectedQA.askedBy.name}</span>
                      <span>{getTimeAgo(selectedQA.createdAt)}</span>
                      <span>{selectedQA.views} views</span>
                      <button
                        onClick={() => handleUpvoteQA(selectedQA._id)}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <FiThumbsUp className="w-4 h-4" />
                        <span>{selectedQA.upvotes?.length || 0} upvotes</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQA(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Answers */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {selectedQA.answers?.length || 0} Answer{selectedQA.answers?.length !== 1 ? 's' : ''}
                </h3>

                {selectedQA.answers && selectedQA.answers.length > 0 ? (
                  <div className="space-y-4">
                    {selectedQA.answers.map((answer) => (
                      <div
                        key={answer._id}
                        className={`p-4 rounded-xl transition-all ${
                          answer.isAccepted
                            ? "bg-green-50 border-2 border-green-200"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-gray-700 mb-3 whitespace-pre-wrap">{answer.text}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="font-medium">{answer.answeredBy.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                {answer.answeredBy.userType}
                              </span>
                              <span>{getTimeAgo(answer.answeredAt)}</span>
                            </div>
                          </div>
                          {answer.isAccepted && (
                            <div className="flex items-center space-x-1 text-green-600 ml-2">
                              <FiCheckCircle className="w-5 h-5" />
                              <span className="text-xs font-semibold">Accepted</span>
                            </div>
                          )}
                        </div>

                        {/* Answer Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleUpvoteAnswer(selectedQA._id, answer._id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm transition-all border border-gray-200"
                          >
                            <FiThumbsUp className="w-4 h-4" />
                            <span>{answer.upvotes?.length || 0}</span>
                          </button>

                          {/* Accept Answer Button */}
                          {!answer.isAccepted && 
                           (selectedQA.askedBy.userId === user?.id || canAnswer) && (
                            <button
                              onClick={() => handleAcceptAnswer(answer._id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-green-50 text-green-600 rounded-lg text-sm font-medium transition-all border border-green-200"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              <span>Accept Answer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FiMessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No answers yet</p>
                    <p className="text-sm text-gray-400">
                      {canAnswer 
                        ? "Be the first to answer this question!" 
                        : "Only teachers can answer questions."}
                    </p>
                  </div>
                )}
              </div>

              {/* Answer Input - Only for Teachers */}
              {canAnswer && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Post Your Answer
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={3}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleAddAnswer();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500">Press Ctrl + Enter to submit</p>
                    <button
                      onClick={handleAddAnswer}
                      disabled={!newAnswer.trim()}
                      className="px-6 py-2.5 text-white rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                      style={{ backgroundColor: brandColor }}
                    >
                      <FiSend className="w-4 h-4" />
                      Post Answer
                    </button>
                  </div>
                </div>
              )}

              {/* Show message for students */}
              {!canAnswer && (
                <div className="p-4 border-t border-gray-200 bg-orange-50">
                  <p className="text-sm text-orange-700 text-center flex items-center justify-center gap-2">
                    <FiAlertCircle className="w-4 h-4" />
                    Only teachers can answer questions. You can upvote helpful answers.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
