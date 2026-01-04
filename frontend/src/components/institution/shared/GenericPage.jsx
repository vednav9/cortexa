import React from "react";
import { motion } from "framer-motion";
import { HiSparkles } from "react-icons/hi";
import { useOutletContext } from "react-router-dom";

export default function GenericPage({ title, description, icon: Icon = HiSparkles, requiresAccess = true, children }) {
    const { hasAccess } = useOutletContext();

    const shouldShowContent = !requiresAccess || hasAccess;

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
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            {description && <p className="text-gray-500 text-sm">{description}</p>}
                        </div>
                    </div>

                    {shouldShowContent ? (
                        children ? (
                            <div>{children}</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                                    <p className="text-emerald-800 font-medium mb-2">Coming Soon!</p>
                                    <p className="text-emerald-600 text-sm">
                                        This feature is currently under development. Check back soon for updates.
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Icon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">You need to be a member to access this feature.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
