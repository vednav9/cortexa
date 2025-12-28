// Notifications.jsx – Cortexa Level (Tab Content Only)
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiX,
  FiClock,
  FiBell,
  FiMail,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  /* MOCK DATA (API later) */
  const invitations = [
    {
      id: 1,
      institutionName: "Harvard University",
      logo: "H",
      email: "admissions@harvard.edu",
      type: "University",
      date: "2 days ago",
    },
    {
      id: 2,
      institutionName: "Indian Institute of Technology",
      logo: "I",
      email: "info@iit.edu",
      type: "University",
      date: "5 days ago",
    },
  ];

  const otherNotifications = [
    {
      id: 3,
      title: "New Course Available",
      message: "A new Data Science course is now live.",
      date: "3 hours ago",
      read: false,
    },
    {
      id: 4,
      title: "System Maintenance",
      message: "Scheduled maintenance this Sunday.",
      date: "1 day ago",
      read: true,
    },
  ];

  const filters = [
    { id: "all", label: "All" },
    { id: "invitations", label: "Invitations" },
    { id: "announcements", label: "Announcements" },
  ];

  const filteredInvitations =
    activeFilter === "all" || activeFilter === "invitations"
      ? invitations
      : [];

  const filteredOther =
    activeFilter === "all" || activeFilter === "announcements"
      ? otherNotifications
      : [];

  return (
    <div className="space-y-6">

      {/* HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiBell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-sm opacity-90">
                Invitations, updates & announcements
              </p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex gap-2 p-1.5 bg-white/10 rounded-xl border border-white/20">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${activeFilter === f.id
                    ? "bg-white text-emerald-600 shadow"
                    : "text-white hover:bg-white/10"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INVITATIONS */}
      {filteredInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiMail className="text-emerald-600" />
            Institution Invitations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInvitations.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {inv.logo}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {inv.institutionName}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FiMail className="w-3.5 h-3.5" />
                      {inv.email}
                    </p>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FiClock className="w-3.5 h-3.5" />
                      {inv.date}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition">
                    <FiCheck className="inline mr-1" /> Accept
                  </button>
                  <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 transition">
                    <FiX className="inline mr-1" /> Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* OTHER NOTIFICATIONS */}
      {filteredOther.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HiSparkles className="text-emerald-600" />
            Recent Updates
          </h2>

          <div className="space-y-3">
            {filteredOther.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border rounded-xl p-6 transition-all
                  ${!n.read
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-gray-200"
                  }`}
              >
                <h4 className="font-bold text-gray-900">{n.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <span className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <FiClock className="w-3.5 h-3.5" />
                  {n.date}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredInvitations.length === 0 && filteredOther.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700">
            You’re all caught up!
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            No new notifications right now.
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
