import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiTrendingUp, FiAward, FiMapPin, FiMail, FiPhone, FiGlobe, FiCalendar, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { InstitutionContext } from '../../context/InstitutionContext';

export default function InstitutionHome() {
  const { institution } = useContext(InstitutionContext);
  const [institutionData, setInstitutionData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    { icon: FiUsers, label: 'Students', value: displayData.stats?.totalStudents?.toLocaleString() || '0', color: 'from-blue-500 via-blue-600 to-indigo-600', bgColor: 'bg-blue-50' },
    { icon: FiBook, label: 'Courses', value: displayData.stats?.totalCourses?.toLocaleString() || '0', color: 'from-purple-500 via-purple-600 to-pink-600', bgColor: 'bg-purple-50' },
    { icon: FiUsers, label: 'Faculty', value: displayData.stats?.totalFaculty?.toLocaleString() || '0', color: 'from-green-500 via-green-600 to-emerald-600', bgColor: 'bg-green-50' },
    { icon: FiAward, label: 'Active Semesters', value: displayData.stats?.activeSemesters || '0', color: 'from-orange-500 via-orange-600 to-red-600', bgColor: 'bg-orange-50' }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen">
      {/* Hero Section with Enhanced Banner */}
      <div className="relative h-[420px] md:h-[480px] overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Banner Image with Parallax Effect */}
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: institution.branding?.banner
                ? `url(${institution.branding.banner})`
                : `linear-gradient(135deg, ${brandColor}20 0%, ${accentColor}40 100%)`
            }}
          >
            {/* Enhanced Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/50" />
            
            {/* Animated Gradient Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center pt-4">
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-white max-w-4xl"
            >
              {/* Logo with Glassmorphism */}
              {institution.branding?.logo && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  className="inline-block mb-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-2xl blur-sm" />
                    <img
                      src={institution.branding.logo}
                      alt={institution.name}
                      className="relative h-14 w-14 md:h-20 md:w-20 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md p-2 border-2 border-white/20"
                    />
                  </div>
                </motion.div>
              )}

              {/* Title with Stagger Animation */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 leading-tight tracking-tight"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100">
                  {institution.name}
                </span>
              </motion.h1>

              {/* Tagline with Elegant Animation */}
              {institution.tagline && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="relative inline-block mb-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-lg" />
                  <p className="relative text-base md:text-lg lg:text-xl text-blue-100 italic font-light px-3 py-1.5">
                    "{institution.tagline}"
                  </p>
                </motion.div>
              )}

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-sm md:text-base mb-5 text-gray-200 leading-relaxed max-w-3xl font-light"
              >
                {institution.description}
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <Link
                  to={`/${institution.slug}/login`}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-xl font-bold text-white hover:bg-white/20 hover:border-white/50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <span className="text-sm">Get Started</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FiTrendingUp className="w-4 h-4" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path fill="#f8fafc" fillOpacity="1" d="M0,50 C240,100 480,0 720,50 C960,100 1200,0 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </div>

      {/* Floating Stats Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-16 md:-mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 0.8 + index * 0.1, 
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative bg-white rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl transition-all p-6 md:p-8 group overflow-hidden border border-gray-100`}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.bgColor}`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-semibold">
                  {stat.label}
                </div>
              </div>

              {/* Decorative Corner */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* About & Contact Section with Modern Cards */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* About Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all p-8 md:p-10 overflow-hidden border border-gray-100"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -z-0 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
                >
                  <FiInfo className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                  About Us
                </h2>
              </div>

              <div className="space-y-5 text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-sm">Type:</span>
                  <span 
                    className="px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
                    style={{ 
                      backgroundColor: `${brandColor}15`,
                      color: brandColor
                    }}
                  >
                    {institution.type}
                  </span>
                </div>

                {institution.established && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <FiCalendar className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Established</p>
                      <p className="text-lg font-bold text-gray-900">{institution.established}</p>
                    </div>
                  </div>
                )}

                {institution.location && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl">
                    <FiMapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: brandColor }} />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
                      <p className="text-gray-700 leading-relaxed">
                        {institution.location.address}<br />
                        <span className="font-semibold">{institution.location.city}</span>, {institution.location.state}<br />
                        {institution.location.country}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all p-8 md:p-10 overflow-hidden border border-gray-100"
          >
            {/* Background Decoration */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-100/50 to-blue-100/50 rounded-full blur-3xl -z-0 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
                >
                  <FiMail className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                  Contact
                </h2>
              </div>

              <div className="space-y-4">
                {institution.contact?.email && (
                  <motion.a
                    href={`mailto:${institution.contact.email}`}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-all group/item"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                      <FiMail className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="font-bold text-gray-900 group-hover/item:text-red-600 transition-colors truncate">{institution.contact.email}</p>
                    </div>
                  </motion.a>
                )}

                {institution.contact?.phone && (
                  <motion.a
                    href={`tel:${institution.contact.phone}`}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all group/item"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                      <FiPhone className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="font-bold text-gray-900 group-hover/item:text-green-600 transition-colors truncate">{institution.contact.phone}</p>
                    </div>
                  </motion.a>
                )}

                {institution.contact?.website && (
                  <motion.a
                    href={institution.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group/item"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                      <FiGlobe className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Website</p>
                      <p className="font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors truncate">{institution.contact.website}</p>
                    </div>
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Departments Section with Enhanced Cards */}
      {institution.departments && institution.departments.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
                Our Departments
              </h2>
              <div 
                className="h-1.5 w-32 mx-auto rounded-full"
                style={{ background: `linear-gradient(90deg, ${brandColor}, ${accentColor})` }}
              />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institution.departments.map((dept, index) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 cursor-pointer overflow-hidden border-2 border-transparent hover:border-opacity-30"
                style={{ 
                  '--hover-border': `${brandColor}50`
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${brandColor}50`}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                {/* Background Gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                      style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
                    >
                      {dept.code}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <FiBook className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {dept.name}
                  </h4>

                  {dept.head && (
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100">
                      <FiUsers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Department Head</p>
                        <p className="text-sm text-gray-700 font-semibold">{dept.head}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Corner Decoration */}
                <div 
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
