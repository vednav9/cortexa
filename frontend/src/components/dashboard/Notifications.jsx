import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiClock, FiBell, FiMenu, FiUser, FiSettings, FiLogOut, FiChevronDown, FiMail } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import Sidebar from './Sidebar';

function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

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

  const invitations = [
    {
      id: 1,
      institutionName: 'Harvard University',
      logo: 'H',
      email: 'admissions@harvard.edu',
      type: 'University',
      date: '2 days ago',
      status: 'pending'
    },
    {
      id: 2,
      institutionName: 'Indian Institute of Technology',
      logo: 'I',
      email: 'info@iit.edu',
      type: 'University',
      date: '5 days ago',
      status: 'pending'
    },
    {
      id: 3,
      institutionName: 'Yale University',
      logo: 'Y',
      email: 'faculty@yale.edu',
      type: 'University',
      date: '1 day ago',
      status: 'pending'
    },
  ];

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
  };

  const handleRejectInvitation = (id) => {
    console.log('Rejected:', id);
  };

  const filters = [
    { id: 'all', label: 'All Notifications' },
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
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />


      <div className="flex-1 flex flex-col lg:lg:pl-80">

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
                  <FiBell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
                  <p className="text-xs text-gray-500">Stay updated with your activity</p>
                </div>
              </div>
            </div>

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
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
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
                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <FiSettings className="w-4 h-4" />
                      <span>Settings</span>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Stats */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <HiSparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  {filters.map((filter) => {
                    const count =
                      filter.id === 'invitations' ? invitations.length :
                        filter.id === 'announcements' ? otherNotifications.length :
                          invitations.length + otherNotifications.length;

                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeFilter === filter.id
                          ? 'bg-white text-emerald-600 shadow-lg'
                          : 'text-white hover:bg-white/10'
                          }`}
                      >
                        {filter.label}
                        {count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeFilter === filter.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white/20 text-white'
                            }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Invitations Grid */}
            {filteredInvitations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FiMail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Institution Invitations</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Pending invites from institutions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInvitations.map((invitation, index) => (
                    <motion.div
                      key={invitation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border-2 border-emerald-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                          {invitation.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-gray-900 mb-1 truncate">
                            {invitation.institutionName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 truncate flex items-center gap-1">
                            <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                            {invitation.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <FiClock className="w-3.5 h-3.5" />
                              {invitation.date}
                            </span>
                            <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                              {invitation.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <FiCheck className="w-4 h-4" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRejectInvitation(invitation.id)}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                        >
                          <FiX className="w-4 h-4" />
                          Decline
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Notifications */}
            {filteredOtherNotifications.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FiBell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Recent Updates</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Latest announcements and updates</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOtherNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative bg-white border-2 rounded-2xl p-6 hover:shadow-lg transition-all overflow-hidden ${!notification.read
                        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/30 to-transparent'
                        : 'border-gray-100'
                        }`}
                    >
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-green-500"></div>
                      )}
                      <div className="flex items-start justify-between pl-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-bold text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FiClock className="w-3.5 h-3.5" />
                            {notification.date}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredInvitations.length === 0 && filteredOtherNotifications.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border-2 border-gray-100 p-16 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiBell className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">All Caught Up!</h3>
                <p className="text-sm text-gray-500">You have no new notifications at the moment</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Notifications;
