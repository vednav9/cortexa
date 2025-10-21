import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBook, 
  FiMessageSquare, 
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiBell
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Navbar = ({ userRole = 'user' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { name: 'Home', path: '/', icon: FiHome },
      { name: 'Resources', path: '/resources', icon: FiBook },
      { name: 'Query Desk', path: '/queries', icon: FiMessageSquare },
    ];

    if (userRole === 'admin') {
      return [
        ...commonItems,
        { name: 'Manage Users', path: '/admin/users', icon: FiUser },
        { name: 'Analytics', path: '/admin/analytics', icon: HiSparkles },
      ];
    } else if (userRole === 'teacher') {
      return [
        ...commonItems,
        { name: 'My Classes', path: '/teacher/classes', icon: FiBook },
        { name: 'AI Tools', path: '/teacher/ai-tools', icon: HiSparkles },
      ];
    } else {
      return [
        ...commonItems,
        { name: 'My Learning', path: '/student/learning', icon: FiBook },
        { name: 'AI Assistant', path: '/student/assistant', icon: HiSparkles },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-slate-900/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-lg shadow-indigo-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50"
              >
                <HiSparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Cortexa
                </span>
                <span className="text-xs text-indigo-300/70 -mt-1">AI-Powered Learning</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="group relative px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </motion.div>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center space-x-4">
              
              {/* Search Bar */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-indigo-500/20 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </motion.div>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-lg bg-slate-800/50 border border-indigo-500/20 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all"
              >
                <FiBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              </motion.button>

              {/* Profile */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 capitalize">{userRole}</span>
                </motion.button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-900 border border-indigo-500/20 rounded-lg shadow-xl overflow-hidden"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-colors"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-3 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => navigate('/logout')}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-800/50 border border-indigo-500/20 text-slate-300"
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
            className="md:hidden bg-slate-900/98 border-t border-indigo-500/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-all"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Search */}
              <div className="pt-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-indigo-500/20 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Mobile Profile Section */}
              <div className="pt-2 border-t border-indigo-500/20">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-all"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </Link>
                <button
                  onClick={() => navigate('/logout')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
