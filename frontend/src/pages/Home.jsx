import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiCpu, FiUsers, FiBookOpen, FiShield, FiZap, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-gray-900/30 to-black/30 animate-gradient-slow"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-sm text-gray-300">AI-Powered Multi-Tenant Educational Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            <span className="block text-white">Unify Education</span>
            <span className="block text-white">
              with <span className="bg-gradient-to-r from-gray-300 via-white to-gray-400 bg-clip-text text-transparent">Cortexa</span>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="max-w-3xl text-lg sm:text-xl text-gray-300 leading-relaxed"
          >
            A comprehensive platform that centralizes institutional resources with AI-powered RAG assistants, citation-backed answers, MCQ generation, and seamless collaboration for students, teachers, and administrators.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Link
              to="/signup"
              className="group relative px-8 py-4 rounded-lg font-semibold text-black bg-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/30"
            >
              <span className="relative flex items-center space-x-2">
                <span>Get Started</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Link>

            <Link
              to="/about"
              className="group px-8 py-4 rounded-lg font-semibold text-white border border-gray-700 hover:border-gray-500 hover:bg-gray-900/50 transition-all duration-300"
            >
              <span className="flex items-center space-x-2">
                <span>Learn More</span>
              </span>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 w-full max-w-6xl"
          >
            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                <FiCpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">RAG Assistant</h3>
              <p className="text-sm text-gray-400 text-center">Citation-backed answers extracted directly from teacher notes</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                <FiZap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Content Tools</h3>
              <p className="text-sm text-gray-400 text-center">Generate videos, MCQs, and voice-to-text notes automatically</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Tenant Security</h3>
              <p className="text-sm text-gray-400 text-center">Institutional branding with complete data isolation and privacy</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Collaborative Learning</h3>
              <p className="text-sm text-gray-400 text-center">Query desk and note-sharing between students and teachers</p>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex flex-col items-center space-y-4 pt-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Institutional dashboard</span>
              </div>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <div className="flex items-center space-x-2">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Free for educators</span>
              </div>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <div className="flex items-center space-x-2">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Privacy-first architecture</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  );
};

export default Home;
