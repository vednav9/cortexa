// InstitutionMenu.jsx - Role-based dropdown menu for institution pages
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiBell,
  FiUserPlus,
  FiUsers,
  FiGrid,
  FiUpload,
  FiCheckSquare,
  FiMic,
  FiMessageSquare,
  FiClipboard,
  FiHelpCircle,
  FiChevronDown,
  FiBook,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

export default function InstitutionMenu({
  userRole,
  hasAccess,
  brandColor = "#10b981",
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const menuRefs = useRef({});
  const dropdownRef = useRef(null);

  // Get menu items based on role
  const getMenuItems = () => {
    const role = userRole?.toLowerCase();

    // Debug logging
    console.log('🎯 InstitutionMenu - getMenuItems:', {
      userRole: role,
      hasAccess,
      willCheckRole: !!role
    });

    // ADMIN Menu - Check hasAccess for full vs limited menu
    if (role === "admin") {
      if (hasAccess) {
        // Admin HAS ACCESS to this institution - Full admin menu
        console.log('✅ Admin with access - showing full menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "announcements",
            label: "Announcements",
            icon: FiBell,
            items: [],
          },
          {
            id: "invite-people",
            label: "Invite People",
            icon: FiUserPlus,
            items: [],
          },
          {
            id: "manage-users",
            label: "Manage Users",
            icon: FiUsers,
            items: [],
          },
          {
            id: "academic-structure",
            label: "Academic Structure",
            icon: FiGrid,
            items: [
              { id: "departments", label: "Departments", icon: FiBook },
              { id: "courses", label: "Courses", icon: FiBook },
              { id: "semesters", label: "Semesters", icon: FiClipboard },
              { id: "calendar", label: "Academic Calendar", icon: FiBell },
              { id: "faculty", label: "Faculty", icon: FiUsers },
            ],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      } else {
        // Admin NO ACCESS - Limited menu (visitor view)
        console.log('⚠️ Admin without access - showing limited menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      }
    }

    // TEACHER Menu - Check hasAccess for full vs limited menu
    if (role === "teacher") {
      if (hasAccess) {
        // Teacher HAS ACCESS to this institution - Full menu
        console.log('✅ Teacher with access - showing full menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "announcements",
            label: "Announcements",
            icon: FiBell,
            items: [],
          },
          {
            id: "see-students",
            label: "See Students",
            icon: FiUsers,
            items: [],
          },
          {
            id: "upload-notes",
            label: "Upload Notes",
            icon: FiUpload,
            items: [],
          },
          {
            id: "generate-mcq",
            label: "Generate MCQs",
            icon: FiCheckSquare,
            items: [],
          },
          {
            id: "voice-to-text",
            label: "Voice-to-Text",
            icon: FiMic,
            items: [],
          },
          {
            id: "qa-portal",
            label: "Q&A Portal",
            icon: FiMessageSquare,
            items: [],
          },
          {
            id: "assessment",
            label: "Assessment",
            icon: FiClipboard,
            items: [],
          },
          {
            id: "ai-chatbot",
            label: "AI Chatbot Personal",
            icon: HiSparkles,
            items: [],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      } else {
        // Teacher NO ACCESS - Limited menu
        console.log('⚠️ Teacher without access - showing limited menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      }
    }

    // STUDENT Menu - Check hasAccess for full vs limited menu
    if (role === "student") {
      if (hasAccess) {
        // Student HAS ACCESS to this institution - Full menu
        console.log('✅ Student with access - showing full menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "announcements",
            label: "Announcements",
            icon: FiBell,
            items: [],
          },
          {
            id: "mcq-test",
            label: "MCQ Test",
            icon: FiCheckSquare,
            items: [],
          },
          {
            id: "rag-chatbot",
            label: "RAG Chatbot",
            icon: HiSparkles,
            items: [],
          },
          {
            id: "qa-section",
            label: "Q&A Section",
            icon: FiMessageSquare,
            items: [],
          },
          {
            id: "assessment",
            label: "Assessment",
            icon: FiClipboard,
            items: [],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      } else {
        // Student NO ACCESS - Limited menu
        console.log('⚠️ Student without access - showing limited menu');
        return [
          {
            id: "institution-dashboard",
            label: "Institution Dashboard",
            icon: FiHome,
            items: [],
          },
          {
            id: "query-desk",
            label: "Query Desk",
            icon: FiHelpCircle,
            items: [],
          },
        ];
      }
    }

    // Default - Non-logged-in users or unknown roles
    console.log('⚠️ No role matched or not logged in - showing public menu');
    return [
      {
        id: "institution-dashboard",
        label: "Institution Dashboard",
        icon: FiHome,
        items: [],
      },
      {
        id: "courses",
        label: "Courses",
        icon: FiBook,
        items: [],
      },
    ];
  };

  const menuItems = getMenuItems();

  // Determine active view from current location
  const getCurrentView = () => {
    const path = location.pathname.replace(`/${slug}`, "") || "/";
    if (path === "/" || path === "") return "institution-dashboard";

    // Remove leading slash and get the path
    const cleanPath = path.replace(/^\//, "");

    // Check if it's a nested route (e.g., academic-structure/departments)
    if (cleanPath.includes("/")) {
      const parts = cleanPath.split("/");
      return `${parts[0]}-${parts[1]}`; // e.g., "academic-structure-departments"
    }

    return cleanPath;
  };

  const activeView = getCurrentView();

  const handleMenuClick = (item) => {
    if (item.items && item.items.length > 0) {
      // Calculate dropdown position
      const buttonElement = menuRefs.current[item.id];
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
      // Toggle dropdown for items with sub-items
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      // Navigate to the route for items without sub-items
      navigate(`/${slug}/${item.id}`);
      setOpenDropdown(null);
    }
  };

  const handleSubItemClick = (parentId, subItem) => {
    // Navigate to nested route: /{slug}/{parent}/{subitem}
    navigate(`/${slug}/${parentId}/${subItem.id}`);
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside - FIXED: Include dropdown ref
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both menu buttons AND dropdown
      const clickedOutsideButtons = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );
      
      const clickedOutsideDropdown = 
        !dropdownRef.current || !dropdownRef.current.contains(event.target);

      if (clickedOutsideButtons && clickedOutsideDropdown && openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Update dropdown position on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdown) {
        const buttonElement = menuRefs.current[openDropdown];
        if (buttonElement) {
          const rect = buttonElement.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX,
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openDropdown]);

  return (
    <div className="bg-white border-b-2 border-gray-100 shadow-sm z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto scrollbar-hide">
          <nav className="flex items-center space-x-1 py-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id || activeView?.startsWith(`${item.id}-`);
              const isOpen = openDropdown === item.id;
              const hasSubItems = item.items && item.items.length > 0;

              return (
                <div key={item.id}>
                  {/* Main Menu Button */}
                  <motion.button
                    ref={(el) => (menuRefs.current[item.id] = el)}
                    onClick={() => handleMenuClick(item)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      flex items-center space-x-2 px-4 py-2.5 rounded-xl
                      transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? "font-semibold shadow-md"
                          : "text-gray-700 hover:bg-gray-50 font-medium"
                      }
                    `}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${brandColor}15`,
                            color: brandColor,
                          }
                        : {}
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                    {hasSubItems && (
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiChevronDown className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Dropdown Menu - Rendered via Portal */}
                  {hasSubItems &&
                    isOpen &&
                    createPortal(
                      <AnimatePresence>
                        <motion.div
                          ref={dropdownRef}
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: "absolute",
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            zIndex: 200,
                          }}
                          className="w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden"
                        >
                          <div className="py-2">
                            {item.items.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive =
                                activeView === `${item.id}-${subItem.id}`;

                              return (
                                <motion.button
                                  key={subItem.id}
                                  onClick={() =>
                                    handleSubItemClick(item.id, subItem)
                                  }
                                  whileHover={{
                                    x: 4,
                                    backgroundColor: `${brandColor}05`,
                                  }}
                                  className={`
                                    w-full flex items-center space-x-3 px-4 py-3
                                    text-left transition-all
                                    ${
                                      isSubActive
                                        ? "font-semibold"
                                        : "text-gray-700 hover:text-gray-900"
                                    }
                                  `}
                                  style={
                                    isSubActive ? { color: brandColor } : {}
                                  }
                                >
                                  <SubIcon className="w-4 h-4" />
                                  <span className="text-sm">
                                    {subItem.label}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </AnimatePresence>,
                      document.body
                    )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
