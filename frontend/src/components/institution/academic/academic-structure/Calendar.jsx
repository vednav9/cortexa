import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI } from '../../../../services/api';
import GenericPage from '../../shared/GenericPage';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/authcontext';

function Calendar() {
  const { institution } = useOutletContext();
  const { user } = useAuth();
  const hasAccess = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'event',
    startDate: '',
    endDate: '',
    allDay: true,
    location: '',
    targetAudience: 'all',
  });

  const eventTypes = ['event', 'exam', 'holiday', 'deadline', 'other'];
  const audiences = ['all', 'students', 'faculty', 'staff'];

  const fetchEvents = useCallback(async () => {
    if (!institution?._id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await academicAPI.getCalendarEvents(institution._id);

      // Backend currently returns { success, count, events: [...] }
      // Keep compatibility with old payloads too.
      const payload = response?.data;
      const eventsData = Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [institution?._id]);

  useEffect(() => {
    if (!institution?._id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    fetchEvents();
  }, [institution?._id, fetchEvents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting calendar event with data:', formData);
      
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        toast.error('Start date and end date are required');
        return;
      }
      
      if (editingEvent) {
        await academicAPI.updateCalendarEvent(editingEvent._id, formData);
        toast.success('Event updated successfully!');
      } else {
        await academicAPI.createCalendarEvent(institution._id, formData);
        toast.success('Event created successfully!');
      }
      await fetchEvents();
      closeModal();
    } catch (error) {
      console.error('Calendar event error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await academicAPI.deleteCalendarEvent(id);
      toast.success('Event deleted successfully!');
      await fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error('Failed to delete event');
    }
  };

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate?.split('T')[0] || event.startDate.split('T')[0],
        allDay: event.allDay,
        location: event.location || '',
        targetAudience: event.targetAudience,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        eventType: 'event',
        startDate: '',
        endDate: '',
        allDay: true,
        location: '',
        targetAudience: 'all',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <GenericPage title="Academic Calendar" icon={FiCalendar}>
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage title="Academic Calendar" icon={FiCalendar} description="Manage events, exams, and deadlines">
      {hasAccess && (
        <div className="mb-8">
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="w-5 h-5" /> Add Event
          </Motion.button>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event, index) => {
          const colorMap = {
            event: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
            exam: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-800' },
            holiday: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', badge: 'bg-green-100 text-green-800' },
            deadline: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
            other: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
          };
          const colors = colorMap[event.eventType] || colorMap.event;
          
          return (
            <Motion.div
              key={event._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border-l-4 ${colors.border}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    <span className={`px-3 py-1 ${colors.badge} text-xs rounded-full font-semibold uppercase`}>
                      {event.eventType}
                    </span>
                    {event.targetAudience !== 'all' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-semibold capitalize">
                        {event.targetAudience}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <FiCalendar className={`w-4 h-4 ${colors.text}`} />
                      <span className="font-medium text-gray-700">
                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span>📍</span>
                        <span className="font-medium text-gray-700">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {hasAccess && (
                  <div className="flex gap-2 ml-4">
                    <Motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openModal(event)}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Motion.button>
                    <Motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(event._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Motion.button>
                  </div>
                )}
              </div>
            </Motion.div>
          );
        })}
      </div>

      {events.length === 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCalendar className="w-12 h-12 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No events scheduled yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start organizing your academic calendar by adding events, exams, and important deadlines.
          </p>
          {hasAccess && (
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="w-5 h-5" /> Create First Event
            </Motion.button>
          )}
        </Motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <Motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingEvent ? 'Edit' : 'Add'} Event</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Type *</label>
                    <select
                      required
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Audience *</label>
                    <select
                      required
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {audiences.map(aud => (
                        <option key={aud} value={aud}>{aud}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </GenericPage>
  );
}

export default Calendar;
