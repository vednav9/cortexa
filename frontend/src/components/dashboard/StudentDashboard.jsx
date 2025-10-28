import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiBell, FiLogOut } from 'react-icons/fi';
import MainSidebar from './Sidebar';
import BrowseCollegesTab from './BrowseCollegesTab';
import MyInstitutions from './MyInstitutions';
import InvitationCard from './InvitationCard';

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('access');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const myInstitutions = [
    { id: 1, name: 'MIT', logo: 'M', role: 'Student', status: 'active' },
    { id: 2, name: 'Harvard', logo: 'H', role: 'Student', status: 'active' },
  ];

  const invitations = [
    { id: 1, institutionName: 'Harvard University', logo: 'H', email: 'admissions@harvard.edu', type: 'university', date: '2 days ago', status: 'pending' },
    { id: 2, institutionName: 'MIT', logo: 'M', email: 'info@mit.edu', type: 'university', date: '5 days ago', status: 'pending' },
  ];

  const tabs = [
    { id: 'access', label: 'Browse Colleges', count: 5 },
    { id: 'institutions', label: 'My Institutions', count: myInstitutions.length },
    { id: 'invitations', label: 'Invitations', count: invitations.length },
  ];

  const handleAcceptInvitation = (id) => console.log('Accepted:', id);
  const handleRejectInvitation = (id) => console.log('Rejected:', id);

  return (
    // ✅ Removed min-h-screen, changed to flex w-full
    <div className="flex w-full bg-gray-50 pt-0 sticky top-0">
      {/* Sidebar */}
      <MainSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isInstitution={false} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your institution connections</p>
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
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <button className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg">
                <FiBell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 shadow-sm">
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
                    layoutId="studentActiveTab"
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
              {invitations.map((invitation, index) => (
                <motion.div key={invitation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <InvitationCard invitation={invitation} onAccept={handleAcceptInvitation} onReject={handleRejectInvitation} />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
