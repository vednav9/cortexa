import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

const InvitationCard = ({ invitation, onAccept, onReject }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
          >
            {invitation.logo}
          </motion.div>

          {/* Details */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {invitation.institutionName}
            </h3>
            <p className="text-sm text-gray-500 mb-2">{invitation.email}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <FiClock className="w-3 h-3" />
                <span>{invitation.date}</span>
              </span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                {invitation.type}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 ml-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAccept(invitation.id)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white flex items-center justify-center hover:shadow-lg transition-all"
            title="Accept"
          >
            <FiCheck className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReject(invitation.id)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center hover:shadow-lg transition-all"
            title="Reject"
          >
            <FiX className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default InvitationCard;
