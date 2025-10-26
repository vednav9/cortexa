import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiFilter, FiBell, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar';
import InvitationCard from './InvitationCard';
import JoinAccessTab from './JoinAccessTab';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('access');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    institutionType: 'all',
    status: 'all',
  });

  const invitations = [
    {
      id: 1,
      institutionName: 'Stanford University',
      logo: 'S',
      email: 'faculty@stanford.edu',
      type: 'university',
      date: '1 day ago',
      status: 'pending'
    },
    {
      id: 2,
      institutionName: 'Berkeley',
      logo: 'B',
      email: 'admissions@berkeley.edu',
      type: 'university',
      date: '3 days ago',
      status: 'pending'
    },
  ];

  const tabs = [
    { id: 'access', label: 'Join / Access', count: 3 },
    { id: 'invitations', label: 'Invitations', count: invitations.length },
    { id: 'requests', label: 'Requests', count: 1 },
  ];

  const handleAcceptInvitation = (id) => {
    console.log('Accepted:', id);
  };

  const handleRejectInvitation = (id) => {
    console.log('Rejected:', id);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-emerald-600">
            <FiFilter className="w-5 h-5" />
            <span className="font-semibold text-lg">Filters</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution Type
            </label>
            <select
              value={filters.institutionType}
              onChange={(e) => setFilters({ ...filters, institutionType: e.target.value })}
              className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="university">University</option>
              <option value="college">College</option>
              <option value="school">School</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
            </select>
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
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your teaching institutions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
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
                  TD
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
                    layoutId="teacherActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'access' && <JoinAccessTab />}
          
          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <InvitationCard
                    invitation={invitation}
                    onAccept={handleAcceptInvitation}
                    onReject={handleRejectInvitation}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="text-center py-12">
              <p className="text-gray-500">No pending requests</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
