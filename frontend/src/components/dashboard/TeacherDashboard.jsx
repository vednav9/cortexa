import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiFilter, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import Sidebar from './Sidebar';
import InvitationCard from './InvitationCard';
import MyInstitutions from './MyInstitutions';
import BrowseCollegesTab from './BrowseCollegesTab';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('access');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    institutionType: 'all',
    status: 'all',
    sortBy: 'recent'
  });

  // Mock data
  const myInstitutions = [
    { id: 1, name: 'Stanford University', logo: 'S', role: 'Teacher', status: 'active' },
    { id: 2, name: 'Berkeley', logo: 'B', role: 'Teacher', status: 'active' },
  ];

  const invitations = [
    { id: 1, institutionName: 'Yale University', logo: 'Y', email: 'faculty@yale.edu', type: 'university', date: '1 day ago', status: 'pending' },
    { id: 2, institutionName: 'Princeton', logo: 'P', email: 'admissions@princeton.edu', type: 'university', date: '3 days ago', status: 'pending' },
  ];

  const tabs = [
    { id: 'access', label: 'Browse Colleges', count: 5 },
    { id: 'institutions', label: 'My Institutions', count: myInstitutions.length },
    { id: 'invitations', label: 'Invitations', count: invitations.length },
  ];

  const handleAcceptInvitation = (id) => {
    console.log('Accepted:', id);
  };

  const handleRejectInvitation = (id) => {
    console.log('Rejected:', id);
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = inv.institutionName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filters.institutionType === 'all' || inv.type === filters.institutionType;
    const matchesStatus = filters.status === 'all' || inv.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50 sticky top-0">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <div className="space-y-6">
          {/* Filter Header */}
          <div className="flex items-center space-x-2 text-emerald-600">
            <FiFilter className="w-5 h-5" />
            <span className="font-semibold text-lg">Filters</span>
          </div>

          {/* Institution Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution Type</label>
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

          {/* Status Filter */}
          {/* <div>
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
          </div> */}

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilters({ institutionType: 'all', status: 'all', sortBy: 'recent' })}
            className="w-full py-2 px-4 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50"
          >
            Reset Filters
          </motion.button>
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-emerald-100 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600 hover:text-emerald-600">
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your teaching institutions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* <div className="relative hidden md:block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search institutions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div> */}

              <motion.button whileHover={{ scale: 1.1 }} className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                <FiBell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>

              {/* <motion.button whileHover={{ scale: 1.05 }} className="flex items-center space-x-3 p-2 hover:bg-emerald-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  TD
                </div>
              </motion.button>

              <motion.button whileHover={{ scale: 1.05 }} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <FiLogOut className="w-5 h-5" />
              </motion.button> */}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-emerald-100 px-6 shadow-sm">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-2 font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
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
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'access' && <BrowseCollegesTab />}

          {activeTab === 'institutions' && <MyInstitutions institutions={myInstitutions} />}

          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {filteredInvitations.length > 0 ? (
                filteredInvitations.map((invitation, index) => (
                  <motion.div key={invitation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <InvitationCard invitation={invitation} onAccept={handleAcceptInvitation} onReject={handleRejectInvitation} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUser className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No invitations found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
