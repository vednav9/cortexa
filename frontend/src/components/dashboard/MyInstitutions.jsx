// MyInstitutions.jsx - Refined version
import React from "react";
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

export default function MyInstitutions({ institutions = [], onSelectInstitution }) {
  return (
    <div className="space-y-6">
      {institutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((institution, index) => (
            <motion.div
              key={institution._id || institution.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectInstitution && onSelectInstitution(institution)}
              className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition-all ${onSelectInstitution ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{
                      background: institution.primaryColor 
                        ? `linear-gradient(135deg, ${institution.primaryColor}, ${institution.secondaryColor || institution.primaryColor})` 
                        : 'linear-gradient(135deg, #10b981, #059669)'
                    }}
                  >
                    {institution.logo || institution.name?.substring(0, 2).toUpperCase() || 'IN'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-800">{institution.name}</h4>
                    <p className="text-sm text-gray-500">{institution.type || 'Institution'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg w-fit">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">{institution.status || 'Active'}</span>
                </div>
                {institution.establishedYear && (
                  <span className="text-xs text-gray-400">Est. {institution.establishedYear}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No institutions joined yet</p>
          <p className="text-gray-400 text-sm">Browse colleges to get started</p>
        </div>
      )}
    </div>
  );
}
