import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch } from 'react-icons/fi';

const BrowseCollegesTab = () => {
  // const [joinCode, setJoinCode] = useState('');

  // const handleJoinWithCode = () => {
  //   console.log('Joining with code:', joinCode);
  // };

  return (
    <div className="space-y-8">
      {/* Join with Code */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Join with Code</h3>
        <p className="text-gray-600 mb-6">Enter your institution's join code to get access</p>
        
        <div className="flex space-x-4">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter join code..."
            className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinWithCode}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Join</span>
          </motion.button>
        </div>
      </motion.div> */}

      {/* Browse Institutions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Browse Institutions</h3>
        <div className="relative mb-4">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for institutions..."
            className="w-full pl-12 pr-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="text-center py-12 bg-white border border-emerald-100 rounded-xl">
          <p className="text-gray-500">No results to display</p>
          <p className="text-gray-400 text-sm mt-2">Try searching for an institution</p>
        </div>
      </div>
    </div>
  );
};

export default BrowseCollegesTab;
