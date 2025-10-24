import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBook, 
  FiMessageSquare, 
  FiPhone,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navItems = [
    { name: 'About', path: '/about', icon: FiHome },
    { name: 'Features', path: '/features', icon: FiBook },
    { name: 'Reviews', path: '/reviews', icon: FiMessageSquare },
    { name: 'Contact Us', path: '/contact-us', icon: FiPhone },
  ];

  // Check if current path matches
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-12 h-12 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg"
              >
                <HiSparkles className="w-7 h-7 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white tracking-tight">
                  Cortexa
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="group relative"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center space-x-2 px-1 py-2 ${
                      isActive(item.path) 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    } transition-colors duration-300`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wide">{item.name}</span>
                  </motion.div>
                  
                  {/* Active Underline Indicator */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                    initial={false}
                    animate={{
                      scaleX: isActive(item.path) ? 1 : 0,
                      opacity: isActive(item.path) ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Hover Underline */}
                  {!isActive(item.path) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section - Login & Sign Up Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-lg text-white border border-gray-700 hover:border-gray-500 hover:bg-gray-900/50 transition-all duration-300 font-medium text-sm"
              >
                Login
              </motion.button>

              {/* Sign Up Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="px-6 py-2.5 rounded-lg bg-white text-black hover:bg-gray-200 transition-all duration-300 font-semibold text-sm shadow-lg"
              >
                Sign Up
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black border-t border-gray-800"
          >
            <div className="px-4 py-6 space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-gray-900 text-white border-l-4 border-white'
                      : 'text-gray-400 hover:bg-gray-900/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white border border-gray-700 hover:bg-gray-900/50 transition-all"
                >
                  <FiLogIn className="w-5 h-5" />
                  <span className="font-medium">Login</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/signup');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-white text-black hover:bg-gray-200 transition-all font-semibold"
                >
                  <FiUserPlus className="w-5 h-5" />
                  <span className="font-medium">Sign Up</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
