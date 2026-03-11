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
        className="text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-sm"
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
  console.log("INSTITUTION STATS:", institution.stats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-200/50 transition-all duration-300 group overflow-hidden"
    >

      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* LEFT: Branding & Main Information */}
          <div className="flex items-start gap-5 flex-1 w-full min-w-0">
            {/* Logo Container */}
            <div className="relative group-hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-emerald-100 rounded-[18px] blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="w-16 h-16 rounded-[18px] flex items-center justify-center text-emerald-600 bg-white border border-gray-200 font-bold text-xl shadow-sm flex-shrink-0 relative z-10 overflow-hidden">
                {institution.branding?.logo ? (
                  <img src={institution.branding.logo} alt={institution.code || institution.name} className="w-full h-full object-cover" />
                ) : (
                  institution.code || institution.name.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* Institution Content Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight truncate max-w-full">
                  {institution.name}
                </h3>
                {/* Micro Status Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100/80 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase leading-none mt-px">
                    Active
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500 mb-5">
                <div className="flex items-center gap-1.5">
                  <FiUsers className="w-4 h-4 text-emerald-500" />
                  <p>Role: <span className="font-semibold text-gray-800 capitalize">{institution.role}</span></p>
                </div>
                {institution.code && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <p>Code: <span className="font-semibold text-gray-800">{institution.code}</span></p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: Action & Access Area */}
          <div className="flex flex-col md:items-end gap-3 self-center mt-2 md:mt-0 w-full md:w-auto">
            <motion.a
              href={`/${institution.slug}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 text-white text-[14px] font-semibold rounded-xl shadow-md shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 transition-all focus:ring-2 focus:ring-emerald-500/20 w-full md:w-auto"
            >
              Access Dashboard
              <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>

          </div>

        </div>

        {/* Info Stats separated by a line */}
        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {institution.stats?.students ?? 0}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Total Students</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-2xl font-bold text-gray-800">
              {institution.stats?.teachers ?? 0}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Total Teachers</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-2xl font-bold text-gray-800">
              {institution.stats?.courses ?? 0}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Total Courses</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
