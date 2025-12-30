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
      const response = await api.get(`/institutions/${institution.slug}/courses`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div
        className="text-white py-16"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold mb-4">Course Catalog</h1>
            <p className="text-xl text-gray-100">
              Explore our {courses.length} courses across {institution.departments?.length || 0} departments
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer"
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl shadow-lg"
          >
            <FiBook className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedDept !== 'all'
                ? 'Try adjusting your filters'
                : 'Courses will be available soon'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/${institution.slug}/courses/${course.code}`}
                  className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group h-full"
                >
                  {/* Course Header */}
                  <div
                    className="p-6 text-white relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold">
                          {course.code}
                        </span>
                        {course.credits && (
                          <span className="text-sm font-semibold">{course.credits} Credits</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold group-hover:scale-105 transition-transform">
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* Course Body */}
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {course.description || 'Comprehensive course covering essential topics and practical applications.'}
                    </p>

                    <div className="space-y-2">
                      {course.instructor && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiUsers className="w-4 h-4" />
                          <span>{course.instructor}</span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiClock className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.rating && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <FiStar className="w-4 h-4 fill-current" />
                          <span className="font-semibold">{course.rating}/5.0</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="mt-4 w-full py-2 rounded-lg font-semibold text-white transition-all group-hover:shadow-lg"
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
