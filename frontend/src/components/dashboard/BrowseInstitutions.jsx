// BrowseInstitutionsTab.jsx - Fetches from backend
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiUsers, FiBook, FiExternalLink, FiChevronDown, FiLoader } from 'react-icons/fi';
import { institutionAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BrowseInstitutionsTab() {
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'name'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Fetch institutions from backend
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoading(true);
        const response = await institutionAPI.browse();
        setInstitutions(response.data.institutions || []);
      } catch (error) {
        console.error('Error fetching institutions:', error);
        toast.error('Failed to load institutions');
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(institutions.map(inst => inst.type))];
    return types.sort();
  }, [institutions]);

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

  const filteredInstitutions = useMemo(() => {
    let results = institutions;

    if (filters.type !== 'all') {
      results = results.filter(inst => inst.type === filters.type);
    }

    if (searchQuery) {
      results = results.filter(inst =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inst.code && inst.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inst.address?.city && inst.address.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    results.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === 'students') {
        return (b.stats?.totalStudents || 0) - (a.stats?.totalStudents || 0);
      } else if (filters.sortBy === 'established') {
        return (a.established || 0) - (b.established || 0);
      }
      return 0;
    });

    return results;
  }, [filters, searchQuery, institutions]);

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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search institutions by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm transition-all"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Type Dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-emerald-400 transition-all flex items-center space-x-2 min-w-[160px] justify-between shadow-sm"
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
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${filters.type === option.value
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-emerald-400 transition-all flex items-center space-x-2 min-w-[160px] justify-between shadow-sm"
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
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${filters.sortBy === option.value
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium shadow-sm"
          >
            Reset
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{filteredInstitutions.length}</span> results
        </div>
      </div>

      {/* Institution Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <FiLoader className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg font-medium">Loading institutions...</p>
          </div>
        ) : filteredInstitutions.length > 0 ? (
          filteredInstitutions.map((institution, index) => (
            <motion.div
              key={institution._id || institution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                {/* Logo */}
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: institution.branding?.primaryColor || '#10b981' }}
                >
                  {institution.branding?.logo ? (
                    <img src={institution.branding.logo} alt={institution.code || institution.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    institution.code || institution.name.substring(0, 2).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {institution.name}
                      </h3>
                      <p className="text-sm text-gray-500">{institution.code || ''}</p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: institution.branding?.primaryColor || '#10b981' }}
                    >
                      {institution.type}
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    {institution.address?.city && (
                      <div className="flex items-center space-x-1.5">
                        <FiMapPin className="w-4 h-4" />
                        <span>{institution.address.city}{institution.address.state && `, ${institution.address.state}`}</span>
                      </div>
                    )}
                    {institution.stats?.totalStudents && (
                      <div className="flex items-center space-x-1.5">
                        <FiUsers className="w-4 h-4" />
                        <span>{institution.stats.totalStudents.toLocaleString()} Students</span>
                      </div>
                    )}
                    {institution.stats?.totalCourses && (
                      <div className="flex items-center space-x-1.5">
                        <FiBook className="w-4 h-4" />
                        <span>{institution.stats.totalCourses} Courses</span>
                      </div>
                    )}
                    {institution.established && (
                      <div className="text-gray-500">
                        Est. {institution.established}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {institution.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {institution.description}
                    </p>
                  )}

                  {/* Departments */}
                  {institution.departments && institution.departments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {institution.departments.slice(0, 4).map((dept, idx) => (
                        <span
                          key={dept._id || dept.id || idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {dept.code || dept.name}
                        </span>
                      ))}
                      {institution.departments.length > 4 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{institution.departments.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <button
                      className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md"
                      style={{ backgroundColor: institution.branding?.primaryColor || '#10b981' }}
                    >
                      Request Access
                    </button>
                    <a
                      href={`/${institution.slug}`}
                      className="px-5 py-2.5 rounded-lg font-medium border-2 transition-all flex items-center space-x-2 hover:bg-gray-50"
                      style={{
                        borderColor: institution.branding?.primaryColor || '#10b981',
                        color: institution.branding?.primaryColor || '#10b981'
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
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-500 text-lg font-medium mb-2">No institutions found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
