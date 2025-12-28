// CortexaDashboard.jsx – UI Polished & Consistent
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiMenu,
    FiUser,
    FiLogOut,
    FiSettings,
    FiChevronDown,
    FiGrid,
    FiBook,
    FiBell,
    FiHelpCircle
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../context/authcontext";
import Sidebar from "./Sidebar";
import BrowseInstitutionsTab from "./BrowseInstitutionsTab";
import MyInstitutionsTab from "./MyInstitutionsTab";
import Notifications from "./Notifications";

const CortexaDashboard = () => {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
        };

        if (profileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [profileMenuOpen]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <HiSparkles className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Mock data
    const myInstitutions = [];
    const browseCount = 5;

    return (
        <div className="flex w-full h-screen bg-gray-50 lg:pl-80">
            {/* SIDEBAR */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        {/* Left */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
                            >
                                <FiMenu className="w-5 h-5" />
                            </button>

                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                    <HiSparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">
                                        {activeTab === "dashboard" ? "Dashboard" :
                                            activeTab === "notifications" ? "Notifications" :
                                                activeTab === "querydesk" ? "Query Desk" : "Dashboard"}
                                    </h1>
                                    <p className="text-xs text-gray-500">
                                        {activeTab === "dashboard" ? "Your learning hub" :
                                            activeTab === "notifications" ? "Stay updated with your activity" :
                                                activeTab === "querydesk" ? "Get help and support" : "Welcome back"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right - Profile Menu */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user?.role || "Student"}
                                    </p>
                                </div>
                                <FiChevronDown
                                    className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {profileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {user?.name || "User"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user?.email || "user@email.com"}
                                            </p>
                                        </div>
                                        <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                                            <FiUser className="w-4 h-4" />
                                            <span>Profile</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                                            <FiSettings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                        <div className="border-t border-gray-100">
                                            <button
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                                            >
                                                <FiLogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* DASHBOARD TAB */}
                    {activeTab === "dashboard" && (
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Hero Header with Stats */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <HiSparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold">Welcome to Cortexa</h1>
                                            <p className="text-emerald-100 text-sm mt-1">
                                                A unified platform to discover institutions and manage your academic access
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                            <p className="text-emerald-100 text-xs font-medium uppercase">My Institutions</p>
                                            <p className="text-3xl font-bold mt-1">{myInstitutions.length}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                            <p className="text-emerald-100 text-xs font-medium uppercase">Available</p>
                                            <p className="text-3xl font-bold mt-1">{browseCount}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                            <p className="text-emerald-100 text-xs font-medium uppercase">Notifications</p>
                                            <p className="text-3xl font-bold mt-1">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MY INSTITUTIONS */}
                            <section className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
                                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <FiBook className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">My Institutions</h2>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                Institutions you are currently associated with
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <MyInstitutionsTab institutions={myInstitutions} />
                                </div>
                            </section>

                            {/* BROWSE INSTITUTIONS */}
                            <section className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
                                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <FiGrid className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Browse Institutions</h2>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                Discover universities, colleges, and learning platforms
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <BrowseInstitutionsTab />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && <Notifications />}

                    {/* QUERY DESK */}
                    {activeTab === "querydesk" && (
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden"
                            >
                                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <FiHelpCircle className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Query Desk</h2>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                Get help and support for your queries
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <FiHelpCircle className="w-10 h-10 text-purple-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        Coming Soon
                                    </h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Raise questions, support requests, or academic queries here.
                                        This feature will be available soon.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CortexaDashboard;
