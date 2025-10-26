import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';

export default function BrowseCollegesTab() {
  const [joinCode, setJoinCode] = useState('');
  const [filters, setFilters] = useState({
    institutionType: 'all',
    location: 'all',
    sortBy: 'recent'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleJoinWithCode = () => {
    console.log('Joining with code:', joinCode);
  };

  return (
    <div className="space-y-6">
      {/* Join with Code */}
      {/* <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Join with Code</h3>
        <p className="text-gray-600 mb-4">Enter your institution's join code to get access</p>
        
        <div className="flex space-x-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter join code..."
            className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handleJoinWithCode}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Join</span>
          </button>
        </div>
      </div> */}

      {/* Browse Section with Filters */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Browse Institutions</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Type</label>
                <select
                  value={filters.institutionType}
                  onChange={(e) => setFilters({ ...filters, institutionType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Types</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="institute">Institute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Locations</option>
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uk">UK</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setFilters({ institutionType: 'all', location: 'all', sortBy: 'recent' })}
              className="text-sm text-emerald-600 hover:underline"
            >
              Reset Filters
            </button>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for institutions..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Results */}
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">No results to display</p>
          <p className="text-gray-400 text-sm mt-2">Try searching for an institution</p>
        </div>
      </div>
    </div>
  );
}
