import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', color = 'emerald' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
  };

  return (
    <div className={`${sizes[size]} ${colors[color]} border-4 border-t-transparent rounded-full animate-spin`} />
  );
};

export const LoadingCard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-xl p-6 shadow-sm animate-pulse"
  >
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </motion.div>
);

export const LoadingTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-4 border-b animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const LoadingPage = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  </div>
);
