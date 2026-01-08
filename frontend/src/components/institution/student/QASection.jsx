// QASection.jsx - Student Q&A Section with beautiful UI
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle,
  FiSend,
  FiThumbsUp,
  FiThumbsDown,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiUser,
  FiBookOpen,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../../context/authcontext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../services/api";

export default function QASection() {
  const { user } = useAuth();
  const { institution } = useOutletContext();
  const [questions, setQuestions] = useState([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    description: "",
    subject: "",
  });
  const [filter, setFilter] = useState("all"); // all, unanswered, answered, my-questions
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const res = await api.get(`/qa/questions/${institution._id}?filter=${filter}`);
      // setQuestions(res.data.questions || []);

      // Mock data for development
      setQuestions([
        {
          _id: "1",
          title: "What is the difference between Stack and Queue?",
          description: "Can someone explain the main differences between stack and queue data structures?",
          subject: "Data Structures",
          askedBy: { name: "Alice Johnson", _id: "user1" },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          answers: [
            {
              _id: "a1",
              text: "Stack follows LIFO (Last In First Out) principle, while Queue follows FIFO (First In First Out) principle.",
              answeredBy: { name: "Dr. Smith", role: "teacher" },
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
              likes: 5,
              isAccepted: true,
            },
          ],
          views: 24,
          likes: 3,
        },
        {
          _id: "2",
          title: "How to normalize a database?",
          description: "I'm confused about database normalization forms. Can someone explain 1NF, 2NF, and 3NF?",
          subject: "Database Management",
          askedBy: { name: "Bob Williams", _id: "user2" },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          answers: [],
          views: 12,
          likes: 2,
        },
      ]);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual API endpoint
      // const res = await api.post('/qa/ask', { ...newQuestion, institutionId: institution._id });
      
      toast.success("Question posted successfully!");
      setShowAskModal(false);
      setNewQuestion({ title: "", description: "", subject: "" });
      fetchQuestions();
    } catch (error) {
      toast.error("Failed to post question");
    }
  };

  const handleLikeQuestion = async (questionId) => {
    try {
      // TODO: API call to like question
      toast.success("Question liked!");
    } catch (error) {
      toast.error("Failed to like question");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "unanswered") return matchesSearch && q.answers.length === 0;
    if (filter === "answered") return matchesSearch && q.answers.length > 0;
    if (filter === "my-questions") return matchesSearch && q.askedBy._id === user.id;
    return matchesSearch;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
              <HiSparkles className="text-blue-600" />
              <span>Q&A Section</span>
            </h1>
            <p className="text-gray-600">Ask questions and get answers from teachers and peers</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAskModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>Ask Question</span>
          </motion.button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {[
                { value: "all", label: "All" },
                { value: "unanswered", label: "Unanswered" },
                { value: "answered", label: "Answered" },
                { value: "my-questions", label: "My Questions" },
              ].map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === filterOption.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Found</h3>
              <p className="text-gray-600 mb-6">Be the first to ask a question!</p>
              <button
                onClick={() => setShowAskModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold"
              >
                Ask Question
              </button>
            </div>
          ) : (
            filteredQuestions.map((question, index) => (
              <motion.div
                key={question._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                        {question.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{question.description}</p>
                      
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiUser className="w-4 h-4" />
                          <span>{question.askedBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>{getTimeAgo(question.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiBookOpen className="w-4 h-4" />
                          <span>{question.subject}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        question.answers.length > 0
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {question.answers.length > 0 ? "Answered" : "Unanswered"}
                      </span>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiThumbsUp className="w-4 h-4" />
                          <span>{question.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiMessageCircle className="w-4 h-4" />
                          <span>{question.answers.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Answers */}
                  {question.answers.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
                      </h4>
                      {question.answers.map((answer) => (
                        <div
                          key={answer._id}
                          className={`p-4 rounded-xl mb-2 ${
                            answer.isAccepted
                              ? "bg-green-50 border-2 border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-700">{answer.text}</p>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                <span className="font-medium">{answer.answeredBy.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                  {answer.answeredBy.role}
                                </span>
                                <span>{getTimeAgo(answer.createdAt)}</span>
                              </div>
                            </div>
                            {answer.isAccepted && (
                              <FiCheckCircle className="w-5 h-5 text-green-600 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleLikeQuestion(question._id)}
                      className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm font-medium transition-all"
                    >
                      <FiThumbsUp className="w-4 h-4" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-all">
                      <FiMessageCircle className="w-4 h-4" />
                      <span>Answer</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Ask a Question</h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    placeholder="e.g., Data Structures, Database, etc."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="What's your question?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                    placeholder="Provide more details about your question..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAskModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
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
    </div>
  );
}
