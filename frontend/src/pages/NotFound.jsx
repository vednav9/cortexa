import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const NotFound = () => {
  // Floating animation for decorative elements
  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Pulse animation for the alert icon
  const pulseAnimation = {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-start justify-center pt-24 px-4 overflow-hidden relative">


      {/* Animated Background Circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full blur-3xl"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Floating Sparkles */}
        <div className="absolute -top-10 left-1/4">
          <motion.div animate={floatingAnimation}>
            <HiSparkles className="w-8 h-8 text-emerald-400" />
          </motion.div>
        </div>
        <div className="absolute top-0 right-1/4">
          <motion.div
            animate={floatingAnimation}
            transition={{ delay: 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <HiSparkles className="w-6 h-6 text-green-400" />
          </motion.div>
        </div>

        {/* Alert Icon */}
        <motion.div
          animate={pulseAnimation}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <FiAlertCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </motion.div>

        {/* 404 Text with Gradient */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        >
          <h1 className="text-9xl md:text-[12rem] font-black bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 bg-clip-text text-transparent mb-4 leading-none">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-2 mb-4"

        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            The page you're looking for seems to have wandered off. Don't worry, even the best explorers get lost sometimes!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all"
            >
              <FiHome className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Go to Dashboard
            </motion.button>
          </Link>

          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-2 px-8 py-4 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-emerald-50 transition-all"
            >
              <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </motion.button>
          </Link>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-sm text-gray-500"
        >
          Need help? <Link to="/querydesk" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">Contact Support</Link>
        </motion.p>
      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-50/50 to-transparent pointer-events-none" />
    </div>
  );
};

export default NotFound;
