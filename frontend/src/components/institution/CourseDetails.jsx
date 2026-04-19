import React, { useContext, useState, useEffect } from 'react';
import { InstitutionContext } from '../../context/InstitutionContext';
import { useParams, Link } from 'react-router-dom';
import { FiBook, FiClock, FiUsers, FiStar, FiAward, FiCheckCircle, FiArrowLeft, FiCalendar, FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/authcontext';

export default function CourseDetails() {
  const { institution } = useContext(InstitutionContext);
  const { user } = useAuth();
  const { courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institution?.slug && courseCode) {
      fetchCourseDetails();
    }
  }, [institution?.slug, courseCode]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/institutions/slug/${institution.slug}/courses/${courseCode}`);
      setCourse(response.data.course);
      setDocuments(Array.isArray(response.data.documents) ? response.data.documents : []);
    } catch (error) {
      console.error('Error fetching course:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes = 0) => {
    if (!bytes || Number.isNaN(Number(bytes))) return 'Unknown size';
    const val = Number(bytes);
    if (val < 1024) return `${val} B`;
    if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
    return `${(val / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDownloadHref = (doc) => {
    if (doc?.downloadUrl) {
      return doc.downloadUrl.startsWith('http')
        ? doc.downloadUrl
        : `${API_BASE_URL}${doc.downloadUrl}`;
    }

    if (doc?.fileUrl) return doc.fileUrl;
    return '#';
  };

  if (!institution) return null;

  const brandColor = institution.branding?.primaryColor || '#003D7A';
  const accentColor = institution.branding?.accentColor || brandColor;
  const canDownload = user?.role?.toLowerCase?.() === 'student';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm md:text-base text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center p-4">
        <div className="text-center">
          <FiBook className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <Link
            to={`/${institution.slug}/courses`}
            className="text-sm md:text-base text-blue-600 hover:underline"
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Header */}
      <div
        className="text-white py-8 md:py-12"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Link
            to={`/${institution.slug}/courses`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 md:mb-6 transition-colors text-sm md:text-base"
          >
            <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Back to Courses</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <span className="px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur-sm rounded-lg font-bold text-base md:text-lg">
                {course.code}
              </span>
              {course.credits && (
                <span className="px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold text-sm md:text-base">
                  {course.credits} Credits
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">{course.name}</h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-100">{course.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Course Overview */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-6 md:p-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3" style={{ color: brandColor }}>
                <FiBook className="w-6 h-6 md:w-8 md:h-8" />
                Course Overview
              </h2>
              <div className="prose max-w-none text-sm md:text-base text-gray-700">
                <p>{course.fullDescription || course.description}</p>
              </div>
            </motion.div> */}

            {/* Learning Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-6 md:p-8"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3" style={{ color: brandColor }}>
                  <FiAward className="w-6 h-6 md:w-8 md:h-8" />
                  Learning Outcomes
                </h2>
                <ul className="space-y-3">
                  {course.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-2 md:gap-3">
                      <FiCheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-0.5 md:mt-1" />
                      <span className="text-sm md:text-base text-gray-700">{outcome}</span>
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
                className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-6 md:p-8"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6" style={{ color: brandColor }}>
                  Topics Covered
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: brandColor }}>
                        {index + 1}
                      </div>
                      <span className="text-sm md:text-base text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-6 md:p-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6" style={{ color: brandColor }}>
                Uploaded Course Content
              </h2>

              {documents.length === 0 ? (
                <p className="text-sm md:text-base text-gray-600">No uploaded content available for this course yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-semibold text-gray-900 truncate">{doc.originalName}</p>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          {String(doc.fileType || '').toUpperCase()} • {formatBytes(doc.fileSize)} • Uploaded by {doc.uploadedBy || 'Unknown'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          MongoDB Index: {doc.isProcessed ? 'Ready' : 'Pending'} ({doc.chunksCount || 0} chunks) • Downloads: {doc.downloadCount || 0}
                        </p>
                      </div>

                      {canDownload ? (
                        <a
                          href={getDownloadHref(doc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                          style={{ backgroundColor: brandColor }}
                        >
                          <FiDownload className="w-4 h-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs md:text-sm text-gray-500">Download available for students only</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-5 md:p-6 lg:sticky lg:top-6"
            >
              <h3 className="text-xl md:text-2xl font-bold mb-5 md:mb-6" style={{ color: brandColor }}>
                Course Information
              </h3>

              <div className="space-y-3 md:space-y-4">
                {course.instructor && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <FiUsers className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: brandColor }} />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Instructor</p>
                      <p className="text-sm md:text-base font-semibold text-gray-800 truncate">{course.instructor}</p>
                    </div>
                  </div>
                )}

                {course.duration && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <FiClock className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: brandColor }} />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Duration</p>
                      <p className="text-sm md:text-base font-semibold text-gray-800">{course.duration}</p>
                    </div>
                  </div>
                )}

                {course.schedule && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <FiCalendar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: brandColor }} />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Schedule</p>
                      <p className="text-sm md:text-base font-semibold text-gray-800">{course.schedule}</p>
                    </div>
                  </div>
                )}

                {course.rating && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <FiStar className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-current flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Rating</p>
                      <p className="text-sm md:text-base font-semibold text-gray-800">{course.rating}/5.0</p>
                    </div>
                  </div>
                )}

                {course.department && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-gray-50 rounded-lg">
                    <FiBook className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: brandColor }} />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500">Department</p>
                      <p className="text-sm md:text-base font-semibold text-gray-800 truncate">{course.department}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* <button
                className="w-full mt-5 md:mt-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: brandColor }}
              >
                Enroll Now
              </button> */}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
