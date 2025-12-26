import React, { useContext, useState, useEffect } from 'react';
import { InstitutionContext } from '../../App';
import { useParams, Link } from 'react-router-dom';
import { FiBook, FiClock, FiUsers, FiStar, FiAward, FiCheckCircle, FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function CourseDetails() {
  const { institution } = useContext(InstitutionContext);
  const { courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institution?.slug && courseCode) {
      fetchCourseDetails();
    }
  }, [institution?.slug, courseCode]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/institutions/${institution.slug}/courses/${courseCode}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!institution) return null;

  const brandColor = institution.branding?.primaryColor || '#003D7A';
  const accentColor = institution.branding?.accentColor || brandColor;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiBook className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <Link 
            to={`/${institution.slug}/courses`}
            className="text-blue-600 hover:underline"
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div 
        className="text-white py-12"
        style={{ 
          background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Link 
            to={`/${institution.slug}/courses`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-bold text-lg">
                {course.code}
              </span>
              {course.credits && (
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold">
                  {course.credits} Credits
                </span>
              )}
            </div>
            <h1 className="text-5xl font-bold mb-4">{course.name}</h1>
            <p className="text-xl text-gray-100">{course.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: brandColor }}>
                <FiBook className="w-8 h-8" />
                Course Overview
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p>{course.fullDescription || course.description}</p>
              </div>
            </motion.div>

            {/* Learning Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: brandColor }}>
                  <FiAward className="w-8 h-8" />
                  Learning Outcomes
                </h2>
                <ul className="space-y-3">
                  {course.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Topics Covered */}
            {course.topics && course.topics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-3xl font-bold mb-6" style={{ color: brandColor }}>
                  Topics Covered
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                           style={{ backgroundColor: brandColor }}>
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 sticky top-6"
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: brandColor }}>
                Course Information
              </h3>

              <div className="space-y-4">
                {course.instructor && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiUsers className="w-6 h-6" style={{ color: brandColor }} />
                    <div>
                      <p className="text-sm text-gray-500">Instructor</p>
                      <p className="font-semibold text-gray-800">{course.instructor}</p>
                    </div>
                  </div>
                )}

                {course.duration && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiClock className="w-6 h-6" style={{ color: brandColor }} />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-800">{course.duration}</p>
                    </div>
                  </div>
                )}

                {course.schedule && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiCalendar className="w-6 h-6" style={{ color: brandColor }} />
                    <div>
                      <p className="text-sm text-gray-500">Schedule</p>
                      <p className="font-semibold text-gray-800">{course.schedule}</p>
                    </div>
                  </div>
                )}

                {course.rating && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiStar className="w-6 h-6 text-yellow-500 fill-current" />
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="font-semibold text-gray-800">{course.rating}/5.0</p>
                    </div>
                  </div>
                )}

                {course.department && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiBook className="w-6 h-6" style={{ color: brandColor }} />
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-semibold text-gray-800">{course.department}</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                className="w-full mt-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: brandColor }}
              >
                Enroll Now
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
