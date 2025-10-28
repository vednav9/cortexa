import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiMessageCircle, 
  FiBell, 
  FiFolder, 
  FiHelpCircle, 
  FiTrendingUp,
  FiX 
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { InstitutionContext } from '../../App';
import AIChat from '../ai/AIChat';

export default function Sidebar({ isOpen, onClose, isInstitution = false }) {
  const { institution } = useContext(InstitutionContext) || {};
  const location = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  // Theme colors
  const defaultColor = '#10b981'; // Emerald
  const brandColor = isInstitution && institution 
    ? institution.branding.primaryColor 
    : defaultColor;

  const isActive = (path) => location.pathname.includes(path);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: FiHome, 
      path: '/dashboard',
      disabled: false
    },
    { 
      id: 'chatbot', 
      label: 'AI Assistant', 
      icon: FiMessageCircle, 
      path: '#',
      disabled: false,
      isAIChat: true
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: FiBell, 
      path: isInstitution ? `/${institution?.slug}/notifications` : '/notifications',
      badge: 3,
      disabled: false
    },
    { 
      id: 'space', 
      label: 'My Space', 
      icon: FiFolder, 
      path: isInstitution ? `/${institution?.slug}/space` : '/space',
      description: 'Documents & Notes',
      disabled: false
    },
    { 
      id: 'querydesk', 
      label: 'Query Desk', 
      icon: FiHelpCircle, 
      path: institution ? `/${institution.slug}/querydesk` : '/querydesk',
      disabled: !isInstitution, // Grayed out on dashboard
      institutionOnly: true
    },
    { 
      id: 'analytics', 
      label: 'Progress Insights', 
      icon: FiTrendingUp, 
      path: isInstitution ? `/${institution?.slug}/analytics` : '/analytics',
      disabled: false
    },
  ];

  const handleItemClick = (item, e) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }

    if (item.isAIChat) {
      e.preventDefault();
      setAiChatOpen(true);
      onClose(); // Close sidebar on mobile
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
          w-80 bg-white border-r shadow-xl lg:shadow-none 
          overflow-y-auto transition-transform duration-300
          fixed lg:relative inset-y-0 left-0 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          borderRightColor: `${brandColor}20`,
          borderRightWidth: '2px'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-2 sticky top-0 bg-white z-10"
          // style={{ borderBottomColor: `${brandColor}20` }}
        >
          {/* <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}
            >
              {isInstitution && institution?.logo ? (
                <img src={institution.logo} alt="" className="w-8 h-8 rounded-lg" />
              ) : (
                <HiSparkles className="w-6 h-6 text-white" />
              )}
            </motion.div>
            <div>
              <span 
                className="text-xl font-bold"
                style={{ color: brandColor }}
              >
                {isInstitution && institution ? institution.shortName : 'Cortexa'}
              </span>
              {isInstitution && institution && (
                <p className="text-xs text-gray-500">Learning Portal</p>
              )}
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: brandColor }}
          >
            <FiX className="w-5 h-5" />
          </button> */}
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const ItemIcon = item.icon;
            const active = isActive(item.path) && !item.isAIChat;
            const disabled = item.disabled;

            return (
              <Link
                key={item.id}
                to={item.isAIChat ? '#' : (disabled ? '#' : item.path)}
                className={`
                  relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group
                  ${disabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : active 
                      ? 'shadow-md' 
                      : 'hover:bg-gray-50'
                  }
                `}
                style={
                  active && !disabled
                    ? { 
                        backgroundColor: `${brandColor}10`, 
                        color: brandColor 
                      }
                    : {}
                }
                onClick={(e) => handleItemClick(item, e)}
              >
                {/* Icon */}
                <div className="relative">
                  <ItemIcon className="w-5 h-5" />
                  {item.badge && !disabled && (
                    <span 
                      className="absolute -top-1 -right-1 w-4 h-4 text-xs text-white rounded-full flex items-center justify-center font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.isAIChat && (
                    <HiSparkles 
                      className="absolute -top-1 -right-1 w-4 h-4 text-emerald-500 animate-pulse" 
                    />
                  )}
                </div>  

                {/* Label */}
                <div className="flex-1">
                  <p className={`font-medium ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </div>

                {/* Institution Only Badge */}
                {item.institutionOnly && !isInstitution && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    Institution
                  </span>
                )}

                {/* Active Indicator */}
                {active && !disabled && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: brandColor }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Context Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50" style={{ borderTopColor: `${brandColor}20` }}>
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl" style={{ backgroundColor: `${brandColor}05` }}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: brandColor }}
            >
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">User Name</p>
              <p className="text-xs text-gray-500 truncate">Student</p>
            </div>
          </div>
        </div>
      </aside>
      <AIChat 
        isOpen={aiChatOpen} 
        onClose={() => setAiChatOpen(false)}
        institutionId={institution?.id}
        brandColor={brandColor}
      />
    </>
  );
}