import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { Link } from "react-router-dom";

const Sidebar = ({
  isOpen,
  onClose,
  children,
  title = "Cortexa",
}) => {
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

      {/* Sidebar - Always visible on desktop */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 w-80 
          bg-white border-r border-emerald-100 shadow-xl lg:shadow-none 
          overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        {/* <div className="flex items-center justify-between p-6 border-b border-emerald-100 sticky top-0 bg-white z-10">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <HiSparkles className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {title}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div> */}

        {/* Content */}
        <div className="p-6">{children}</div>
      </aside>
    </>
  );
};

export default Sidebar;
