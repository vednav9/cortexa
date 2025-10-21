import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiCheck, FiCpu, FiBookOpen, FiUsers } from 'react-icons/fi';

const Hero = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-slow"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm text-gray-300">AI-Powered Educational Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
            <span className="block text-white">Transform Learning</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              with Cortexa AI
            </span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-3xl text-lg sm:text-xl text-gray-300 leading-relaxed">
            A unified platform that brings students, teachers, and institutions together with AI-powered personalization, citation-backed answers, and seamless collaboration tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link
              to="/signup"
              className="group relative px-8 py-4 rounded-lg font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <span className="relative flex items-center space-x-2">
                <span>Get Started</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 w-full max-w-4xl">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <FiCpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
              <p className="text-sm text-gray-400 text-center">Citation-backed answers powered by RAG technology</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <FiBookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Unified Learning</h3>
              <p className="text-sm text-gray-400 text-center">All your courses, materials, and resources in one place</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-pink-500/30 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Tenant</h3>
              <p className="text-sm text-gray-400 text-center">Institutional branding with complete customization</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col items-center space-y-4 pt-8">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <FiCheck className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
              <span className="text-gray-600">•</span>
              <FiCheck className="w-5 h-5 text-green-500" />
              <span>Free forever plan</span>
              <span className="text-gray-600">•</span>
              <FiCheck className="w-5 h-5 text-green-500" />
              <span>Privacy-first</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  );
};

export default Hero;
