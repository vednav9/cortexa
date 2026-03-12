// BrowseInstitutionsTab.jsx - Fetches from backend
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiUsers, FiBook, FiExternalLink, FiChevronDown, FiLoader } from 'react-icons/fi';
import { institutionAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BrowseInstitutionsTab({
  excludeInstitutionId,
  onCountChange
}) {

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

        let data = response.data.institutions || [];

        setInstitutions(response.data.institutions || []);


        setInstitutions(data);

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

    // ✅ EXCLUDE LOGGED-IN ADMIN'S INSTITUTION
    if (excludeInstitutionId) {
      const excludedId = excludeInstitutionId.toString();
      results = results.filter(
        (inst) => inst._id?.toString() !== excludedId
      );
    }

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
  }, [institutions, filters, searchQuery, excludeInstitutionId]);

  useEffect(() => {
    if (typeof onCountChange === "function") {
      onCountChange(filteredInstitutions.length);
    }
  }, [filteredInstitutions, onCountChange]);


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
          className="w-full pl-12 pr-4 py-3 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm transition-all text-sm"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Type Dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              className="px-4 py-2 bg-white border border-gray-200/80 rounded-xl hover:border-gray-300 transition-all flex items-center space-x-2 min-w-[150px] justify-between shadow-sm"
            >
              <span className="text-[13px] font-medium text-gray-700">
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
                  className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 max-h-64 overflow-y-auto p-1.5"
                >
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('type', option.value)}
                      className={`w-full px-3 py-2 text-left text-[13px] rounded-lg transition-colors ${filters.type === option.value
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              className="px-4 py-2 bg-white border border-gray-200/80 rounded-xl hover:border-gray-300 transition-all flex items-center space-x-2 min-w-[150px] justify-between shadow-sm"
            >
              <span className="text-[13px] font-medium text-gray-700">
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
                  className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 p-1.5"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sortBy', option.value)}
                      className={`w-full px-3 py-2 text-left text-[13px] rounded-lg transition-colors ${filters.sortBy === option.value
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-[13px] font-medium border border-gray-200/80 hover:text-gray-900"
          >
            Reset
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{filteredInstitutions.length}</span> results
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100/50">
              <FiLoader className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
            <p className="text-gray-900 text-lg font-bold tracking-tight">Loading directory...</p>
            <p className="text-gray-500 text-[13px] mt-1">Please wait while we fetch the institutions</p>
          </div>
        ) : filteredInstitutions.length > 0 ? (
          filteredInstitutions.map((institution, index) => (
            <motion.a
              href={`/${institution.slug}`}
              key={institution._id || institution.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block group bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-200/60 transition-all duration-300 overflow-hidden relative cursor-pointer"
            >
              <div className="p-6 md:p-7 flex flex-col sm:flex-row items-start gap-6">

                {/* Logo */}
                <div className="relative group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                  <div className="absolute inset-0 bg-emerald-100 rounded-[18px] blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <div
                    className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white font-bold text-xl shadow-sm border border-emerald-100/50 relative z-10 overflow-hidden"
                    style={{ backgroundColor: institution.branding?.primaryColor || '#10b981' }}
                  >
                    {institution.branding?.logo ? (
                      <img src={institution.branding.logo} alt={institution.code || institution.name} className="w-full h-full object-cover" />
                    ) : (
                      institution.code || institution.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full">
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight tracking-tight truncate">
                        {institution.name}
                      </h3>
                      {institution.code && (
                        <p className="text-[13px] font-semibold text-gray-500 mt-1 tracking-widest uppercase">{institution.code}</p>
                      )}
                    </div>
                    {/* Badge */}
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border"
                        style={{
                          color: institution.branding?.primaryColor || '#10b981',
                          backgroundColor: `${institution.branding?.primaryColor}15` || '#10b98115',
                          borderColor: `${institution.branding?.primaryColor}40` || '#10b98140'
                        }}>
                        {institution.type}
                      </span>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-gray-500 mb-4 mt-3">
                    {institution.address?.city && (
                      <div className="flex items-center gap-1.5">
                        <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{institution.address.city}{institution.address.state && `, ${institution.address.state}`}</span>
                      </div>
                    )}
                    {institution.stats?.totalStudents && (
                      <div className="flex items-center gap-1.5">
                        <FiUsers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span><strong className="text-gray-700 font-semibold">{institution.stats.totalStudents.toLocaleString()}</strong> Students</span>
                      </div>
                    )}
                    {institution.stats?.totalCourses && (
                      <div className="flex items-center gap-1.5">
                        <FiBook className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span><strong className="text-gray-700 font-semibold">{institution.stats.totalCourses}</strong> Courses</span>
                      </div>
                    )}
                    {institution.established && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0"></span>
                        <span>Est. <strong className="text-gray-700 font-semibold">{institution.established}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {institution.description && (
                    <p className="text-gray-600 text-[13px] mb-5 line-clamp-2 leading-relaxed">
                      {institution.description}
                    </p>
                  )}

                  {/* Departments Bottom Row */}
                  {institution.departments && institution.departments.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-100/80">

                      {/* Departments */}
                      <div className="flex flex-wrap gap-2">
                        {institution.departments?.slice(0, 3).map((dept, idx) => (
                          <span
                            key={dept._id || dept.id || idx}
                            className="px-2.5 py-1 bg-gray-50 border border-gray-200/60 text-gray-600 rounded-lg text-[11px] font-medium"
                          >
                            {dept.code || dept.name}
                          </span>
                        ))}
                        {institution.departments?.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-50 border border-gray-200/60 text-gray-500 rounded-lg text-[11px] font-medium">
                            +{institution.departments.length - 3}
                          </span>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </motion.a>
          ))
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="w-20 h-20 bg-gray-50/80 rounded-[18px] flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
              <FiSearch className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 text-xl font-bold tracking-tight mb-2">No institutions found</p>
            <p className="text-gray-500 text-[13px] max-w-sm mx-auto">Try adjusting your search criteria or removing filters to discover more directories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
