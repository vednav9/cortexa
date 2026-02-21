import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHelpCircle, FiPlus, FiSearch, FiFilter, FiCheck, FiClock,
  FiAlertCircle, FiMessageSquare, FiSend, FiX, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../context/authcontext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function QueryDesk({ institution }) {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [showNewQuery, setShowNewQuery] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newQuery, setNewQuery] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'normal'
  });
  const [replyText, setReplyText] = useState('');

  const brandColor = institution?.branding?.primaryColor || '#10b981';

  // Fetch queries
  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = {
        status: filterStatus,
        search: searchTerm
      };
      const response = await api.get(`/queries/institution/${institution._id}`, { params });
      setQueries(response.data.queries || []);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get(`/queries/institution/${institution._id}/stats`);
      setStats(response.data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (!institution?._id) {
      setLoading(false); // ⬅️ STOP infinite loader
      return;
    }

    fetchQueries();
    fetchStats();
  }, [institution?._id, filterStatus, searchTerm]);


  const categories = [
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'technical', label: 'Technical', color: 'purple' },
    { value: 'academic', label: 'Academic', color: 'green' },
    { value: 'administrative', label: 'Administrative', color: 'orange' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const statuses = [
    { value: 'all', label: 'All', icon: FiMessageSquare },
    { value: 'open', label: 'Open', icon: FiAlertCircle },
    { value: 'in-progress', label: 'In Progress', icon: FiClock },
    { value: 'resolved', label: 'Resolved', icon: FiCheck }
  ];

  const handleSubmitQuery = async () => {
    if (!institution?._id) {
      toast.error("Institution not loaded yet. Please wait.");
      return;
    }

    if (!newQuery.title.trim() || !newQuery.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post(
        `/queries/institution/${institution._id}`,
        newQuery
      );

      setQueries([response.data.query, ...queries]);
      setNewQuery({ title: '', description: '', category: 'general', priority: 'normal' });
      setShowNewQuery(false);
      toast.success('Query submitted successfully!');
      fetchStats();
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error(error.response?.data?.message || 'Failed to submit query');
    }
  };


  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const response = await api.post(`/queries/${selectedQuery._id}/reply`, { text: replyText });

      // Update queries list
      setQueries(queries.map(q =>
        q._id === selectedQuery._id ? response.data.query : q
      ));

      // Update selected query
      setSelectedQuery(response.data.query);
      setReplyText('');
      toast.success('Reply sent!');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleStatusChange = async (queryId, newStatus) => {
    try {
      const response = await api.patch(`/queries/${queryId}/status`, { status: newStatus });

      // Update queries list
      setQueries(queries.map(q =>
        q._id === queryId ? response.data.query : q
      ));

      // Update selected query if open
      if (selectedQuery?._id === queryId) {
        setSelectedQuery(response.data.query);
      }

      toast.success('Status updated!');
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-orange-600 bg-orange-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayStats = [
    { label: 'Total Queries', value: stats.total, icon: FiMessageSquare, color: 'blue' },
    { label: 'Open', value: stats.open, icon: FiAlertCircle, color: 'orange' },
    { label: 'In Progress', value: stats.inProgress, icon: FiClock, color: 'blue' },
    { label: 'Resolved', value: stats.resolved, icon: FiCheck, color: 'green' }
  ];

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-end mb-1">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewQuery(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all text-[13px]"
          style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}
        >
          <FiPlus className="w-4 h-4" />
          Create New Query
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight leading-none">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-[14px] bg-${stat.color}-50 flex items-center justify-center border border-${stat.color}-100/50 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        {/* Search */}
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all text-[13px]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 p-1 bg-gray-100/80 border border-gray-200/60 rounded-2xl overflow-x-auto">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${filterStatus === status.value
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 border border-transparent'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queries List */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100/50">
            <FiClock className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
          <p className="text-gray-900 text-lg font-bold tracking-tight">Loading queries...</p>
          <p className="text-[13px] text-gray-500 mt-1">Please wait while we fetch your query history</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {queries.map((query, index) => (
              <motion.div
                key={query._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedQuery(query)}
                className="group bg-white border border-gray-200/60 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-200/60 transition-all duration-300 cursor-pointer overflow-hidden relative flex flex-col"
              >
                {/* Hover gradient top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-200 group-hover:from-emerald-400 group-hover:to-emerald-500 opacity-80 group-hover:opacity-100 transition-all duration-500"></div>

                {/* Header */}
                <div className="flex items-start justify-between mb-4 mt-1 gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight truncate mb-1">{query.title}</h3>
                    <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">{query.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border border-gray-100 ${getStatusColor(query.status)}`}>
                    {query.status}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold text-gray-500 mb-5">
                  <span className={`px-2 py-1 rounded-md border border-gray-100 uppercase tracking-widest text-[10px] ${getPriorityColor(query.priority)}`}>
                    {query.priority}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600 uppercase tracking-widest text-[10px]">
                    {query.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(query.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    {query.replies?.length || 0} Replies
                  </span>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100/80 flex items-center justify-between">
                  <span className="text-[13px] text-gray-500 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {query.createdBy?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                    {query.createdBy.name}
                  </span>
                  <span className="text-[13px] font-semibold text-emerald-600 group-hover:text-emerald-500 flex items-center gap-1 transition-colors">
                    View Thread →
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {queries.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="w-20 h-20 bg-gray-50/80 rounded-[18px] flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
                <FiHelpCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 text-xl font-bold tracking-tight mb-2">No queries found</p>
              <p className="text-[13px] text-gray-500 max-w-sm mx-auto">You haven't submitted any support queries yet. If you need help, create a new query.</p>
            </div>
          )}
        </div>
      )}

      {/* New Query Modal */}
      <AnimatePresence>
        {showNewQuery && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50"
              onClick={() => setShowNewQuery(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[550px] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] z-50 p-8 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New Query</h2>
                  <p className="text-[13px] text-gray-500 mt-1">Submit a detailed support request directly to the institution.</p>
                </div>
                <button
                  onClick={() => setShowNewQuery(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors bg-gray-50 text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Subject Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newQuery.title}
                    onChange={(e) => setNewQuery({ ...newQuery, title: e.target.value })}
                    placeholder="Brief title of your query"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={newQuery.description}
                    onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                    placeholder="Describe your query in detail..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[13px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                    <div className="relative">
                      <select
                        value={newQuery.category}
                        onChange={(e) => setNewQuery({ ...newQuery, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[13px] appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Priority</label>
                    <div className="relative">
                      <select
                        value={newQuery.priority}
                        onChange={(e) => setNewQuery({ ...newQuery, priority: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[13px] appearance-none"
                      >
                        {priorities.map(pri => (
                          <option key={pri.value} value={pri.value}>{pri.label}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowNewQuery(false)}
                  className="flex-1 px-6 py-3 bg-white border border-gray-200/80 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-[13px] shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuery}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all text-[13px]"
                  style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}
                >
                  Submit Query
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Query Details Modal */}
      <AnimatePresence>
        {selectedQuery && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedQuery(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-[600px] h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-50 flex flex-col border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold border border-gray-100 ${getStatusColor(selectedQuery.status)}`}>
                        {selectedQuery.status}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold border border-gray-100 ${getPriorityColor(selectedQuery.priority)}`}>
                        {selectedQuery.priority}
                      </span>
                      {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <div className="relative">
                          <select
                            value={selectedQuery.status}
                            onChange={(e) => handleStatusChange(selectedQuery._id, e.target.value)}
                            className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200/80 rounded-md px-2 py-1 appearance-none pr-6 cursor-pointer hover:border-gray-300 transition-colors"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <FiChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight mb-2">{selectedQuery.title}</h2>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{selectedQuery.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedQuery(null)}
                    className="p-2 hover:bg-white rounded-xl transition-colors bg-gray-100 text-gray-500 hover:text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-200/80"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-white">
                {selectedQuery.replies && selectedQuery.replies.length > 0 ? (
                  selectedQuery.replies.map((reply) => (
                    <div key={reply._id} className="bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-5 relative">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-[14px] text-white flex items-center justify-center font-bold shadow-sm"
                          style={{ backgroundColor: brandColor }}
                        >
                          {reply.repliedBy.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[13px] text-gray-900">{reply.repliedBy.name}</span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {formatDate(reply.repliedAt)}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-600 leading-relaxed mt-1">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                      <FiMessageSquare className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-bold text-[15px] mb-1">No replies yet</p>
                    <p className="text-[13px] text-gray-500 max-w-[200px] mx-auto">This query is currently awaiting a response from the team.</p>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              {(user?.role === 'admin' || user?.role === 'teacher' || selectedQuery.createdBy.userId === user?._id) && (
                <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[13px]"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    />
                    <button
                      onClick={handleReply}
                      className="px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all text-[13px]"
                      style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}
                    >
                      <FiSend className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
