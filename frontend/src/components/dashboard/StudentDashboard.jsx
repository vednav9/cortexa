import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiUser, FiLogOut, FiSettings, FiChevronDown, FiSearch } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import BrowseInstitutions from './BrowseInstitutions';
import MyInstitutions from './MyInstitutions';
import { studentAPI } from '../../services/api';
import { LoadingPage } from '../common/LoadingSpinner';
import { ErrorPage } from '../common/ErrorMessage';
import { useAuth } from '../../context/authcontext';

const StudentDashboard = ({ onLogout }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('access');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  
  const [myInstitutions, setMyInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch institutions
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoading(true);
        const { data } = await studentAPI.getInstitutions();
        setMyInstitutions(data.institutions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load institutions');
        toast.error('Failed to load institutions');
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

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

  const handleLeaveInstitution = async (institutionId) => {
    try {
      await studentAPI.leaveInstitution(institutionId);
      setMyInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
      toast.success('Left institution successfully');
    } catch (err) {
      toast.error('Failed to leave institution');
    }
  };

  if (loading) return <LoadingPage message="Loading your dashboard..." />;
  if (error) return <ErrorPage message={error} onRetry={() => window.location.reload()} />;

  const browseCount = 5;

  return (
    <div className="flex w-full h-screen bg-gray-50 lg:pl-80">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isInstitution={false}
      />

      {/* Main Content */}
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
                  <h1 className="text-xl font-bold text-gray-800">Student Dashboard</h1>
                  <p className="text-xs text-gray-500">Explore and manage institutions</p>
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
                  {user?.fullName?.substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Student'}</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
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
                      <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Student'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'student@email.com'}</p>
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
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Stats */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <HiSparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">My Learning Hub</h1>
                      </div>
                    </div>
                  </div>

                  {/* Tab Toggle */}
                  <div className="flex gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <button
                      onClick={() => setActiveTab('access')}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'access'
                        ? 'bg-white text-emerald-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                        }`}
                    >
                      Browse Colleges
                      {browseCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'access'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white/20 text-white'
                          }`}>
                          {browseCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('institutions')}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'institutions'
                        ? 'bg-white text-emerald-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                        }`}
                    >
                      My Institutions
                      {myInstitutions.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'institutions'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white/20 text-white'
                          }`}>
                          {myInstitutions.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-emerald-100 text-xs font-medium uppercase">My Institutions</p>
                    <p className="text-3xl font-bold mt-1">{myInstitutions.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-emerald-100 text-xs font-medium uppercase">Available</p>
                    <p className="text-3xl font-bold mt-1">{browseCount}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-emerald-100 text-xs font-medium uppercase">Total Access</p>
                    <p className="text-3xl font-bold mt-1">{myInstitutions.length + browseCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'access' && <BrowseInstitutions />}
            {activeTab === 'institutions' && (
              <MyInstitutions
                institutions={myInstitutions}
                onLeaveInstitution={handleLeaveInstitution}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
