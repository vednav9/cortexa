// MCQTest.jsx - Student MCQ Test Interface with beautiful UI
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiRefreshCw,
  FiPlay,
  FiAlertCircle,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../../context/authcontext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../services/api";

export default function MCQTest() {
  const { user } = useAuth();
  const { currentInstitution } = useOutletContext();
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (currentInstitution?._id) {
      fetchAvailableTests();
    }
  }, [currentInstitution]);

  // Timer logic
  useEffect(() => {
    if (activeTest && timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTest, timeLeft, showResults]);

  const fetchAvailableTests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/student-mcq/mcq/assigned?institutionId=${currentInstitution._id}`);
      setTests(res.data.mcqSets || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (test) => {
    if (test.hasAttempted) {
      toast.error("You have already attempted this test");
      return;
    }

    try {
      const res = await api.get(`/student-mcq/mcq/${test._id}/details`);
      const mcqSetData = res.data.mcqSet;

      setActiveTest({
        _id: mcqSetData._id,
        title: mcqSetData.title,
        description: mcqSetData.description,
        duration: mcqSetData.duration,
        questions: mcqSetData.questions,
        totalQuestions: mcqSetData.totalQuestions
      });
      setTimeLeft(mcqSetData.duration * 60);
      setStartTime(Date.now());
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      toast.success("Test started! Good luck!");
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error(error.response?.data?.error || "Failed to start test");
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) {
      return;
    }

    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      const answersArray = activeTest.questions.map((q, index) => ({
        questionIndex: index,
        selectedAnswer: answers[index] !== undefined ? answers[index] : -1
      }));

      const res = await api.post(`/student-mcq/mcq/${activeTest._id}/submit`, {
        answers: answersArray,
        timeTaken
      });

      setResults(res.data.results);
      setShowResults(true);
      toast.success("Test submitted successfully!");
      
      // Refresh test list
      fetchAvailableTests();
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error(error.response?.data?.error || "Failed to submit test");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  // Test Results View
  if (showResults && results) {
    const getGrade = (percentage) => {
      if (percentage >= 90) return { grade: "A+", color: "text-green-600", emoji: "🎉" };
      if (percentage >= 80) return { grade: "A", color: "text-green-500", emoji: "🌟" };
      if (percentage >= 70) return { grade: "B", color: "text-blue-500", emoji: "👍" };
      if (percentage >= 60) return { grade: "C", color: "text-yellow-500", emoji: "📚" };
      return { grade: "D", color: "text-red-500", emoji: "💪" };
    };

    const gradeInfo = getGrade(parseFloat(results.percentage));

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">{gradeInfo.emoji}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
            <p className="text-gray-600 mb-8">{activeTest.title}</p>

            <div className={`text-7xl font-black ${gradeInfo.color} mb-2`}>
              {results.percentage}%
            </div>
            <div className={`text-2xl font-bold ${gradeInfo.color} mb-8`}>
              Grade: {results.grade}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <FiCheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {results.score}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                <FiXCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {results.totalQuestions - results.score}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <FiClock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(results.timeTaken)}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTest(null);
                setShowResults(false);
                setResults(null);
              }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Back to Tests
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Test View
  if (activeTest) {
    const currentQuestion = activeTest.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeTest.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with Timer */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeTest.title}</h2>
                <p className="text-gray-600">
                  Question {currentQuestionIndex + 1} of {activeTest.questions.length}
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
                    timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <FiClock className="w-5 h-5" />
                  <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-2xl shadow-xl p-8 mb-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      answers[currentQuestionIndex] === index
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestionIndex] === index
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-300"
                        }`}
                      >
                        {answers[currentQuestionIndex] === index && (
                          <FiCheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-700">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all"
            >
              Previous
            </button>

            {currentQuestionIndex === activeTest.questions.length - 1 ? (
              <button
                onClick={handleSubmitTest}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center space-x-2"
              >
                <FiCheckCircle className="w-5 h-5" />
                <span>Submit Test</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Test List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
            <HiSparkles className="text-purple-600" />
            <span>MCQ Tests</span>
          </h1>
          <p className="text-gray-600">Test your knowledge and track your progress</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tests...</p>
            </div>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Tests Available
            </h3>
            <p className="text-gray-600">Check back later for new tests from your teachers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test, index) => (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {test.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                        test.difficulty
                      )}`}
                    >
                      {test.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{test.course?.name || "General"}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiClock className="w-4 h-4" />
                      <span>{test.duration} mins</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiAward className="w-4 h-4" />
                      <span>{test.questions?.length || 0} questions</span>
                    </div>
                  </div>

                  {test.hasAttempted && (
                    <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                      <FiCheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-blue-700">Completed</span>
                    </div>
                  )}

                  <button
                    onClick={() => startTest(test)}
                    disabled={test.hasAttempted}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                      test.hasAttempted
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105"
                    }`}
                  >
                    <FiPlay className="w-5 h-5" />
                    <span>{test.hasAttempted ? "Already Attempted" : "Start Test"}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
