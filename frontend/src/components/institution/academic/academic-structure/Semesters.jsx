import React from "react";
import { motion } from "framer-motion";
import { FiClipboard } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function Semesters() {
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
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <FiClipboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Semesters</h1>
                            <p className="text-gray-500 text-sm">View semester schedules and planning</p>
                        </div>
                    </div>

                    {hasAccess ? (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                                <p className="text-purple-800 font-medium mb-2">Semester Management</p>
                                <p className="text-purple-600 text-sm">
                                    View and manage semester schedules here.
                                </p>
                            </div>
                            {/* Add your semesters content here */}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">You need to be a member to view semesters.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
