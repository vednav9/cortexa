// Sidebar.jsx – Cortexa Level (UI Polished + Logout)
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiBell,
  FiHelpCircle,
  FiLogOut,
  FiX,
  FiClock,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const brandColor = "#10b981";

  if (loading) return null;

  const userRole = user?.role;

  /* ROLE → MENU ACCESS MAP */
  const MENU_BY_ROLE = {
    admin: ["dashboard", "addUsers", "pendingRequests", "notifications", "querydesk"],
    student: ["dashboard", "notifications"],
    teacher: ["dashboard", "notifications", "querydesk"],
  };

  /* BRAND COLOR */
  const defaultColor = "#10b981";
  const brandColor =
    isInstitution && institution?.brandColor
      ? institution.brandColor
      : defaultColor;

  /* MENU ITEMS */
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FiHome,
      path: "/dashboard",
    },
    {
      id: "addUsers",
      label: "Add Users",
      icon: FiUserPlus,
      path: "/dashboard", // Keep on dashboard
      isTab: true, // Mark as tab-based
    },
    {
      id: "pendingRequests",
      label: "Pending Requests",
      icon: FiClock,
      path: "/dashboard",
      isTab: true,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: FiBell,
      path: "/notifications",
    },
    {
      id: "querydesk",
      label: "Query Desk",
      icon: FiHelpCircle,
      path: "/querydesk",
    },
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
  ];

  const handleItemClick = (id) => {
    setActiveTab(id);
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      // ignore backend failure, still logout locally
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          w-80 bg-white border-r shadow-xl
          fixed inset-y-0 left-0 z-50
          h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          borderRightColor: `${brandColor}20`,
          borderRightWidth: "2px",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
              }}
            >
              <HiSparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: brandColor }}>
                Cortexa
              </p>
              <p className="text-xs text-gray-500">Unified Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                  ${active
                    ? "bg-emerald-50 text-emerald-600 font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
                style={
                  active
                    ? { backgroundColor: `${brandColor}10`, color: brandColor }
                    : {}
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>

                {active && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              text-red-600 hover:bg-red-50 font-semibold transition-all"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
