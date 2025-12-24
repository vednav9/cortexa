import React, { useState } from 'react';
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
  FiBarChart
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Sidebar from './Sidebar';
import AddUsersTab from './AddUsersTab';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = activeTab === 'students' ? students : activeTab === 'teachers' ? teachers : [];

  const handleDeleteUser = (id) => {
    console.log('Delete user:', id);
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 lg:pl-80">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
                  AD
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
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
                      <p className="text-sm font-semibold text-gray-800">Admin</p>
                      <p className="text-xs text-gray-500">admin@email.com</p>
                    </div>

                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'addUsers' ? (
            <AddUsersTab />
          ) : (
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
                          <h1 className="text-3xl font-bold">User Management</h1>
                        </div>
                      </div>
                    </div>

                    {/* User Type Toggle */}
                    <div className="flex gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <button
                        onClick={() => setActiveTab('students')}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'students'
                          ? 'bg-white text-emerald-600 shadow-lg'
                          : 'text-white hover:bg-white/10'
                          }`}
                      >
                        <FiUsers className="w-4 h-4" />
                        Students
                      </button>
                      <button
                        onClick={() => setActiveTab('teachers')}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'teachers'
                          ? 'bg-white text-emerald-600 shadow-lg'
                          : 'text-white hover:bg-white/10'
                          }`}
                      >
                        <FiUsers className="w-4 h-4" />
                        Teachers
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-emerald-100 text-xs font-medium uppercase">Total Students</p>
                      <p className="text-3xl font-bold mt-1">{students.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-emerald-100 text-xs font-medium uppercase">Total Teachers</p>
                      <p className="text-3xl font-bold mt-1">{teachers.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-emerald-100 text-xs font-medium uppercase">Total Users</p>
                      <p className="text-3xl font-bold mt-1">{students.length + teachers.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Section */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
                {/* Section Header */}
                <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <FiUsers className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {activeTab === 'students' ? 'Students' : 'Teachers'} ({filteredUsers.length})
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">Manage your {activeTab}</p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                      />
                    </div>
                  </div>
                </div>

                {/* User Grid */}
                <div className="p-6">
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
      className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-emerald-200 transition-all group"
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
            className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-10"
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
