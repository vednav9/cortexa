import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiUser, FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const navItems = [
    { name: "About", path: "about" },
    { name: "Features", path: "features" },
    { name: "Reviews", path: "reviews" },
    { name: "Contact", path: "contact" },
  ];

  // ✅ ALL HOOKS FIRST (NO EARLY RETURNS ABOVE THIS)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

      const scrollY = window.scrollY + 120;
      ["hero", ...navItems.map((i) => i.path)].forEach((sectionId) => {
        const sec = document.getElementById(sectionId);
        if (sec) {
          const top = sec.offsetTop;
          const bottom = top + sec.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // ✅ CONDITIONS ONLY AFTER HOOKS
  const isHomePage = location.pathname === "/";
  if (!isHomePage) return null;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const pos = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: pos, behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
    setProfileMenuOpen(false);
  };

  return (
    <motion.nav className="fixed top-0 left-0 right-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 z-[9999]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <HiSparkles className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">
            Cortexa
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => scrollToSection(item.path)}
              className={`text-sm font-medium transition-colors ${
                activeSection === item.path
                  ? "text-emerald-400"
                  : "text-gray-300 hover:text-emerald-400"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            // Show Profile Dropdown when logged in
            <div className="relative" ref={profileMenuRef}>
              <motion.button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
              >
                {/* User Avatar */}
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>

                {/* User Info */}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.role || "Member"}
                  </p>
                </div>

                {/* Dropdown Icon */}
                <motion.div
                  animate={{ rotate: profileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </motion.button>

              {/* Dropdown Menu - FIXED Z-INDEX */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-[99999]"
                    style={{ position: "absolute" }}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
                      <p className="text-sm font-bold text-gray-900">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs font-semibold mt-1 capitalize text-emerald-600">
                        {user?.role || "Member"}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Dashboard */}
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "#f0fdf4" }}
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 transition-all text-left"
                      >
                        <HiSparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </motion.button>

                      {/* Profile */}
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "#f0fdf4" }}
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
                        whileHover={{ x: 4, backgroundColor: "#f0fdf4" }}
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
          ) : (
            // Show Login/Signup buttons when not logged in
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 text-sm rounded-lg text-emerald-400 border border-emerald-400/40 hover:bg-emerald-400/10 transition-all"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg bg-white/10 text-gray-200"
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-black/95 border-t border-white/10"
          >
            <div className="px-6 py-5 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => scrollToSection(item.path)}
                  className="block w-full text-left px-3 py-2 rounded-md text-gray-300 hover:text-emerald-400 hover:bg-white/5 transition-all"
                >
                  {item.name}
                </button>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-3">
                {user ? (
                  // Mobile: Show user info and logout
                  <>
                    <div className="px-3 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm font-semibold text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                      <p className="text-xs font-semibold mt-1 capitalize text-emerald-400">
                        {user?.role || "Member"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold flex items-center justify-center space-x-2"
                    >
                      <HiSparkles className="w-4 h-4" />
                      <span>Go to Dashboard</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 rounded-lg border border-red-500/40 text-red-400 font-semibold flex items-center justify-center space-x-2 hover:bg-red-500/10"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  // Mobile: Show login/signup buttons
                  <>
                    <button
                      onClick={() => {
                        navigate("/login");
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg text-emerald-400 border border-emerald-400/40"
                    >
                      Login
                    </button>

                    <button
                      onClick={() => {
                        navigate("/signup");
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
