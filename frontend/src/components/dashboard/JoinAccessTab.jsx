import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiCheck } from 'react-icons/fi';

const JoinAccessTab = () => {
  const [joinCode, setJoinCode] = useState('');

  const myInstitutions = [
    { id: 1, name: 'MIT', logo: 'M', role: 'Student', status: 'active' },
    { id: 2, name: 'Harvard', logo: 'H', role: 'Student', status: 'active' },
  ];

  const handleJoinWithCode = () => {
    console.log('Joining with code:', joinCode);
  };

  return (
    <div className="space-y-8">
      {/* Join with Code */}
      <motion.div
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
      </motion.div>

      {/* My Institutions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">My Institutions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myInstitutions.map((institution, index) => (
            <motion.div
              key={institution.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {institution.logo}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{institution.name}</h4>
                    <p className="text-sm text-gray-500">{institution.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">{institution.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

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
        <p className="text-gray-500 text-center py-8">No results to display</p>
      </div>
    </div>
  );
};

export default JoinAccessTab;
