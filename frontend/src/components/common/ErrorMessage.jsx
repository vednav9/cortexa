import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export const ErrorMessage = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3"
  >
    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-red-800 font-medium">Error</p>
      <p className="text-red-600 text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  </motion.div>
);

export const ErrorPage = ({ message = 'Something went wrong', onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div className="max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiAlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
        >
          <FiRefreshCw className="w-5 h-5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  </div>
);
