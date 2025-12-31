import React from "react";
import { motion } from "framer-motion";
import { FiGrid } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function AcademicStructure() {
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
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <FiGrid className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
                            <p className="text-gray-500 text-sm">Departments, courses, and more</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600">Browse academic departments and programs.</p>
                        {/* Add your academic structure content here */}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
