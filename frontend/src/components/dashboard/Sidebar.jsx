import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiMail, FiX } from 'react-icons/fi';
import { InstitutionContext } from '../../App';

export default function Sidebar({ isOpen, onClose, isInstitution = false }) {
  const { institution } = useContext(InstitutionContext) || {};
  const location = useLocation();

  // Theme color (uses institution branding if available)
  const defaultColor = '#10b981'; // Emerald
  const brandColor =
    isInstitution && institution
      ? institution.branding.primaryColor
      : defaultColor;

  const isActive = (path) => location.pathname.includes(path);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      path: isInstitution
        ? `/${institution?.slug}/dashboard`
        : '/dashboard',
      disabled: false,
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: FiMail,
      path: isInstitution
        ? `/${institution?.slug}/invitations`
        : '/invitations',
      disabled: false,
    },
  ];

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
          borderRightWidth: '2px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
              }}
            >
              <span className="text-white font-bold text-lg">C</span>
            </motion.div>
            <div>
              <span
                className="text-xl font-bold"
                style={{ color: brandColor }}
              >
                {isInstitution && institution
                  ? institution.shortName
                  : 'Cortexa'}
              </span>
              {isInstitution && institution && (
                <p className="text-xs text-gray-500">Learning Portal</p>
              )}
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: brandColor }}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const ItemIcon = item.icon;
            const active = isActive(item.path);
            const disabled = item.disabled;

            return (
              <Link
                key={item.id}
                to={disabled ? '#' : item.path}
                className={`
                  relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group
                  ${disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : active
                      ? 'shadow-md'
                      : 'hover:bg-gray-50'}
                `}
                style={
                  active && !disabled
                    ? {
                      backgroundColor: `${brandColor}10`,
                      color: brandColor,
                    }
                    : {}
                }
                onClick={disabled ? (e) => e.preventDefault() : undefined}
              >
                {/* Icon */}
                <div className="relative">
                  <ItemIcon className="w-5 h-5" />
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p className={`font-medium ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </p>
                </div>

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

        {/* Footer / User Info */}

      </aside>
    </>
  );
}
