import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiUser } from 'react-icons/fi';

const UserCard = ({ user, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(user.id);
    setShowConfirm(false);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-2xl transition-all group"
    >
      {/* Delete Button */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConfirm(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <FiX className="w-4 h-4" />
      </motion.button>

      {/* User Info */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg"
        >
          {user.logo}
        </motion.div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.name}</h3>
        <p className="text-sm text-gray-500 mb-3 flex items-center space-x-1">
          <FiMail className="w-3 h-3" />
          <span>{user.email}</span>
        </p>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium flex items-center space-x-1">
            <FiUser className="w-3 h-3" />
            <span>{user.role}</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.status === 'active' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {user.status}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 z-20"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-lg p-6 max-w-xs w-full"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">Delete User?</h4>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {user.name}? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserCard;
