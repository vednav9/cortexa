import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHome, FiBell, FiHelpCircle, FiLogOut, FiX } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  unreadCount = 0
}) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  if (!user) return null;

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
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <aside
        className={`
          w-72 bg-white border-r border-gray-200 shadow-sm
          fixed inset-y-0 left-0 z-50
          h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Branding Header */}
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 shadow-sm shadow-emerald-500/20">
              <HiSparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[17px] text-gray-900 tracking-tight">Cortexa</span>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold px-1.5 py-[3px] rounded-md tracking-wider">
                {user?.role || "PORTAL"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <p className="px-2 mb-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 ${active
                  ? "bg-gray-100/80 text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-4.5 h-4.5 ${active ? "text-emerald-500" : "text-gray-400"}`} />
                  <span className={`text-[14px] ${active ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </div>

                {/* Notification Badge */}
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
