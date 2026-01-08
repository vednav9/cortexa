import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome, FiBell, FiHelpCircle, FiLogOut, FiX
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  if (!user) return null;

  // Universal menu items for all users (Cortexa Dashboard)
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    } catch (_) { }
    setUser(null);
    navigate("/login", { replace: true });
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          w-80 bg-white border-r-2 shadow-xl
          fixed inset-y-0 left-0 z-50
          h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          borderRightColor: "#10b98120",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-green-600"
            >
              <HiSparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-emerald-600">Cortexa</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "User"}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();

                  // 🔔 clear unread count when opened
                  if (item.id === "notifications") {
                    window.dispatchEvent(new Event("notifications-opened"));
                  }
                }}
                className={`relative w-full flex items-center px-4 py-3 rounded-xl ${active ? "bg-emerald-50 text-emerald-600" : ""
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>

                {/* 🔴 BADGE
                {item.id === "notifications" && window.__UNREAD_COUNT__ > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {window.__UNREAD_COUNT__}
                  </span>
                )} */}
              </motion.button>
            );
          })}

        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-gray-100 p-4">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
