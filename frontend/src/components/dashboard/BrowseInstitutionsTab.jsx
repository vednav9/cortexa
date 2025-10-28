import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiUsers, FiBook, FiExternalLink, FiChevronDown } from 'react-icons/fi';
import { institutionsData } from '../../data/institutionsData';

export default function BrowseInstitutionsTab() {
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'name'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Refs for click outside detection
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Get unique types from data
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(institutionsData.map(inst => inst.type))];
    return types.sort();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        typeDropdownRef.current && !typeDropdownRef.current.contains(event.target) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search institutions
  const filteredInstitutions = useMemo(() => {
    let results = institutionsData;

    // Apply type filter
    if (filters.type !== 'all') {
      results = results.filter(inst => inst.type === filters.type);
    }

    // Apply search
    if (searchQuery) {
      results = results.filter(inst =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === 'students') {
        return b.stats.totalStudents - a.stats.totalStudents;
      } else if (filters.sortBy === 'established') {
        return a.established - b.established;
      }
      return 0;
    });

    return results;
  }, [filters, searchQuery]);

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...uniqueTypes.map(type => ({ value: type, label: type }))
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'students', label: 'Most Students' },
    { value: 'established', label: 'Oldest First' }
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters({ ...filters, [filterType]: value });
    setOpenDropdown(null);
  };

  const handleReset = () => {
    setFilters({ type: 'all', sortBy: 'name' });
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex items-center gap-3">
        {/* Institution Type Dropdown */}
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 min-w-[160px] justify-between"
          >
            <span className="text-sm font-medium text-gray-700">
              {typeOptions.find(opt => opt.value === filters.type)?.label}
            </span>
            <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {openDropdown === 'type' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('type', option.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      filters.type === option.value 
                        ? 'bg-emerald-50 text-emerald-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort By Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 min-w-[160px] justify-between"
          >
            <span className="text-sm font-medium text-gray-700">
              {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
            </span>
            <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {openDropdown === 'sort' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('sortBy', option.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      filters.sortBy === option.value 
                        ? 'bg-emerald-50 text-emerald-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Reset
        </button>

        {/* Results Count */}
        <div className="ml-auto text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{filteredInstitutions.length}</span> institutions found
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search institutions by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
        />
      </div>

      {/* Institution Cards */}
      <div className="space-y-4">
        {filteredInstitutions.length > 0 ? (
          filteredInstitutions.map((institution, index) => (
            <motion.div
              key={institution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                {/* Logo */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ backgroundColor: institution.branding.primaryColor }}
                >
                  {institution.logo ? (
                    <img src={institution.branding.logo} alt={institution.shortName} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    institution.shortName
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {institution.name}
                      </h3>
                      <p className="text-sm text-gray-500">{institution.tagline}</p>
                    </div>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: institution.branding.primaryColor }}
                    >
                      {institution.type}
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <FiMapPin className="w-4 h-4" />
                      <span>{institution.location.city}, {institution.location.state}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiUsers className="w-4 h-4" />
                      <span>{institution.stats.totalStudents.toLocaleString()} Students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiBook className="w-4 h-4" />
                      <span>{institution.stats.totalCourses} Courses</span>
                    </div>
                    <div className="text-gray-500">
                      Est. {institution.established}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {institution.description}
                  </p>

                  {/* Departments Pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {institution.departments.slice(0, 4).map((dept) => (
                      <span
                        key={dept.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {dept.code}
                      </span>
                    ))}
                    {institution.departments.length > 4 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{institution.departments.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-white transition-all"
                      style={{ backgroundColor: institution.branding.primaryColor }}
                    >
                      Request Access
                    </button>
                    <a
                      href={`/${institution.slug}`}
                      className="px-4 py-2 rounded-lg font-medium border-2 transition-all flex items-center space-x-2 hover:bg-gray-50"
                      style={{ 
                        borderColor: institution.branding.primaryColor,
                        color: institution.branding.primaryColor 
                      }}
                    >
                      <span>View Details</span>
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-500 text-lg font-medium mb-2">No institutions found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
