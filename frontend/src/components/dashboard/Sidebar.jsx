import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiMessageCircle,
  FiBell,
  FiFolder,
  FiUserPlus,
  FiHelpCircle,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import AIChat from "../ai/AIChat";
import { InstitutionContext } from "../../App";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({
  isOpen,
  onClose,
  isInstitution = false,
  activeTab,
  setActiveTab,
}) {
  const { institution } = useContext(InstitutionContext) || {};
  const { user, loading } = useAuth();
  const location = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);

  if (loading) return null;

  const userRole = user?.role;

  /* ROLE → MENU ACCESS MAP */
  const MENU_BY_ROLE = {
    admin: ["dashboard", "addUsers", "notifications", "querydesk"],
    student: ["dashboard", "chatbot", "notifications", "space", "analytics"],
    teacher: ["dashboard", "notifications", "querydesk", "analytics"],
  };

  /* BRAND COLOR */
  const defaultColor = "#10b981";
  const brandColor =
    isInstitution && institution?.brandColor
      ? institution.brandColor
      : defaultColor;

  /* ALL MENU ITEMS */
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
      path: "#",
      isTab: true,
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

  /* FILTER MENU BY ROLE */
  const allowedMenuIds = MENU_BY_ROLE[userRole] || [];
  const filteredMenuItems = menuItems.filter((item) =>
    allowedMenuIds.includes(item.id)
  );

  /* FIXED isActive FUNCTION */
  const isActive = (item) => {
    // For AI Chat - never show as active in sidebar
    if (item.isAIChat) {
      return false;
    }

    // Tab-based items (Admin: Add Users)
    if (item.isTab) {
      return activeTab === item.id;
    }

    // If any tab is active, route-based items should NOT be active
    if (activeTab && activeTab !== 'students' && activeTab !== 'teachers') {
      return false;
    }

    // Normal route-based active state
    if (item.path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(item.path) && item.path !== "#";
  };

  /* FIXED handleItemClick FUNCTION */
  const handleItemClick = (item, e) => {
    // Handle AI Chat
    if (item.isAIChat) {
      e.preventDefault();
      setAiChatOpen(true);
      onClose?.();
      return;
    }

    // Handle Tab-based navigation (Admin Add Users)
    if (item.isTab && setActiveTab) {
      e.preventDefault();
      setActiveTab(item.id);
      onClose?.();
      return;
    }

    // Handle regular navigation - clear activeTab
    if (setActiveTab && !item.isTab) {
      setActiveTab(null);
    }

    // Close sidebar on mobile
    onClose?.();
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
        {/* Header */}
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
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
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

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            // For tab items, use button instead of Link
            if (item.isTab || item.isAIChat) {
              return (
                <button
                  key={item.id}
                  onClick={(e) => handleItemClick(item, e)}
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

                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <span
                      className="px-2 py-0.5 text-xs text-white rounded-full font-bold flex-shrink-0"
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
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            }

            // Regular Link items
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={(e) => handleItemClick(item, e)}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
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

                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.badge && (
                  <span
                    className="px-2 py-0.5 text-xs text-white rounded-full font-bold flex-shrink-0"
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
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
