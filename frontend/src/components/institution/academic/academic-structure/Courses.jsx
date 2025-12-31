import React from "react";
import { motion } from "framer-motion";
import { FiBook } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function Courses() {
    const { hasAccess } = useOutletContext();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <FiBook className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                            <p className="text-gray-500 text-sm">Browse all available courses</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <p className="text-blue-800 font-medium mb-2">Course Catalog</p>
                            <p className="text-blue-600 text-sm">
                                Explore all courses offered by this institution.
                            </p>
                        </div>
                        {/* Add your courses list here */}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
