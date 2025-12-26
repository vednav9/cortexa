import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiLogOut, FiUser, FiChevronDown, FiSettings } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import MyInstitutionsTab from './MyInstitutionsTab';
import BrowseInstitutionsTab from './BrowseInstitutionsTab';
import { teacherAPI } from '../../services/api';
import { LoadingPage } from '../common/LoadingSpinner';
import { ErrorPage } from '../common/ErrorMessage';
import { useAuth } from '../../context/authcontext';

const TeacherDashboard = ({ onLogout }) => {
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
        const { data } = await teacherAPI.getInstitutions();
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
      await teacherAPI.leaveInstitution(institutionId);
      setMyInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
      toast.success('Left institution successfully');
    } catch (err) {
      toast.error('Failed to leave institution');
    }
  };

  if (loading) return <LoadingPage message="Loading your dashboard..." />;
  if (error) return <ErrorPage message={error} onRetry={() => window.location.reload()} />;

  const tabs = [
    { id: 'access', label: 'Browse Colleges', count: 5 },
    { id: 'institutions', label: 'My Institutions', count: myInstitutions.length },
  ];

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
        {/* Top Bar with Tabs */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left - Title & Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <HiSparkles className="w-6 h-6 text-emerald-500" />
                <h1 className="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
              </div>
            </div>

            {/* Right - Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.substring(0, 2).toUpperCase() || 'TC'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Teacher'}</p>
                  <p className="text-xs text-gray-500">Teacher</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Teacher'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'teacher@email.com'}</p>
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
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-6 pb-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => {
                const count = tab.id === 'institutions' ? myInstitutions.length : 5;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    {count > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-600'
                          }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </header>



        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 z-0 relative pt-6">

          <div className="max-w-7xl mx-auto"></div>
          {activeTab === 'access' && <BrowseInstitutionsTab />}
          {activeTab === 'institutions' && (
            <MyInstitutionsTab 
              institutions={myInstitutions}
              onLeaveInstitution={handleLeaveInstitution}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
