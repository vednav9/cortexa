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
  FiChevronDown,
  FiSearch
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Sidebar from './Sidebar';
import AddUsersTab from './AddUsersTab';

const AdminDashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    { id: 'students', label: 'Students', icon: FiUsers, count: students.length },
    { id: 'teachers', label: 'Teachers', icon: FiUsers, count: teachers.length }
  ];

  const filteredUsers = activeTab === 'students' ? students : activeTab === 'teachers' ? teachers : [];

  const handleDeleteUser = (id) => {
    console.log('Delete user:', id);
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 pl-80">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col">
        {/* Simplified Header */}
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
                <HiSparkles className="w-7 h-7 text-emerald-500" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Manage your institution</p>
                </div>
              </div>
            </div>

            {/* Right – Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
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

                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </button>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          {
                            setProfileMenuOpen(false);
                            onLogout();
                          };
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

        {/* Main Content with Tabs */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'addUsers' && <AddUsersTab />}

          {activeTab !== 'addUsers' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Total Students</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{students.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <FiUsers className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Teachers</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{teachers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <FiUsers className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{students.length + teachers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <FiBarChart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tabs and Search Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  {/* Tabs */}
                  <div className="flex items-center gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                </div>

                {/* User Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredUsers
                    .filter((user) =>
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <UserCard key={user.id} user={user} onDelete={handleDeleteUser} />
                    ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No users found</p>
                  </div>
                )}
              </div>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-emerald-200 transition-all group"
    >
      {/* Delete Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
      >
        <FiX className="w-4 h-4" />
      </button>

      {/* User Info */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {user.logo}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <h3 className="text-base font-bold text-gray-800 mb-1">{user.name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <FiMail className="w-3 h-3" /> {user.email}
        </p>

        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
          {user.role}
        </span>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10"
          >
            <p className="text-sm font-semibold text-gray-800 mb-4 text-center">
              Delete {user.name}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDelete(user.id);
                  setShowConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
