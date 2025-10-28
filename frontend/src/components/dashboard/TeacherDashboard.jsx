import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiSearch, FiFilter, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import Sidebar from './Sidebar';
import InvitationTab from './InvitationTab';
import MyInstitutionsTab from './MyInstitutionsTab';
import BrowseInstitutionsTab from './BrowseInstitutionsTab';

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
    <div className="flex w-full bg-gray-50 pt-0 sticky top-0">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isInstitution={false} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Tabs */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
              </div>
            </div>

            {/* Right side - Tabs */}
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id 
                      ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'access' && <BrowseInstitutionsTab />}
          {activeTab === 'institutions' && <MyInstitutionsTab institutions={myInstitutions} />}
          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <motion.div 
                  key={invitation.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.1 }}
                >
                  <InvitationTab 
                    invitation={invitation} 
                    onAccept={handleAcceptInvitation} 
                    onReject={handleRejectInvitation} 
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
