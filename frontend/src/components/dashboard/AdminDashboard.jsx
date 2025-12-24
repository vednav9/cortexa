import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu,
  FiUsers,
  FiSettings,
  FiBarChart,
  FiUserPlus,
  FiX,
  FiMail,
  FiUser,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Sidebar from './Sidebar';
import AddUsersTab from './AddUsersTab';

const AdminDashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
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

  const adminFeatures = [
    { id: 1, name: 'User Management', icon: FiUsers, count: 245, color: 'from-emerald-400 to-green-500' },
    { id: 2, name: 'Settings', icon: FiSettings, count: 12, color: 'from-blue-400 to-blue-500' },
    { id: 3, name: 'Analytics', icon: FiBarChart, count: 8, color: 'from-purple-400 to-purple-500' },
  ];

  const students = [
    { id: 1, name: 'John Doe', email: 'john@example.com', logo: 'JD', role: 'Student', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', logo: 'JS', role: 'Student', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', logo: 'BJ', role: 'Student', status: 'active' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', logo: 'AB', role: 'Student', status: 'active' },
  ];

  const teachers = [
    { id: 1, name: 'Prof. Wilson', email: 'wilson@example.com', logo: 'PW', role: 'Teacher', status: 'active' },
    { id: 2, name: 'Dr. Garcia', email: 'garcia@example.com', logo: 'DG', role: 'Teacher', status: 'active' },
  ];

  const tabs = [
    { id: 'students', label: 'Students', count: students.length },
    { id: 'teachers', label: 'Teachers', count: teachers.length },
    { id: 'addUsers', label: 'Add Users', icon: FiUserPlus }
  ];

  const filteredUsers =
    activeTab === 'students' ? students :
      activeTab === 'teachers' ? teachers : [];

  const handleDeleteUser = (id) => {
    console.log('Delete user:', id);
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 pl-80">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header (SAME AS STUDENT) */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <FiMenu className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <HiSparkles className="w-6 h-6 text-emerald-500" />
                <h1 className="text-xl font-bold text-gray-800">
                  Admin Dashboard
                </h1>
              </div>
            </div>

            {/* Right – Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  AD
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''
                    }`}
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
                      <p className="text-sm font-semibold text-gray-800">Admin</p>
                      <p className="text-xs text-gray-500">admin@email.com</p>
                    </div>

                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </button>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
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

          {/* Tabs (SAME STYLE AS STUDENT) */}
          <div className="px-6 pb-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4 inline mr-1" />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 z-0">
          {activeTab === 'addUsers' && <AddUsersTab />}

          {activeTab !== 'addUsers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} onDelete={handleDeleteUser} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const UserCard = ({ user, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-2xl transition-all group"
    >
      <button
        onClick={() => setShowConfirm(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <FiX className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
          {user.logo}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <FiMail className="w-3 h-3" /> {user.email}
        </p>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
