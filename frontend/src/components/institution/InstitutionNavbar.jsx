// InstitutionNavbar.jsx – Responsive, Brand-Color Themed
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiUser, FiLogOut, FiChevronDown, FiMenu, FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authcontext";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)}, ${parseInt(r[2],16)}, ${parseInt(r[3],16)}` : '16, 185, 129';
};

export default function InstitutionNavbar({
  institution,
  onBackToDashboard,
  brandColor = "#10b981",
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const rgb = hexToRgb(brandColor);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("auth");
    navigate("/login", { replace: true });
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "U";

  return (
    <>
      <nav
        className="relative bg-white border-b z-50"
        style={{ borderBottomColor: `rgba(${rgb}, 0.15)` }}
      >
        {/* Brand color accent line on top */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${brandColor}, rgba(${rgb}, 0.4))` }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">

            {/* ── LEFT: Back + Institution Identity ── */}
            <div className="flex items-center gap-3">
              {/* Back button */}
              <motion.button
                onClick={onBackToDashboard}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors group"
                aria-label="Back to Dashboard"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="text-[12px] font-semibold hidden sm:inline">Dashboard</span>
              </motion.button>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-200 hidden sm:block" />

              {/* Logo + Name */}
              <div className="flex items-center gap-3">
                {/* Logo circle or initial */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-[11px] overflow-hidden shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {institution?.branding?.logo ? (
                    <img
                      src={institution.branding.logo}
                      alt={institution.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    institution?.name?.charAt(0).toUpperCase() || "I"
                  )}
                </div>

                {/* Name */}
                <div className="hidden sm:block">
                  <p className="text-[14px] font-bold text-gray-900 leading-none">{institution?.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{institution?.type}</p>
                </div>
                {/* Mobile: name only (no type) */}
                <p className="text-[13px] font-bold text-gray-900 sm:hidden leading-none">{institution?.name}</p>
              </div>
            </div>

            {/* ── RIGHT: Profile dropdown (desktop) + hamburger (mobile) ── */}
            <div className="flex items-center gap-2">

              {/* Desktop profile button */}
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {initials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-gray-400 capitalize leading-tight">{user?.role}</p>
                  </div>
                  <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </motion.div>
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] overflow-hidden z-[200]"
                    >
                      {/* User info header */}
                      <div
                        className="px-4 py-3.5 border-b border-gray-50"
                        style={{ backgroundColor: `rgba(${rgb}, 0.05)` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                            style={{ backgroundColor: brandColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                            <p
                              className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                              style={{ color: brandColor }}
                            >
                              {user?.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5">
                        <button
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                        >
                          <FiUser className="w-4 h-4 flex-shrink-0" />
                          <span className="text-[13px] font-medium">My Profile</span>
                        </button>
                      </div>

                      <div
                        className="p-1.5 border-t"
                        style={{ borderColor: `rgba(${rgb}, 0.08)` }}
                      >
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                        >
                          <FiLogOut className="w-4 h-4 flex-shrink-0" />
                          <span className="text-[13px] font-medium">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                className="sm:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Open menu"
              >
                {mobileOpen
                  ? <FiX className="w-5 h-5 text-gray-600" />
                  : <FiMenu className="w-5 h-5 text-gray-600" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden border-t overflow-hidden"
              style={{ borderColor: `rgba(${rgb}, 0.10)`, backgroundColor: `rgba(${rgb}, 0.02)` }}
            >
              {/* User info strip */}
              <div className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: `rgba(${rgb}, 0.08)` }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[12px] text-gray-400 truncate">{user?.email}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: brandColor }}>
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 space-y-1">
                <button
                  onClick={() => { setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-white hover:text-gray-900 transition-colors text-left"
                >
                  <FiUser className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[13px] font-medium">My Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <FiLogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[13px] font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
