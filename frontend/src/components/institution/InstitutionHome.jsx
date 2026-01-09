import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiTrendingUp, FiAward, FiMapPin, FiMail, FiPhone, FiGlobe, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { InstitutionContext } from '../../context/InstitutionContext';

export default function InstitutionHome() {
  const { institution } = useContext(InstitutionContext);
  const [institutionData, setInstitutionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (institution?.slug) {
  //     fetchInstitutionData();
  //   }
  // }, [institution?.slug]);

  const fetchInstitutionData = async () => {
    try {
      const response = await api.get(`/institutions/${institution.slug}`);
      setInstitutionData(response.data.institution);
    } catch (error) {
      console.error('Error fetching institution:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!institution) return null;

  const displayData = institutionData || institution;
  const brandColor = institution.branding?.primaryColor || '#003D7A';
  const accentColor = institution.branding?.accentColor || brandColor;

  const stats = [
    { icon: FiUsers, label: 'Students', value: displayData.stats?.totalStudents?.toLocaleString() || '0', color: 'from-blue-500 to-blue-600' },
    { icon: FiBook, label: 'Courses', value: displayData.stats?.totalCourses?.toLocaleString() || '0', color: 'from-purple-500 to-purple-600' },
    { icon: FiUsers, label: 'Faculty', value: displayData.stats?.totalFaculty?.toLocaleString() || '0', color: 'from-green-500 to-green-600' },
    { icon: FiAward, label: 'Semesters', value: displayData.stats?.activeSemesters || '0', color: 'from-orange-500 to-orange-600' }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 min-h-screen">
      {/* Hero Section with Banner */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Banner Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: institution.branding?.banner
              ? `url(${institution.branding.banner})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white max-w-3xl"
          >
            {/* Logo */}
            {institution.branding?.logo && (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src={institution.branding.logo}
                alt={institution.name}
                className="h-16 w-16 md:h-24 md:w-24 mb-4 md:mb-6 rounded-xl shadow-2xl bg-white/10 backdrop-blur-sm p-2"
              />
            )}

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight">
              {institution.name}
            </h1>

            {institution.tagline && (
              <p className="text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 text-gray-200 italic">
                "{institution.tagline}"
              </p>
            )}

            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-100 leading-relaxed line-clamp-3 md:line-clamp-none">
              {institution.description}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              {/* <Link
                to={`/${institution.slug}/courses`}
                className="px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 text-sm md:text-base"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
                }}
              >
                <span className="flex items-center gap-2">
                  <FiBook className="w-4 h-4 md:w-5 md:h-5" />
                  Explore Courses
                </span>
              </Link> */}

              <Link
                to={`/${institution.slug}/login`}
                className="px-6 py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-xl font-bold text-white hover:bg-white/20 transition-all text-sm md:text-base"
              >
                Student Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-2xl transition-all p-4 md:p-6 group"
            >
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About & Contact Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 md:p-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 flex items-center gap-2 md:gap-3" style={{ color: brandColor }}>
              <FiCalendar className="w-6 h-6 md:w-8 md:h-8" />
              About Us
            </h2>
            <div className="space-y-3 md:space-y-4 text-gray-700 text-sm md:text-base">
              <p className="flex items-center gap-2 md:gap-3">
                <span className="font-semibold text-xs md:text-base">Type:</span>
                <span className="px-2.5 py-1 md:px-3 bg-blue-100 text-blue-700 rounded-lg text-xs md:text-sm font-medium">{institution.type}</span>
              </p>
              {institution.established && (
                <p className="flex items-center gap-2 md:gap-3">
                  <span className="font-semibold text-xs md:text-base">Established:</span>
                  <span className="text-xs md:text-base">{institution.established}</span>
                </p>
              )}
              {institution.location && (
                <div className="flex items-start gap-2 md:gap-3">
                  <FiMapPin className="w-4 h-4 md:w-5 md:h-5 mt-1 flex-shrink-0" style={{ color: brandColor }} />
                  <div>
                    <p className="font-semibold mb-1 text-xs md:text-base">Location:</p>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      {institution.location.address}<br />
                      {institution.location.city}, {institution.location.state}<br />
                      {institution.location.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 md:p-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 flex items-center gap-2 md:gap-3" style={{ color: brandColor }}>
              <FiMail className="w-6 h-6 md:w-8 md:h-8" />
              Contact Information
            </h2>
            <div className="space-y-3 md:space-y-4">
              {institution.contact?.email && (
                <a href={`mailto:${institution.contact.email}`} className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FiMail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-sm md:text-base text-gray-800 group-hover:text-blue-600 transition-colors truncate">{institution.contact.email}</p>
                  </div>
                </a>
              )}

              {institution.contact?.phone && (
                <a href={`tel:${institution.contact.phone}`} className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FiPhone className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-sm md:text-base text-gray-800 group-hover:text-blue-600 transition-colors truncate">{institution.contact.phone}</p>
                  </div>
                </a>
              )}

              {institution.contact?.website && (
                <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FiGlobe className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-gray-500">Website</p>
                    <p className="font-semibold text-sm md:text-base text-gray-800 group-hover:text-blue-600 transition-colors truncate">{institution.contact.website}</p>
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Departments Section */}
      {institution.departments && institution.departments.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center" style={{ color: brandColor }}>
              Our Departments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {institution.departments.map((dept, index) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="group bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-2xl transition-all p-5 md:p-6 cursor-pointer border-2 border-transparent hover:border-opacity-50"
                  style={{ '--hover-color': brandColor }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${brandColor}50`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-base md:text-lg group-hover:scale-110 transition-transform shadow-md"
                      style={{ backgroundColor: brandColor }}
                    >
                      {dept.code}
                    </div>
                    <FiBook className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {dept.name}
                  </h4>
                  {dept.head && (
                    <p className="text-xs md:text-sm text-gray-600">
                      <span className="font-semibold">Head:</span> {dept.head}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
