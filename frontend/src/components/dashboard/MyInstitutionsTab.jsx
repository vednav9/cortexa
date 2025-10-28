import React from "react";
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

export default function MyInstitutionsTab({ institutions = [] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">My Institutions</h3>
      
      {institutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutions.map((institution, index) => (
            <motion.div
              key={institution.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {institution.logo}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{institution.name}</h4>
                    <p className="text-sm text-gray-500">{institution.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">{institution.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-emerald-100 rounded-xl">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-lg">No institutions joined yet</p>
          <p className="text-gray-400 text-sm mt-2">Browse colleges to get started</p>
        </div>
      )}
    </div>
  );
}
