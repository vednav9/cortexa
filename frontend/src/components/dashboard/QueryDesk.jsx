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
    if (institution?._id) {
      fetchQueries();
      fetchStats();
    }
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <FiHelpCircle className="w-6 h-6" style={{ color: brandColor }} />
            </div>
            Query Desk
          </h1>
          <p className="text-gray-600 mt-1">Get help and support for your queries</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewQuery(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg"
          style={{ backgroundColor: brandColor }}
        >
          <FiPlus className="w-5 h-5" />
          New Query
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
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: brandColor }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status.value
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filterStatus === status.value ? { backgroundColor: brandColor } : {}}
              >
                <Icon className="w-4 h-4" />
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queries List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 rounded-full mx-auto" style={{ borderTopColor: brandColor }} />
          <p className="text-gray-500 mt-4">Loading queries...</p>
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
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{query.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{query.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(query.status)}`}>
                    {query.status}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded ${getPriorityColor(query.priority)}`}>
                    {query.priority}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                    {query.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {formatDate(query.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="w-4 h-4" />
                    {query.replies?.length || 0}
                  </span>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-600">By {query.createdBy.name}</span>
                  <button
                    className="text-sm font-medium hover:underline"
                    style={{ color: brandColor }}
                  >
                    View Details →
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {queries.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <FiHelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No queries found</p>
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
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewQuery(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit New Query</h2>
                <button
                  onClick={() => setShowNewQuery(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* ...existing form fields... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newQuery.title}
                    onChange={(e) => setNewQuery({ ...newQuery, title: e.target.value })}
                    placeholder="Brief title of your query"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: brandColor }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newQuery.description}
                    onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                    placeholder="Describe your query in detail..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: brandColor }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newQuery.category}
                      onChange={(e) => setNewQuery({ ...newQuery, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: brandColor }}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newQuery.priority}
                      onChange={(e) => setNewQuery({ ...newQuery, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: brandColor }}
                    >
                      {priorities.map(pri => (
                        <option key={pri.value} value={pri.value}>{pri.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewQuery(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuery}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                  style={{ backgroundColor: brandColor }}
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
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedQuery(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed top-0 right-0 w-full max-w-2xl h-full bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedQuery.status)}`}>
                        {selectedQuery.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(selectedQuery.priority)}`}>
                        {selectedQuery.priority}
                      </span>
                      {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <select
                          value={selectedQuery.status}
                          onChange={(e) => handleStatusChange(selectedQuery._id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedQuery.title}</h2>
                    <p className="text-sm text-gray-600 mt-2">{selectedQuery.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedQuery(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedQuery.replies && selectedQuery.replies.length > 0 ? (
                  selectedQuery.replies.map((reply) => (
                    <div key={reply._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold"
                          style={{ backgroundColor: brandColor }}
                        >
                          {reply.repliedBy.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{reply.repliedBy.name}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.repliedAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No replies yet</p>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              {(user?.role === 'admin' || user?.role === 'teacher' || selectedQuery.createdBy.userId === user?._id) && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: brandColor }}
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    />
                    <button
                      onClick={handleReply}
                      className="px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
                      style={{ backgroundColor: brandColor }}
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
