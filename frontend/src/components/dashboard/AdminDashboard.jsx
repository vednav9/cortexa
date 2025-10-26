import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiUsers, FiSettings, FiBarChart, FiBell, FiLogOut, FiFilter } from 'react-icons/fi';
import Sidebar from './Sidebar';
import UserCard from './UserCard';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);

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
    { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', logo: 'CD', role: 'Student', status: 'inactive' },
    { id: 6, name: 'Emma Wilson', email: 'emma@example.com', logo: 'EW', role: 'Student', status: 'active' },
  ];

  const teachers = [
    { id: 1, name: 'Prof. Wilson', email: 'wilson@example.com', logo: 'PW', role: 'Teacher', status: 'active' },
    { id: 2, name: 'Dr. Garcia', email: 'garcia@example.com', logo: 'DG', role: 'Teacher', status: 'active' },
    { id: 3, name: 'Prof. Martinez', email: 'martinez@example.com', logo: 'PM', role: 'Teacher', status: 'active' },
    { id: 4, name: 'Dr. Anderson', email: 'anderson@example.com', logo: 'DA', role: 'Teacher', status: 'active' },
  ];

  const tabs = [
    { id: 'students', label: 'Students', count: students.length },
    { id: 'teachers', label: 'Teachers', count: teachers.length },
  ];

  const handleDeleteUser = (id) => {
    console.log('Delete user:', id);
    // Add your delete logic here
  };

  const filteredUsers = (activeTab === 'students' ? students : teachers).filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} showFilter={false}>
        <div className="space-y-6">
          {/* Admin Features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
              <FiSettings className="w-4 h-4" />
              <span>Admin Features</span>
            </h3>
            <div className="space-y-2">
              {adminFeatures.map((feature) => (
                <motion.button
                  key={feature.id}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFeature(feature.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedFeature === feature.id
                      ? 'bg-emerald-50 border-2 border-emerald-200'
                      : 'bg-white border border-emerald-100 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                    {feature.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Total Count */}
          <div className="pt-6 border-t border-emerald-100">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2 flex items-center space-x-2">
                <FiUsers className="w-4 h-4" />
                <span>Total Users</span>
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {students.length + teachers.length}
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-200 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-emerald-600">{students.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Teachers</p>
                  <p className="text-2xl font-bold text-green-600">{teachers.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-emerald-100 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage users and institution settings</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
              >
                <FiBell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 p-2 hover:bg-emerald-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  AD
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <FiLogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-emerald-100 px-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-2 font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id ? 'text-emerald-600' : 'text-gray-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="adminActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <UserCard user={user} onDelete={handleDeleteUser} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
