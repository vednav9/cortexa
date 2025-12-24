import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiMessageCircle,
  FiBell,
  FiFolder,
  FiHelpCircle,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import AIChat from "../ai/AIChat";
import { InstitutionContext } from "../../App";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({ isOpen, onClose, isInstitution = false }) {
  const { institution } = useContext(InstitutionContext) || {};
  const { user, loading } = useAuth();
  const location = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);

  if (loading) return null;

  const userRole = user?.role;

  /* =======================
     ROLE → MENU ACCESS MAP
  ======================== */
  const MENU_BY_ROLE = {
    admin: ["dashboard", "notifications", "querydesk"],
    student: ["dashboard", "chatbot", "notifications", "space", "analytics"],
    teacher: ["dashboard", "notifications", "querydesk", "analytics"],
  };

  /* =======================
     BRAND COLOR
  ======================== */
  const defaultColor = "#10b981";
  const brandColor =
    isInstitution && institution?.brandColor
      ? institution.brandColor
      : defaultColor;

  /* =======================
     ALL MENU ITEMS
  ======================== */
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FiHome,
      path: "/dashboard",
    },
    {
      id: "chatbot",
      label: "AI Assistant",
      icon: FiMessageCircle,
      path: "#",
      isAIChat: true,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: FiBell,
      path: "/notifications",
      badge: 3,
    },
    {
      id: "space",
      label: "My Space",
      icon: FiFolder,
      path: "/space",
      description: "Documents & Notes",
    },
    {
      id: "querydesk",
      label: "Query Desk",
      icon: FiHelpCircle,
      path: "/querydesk",
    },
    {
      id: "analytics",
      label: "Progress Insights",
      icon: FiTrendingUp,
      path: "/analytics",
    },
  ];


  /* =======================
     FILTER MENU BY ROLE
  ======================== */
  const allowedMenuIds = MENU_BY_ROLE[userRole] || [];
  const filteredMenuItems = menuItems.filter((item) =>
    allowedMenuIds.includes(item.id)
  );

  const isActive = (path) => location.pathname.includes(path);

  const handleItemClick = (item, e) => {
    if (item.isAIChat) {
      e.preventDefault();
      setAiChatOpen(true);
      onClose();
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
    transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
  `}
        style={{
          borderRightColor: `${brandColor}20`,
          borderRightWidth: "2px",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10">
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
              <p className="font-bold" style={{ color: brandColor }}>
                Cortexa
              </p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.isAIChat ? "#" : item.path}
                onClick={(e) => handleItemClick(item, e)}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                  ${active ? "shadow-md" : "hover:bg-gray-50"}
                `}
                style={
                  active
                    ? { backgroundColor: `${brandColor}10`, color: brandColor }
                    : {}
                }
              >
                <Icon className="w-5 h-5" />

                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.badge && (
                  <span
                    className="w-4 h-4 text-xs text-white rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: brandColor }}
                  >
                    {item.badge}
                  </span>
                )}

                {active && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* AI Chat */}
      <AIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        institutionId={institution?.id}
        brandColor={brandColor}
      />
    </>
  );
}
