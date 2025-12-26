import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import aiService from '../../services/aiService';

export default function AIChat({ isOpen, onClose, institutionId = null, brandColor = '#10b981' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.queryAssistant(input, true);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer,
        sources: response.sources,
        searchMethod: response.search_method,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 mx-4"
          >
            {/* Header */}
            <div 
              className="p-4 rounded-t-2xl flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
            >
              <div className="flex items-center space-x-2">
                <HiSparkles className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded-full">
                  Powered by RAG + Web
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <HiSparkles className="w-12 h-12 mx-auto mb-4" style={{ color: brandColor }} />
                  <p className="text-lg font-semibold mb-2">Ask me anything!</p>
                  <p className="text-sm">I can search your documents and the web for answers</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {[
                      'What is Big Data Analytics?',
                      'Explain MapReduce',
                      'Generate 5 MCQs on NoSQL',
                      'Latest AI trends'
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        className="p-3 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    style={message.type === 'user' ? { backgroundColor: brandColor } : {}}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-semibold mb-1">Sources ({message.searchMethod}):</p>
                        <div className="space-y-1">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              {source.type === 'document' ? (
                                <span>📄 {source.source}</span>
                              ) : (
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: brandColor }}>
                                  🔗 {source.title}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                    <FiLoader className="w-5 h-5 animate-spin" style={{ color: brandColor }} />
                    <span className="text-sm text-gray-600">
                      AI is thinking... This may take 1-2 minutes on first use
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ focusRingColor: brandColor }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
