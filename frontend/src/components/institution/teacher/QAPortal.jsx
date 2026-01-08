import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageSquare,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiThumbsUp,
  FiEye,
  FiX,
  FiAward,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import toast from "react-hot-toast";
import api from "../../../services/api";

export default function QAPortal() {
  const { user } = useAuth();
  const { currentInstitution } = useOutletContext();
  
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResolved, setFilterResolved] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    if (currentInstitution?._id) {
      fetchCourses();
      fetchStats();
      fetchQuestions();
    }
  }, [currentInstitution, selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`/teacher/courses?institutionId=${currentInstitution._id}`);
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/teacher-qa/stats?institutionId=${currentInstitution._id}`);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const courseParam = selectedCourse !== "all" ? `&courseId=${selectedCourse}` : "";
      const res = await api.get(
        `/teacher-qa/questions?institutionId=${currentInstitution._id}${courseParam}`
      );
      setQuestions(res.data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!answerText.trim()) {
      toast.error("Please write an answer");
      return;
    }

    try {
      await api.post(`/teacher-qa/questions/${questionId}/answers`, {
        content: answerText
      });

      toast.success("Answer posted successfully!");
      setAnswerText("");
      if (selectedQuestion?._id === questionId) {
        fetchQuestionDetails(questionId);
      }
      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error("Error posting answer:", error);
      toast.error(error.response?.data?.error || "Failed to post answer");
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.post(`/teacher-qa/answers/${answerId}/accept`);
      toast.success("Answer accepted successfully!");
      
      if (selectedQuestion) {
        fetchQuestionDetails(selectedQuestion._id);
      }
      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error("Error accepting answer:", error);
      toast.error(error.response?.data?.error || "Failed to accept answer");
    }
  };

  const fetchQuestionDetails = async (questionId) => {
    try {
      const res = await api.get(`/teacher-qa/questions/${questionId}`);
      setSelectedQuestion({ ...res.data.question, answers: res.data.answers });
    } catch (error) {
      console.error("Error fetching question details:", error);
      toast.error("Failed to load question details");
    }
  };

  const openQuestionDetails = (question) => {
    fetchQuestionDetails(question._id);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResolved =
      filterResolved === "all" ||
      (filterResolved === "resolved" && q.isResolved) ||
      (filterResolved === "unresolved" && !q.isResolved);
    return matchesSearch && matchesResolved;
  });

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 flex items-center space-x-3">
            <FiMessageSquare className="text-purple-600" />
            <span>Q&A Portal</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Answer student questions and help them learn
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <FiMessageSquare className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.totalQuestions}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Total Questions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.resolvedQuestions}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Resolved</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <HiSparkles className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.myAnswers}
                </span>
              </div>
              <p className="text-gray-600 font-medium">My Answers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <FiAward className="w-8 h-8 text-yellow-600" />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.acceptedAnswers}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Accepted Answers</p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>

            {/* Resolved Filter */}
            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Questions</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading questions...</p>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Questions Found
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCourse !== "all" || filterResolved !== "all"
                ? "Try adjusting your filters"
                : "No questions have been asked yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <motion.div
                key={question._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => openQuestionDetails(question)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {question.isResolved ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                          <FiCheckCircle className="w-3 h-3" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>Needs Answer</span>
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {question.course?.name}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {question.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {question.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${question.askedBy?.name}&background=random`}
                          alt={question.askedBy?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{question.askedBy?.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMessageSquare className="w-4 h-4" />
                        <span>{question.answerCount} answers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiThumbsUp className="w-4 h-4" />
                        <span>{question.upvotes?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiEye className="w-4 h-4" />
                        <span>{question.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Question Details Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuestion(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              {/* Question Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {selectedQuestion.isResolved ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>Needs Answer</span>
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {selectedQuestion.course?.name}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {selectedQuestion.title}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {selectedQuestion.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <img
                          src={`https://ui-avatars.com/api/?name=${selectedQuestion.askedBy?.name}&background=random`}
                          alt={selectedQuestion.askedBy?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium">
                          {selectedQuestion.askedBy?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>{formatDate(selectedQuestion.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiThumbsUp className="w-4 h-4" />
                        <span>{selectedQuestion.upvotes?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiEye className="w-4 h-4" />
                        <span>{selectedQuestion.views}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Answers Section */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedQuestion.answers?.length || 0} Answers
                </h3>

                <div className="space-y-4 mb-6">
                  {selectedQuestion.answers?.map((answer) => (
                    <div
                      key={answer._id}
                      className={`p-4 rounded-xl border-2 ${
                        answer.isAccepted
                          ? "bg-green-50 border-green-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {answer.isAccepted && (
                        <div className="flex items-center space-x-2 text-green-700 font-semibold mb-2">
                          <FiCheckCircle className="w-5 h-5" />
                          <span>Accepted Answer</span>
                        </div>
                      )}
                      <p className="text-gray-800 mb-3">{answer.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <img
                              src={`https://ui-avatars.com/api/?name=${answer.answeredBy?.name}&background=random`}
                              alt={answer.answeredBy?.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span>{answer.answeredBy?.name}</span>
                            {answer.answeredByModel === "Teacher" && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                Teacher
                              </span>
                            )}
                          </div>
                          <span>{formatDate(answer.createdAt)}</span>
                          <div className="flex items-center space-x-1">
                            <FiThumbsUp className="w-4 h-4" />
                            <span>{answer.upvotes?.length || 0}</span>
                          </div>
                        </div>
                        {!answer.isAccepted && !selectedQuestion.isResolved && answer.answeredByModel === "Student" && (
                          <button
                            onClick={() => handleAcceptAnswer(answer._id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all flex items-center space-x-1"
                          >
                            <FiCheckCircle className="w-3 h-3" />
                            <span>Accept Answer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Teacher Answer Form */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <span>Your Answer</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      Teacher
                    </span>
                  </h4>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Provide a detailed answer to help the student..."
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                  />
                  <button
                    onClick={() => handleAnswerQuestion(selectedQuestion._id)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Post Answer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
