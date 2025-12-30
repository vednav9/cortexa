import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AnnouncementsTab({ institution }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all'
  });

  const handlePublish = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAnnouncements([
      {
        ...newAnnouncement,
        id: Date.now(),
        date: new Date().toISOString(),
        author: 'Admin'
      },
      ...announcements
    ]);

    setNewAnnouncement({ title: '', content: '', priority: 'normal', targetAudience: 'all' });
    setShowForm(false);
    toast.success('Announcement published successfully!');
  };

  const handleDelete = (id) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-600 mt-1">Communicate with students and teachers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Create Announcement Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Announcement</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Announcement title"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="Write your announcement here..."
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={newAnnouncement.targetAudience}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePublish}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <FiSend className="w-5 h-5" />
                <span>Publish</span>
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{announcement.title}</h4>
                    {announcement.priority === 'urgent' && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold">
                        URGENT
                      </span>
                    )}
                    {announcement.priority === 'high' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-semibold">
                        HIGH
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(announcement.date).toLocaleDateString()} • {announcement.author} • {announcement.targetAudience}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-700">{announcement.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSend className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">No announcements yet</p>
            <p className="text-gray-400 text-sm">Create your first announcement to communicate with your institution</p>
          </div>
        )}
      </div>
    </div>
  );
}
