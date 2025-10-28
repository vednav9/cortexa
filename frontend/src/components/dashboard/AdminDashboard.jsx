import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiUsers, FiSettings, FiBarChart, FiUserPlus, FiX, FiMail, FiUser } from 'react-icons/fi';
import Sidebar from './Sidebar';
import AddUsersTab from './AddUsersTab';

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
    { id: 'addUsers', label: 'Add Users', icon: FiUserPlus }
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
    <div className="flex h-screen bg-gray-50 sticky top-0">
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
          {/* <div className="pt-6 border-t border-emerald-100">
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
          </div> */}
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
          </div>
        </header>

        <div className="bg-white border-b border-emerald-100 px-6 shadow-sm sticky top-[73px] z-10">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-2 font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-5 h-5" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="adminActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Add Users Tab */}
          {activeTab === 'addUsers' && <AddUsersTab />}

          {/* Students/Teachers Tab */}
          {activeTab !== 'addUsers' && (
            <>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const UserCard = ({ user, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(user.id);
    setShowConfirm(false);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-2xl transition-all group"
    >
      {/* Delete Button */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConfirm(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
      >
        <FiX className="w-4 h-4" />
      </motion.button>

      {/* User Info */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg"
        >
          {user.logo}
        </motion.div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.name}</h3>
        <p className="text-sm text-gray-500 mb-3 flex items-center space-x-1">
          <FiMail className="w-3 h-3" />
          <span>{user.email}</span>
        </p>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium flex items-center space-x-1">
            <FiUser className="w-3 h-3" />
            <span>{user.role}</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.status === 'active' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {user.status}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 z-20"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-lg p-6 max-w-xs w-full"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">Delete User?</h4>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {user.name}? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
