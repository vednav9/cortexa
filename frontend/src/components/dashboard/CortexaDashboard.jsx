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
import QueryDesk from "./QueryDesk";
import { socket } from "../../socket";

import { studentAPI, teacherAPI, adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const CortexaDashboard = () => {
    const { user, loading } = useAuth();

    console.log("AUTH USER:", user);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [myInstitutions, setMyInstitutions] = useState([]);
    const [institutionsLoading, setInstitutionsLoading] = useState(true);
    const [globalNotifications, setGlobalNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const profileMenuRef = useRef(null);

    // Fetch institutions based on user role
    // 🔁 Re-fetch institutions (used by dashboard + events)
    const fetchInstitutions = async () => {
        if (!user || !user.role) return;

        try {
            setInstitutionsLoading(true);
            const role = user.role.toLowerCase();

            if (role === "student") {
                const { data } = await studentAPI.getMyInstitution();
                setMyInstitutions(data.institution ? [data.institution] : []);
            }
            else if (role === "teacher") {
                const { data } = await teacherAPI.getInstitutions();
                setMyInstitutions(data.institutions || []);
            }
            else if (role === "admin") {
                const { data } = await adminAPI.getInstitution();
                setMyInstitutions(data.institution ? [data.institution] : []);
            }
            else {
                setMyInstitutions([]);
            }
        } catch (err) {
            console.error("Failed to fetch institutions:", err);
            setMyInstitutions([]);
        } finally {
            setInstitutionsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchInstitutions();

        // 👂 listen for accept-invite refresh
        const handleRefresh = () => {
            fetchInstitutions();
        };

        window.addEventListener("institution-updated", handleRefresh);

        return () => {
            window.removeEventListener("institution-updated", handleRefresh);
        };
    }, [user]);


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

    //notifications
    // useEffect(() => {
    //     if (!user) return;

    //     socket.on("global_notification", (notification) => {
    //         setGlobalNotifications((prev) => [notification, ...prev]);
    //         setUnreadCount((prev) => prev + 1);
    //     });


    //     return () => {
    //         socket.off("global_notification");
    //     };
    // }, [user]);


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

    useEffect(() => {
        if (!user?._id) return;

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("join:user", user._id);

        const handleInvite = (invitation) => {
            if (
                invitation.email === user.email ||
                invitation.recipient === user._id
            ) {
                setGlobalNotifications((prev) => [invitation, ...prev]);
                setUnreadCount((prev) => prev + 1);
                toast.success("📩 New invitation received");
            }
        };

        socket.on("invitation:new", handleInvite);

        return () => {
            socket.off("invitation:new", handleInvite);
            socket.disconnect();
        };
    }, [user?._id]);
    if (!user) return null;



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
                                        {/* <div className="border-t border-gray-100">
                                            <button
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                                            >
                                                <FiLogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div> */}
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
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                                        >
                                            <HiSparkles className="w-7 h-7" />
                                        </motion.div>
                                        <div>
                                            <h1 className="text-3xl font-bold">Welcome to Cortexa</h1>
                                            <p className="text-emerald-50 text-sm mt-1">
                                                A unified platform to discover institutions and manage your academic access
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <motion.div
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 shadow-lg cursor-pointer"
                                        >
                                            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">My Institutions</p>
                                            <p className="text-4xl font-bold mt-2">{myInstitutions.length}</p>
                                            <p className="text-emerald-100 text-xs mt-1">Active memberships</p>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 shadow-lg cursor-pointer"
                                        >
                                            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Available</p>
                                            <p className="text-4xl font-bold mt-2">{browseCount}</p>
                                            <p className="text-emerald-100 text-xs mt-1">Discover more</p>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 shadow-lg cursor-pointer"
                                        >
                                            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Notifications</p>
                                            <p className="text-4xl font-bold mt-2">{unreadCount}</p>
                                            <p className="text-emerald-100 text-xs mt-1">
                                                {unreadCount > 0 ? "New notifications" : "All caught up!"}
                                            </p>

                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* MY INSTITUTIONS */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                            >
                                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-emerald-50 to-green-50">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            whileHover={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 0.5 }}
                                            className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"
                                        >
                                            <FiBook className="w-7 h-7 text-white" />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">My Institutions</h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Institutions you are currently associated with
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <MyInstitutionsTab
                                        institutions={myInstitutions}
                                    />
                                </div>
                            </motion.section>

                            {/* BROWSE INSTITUTIONS */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                            >
                                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            whileHover={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 0.5 }}
                                            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
                                        >
                                            <FiGrid className="w-7 h-7 text-white" />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Browse Institutions</h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Discover universities, colleges, and learning platforms
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <BrowseInstitutionsTab
                                        excludeInstitutionId={user?.institution?._id}
                                    />
                                </div>
                            </motion.section>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && (
                        <Notifications
                            realtimeInvites={globalNotifications}
                            clearUnread={() => setUnreadCount(0)}
                        />
                    )}


                    {/* QUERY DESK */}
                    {activeTab === "querydesk" && <QueryDesk />}
                </main>
            </div>
        </div>
    );
};

export default CortexaDashboard;
