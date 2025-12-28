import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, User, Book, Users, Calendar, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PendingRequestsTab = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'student', 'teacher'

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingRequests();
      setPendingRequests(response.data.pendingRequests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = pendingRequests.filter(req => {
    if (filter === 'all') return true;
    return req.type.toLowerCase() === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Requests</h2>
          <p className="text-gray-600 mt-1">
            {filteredRequests.length} pending invitation{filteredRequests.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['all', 'student', 'teacher'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== 'all' && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {pendingRequests.filter(r => r.type.toLowerCase() === type).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'All invitations have been responded to'
              : `No pending ${filter} invitations`}
          </p>
        </div>
      ) : (
        /* Requests Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Header with Type Badge */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {request.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        request.type === 'Student' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {request.type === 'Student' ? <Book className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {request.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Email */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{request.email}</span>
                </div>

                {/* Student-specific fields */}
                {request.type === 'Student' && (
                  <>
                    {request.class && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Book className="w-4 h-4 text-gray-400" />
                        <span>Class: {request.class}</span>
                      </div>
                    )}
                    {request.division && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Division: {request.division}</span>
                      </div>
                    )}
                    {request.enrollmentNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Enrollment: {request.enrollmentNumber}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Teacher-specific fields */}
                {request.type === 'Teacher' && (
                  <>
                    {request.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Book className="w-4 h-4 text-gray-400" />
                        <span>Department: {request.department}</span>
                      </div>
                    )}
                    {request.specialization && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Specialization: {request.specialization}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Sent by & Date */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Sent by: {request.sentBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(request.sentAt)}</span>
                  </div>
                </div>

                {/* Expiry Warning */}
                <div className={`flex items-center gap-2 text-xs font-medium p-2 rounded-lg ${
                  getTimeRemaining(request.expiresAt).includes('Expired')
                    ? 'bg-red-50 text-red-700'
                    : getTimeRemaining(request.expiresAt).includes('today') || getTimeRemaining(request.expiresAt).includes('tomorrow')
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-green-50 text-green-700'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>{getTimeRemaining(request.expiresAt)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md">
                  Resend
                </button>
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequestsTab;
