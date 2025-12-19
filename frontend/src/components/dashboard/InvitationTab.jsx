// InvitationTab.jsx - Refined version
import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

const InvitationTab = ({ invitation, onAccept, onReject }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Logo */}
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
            {invitation.logo}
          </div>

          {/* Details */}
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {invitation.institutionName}
            </h3>
            <p className="text-sm text-gray-500 mb-2">{invitation.email}</p>
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <FiClock className="w-3.5 h-3.5" />
                <span>{invitation.date}</span>
              </span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                {invitation.type}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onAccept(invitation.id)}
            className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
            title="Accept"
          >
            <FiCheck className="w-5 h-5" />
          </button>

          <button
            onClick={() => onReject(invitation.id)}
            className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            title="Reject"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationTab;
