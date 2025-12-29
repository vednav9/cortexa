import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu,
  FiUsers,
  FiX,
  FiMail,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiSearch,
  FiBarChart,
  FiCheck,
  FiBuilding
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import CollegeAdminDashboard from '../college/CollegeAdminDashboard';
import { adminAPI } from '../../services/api';
import { LoadingPage } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useAuth } from '../../context/authcontext';
import { mockInstitutions } from '../../data/mockInstitutions';

const AdminDashboard = ({ onLogout }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🧪 TESTING MODE - Set to false to use real backend data
  const [useMockData] = useState(true);

  // Fetch admin's institution from backend OR use mock data
  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setLoading(true);
        
        if (useMockData) {
          // 🧪 Use mock data for testing
          console.log('🧪 Using mock institutions for testing');
          setInstitution(mockInstitutions[0]); // Use first mock institution
          setLoading(false);
        } else {
          // 🔴 Real backend call
          const response = await adminAPI.getInstitution();
          setInstitution(response.data.institution);
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load institution');
        toast.error('Failed to load institution');
        setLoading(false);
      }
    };
    fetchInstitution();
  }, [useMockData]);

  // If institution is selected, show CollegeAdminDashboard
  if (selectedInstitution) {
    return (
      <CollegeAdminDashboard
        institution={selectedInstitution}
        onLogout={onLogout}
        onBack={() => setSelectedInstitution(null)}
      />
    );
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex w-full h-screen bg-gray-50 lg:pl-80">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
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
                  <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Manage your institution</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.institutionName || 'Administrator'}</p>
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Admin'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'admin@email.com'}</p>
                    </div>

                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <HiSparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Welcome, {user?.fullName || 'Admin'}!</h1>
                    <p className="text-emerald-100 mt-1">Manage your institution from here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Institution Section */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">My Institution</h3>
                <p className="text-sm text-gray-600">Click on your institution card to manage it</p>
              </div>

              {useMockData ? (
                // 🧪 Show ONLY 1 mock institution for testing
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedInstitution(mockInstitutions[0])}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm"
                        style={{
                          background: mockInstitutions[0].branding?.primaryColor 
                            ? `linear-gradient(135deg, ${mockInstitutions[0].branding.primaryColor}, ${mockInstitutions[0].branding.secondaryColor || mockInstitutions[0].branding.primaryColor})` 
                            : 'linear-gradient(135deg, #10b981, #059669)'
                        }}
                      >
                        {mockInstitutions[0].code || mockInstitutions[0].name?.substring(0, 2).toUpperCase() || 'IN'}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                          {mockInstitutions[0].name}
                        </h4>
                        <p className="text-sm text-gray-500">{mockInstitutions[0].type || 'Institution'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg">
                      <FiCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    {mockInstitutions[0].establishedYear && (
                      <span className="text-sm text-gray-400">Est. {mockInstitutions[0].establishedYear}</span>
                    )}
                  </div>
                </motion.div>
              ) : institution ? (
                // 🔴 Show single real institution from backend
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedInstitution(institution)}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${institution.primaryColor || '#10b981'}, ${institution.secondaryColor || '#059669'})`
                        }}
                      >
                        {institution.name?.substring(0, 2).toUpperCase() || 'IN'}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                          {institution.name}
                        </h4>
                        <p className="text-sm text-gray-500">{institution.type || 'Institution'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg">
                      <FiCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    {institution.establishedYear && (
                      <span className="text-sm text-gray-400">Est. {institution.establishedYear}</span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBuilding className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium mb-2">No institution assigned yet</p>
                  <p className="text-gray-400 text-sm">Contact system administrator</p>
                </div>
              )}
            </div>

            {/* Browse Institutions Section */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Browse Institutions</h3>
                <p className="text-sm text-gray-600">Discover other institutions</p>
              </div>

              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">Coming Soon</p>
                <p className="text-gray-400 text-sm">Browse feature will be available soon</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
