// InstitutionNavbar.jsx - Top navbar for institution pages
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authcontext";
import { authAPI } from "../../services/api";

export default function InstitutionNavbar({
  institution,
  onBackToDashboard,
  brandColor = "#10b981",
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
    localStorage.removeItem("auth");
    navigate("/login", { replace: true });
  };

  return (
    <nav
      className="bg-white border-b-2 shadow-sm z-50"
      style={{ borderBottomColor: `${brandColor}20` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LEFT: Back Button + Institution Info */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <motion.button
              onClick={onBackToDashboard}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all group"
              aria-label="Back to Dashboard"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              <span className="hidden sm:inline text-sm font-medium text-gray-600 group-hover:text-gray-900">
                Back
              </span>
            </motion.button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Institution Logo + Name */}
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
                }}
              >
                {institution?.branding?.logo ? (
                  <img
                    src={institution.branding.logo}
                    alt={institution.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  institution?.code ||
                  institution?.name?.substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Institution Name + Type */}
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {institution?.name || "Institution"}
                </h1>
                <p className="text-xs text-gray-500 capitalize">
                  {institution?.type || "Learning Platform"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <motion.button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all"
            >
              {/* User Avatar */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>

              {/* User Info (Hidden on mobile) */}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || "Member"}
                </p>
              </div>

              {/* Dropdown Icon */}
              <motion.div
                animate={{ rotate: profileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-4 h-4 text-gray-600" />
              </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden z-[200]"
                >
                  {/* User Info Header */}
                  <div
                    className="px-4 py-3 border-b border-gray-100"
                    style={{ backgroundColor: `${brandColor}08` }}
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                    <p
                      className="text-xs font-semibold mt-1 capitalize"
                      style={{ color: brandColor }}
                    >
                      {user?.role || "Member"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Profile */}
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: `${brandColor}05` }}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        // Navigate to profile
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 transition-all text-left"
                    >
                      <FiUser className="w-4 h-4" />
                      <span className="text-sm font-medium">My Profile</span>
                    </motion.button>

                    {/* Settings */}
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: `${brandColor}05` }}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        // Navigate to settings
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 transition-all text-left"
                    >
                      <FiSettings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </motion.button>
                  </div>

                  {/* Logout (Highlighted at bottom) */}
                  <div className="border-t border-gray-100">
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: "#fef2f2" }}
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 transition-all text-left font-medium"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
