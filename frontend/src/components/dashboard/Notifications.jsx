import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiClock, FiBell, FiMenu, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Sidebar from './Sidebar';

function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

  // Mock invitations data
  const invitations = [
    { 
      id: 1, 
      institutionName: 'Harvard University', 
      logo: 'H', 
      email: 'admissions@harvard.edu', 
      type: 'university', 
      date: '2 days ago', 
      status: 'pending' 
    },
    { 
      id: 2, 
      institutionName: 'IIT', 
      logo: 'I', 
      email: 'info@iit.edu', 
      type: 'university', 
      date: '5 days ago', 
      status: 'pending' 
    },
    { 
      id: 3, 
      institutionName: 'Yale University', 
      logo: 'Y', 
      email: 'faculty@yale.edu', 
      type: 'university', 
      date: '1 day ago', 
      status: 'pending' 
    },
  ];

  // Mock other notifications
  const otherNotifications = [
    {
      id: 4,
      type: 'announcement',
      title: 'New Course Available',
      message: 'Check out the new Data Science course',
      date: '3 hours ago',
      read: false,
    },
    {
      id: 5,
      type: 'update',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday',
      date: '1 day ago',
      read: true,
    },
  ];

  const handleAcceptInvitation = (id) => {
    console.log('Accepted:', id);
    // Add API call here
  };

  const handleRejectInvitation = (id) => {
    console.log('Rejected:', id);
    // Add API call here
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'invitations', label: 'Invitations' },
    { id: 'announcements', label: 'Announcements' },
  ];

  const filteredInvitations = activeFilter === 'all' || activeFilter === 'invitations' 
    ? invitations 
    : [];

  const filteredOtherNotifications = activeFilter === 'all' || activeFilter === 'announcements'
    ? otherNotifications
    : [];

  return (
    <div className="flex w-full h-screen bg-gray-50 pl-80">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isInstitution={false}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left - Title & Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <FiBell className="w-6 h-6 text-emerald-500" />
                <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
              </div>
            </div>

            {/* Right - Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  JD
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">John Doe</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">John Doe</p>
                    <p className="text-xs text-gray-500">john.doe@email.com</p>
                  </div>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                    <FiUser className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                    <FiSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        // Add logout handler here if needed
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 pb-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {filters.map((filter) => {
                const count = 
                  filter.id === 'invitations' ? invitations.length :
                  filter.id === 'announcements' ? otherNotifications.length :
                  invitations.length + otherNotifications.length;

                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`relative flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {filter.label}
                    {count > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          activeFilter === filter.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Invitations Section */}
            {filteredInvitations.length > 0 && (
              <div className="space-y-4">
                {(activeFilter === 'all' || activeFilter === 'invitations') && (
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Institution Invitations
                  </h2>
                )}
                {filteredInvitations.map((invitation, index) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Logo */}
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                          {invitation.logo}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-800 mb-1">
                            {invitation.institutionName}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{invitation.email}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-400">
                            <span className="flex items-center space-x-1">
                              <FiClock className="w-3.5 h-3.5" />
                              <span>{invitation.date}</span>
                            </span>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                              {invitation.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
                          title="Accept"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleRejectInvitation(invitation.id)}
                          className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                          title="Reject"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Other Notifications Section */}
            {filteredOtherNotifications.length > 0 && (
              <div className="space-y-4">
                {(activeFilter === 'all' || activeFilter === 'announcements') && (
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 mt-6">
                    Other Notifications
                  </h2>
                )}
                {filteredOtherNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 ${
                      !notification.read ? 'border-l-4 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-800 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <span className="text-xs text-gray-400">{notification.date}</span>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredInvitations.length === 0 && filteredOtherNotifications.length === 0 && (
              <div className="text-center py-12">
                <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications</h3>
                <p className="text-sm text-gray-500">You're all caught up!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Notifications;