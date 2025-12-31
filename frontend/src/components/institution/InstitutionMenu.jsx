// InstitutionMenu.jsx - Role-based dropdown menu for institution pages
import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
  brandColor = "#10b981" 
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();

  // Get menu items based on role
  const getMenuItems = () => {
    const role = userRole?.toLowerCase();

    // For users without access (visitors)
    if (!hasAccess) {
      return [
        {
          id: "institution-dashboard",
          label: "Institution Dashboard",
          icon: FiHome,
          items: []
        },
        {
          id: "academic-structure",
          label: "Academic Structure",
          icon: FiGrid,
          items: [
            { id: "departments", label: "Departments", icon: FiBook },
            { id: "courses", label: "Courses", icon: FiBook },
            { id: "faculty", label: "Faculty", icon: FiUsers },
          ]
        }
      ];
    }

    // ADMIN Menu
    if (role === 'admin') {
      return [
        {
          id: "institution-dashboard",
          label: "Institution Dashboard",
          icon: FiHome,
          items: []
        },
        {
          id: "announcements",
          label: "Announcements",
          icon: FiBell,
          items: []
        },
        {
          id: "invite-people",
          label: "Invite People",
          icon: FiUserPlus,
          items: []
        },
        {
          id: "manage-users",
          label: "Manage Users",
          icon: FiUsers,
          items: []
        },
        {
          id: "academic-structure",
          label: "Academic Structure",
          icon: FiGrid,
          items: [
            { id: "departments", label: "Departments", icon: FiBook },
            { id: "courses", label: "Courses", icon: FiBook },
            { id: "semesters", label: "Semesters", icon: FiClipboard },
            { id: "calendar", label: "Calendar Events", icon: FiBell },
          ]
        },
        {
          id: "query-desk",
          label: "Query Desk",
          icon: FiHelpCircle,
          items: []
        }
      ];
    }

    // TEACHER Menu
    if (role === 'teacher') {
      return [
        {
          id: "institution-dashboard",
          label: "Institution Dashboard",
          icon: FiHome,
          items: []
        },
        {
          id: "announcements",
          label: "Announcements",
          icon: FiBell,
          items: []
        },
        {
          id: "see-students",
          label: "See Students",
          icon: FiUsers,
          items: []
        },
        {
          id: "upload-notes",
          label: "Upload Notes",
          icon: FiUpload,
          items: []
        },
        {
          id: "generate-mcq",
          label: "Generate MCQs",
          icon: FiCheckSquare,
          items: []
        },
        {
          id: "voice-to-text",
          label: "Voice-to-Text",
          icon: FiMic,
          items: []
        },
        {
          id: "qa-portal",
          label: "Q&A Portal",
          icon: FiMessageSquare,
          items: []
        },
        {
          id: "assessment",
          label: "Assessment",
          icon: FiClipboard,
          items: []
        },
        {
          id: "ai-chatbot",
          label: "AI Chatbot Personal",
          icon: HiSparkles,
          items: []
        },
        {
          id: "query-desk",
          label: "Query Desk",
          icon: FiHelpCircle,
          items: []
        }
      ];
    }

    // STUDENT Menu
    if (role === 'student') {
      return [
        {
          id: "institution-dashboard",
          label: "Institution Dashboard",
          icon: FiHome,
          items: []
        },
        {
          id: "announcements",
          label: "Announcements",
          icon: FiBell,
          items: []
        },
        {
          id: "mcq-test",
          label: "MCQ Test",
          icon: FiCheckSquare,
          items: []
        },
        {
          id: "rag-chatbot",
          label: "RAG Chatbot",
          icon: HiSparkles,
          items: []
        },
        {
          id: "qa-section",
          label: "Q&A Section",
          icon: FiMessageSquare,
          items: []
        },
        {
          id: "assessment",
          label: "Assessment",
          icon: FiClipboard,
          items: []
        },
        {
          id: "query-desk",
          label: "Query Desk",
          icon: FiHelpCircle,
          items: []
        }
      ];
    }

    // Default (no access)
    return [
      {
        id: "institution-dashboard",
        label: "Institution Dashboard",
        icon: FiHome,
        items: []
      },
      {
        id: "academic-structure",
        label: "Academic Structure",
        icon: FiGrid,
        items: [
          { id: "departments", label: "Departments", icon: FiBook },
          { id: "courses", label: "Courses", icon: FiBook },
        ]
      }
    ];
  };

  const menuItems = getMenuItems();

  // Determine active view from current location
  const getCurrentView = () => {
    const path = location.pathname.replace(`/${slug}`, '') || '/';
    if (path === '/' || path === '') return 'institution-dashboard';
    
    // Remove leading slash and get the path
    const cleanPath = path.replace(/^\//, '');
    
    // Check if it's a nested route (e.g., academic-structure/departments)
    if (cleanPath.includes('/')) {
      const parts = cleanPath.split('/');
      return `${parts[0]}-${parts[1]}`; // e.g., "academic-structure-departments"
    }
    
    return cleanPath;
  };

  const activeView = getCurrentView();

  const handleMenuClick = (item) => {
    if (item.items && item.items.length > 0) {
      // Toggle dropdown
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      // Navigate to the route
      if (item.id === 'institution-dashboard') {
        navigate(`/${slug}`);
      } else {
        navigate(`/${slug}/${item.id}`);
      }
      setOpenDropdown(null);
    }
  };

  const handleSubItemClick = (parentId, subItem) => {
    // Navigate to nested route: /{slug}/{parent}/{subitem}
    navigate(`/${slug}/${parentId}/${subItem.id}`);
    setOpenDropdown(null);
  };

  return (
    <div className="bg-white border-b-2 border-gray-100 shadow-sm sticky top-[72px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-1 overflow-x-auto py-3 scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id || activeView?.startsWith(`${item.id}-`);
            const isOpen = openDropdown === item.id;
            const hasSubItems = item.items && item.items.length > 0;

            return (
              <div key={item.id} className="relative">
                {/* Main Menu Button */}
                <motion.button
                  onClick={() => handleMenuClick(item)}
                  onMouseEnter={() => hasSubItems && setOpenDropdown(item.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-xl
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
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

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isOpen && hasSubItems && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onMouseLeave={() => setOpenDropdown(null)}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden z-50"
                    >
                      <div className="py-2">
                        {item.items.map((subItem, index) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeView === `${item.id}-${subItem.id}`;

                          return (
                            <motion.button
                              key={subItem.id}
                              onClick={() => handleSubItemClick(item.id, subItem)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ x: 4, backgroundColor: `${brandColor}08` }}
                              className={`
                                w-full flex items-center space-x-3 px-4 py-3
                                transition-all text-left
                                ${isSubActive
                                  ? "font-semibold"
                                  : "text-gray-700"
                                }
                              `}
                              style={
                                isSubActive
                                  ? { color: brandColor }
                                  : {}
                              }
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm">{subItem.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
