import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import aiService from '../../services/aiService';

export default function MCQGenerator() {
  const [step, setStep] = useState('generate'); // 'generate', 'quiz', 'results'
  const [loading, setLoading] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  
  const [formData, setFormData] = useState({
    sourceType: 'topic',
    source: '',
    numQuestions: 5,
    difficulty: 'medium'
  });

  const handleGenerate = async () => {
    if (!formData.source.trim()) {
      alert('Please enter a topic or document name');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.generateMCQs(
        formData.sourceType,
        formData.source,
        formData.numQuestions,
        formData.difficulty
      );

      if (response.valid_mcqs > 0) {
        setMcqs(response.mcqs);
        setStep('quiz');
      } else {
        alert('No valid MCQs generated. Try a different topic.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers({ ...userAnswers, [questionIndex]: answer });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await aiService.scoreMCQs(mcqs, userAnswers);
      setResults(response);
      setStep('results');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('generate');
    setMcqs([]);
    setUserAnswers({});
    setResults(null);
    setFormData({
      sourceType: 'topic',
      source: '',
      numQuestions: 5,
      difficulty: 'medium'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Generate Step */}
      {step === 'generate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <HiSparkles className="w-8 h-8 text-emerald-500" />
            <h2 className="text-3xl font-bold text-gray-800">Generate MCQs</h2>
          </div>

          <div className="space-y-6">
            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Type
              </label>
              <div className="flex space-x-4">
                {['topic', 'document'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, sourceType: type })}
                    className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                      formData.sourceType === type
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.sourceType === 'topic' ? 'Topic Name' : 'Document Name'}
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder={formData.sourceType === 'topic' ? 'e.g., Machine Learning' : 'e.g., module3 BDA.pdf'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <select
                value={formData.numQuestions}
                onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[3, 5, 10, 15, 20].map(num => (
                  <option key={num} value={num}>{num} Questions</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="flex space-x-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, difficulty: level })}
                    className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                      formData.difficulty === level
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <HiSparkles className="w-5 h-5" />
                  <span>Generate MCQs</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Quiz Step */}
      {step === 'quiz' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Time!</h2>
            <p className="text-gray-600 mb-6">Answer all questions to see your score</p>

            {mcqs.map((mcq, index) => (
              <div key={index} className="mb-8 pb-8 border-b border-gray-200 last:border-0">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  {index + 1}. {mcq.question}
                </h3>

                <div className="space-y-3">
                  {Object.entries(mcq.options).map(([letter, text]) => (
                    <label
                      key={letter}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        userAnswers[index] === letter
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={letter}
                        checked={userAnswers[index] === letter}
                        onChange={() => handleAnswerSelect(index, letter)}
                        className="w-5 h-5 text-emerald-500"
                      />
                      <span className="font-medium text-gray-700">{letter})</span>
                      <span className="text-gray-800">{text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length !== mcqs.length || loading}
                className="flex-1 px-6 py-4 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Step */}
      {step === 'results' && results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Results</h2>

          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-emerald-50 p-6 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">Score</p>
              <p className="text-4xl font-bold text-emerald-600">{results.score_percentage}%</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">Grade</p>
              <p className="text-4xl font-bold text-blue-600">{results.grade}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">Correct</p>
              <p className="text-4xl font-bold text-green-600">{results.correct_answers}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">Incorrect</p>
              <p className="text-4xl font-bold text-red-600">{results.incorrect_answers}</p>
            </div>
          </div>

          {/* Detailed Results */}
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Review</h3>
          <div className="space-y-4">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border-2 ${
                  result.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-gray-800">
                    Q{index + 1}: {result.question}
                  </p>
                  {result.is_correct ? (
                    <FiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <FiXCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm mb-2">
                  <span className="text-gray-700">
                    Your Answer: <strong>{result.user_answer || 'Not answered'}</strong>
                  </span>
                  <span className="text-green-700">
                    Correct Answer: <strong>{result.correct_answer}</strong>
                  </span>
                </div>

                {result.explanation && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 <strong>Explanation:</strong> {result.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Generate New Quiz
          </button>
        </motion.div>
      )}
    </div>
  );
}
