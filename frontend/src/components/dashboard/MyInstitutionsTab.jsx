// MyInstitutionsTab.jsx – Single Institution (Admin-Owned) - Redesigned
import React from "react";
import { motion } from "framer-motion";
import { FiCheck, FiArrowRight, FiMapPin, FiUsers } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

export default function MyInstitutionsTab({ institutions = [] }) {
  if (institutions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-20 bg-white border-2 border-gray-100 rounded-2xl"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <HiSparkles className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Institution Linked</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          This account is not associated with any institution yet.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <FiMapPin className="w-4 h-4" />
            <span>Explore</span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            <span>Join</span>
          </div>
          <div className="flex items-center gap-2">
            <FiCheck className="w-4 h-4" />
            <span>Connect</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const institution = institutions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden bg-white border-2 border-gray-100 rounded-2xl shadow-lg hover:shadow-xl hover:border-emerald-200 transition-all"
    >
      {/* Background Accent Circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-50/50 rounded-full -ml-24 -mb-24"></div>

      <div className="relative z-10 p-8">
        {/* Main Content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* LEFT: Institution Identity */}
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
              {institution.branding?.logo ? (
                    <img src={institution.branding.logo} alt={institution.code || institution.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    institution.code || institution.name.substring(0, 2).toUpperCase()
                  )}
            </div>

            {/* Info */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                {institution.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Your Role: <span className="font-semibold text-gray-800">{institution.role}</span>
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700 capitalize">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Primary Action */}
          <div className="flex items-center">
            <motion.a
              href={`/${institution.slug}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Go to Dashboard
              <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          </div>
        </div>

        {/* Optional: Quick Stats or Info */}
        <div className="mt-6 pt-6 border-t-2 border-gray-100 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Total Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Teachers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Courses</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
