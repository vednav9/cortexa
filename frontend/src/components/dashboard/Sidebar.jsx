import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiHome, FiBell, FiHelpCircle, FiLogOut, FiX, FiUsers, FiUserPlus,
  FiBook, FiUpload, FiCheckSquare, FiMic, FiVideo, FiMessageSquare,
  FiClipboard, FiGrid, FiArrowLeft
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/authcontext";

export default function Sidebar({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  selectedInstitution,
  onBackToDashboard 
}) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  if (!user) return null;

  const brandColor = selectedInstitution?.branding?.primaryColor || "#10b981";

  // Default menu items (when no institution is selected)
  const defaultMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
  ];

  // Role-specific menu items (when institution is selected)
  const getRoleSpecificMenuItems = () => {
    const role = user?.role?.toLowerCase();

    if (role === 'admin') {
      return [
        { id: "institution-dashboard", label: "Institution Dashboard", icon: FiHome },
        { id: "notifications", label: "Notifications", icon: FiBell },
        { id: "announcements", label: "Announcements", icon: FiBell },
        { id: "invite-people", label: "Invite People", icon: FiUserPlus },
        { id: "manage-users", label: "Manage Users", icon: FiUsers },
        { id: "academic-structure", label: "Academic Structure", icon: FiGrid },
        { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
      ];
    } else if (role === 'teacher') {
      return [
        { id: "institution-dashboard", label: "Institution Dashboard", icon: FiHome },
        { id: "notifications", label: "Notifications", icon: FiBell },
        { id: "announcements", label: "Announcements", icon: FiBell },
        { id: "see-students", label: "See Students", icon: FiUsers },
        { id: "upload-notes", label: "Upload Notes", icon: FiUpload },
        { id: "generate-mcq", label: "Generate MCQs", icon: FiCheckSquare },
        { id: "voice-to-text", label: "Voice-to-Text", icon: FiMic },
        // { id: "video-generator", label: "Video Generator", icon: FiVideo },
        { id: "qa-portal", label: "Q&A Portal", icon: FiMessageSquare },
        { id: "assessment", label: "Assessment", icon: FiClipboard },
        { id: "ai-chatbot", label: "AI Chatbot Personal", icon: HiSparkles },
        { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
      ];
    } else if (role === 'student') {
      return [
        { id: "institution-dashboard", label: "Institution Dashboard", icon: FiHome },
        { id: "notifications", label: "Notifications", icon: FiBell },
        { id: "announcements", label: "Announcements", icon: FiBell },
        { id: "mcq-test", label: "MCQ Test", icon: FiCheckSquare },
        { id: "rag-chatbot", label: "RAG Chatbot", icon: HiSparkles },
        { id: "qa-section", label: "Q&A Section", icon: FiMessageSquare },
        { id: "assessment", label: "Assessment", icon: FiClipboard },
        { id: "querydesk", label: "Query Desk", icon: FiHelpCircle },
      ];
    }

    return defaultMenuItems;
  };

  const menuItems = selectedInstitution ? getRoleSpecificMenuItems() : defaultMenuItems;

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
          borderRightColor: `${brandColor}20`,
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
              {selectedInstitution ? (
                <span className="text-white font-bold text-sm">
                  {selectedInstitution.code || selectedInstitution.name?.substring(0, 2).toUpperCase()}
                </span>
              ) : (
                <HiSparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {selectedInstitution ? (
                <>
                  <p className="font-bold text-sm text-gray-800 truncate">
                    {selectedInstitution.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || "User"}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg text-emerald-600">Cortexa</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || "User"}</p>
                </>
              )}
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

        {/* Back Button (when institution is selected) */}
        {selectedInstitution && onBackToDashboard && (
          <div className="px-4 pt-4">
            <button
              onClick={() => {
                onBackToDashboard();
                onClose?.();
              }}
              className="w-full flex items-center space-x-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>
        )}

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
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full relative flex items-center space-x-3 px-4 py-3 rounded-xl 
                  transition-all duration-200
                  ${active
                    ? "bg-emerald-50 text-emerald-600 font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                  }
                `}
                style={
                  active
                    ? { backgroundColor: `${brandColor}10`, color: brandColor }
                    : {}
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{item.label}</p>
                </div>

                {/* Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: brandColor }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer - User Info & Logout */}
        <div className="border-t border-gray-100">



          {/* Logout Button */}
          <div className="p-4">
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
        </div>
      </aside>
    </>
  );
}
