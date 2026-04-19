import React, { useContext, useState, useEffect } from 'react';
import { InstitutionContext } from '../../context/InstitutionContext';
import { Link } from 'react-router-dom';
import { FiBook, FiClock, FiUsers, FiStar, FiSearch, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function CourseCatalog() {
  const { institution } = useContext(InstitutionContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    if (institution?.slug) {
      fetchCourses();
    }
  }, [institution?.slug]);

  const fetchCourses = async () => {
    try {
      const response = await api.get(`/institutions/slug/${institution.slug}/courses`);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (!institution) return null;

  const brandColor = institution.branding?.primaryColor || '#003D7A';
  const accentColor = institution.branding?.accentColor || brandColor;

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || course.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Header */}
      <div
        className="text-white py-12 md:py-16"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Course Catalog</h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-100">
              Explore our {courses.length} courses across {institution.departments?.length || 0} departments
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <FiFilter className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {institution.departments?.map((dept) => (
                  <option key={dept.id} value={dept.code}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {loading ? (
          <div className="text-center py-16 md:py-20">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm md:text-base text-gray-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 md:py-20 bg-white rounded-xl md:rounded-2xl shadow-md"
          >
            <FiBook className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No courses found</h3>
            <p className="text-sm md:text-base text-gray-600">
              {searchTerm || selectedDept !== 'all'
                ? 'Try adjusting your filters'
                : 'Courses will be available soon'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/${institution.slug}/courses/${course.code}`}
                  className="block bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden group h-full"
                >
                  {/* Course Header */}
                  <div
                    className="p-5 md:p-6 text-white relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 md:px-3 bg-white/20 backdrop-blur-sm rounded-lg text-xs md:text-sm font-semibold">
                          {course.code}
                        </span>
                        {course.credits && (
                          <span className="text-xs md:text-sm font-semibold">{course.credits} Credits</span>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold group-hover:scale-105 transition-transform">
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* Course Body */}
                  <div className="p-5 md:p-6">
                    <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-2">
                      {course.description || 'Comprehensive course covering essential topics and practical applications.'}
                    </p>

                    <div className="space-y-2">
                      {course.instructor && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <FiUsers className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{course.instructor}</span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <FiClock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.rating && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-yellow-600">
                          <FiStar className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current flex-shrink-0" />
                          <span className="font-semibold">{course.rating}/5.0</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="mt-4 w-full py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-semibold text-white transition-all group-hover:shadow-lg"
                      style={{ backgroundColor: brandColor }}
                    >
                      View Details
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
