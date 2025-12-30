// CortexaDashboard.jsx – UI Polished & Consistent
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import InvitePeople from "./admin/InvitePeople";
import ManageUsers from "./admin/ManageUsers";
import AcademicStructure from "./admin/AcademicStructure";
import InstitutionDashboardView from "./institution/InstitutionDashboardView";
import AnnouncementsView from "./institution/AnnouncementsView";
import PlaceholderView from "./institution/PlaceholderView";
import { studentAPI, teacherAPI, adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const CortexaDashboard = ({ institutionSlug }) => {
    const { user, loading } = useAuth();
    const location = useLocation(); // Get location for query params
    const navigate = useNavigate(); // For navigation
    
    console.log("AUTH USER:", user);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [myInstitutions, setMyInstitutions] = useState([]);
    const [institutionsLoading, setInstitutionsLoading] = useState(true);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [hasAccess, setHasAccess] = useState(false); // Track if user has access to selected institution
    const profileMenuRef = useRef(null);

    // Fetch institutions based on user role
    useEffect(() => {
        const fetchInstitutions = async () => {
            if (!user || !user.role) return;
            
            try {
                setInstitutionsLoading(true);
                const role = user.role.toLowerCase();
                
                if (role === 'student') {
                    const { data } = await studentAPI.getInstitutions();
                    console.log("Student institutions fetched:", data.institutions);
                    setMyInstitutions(data.institutions || []);
                } else if (role === 'teacher') {
                    const { data } = await teacherAPI.getInstitutions();
                    console.log("Teacher institutions fetched:", data.institutions);
                    setMyInstitutions(data.institutions || []);
                } else if (role === 'admin') {
                    // Fetch admin's institution
                    const { data } = await adminAPI.getInstitution();
                    console.log("Admin institution fetched:", data.institution);
                    setMyInstitutions(data.institution ? [data.institution] : []);
                } else {
                    setMyInstitutions([]);
                }
            } catch (err) {
                console.error('Failed to fetch institutions:', err);
                toast.error('Failed to load institutions');
                setMyInstitutions([]);
            } finally {
                setInstitutionsLoading(false);
            }
        };
        
        fetchInstitutions();
    }, [user]);

    // Handle institution selection from URL query params
    useEffect(() => {
        // Get institution from query param (e.g., /dashboard?institution=iit-bombay)
        const searchParams = new URLSearchParams(location.search);
        const institutionParam = searchParams.get('institution');
        
        if (institutionParam && myInstitutions.length > 0) {
            const institution = myInstitutions.find(inst => {
                const instSlug = inst.slug || inst.code?.toLowerCase().replace(/\s+/g, '-');
                return instSlug === institutionParam || inst.code?.toLowerCase() === institutionParam.toLowerCase();
            });
            
            if (institution) {
                // User has access to this institution
                console.log("User has access to institution:", institution);
                setSelectedInstitution(institution);
                setHasAccess(true);
                setActiveTab("institution-dashboard");
            } else {
                // User does NOT have access - show basic view
                console.log("User does NOT have access to institution:", institutionParam);
                setSelectedInstitution(null);
                setHasAccess(false);
                setActiveTab("dashboard");
            }
        } else if (!institutionParam) {
            // No institution param, clear selection
            setSelectedInstitution(null);
            setHasAccess(false);
            setActiveTab("dashboard");
        }
    }, [location.search, myInstitutions]);

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

    // Handle institution click - stay on dashboard, don't navigate away
    const handleInstitutionClick = (institution) => {
        console.log("Institution clicked:", institution);
        
        // Set state directly instead of navigating
        setSelectedInstitution(institution);
        setHasAccess(true);
        setActiveTab("institution-dashboard");
        
        // Optionally update URL with query param for bookmarking
        const institutionSlug = institution.slug || institution.code?.toLowerCase().replace(/\s+/g, '-') || institution._id;
        window.history.pushState(null, '', `/dashboard?institution=${institutionSlug}`);
    };

    // Handle back to main dashboard
    const handleBackToDashboard = () => {
        setSelectedInstitution(null);
        setHasAccess(false);
        setActiveTab("dashboard");
        window.history.pushState(null, '', '/dashboard');
    };

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

    const browseCount = 5;

    return (
        <div className="flex w-full h-screen bg-gray-50 lg:pl-80">
            {/* SIDEBAR */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedInstitution={selectedInstitution}
                hasAccess={hasAccess}
                onBackToDashboard={handleBackToDashboard}
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
                                    <MyInstitutionsTab 
                                        institutions={myInstitutions} 
                                        onSelectInstitution={handleInstitutionClick}
                                    />
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
                                    <BrowseInstitutionsTab
                                        excludeInstitutionId={user?.institution?._id}
                                    />

                                </div>
                            </section>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && <Notifications />}

                    {/* QUERY DESK */}
                    {activeTab === "querydesk" && <QueryDesk institution={selectedInstitution} />}

                    {/* INSTITUTION-SPECIFIC TABS (only if user has access) */}
                    {selectedInstitution && hasAccess && (
                        <>
                            {/* Institution Dashboard */}
                            {activeTab === "institution-dashboard" && (
                                <InstitutionDashboardView institution={selectedInstitution} />
                            )}

                            {/* Announcements */}
                            {activeTab === "announcements" && (
                                <AnnouncementsView institution={selectedInstitution} />
                            )}

                            {/* ADMIN-ONLY TABS */}
                            {user?.role?.toLowerCase() === 'admin' && (
                                <>
                                    {activeTab === "invite-people" && (
                                        <InvitePeople institution={selectedInstitution} />
                                    )}
                                    {activeTab === "manage-users" && (
                                        <ManageUsers institution={selectedInstitution} />
                                    )}
                                    {activeTab === "academic-structure" && (
                                        <AcademicStructure institution={selectedInstitution} />
                                    )}
                                </>
                            )}

                            {/* TEACHER-ONLY TABS */}
                            {user?.role?.toLowerCase() === 'teacher' && (
                                <>
                                    {activeTab === "see-students" && (
                                        <PlaceholderView 
                                            title="Students"
                                            description="View student information and track their progress."
                                            icon={FiUser}
                                            color="blue"
                                        />
                                    )}
                                    {activeTab === "upload-notes" && (
                                        <PlaceholderView 
                                            title="Upload Notes"
                                            description="Upload and manage study materials and notes for students."
                                            icon={FiBook}
                                            color="emerald"
                                        />
                                    )}
                                    {activeTab === "generate-mcq" && (
                                        <PlaceholderView 
                                            title="Generate MCQs"
                                            description="Create multiple choice questions for assessments."
                                            icon={FiHelpCircle}
                                            color="purple"
                                        />
                                    )}
                                    {activeTab === "voice-to-text" && (
                                        <PlaceholderView 
                                            title="Voice-to-Text"
                                            description="Convert voice lectures to text notes automatically."
                                            icon={FiHelpCircle}
                                            color="orange"
                                        />
                                    )}
                                    {activeTab === "qa-portal" && (
                                        <PlaceholderView 
                                            title="Q&A Portal"
                                            description="Answer student questions and manage discussions."
                                            icon={FiHelpCircle}
                                            color="blue"
                                        />
                                    )}
                                    {activeTab === "assessment" && (
                                        <PlaceholderView 
                                            title="Assessment"
                                            description="Create and manage assessments and exams."
                                            icon={FiHelpCircle}
                                            color="emerald"
                                        />
                                    )}
                                    {activeTab === "ai-chatbot" && (
                                        <PlaceholderView 
                                            title="AI Chatbot Personal"
                                            description="Your personal AI assistant for teaching and content creation."
                                            icon={HiSparkles}
                                            color="purple"
                                        />
                                    )}
                                </>
                            )}

                            {/* STUDENT-ONLY TABS */}
                            {user?.role?.toLowerCase() === 'student' && (
                                <>
                                    {activeTab === "mcq-test" && (
                                        <PlaceholderView 
                                            title="MCQ Test"
                                            description="Take multiple choice question tests and quizzes."
                                            icon={FiHelpCircle}
                                            color="blue"
                                        />
                                    )}
                                    {activeTab === "rag-chatbot" && (
                                        <PlaceholderView 
                                            title="RAG Chatbot"
                                            description="AI-powered chatbot to answer your study questions."
                                            icon={HiSparkles}
                                            color="purple"
                                        />
                                    )}
                                    {activeTab === "qa-section" && (
                                        <PlaceholderView 
                                            title="Q&A Section"
                                            description="Ask questions and get answers from teachers and peers."
                                            icon={FiHelpCircle}
                                            color="emerald"
                                        />
                                    )}
                                    {activeTab === "assessment" && (
                                        <PlaceholderView 
                                            title="Assessment"
                                            description="View and complete your assessments and exams."
                                            icon={FiHelpCircle}
                                            color="orange"
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CortexaDashboard;
