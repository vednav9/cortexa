import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiBook, FiUsers, FiMenu, FiX, FiLogIn, FiArrowLeft } from 'react-icons/fi';

export default function InstitutionNavbar({ institution, institutionSlug, onMenuClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const brandColor = institution.branding.primaryColor || '#003D7A';
  const accentColor = institution.branding.accentColor || brandColor;

  const navLinks = [
    { path: `/${institutionSlug}`, label: 'Home', icon: FiHome },
    { path: `/${institutionSlug}/courses`, label: 'Courses', icon: FiBook },
  ];

  return (
    <>
      {/* Brand Color Top Bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${brandColor}, ${accentColor})`
        }}
      />

      <nav className="bg-white shadow-md sticky top-0 z-50 border-b-4" style={{ borderBottomColor: brandColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Menu + Logo */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button (for sidebar) */}
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: brandColor }}
              >
                <FiMenu className="w-6 h-6" />
              </button>

              {/* Divider */}
              {/* <div className="hidden md:block h-8 w-px bg-gray-300" /> */}

              {/* Institution Logo & Name */}
              <Link to={`/${institutionSlug}`} className="flex items-center space-x-3 group">
                {institution.logo ? (
                  <img
                    src={institution.logo}
                    alt={institution.name}
                    className="h-12 w-12 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {institution.shortName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h1
                    className="text-xl font-bold group-hover:opacity-80 transition-opacity"
                    style={{ color: brandColor }}
                  >
                    {institution.shortName || institution.name}
                  </h1>
                  <p className="text-xs text-gray-500 hidden lg:block">{institution.name}</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    isActive(link.path)
                      ? 'font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={isActive(link.path) ? { color: brandColor, backgroundColor: `${brandColor}15` } : {}}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Login Button */}
              <Link
                to={`/${institutionSlug}/login`}
                className="px-5 py-2 rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button (for navbar menu) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: brandColor }}
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-gray-50 border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Back to Cortexa</span>
              </Link>

              <div className="h-px bg-gray-300 my-2" />

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
                  style={
                    isActive(link.path)
                      ? { color: brandColor, backgroundColor: `${brandColor}15` }
                      : { color: '#4B5563' }
                  }
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}

              <Link
                to={`/${institutionSlug}/login`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-lg font-semibold text-white mt-3 shadow-md"
                style={{ backgroundColor: brandColor }}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
}
