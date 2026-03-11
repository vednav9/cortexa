import React from "react";
import { motion } from "framer-motion";
import { HiSparkles } from "react-icons/hi";
import { useOutletContext } from "react-router-dom";

const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
        : '16, 185, 129';
};

export default function GenericPage({ title, description, icon: Icon = HiSparkles, requiresAccess = true, children }) {
    const { hasAccess, currentInstitution, institution } = useOutletContext();
    const activeInstitution = currentInstitution || institution;
    const brandColor = activeInstitution?.branding?.primaryColor || '#10b981';
    const rgb = hexToRgb(brandColor);

    const shouldShowContent = !requiresAccess || hasAccess;

    return (
        <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.02)` }}>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm"
                            style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
                        >
                            <Icon className="text-2xl" style={{ color: brandColor }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
                            {description && <p className="text-gray-500 mt-1 font-medium">{description}</p>}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8"
                >
                    {shouldShowContent ? (
                        children ? (
                            <div>{children}</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-2xl p-8 text-center" style={{ backgroundColor: `rgba(${rgb},0.03)`, borderColor: `rgba(${rgb},0.15)` }}>
                                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `rgba(${rgb},0.1)` }}>
                                        <Icon className="w-8 h-8" style={{ color: brandColor }} />
                                    </div>
                                    <p className="font-black text-lg mb-2 text-gray-900">Coming Soon!</p>
                                    <p className="text-gray-500 font-medium">
                                        This feature is currently under development. Check back soon for updates.
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                            <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Icon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h3>
                            <p className="text-gray-500 font-medium">You need to have appropriate roles to access this feature.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
