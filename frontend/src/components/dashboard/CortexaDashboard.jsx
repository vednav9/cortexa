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
import { useAuth } from "../../context/authcontext";
import Sidebar from "./Sidebar";
import BrowseInstitutionsTab from "./BrowseInstitutionsTab";
import MyInstitutionsTab from "./MyInstitutionsTab";
import Notifications from "./Notifications";
import QueryDesk from "./QueryDesk";
import { socket } from "../../socket";
import { useNotification } from "../../context/NotificationContext";


import { studentAPI, teacherAPI, adminAPI, authAPI } from "../../services/api";
import toast from "react-hot-toast";

const CortexaDashboard = () => {
    const { user, setUser, loading, refreshUser } = useAuth();

    console.log("AUTH USER:", user);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [myInstitutions, setMyInstitutions] = useState([]);
    const [institutionsLoading, setInstitutionsLoading] = useState(true);
    const [browseCount, setBrowseCount] = useState(0);

    // const [globalNotifications, setGlobalNotifications] = useState([]);
    // const [unreadCount, setUnreadCount] = useState(0);
    const { notificationCount, clearNotifications } = useNotification();


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
                setMyInstitutions(
                    data.institution
                        ? [{ ...data.institution, role: "student" }]
                        : []
                );
            }
            else if (role === "teacher") {
                const { data } = await teacherAPI.getMyInstitution();
                setMyInstitutions(
                    data.institution
                        ? [{ ...data.institution, role: "teacher" }]
                        : []
                );
            }
            else if (role === "admin") {
                const { data } = await adminAPI.getInstitution();
                setMyInstitutions(
                    data.institution
                        ? [{ ...data.institution, role: "admin" }]
                        : []
                );
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

    // useEffect(() => {
    //     if (!user?.id) return;

    //     if (!socket.connected) {
    //         socket.connect();
    //         console.log("🔌 SOCKET CONNECT CALLED");
    //     }

    //     socket.on("connect", () => {
    //         console.log("🟢 SOCKET CONNECTED:", socket.id);
    //         socket.emit("join:user", user.id);
    //     });

    //     socket.on("invitation:new", (data) => {
    //         console.log("📩 INVITATION RECEIVED:", data);
    //         setUnreadCount(prev => prev + 1);
    //     });

    //     return () => {
    //         socket.off("connect");
    //         socket.off("invitation:new");
    //     };
    // }, [user?.id]);




    // useEffect(() => {
    //     if (!user?.id) return;

    //     const handleInvitation = (invitation) => {
    //         console.log("📩 INVITATION RECEIVED:", invitation);

    //         setGlobalNotifications(prev => [invitation, ...prev]);
    //         setUnreadCount(prev => prev + 1);

    //         toast.success("📩 New invitation received");
    //     };

    //     socket.on("invitation:new", handleInvitation);

    //     return () => {
    //         socket.off("invitation:new", handleInvitation);
    //     };
    // }, [user?.id]);

    // useEffect(() => {
    //     if (!user?._id) return;

    //     // connect socket only once
    //     if (!socket.connected) {
    //         socket.connect();
    //     }

    //     // join personal room
    //     socket.emit("join:user", user._id);
    //     console.log("👤 Joined socket room:", user._id);

    //     const handleInvitation = (invitation) => {
    //         console.log("📩 INVITATION RECEIVED:", invitation);

    //         setGlobalNotifications(prev => [invitation, ...prev]);
    //         setUnreadCount(prev => prev + 1);

    //         toast.success("📩 New invitation received");
    //     };

    //     socket.on("invitation:new", handleInvitation);

    //     return () => {
    //         socket.off("invitation:new", handleInvitation);
    //     };
    // }, [user?._id]);





    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse overflow-hidden shadow-sm">
                        <img src="/logo.png" alt="Cortexa logo" className="w-full h-full object-contain scale-125" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (!user?._id) return;

        socket.on("auth:refresh", async () => {
            console.log("🔄 AUTH REFRESH RECEIVED");

            // force reload auth user from backend
            await refreshUser(); // 👈 explained below
        });

        return () => {
            socket.off("auth:refresh");
        };
    }, [user?._id]);










    return (
        <div className="flex w-full h-screen bg-gray-50 lg:pl-72">
            {/* SIDEBAR */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                unreadCount={notificationCount}
            />


            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col bg-gray-50/50">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 transition-all">
                    <div className="flex items-center justify-between px-8 h-[72px]">
                        {/* Left */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
                            >
                                <FiMenu className="w-5 h-5" />
                            </button>

                            <div className="flex items-center space-x-3">
                                <div>
                                    <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-none">
                                        {activeTab === "dashboard" ? "Dashboard" :
                                            activeTab === "notifications" ? "Notifications" :
                                                activeTab === "querydesk" ? "Query Desk" : "Dashboard"}
                                    </h1>
                                    <p className="text-[12px] text-gray-500 mt-1">
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
                                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                            >
                                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="hidden sm:block text-left pr-1">
                                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                                        {user?.name || "User"}
                                    </p>
                                </div>
                                <FiChevronDown
                                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
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
                                        <div className="p-1.5">
                                            <button className="w-full px-3 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-2.5 transition-colors">
                                                <FiUser className="w-4 h-4 text-gray-400" />
                                                <span>Profile</span>
                                            </button>
                                            <button className="w-full px-3 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-2.5 transition-colors">
                                                <FiSettings className="w-4 h-4 text-gray-400" />
                                                <span>Settings</span>
                                            </button>
                                            <div className="my-1 border-t border-gray-100"></div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await authAPI.logout();
                                                    } catch (err) {
                                                        console.error("Logout failed", err);
                                                    }
                                                    setUser(null);
                                                    localStorage.removeItem("auth");
                                                    window.location.href = "/login";
                                                }}
                                                className="w-full px-3 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
                                            >
                                                <FiLogOut className="w-4 h-4 text-red-500" />
                                                <span>Sign Out</span>
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
                                            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
                                        >
                                            <img src="/logo.png" alt="Cortexa logo" className="w-full h-full object-contain scale-125" />
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
                                            <p className="text-4xl font-bold mt-2">{notificationCount}</p>

                                            <p className="text-emerald-100 text-xs mt-1">
                                                {notificationCount > 0 ? "New notifications" : "All caught up!"}
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
                                        onCountChange={setBrowseCount}
                                    />

                                </div>
                            </motion.section>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && (
                        <Notifications
                            clearUnread={clearNotifications}
                        />
                    )}


                    {/* QUERY DESK */}
                    {activeTab === "querydesk" && (
                        <QueryDesk institution={myInstitutions[0]} />
                    )}

                </main>
            </div>
        </div>
    );
};

export default CortexaDashboard;
