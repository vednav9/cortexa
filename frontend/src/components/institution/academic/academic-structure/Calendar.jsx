import React from "react";
import { motion } from "framer-motion";
import { FiBell } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

export default function Calendar() {
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
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                            <FiBell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Calendar Events</h1>
                            <p className="text-gray-500 text-sm">Important dates and events</p>
                        </div>
                    </div>

                    {hasAccess ? (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                                <p className="text-orange-800 font-medium mb-2">Academic Calendar</p>
                                <p className="text-orange-600 text-sm">
                                    View important dates, events, and deadlines.
                                </p>
                            </div>
                            {/* Add your calendar content here */}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">You need to be a member to view calendar events.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
