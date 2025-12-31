import React from "react";
import { motion } from "framer-motion";
import { FiUsers } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function Faculty() {
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
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                            <FiUsers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
                            <p className="text-gray-500 text-sm">Meet our teaching staff</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                            <p className="text-emerald-800 font-medium mb-2">Faculty Directory</p>
                            <p className="text-emerald-600 text-sm">
                                Browse faculty members and their profiles.
                            </p>
                        </div>
                        {/* Add your faculty list here */}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
