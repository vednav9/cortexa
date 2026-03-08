// InstitutionMenu.jsx – Brand-Themed, Responsive Role-Based Navigation
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome, FiBell, FiUserPlus, FiUsers, FiGrid, FiUpload,
  FiCheckSquare, FiMic, FiMessageSquare, FiClipboard,
  FiHelpCircle, FiChevronDown, FiBook, FiMenu, FiX,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : "16, 185, 129";
};

export default function InstitutionMenu({ userRole, hasAccess, brandColor = "#10b981" }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const menuRefs = useRef({});
  const dropdownRef = useRef(null);
  const rgb = hexToRgb(brandColor);

  const getMenuItems = () => {
    const role = userRole?.toLowerCase();

    if (role === "admin" && hasAccess) {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "announcements", label: "Announcements", icon: FiBell, items: [] },
        { id: "invite-people", label: "Invite People", icon: FiUserPlus, items: [] },
        { id: "manage-users", label: "Manage Users", icon: FiUsers, items: [] },
        {
          id: "academic-structure", label: "Academic", icon: FiGrid,
          items: [
            { id: "departments", label: "Departments", icon: FiBook },
            { id: "courses", label: "Courses", icon: FiBook },
            { id: "semesters", label: "Semesters", icon: FiClipboard },
            { id: "calendar", label: "Calendar", icon: FiBell },
            { id: "faculty", label: "Faculty", icon: FiUsers },
          ],
        },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    if (role === "admin") {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    if (role === "teacher" && hasAccess) {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "announcements", label: "Announcements", icon: FiBell, items: [] },
        { id: "see-students", label: "Students", icon: FiUsers, items: [] },
        { id: "upload-notes", label: "Upload Notes", icon: FiUpload, items: [] },
        { id: "generate-mcq", label: "Generate MCQ", icon: FiCheckSquare, items: [] },
        { id: "voice-to-text", label: "Voice to Text", icon: FiMic, items: [] },
        { id: "qa-section", label: "Q&A", icon: FiMessageSquare, items: [] },
        { id: "rag-chatbot", label: "AI Assistant", icon: HiSparkles, items: [] },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    if (role === "teacher") {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    if (role === "student" && hasAccess) {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "announcements", label: "Announcements", icon: FiBell, items: [] },
        { id: "mcq-test", label: "MCQ Test", icon: FiCheckSquare, items: [] },
        { id: "rag-chatbot", label: "AI Assistant", icon: HiSparkles, items: [] },
        { id: "qa-section", label: "Q&A", icon: FiMessageSquare, items: [] },
        { id: "assessment", label: "Assessment", icon: FiClipboard, items: [] },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    if (role === "student") {
      return [
        { id: "", label: "Home", icon: FiHome, items: [] },
        { id: "query-desk", label: "Query Desk", icon: FiHelpCircle, items: [] },
      ];
    }

    return [
      { id: "", label: "Home", icon: FiHome, items: [] },
      { id: "courses", label: "Courses", icon: FiBook, items: [] },
    ];
  };

  const menuItems = getMenuItems();

  const getCurrentView = () => {
    const path = location.pathname.replace(`/${slug}`, "") || "/";
    if (path === "/" || path === "") return "";
    const clean = path.replace(/^\//, "");
    if (clean.includes("/")) {
      const parts = clean.split("/");
      return `${parts[0]}-${parts[1]}`;
    }
    return clean;
  };

  const activeView = getCurrentView();

  const handleMenuClick = (item) => {
    if (item.items?.length > 0) {
      const el = menuRefs.current[item.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
      }
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      navigate(`/${slug}/${item.id}`);
      setOpenDropdown(null);
      setMobileOpen(false);
    }
  };

  const handleSubItemClick = (parentId, subItem) => {
    navigate(`/${slug}/${parentId}/${subItem.id}`);
    setOpenDropdown(null);
    setMobileOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      const outsideButtons = Object.values(menuRefs.current).every(r => r && !r.contains(e.target));
      const outsideDropdown = !dropdownRef.current || !dropdownRef.current.contains(e.target);
      if (outsideButtons && outsideDropdown && openDropdown) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  // Update dropdown position on scroll
  useEffect(() => {
    const handler = () => {
      if (openDropdown) {
        const el = menuRefs.current[openDropdown];
        if (el) {
          const rect = el.getBoundingClientRect();
          setDropdownPosition({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
        }
      }
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, [openDropdown]);

  return (
    <div
      className="border-b z-40"
      style={{ borderColor: `rgba(${rgb}, 0.12)`, backgroundColor: `rgba(${rgb}, 0.02)` }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-[48px]">

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id || activeView?.startsWith(`${item.id}-`);
              const isOpen = openDropdown === item.id;
              const hasSubItems = item.items?.length > 0;

              return (
                <div key={item.id} className="relative flex-shrink-0">
                  <button
                    ref={(el) => (menuRefs.current[item.id] = el)}
                    onClick={() => handleMenuClick(item)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap relative group"
                    style={{
                      color: isActive ? brandColor : '#6b7280',
                      backgroundColor: isActive ? `rgba(${rgb}, 0.10)` : 'transparent',
                      fontWeight: isActive ? '600' : '500',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = `rgba(${rgb}, 0.06)`;
                      if (!isActive) e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      if (!isActive) e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {hasSubItems && (
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <FiChevronDown className="w-3 h-3" />
                      </motion.div>
                    )}
                    {/* Active underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-3.5 right-3.5 h-[2px] rounded-full"
                        style={{ backgroundColor: brandColor }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>

                  {/* Dropdown via portal */}
                  {hasSubItems && isOpen && createPortal(
                    <AnimatePresence>
                      <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute",
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          zIndex: 300,
                        }}
                        className="w-52 bg-white rounded-2xl shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
                      >
                        <div className="p-1.5">
                          {item.items.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeView === `${item.id}-${sub.id}`;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => handleSubItemClick(item.id, sub)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                                style={{
                                  backgroundColor: isSubActive ? `rgba(${rgb}, 0.10)` : 'transparent',
                                  color: isSubActive ? brandColor : '#374151',
                                }}
                                onMouseEnter={e => {
                                  if (!isSubActive) e.currentTarget.style.backgroundColor = `rgba(${rgb}, 0.06)`;
                                }}
                                onMouseLeave={e => {
                                  if (!isSubActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-[13px] font-medium">{sub.label}</span>
                              </button>
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

          {/* ── MOBILE: current page label + hamburger ── */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <span className="text-[13px] font-semibold" style={{ color: brandColor }}>
              {menuItems.find(i => i.id === activeView || activeView?.startsWith(`${i.id}-`))?.label || 'Home'}
            </span>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: `rgba(${rgb}, 0.08)` }}
            >
              {mobileOpen
                ? <FiX className="w-4 h-4" style={{ color: brandColor }} />
                : <FiMenu className="w-4 h-4" style={{ color: brandColor }} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE DROPDOWN ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t overflow-hidden"
            style={{ borderColor: `rgba(${rgb}, 0.10)` }}
          >
            <div className="p-3 grid grid-cols-2 gap-1.5 max-w-6xl mx-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id || activeView?.startsWith(`${item.id}-`);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? `rgba(${rgb}, 0.12)` : `rgba(${rgb}, 0.04)`,
                      color: isActive ? brandColor : '#374151',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[12px] font-semibold truncate">{item.label}</span>
                    {item.items?.length > 0 && <FiChevronDown className="w-3 h-3 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Mobile sub-items if academic is expanded */}
            {openDropdown && menuItems.find(i => i.id === openDropdown)?.items?.length > 0 && (
              <div
                className="mx-3 mb-3 rounded-xl overflow-hidden border"
                style={{ borderColor: `rgba(${rgb}, 0.12)` }}
              >
                {menuItems.find(i => i.id === openDropdown).items.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubItemClick(openDropdown, sub)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-0 transition-colors bg-white hover:bg-gray-50"
                      style={{ borderColor: `rgba(${rgb}, 0.08)` }}
                    >
                      <SubIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium text-gray-700">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
