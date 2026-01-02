import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI } from '../../../../services/api';
import GenericPage from '../../shared/GenericPage';

function Calendar() {
  const { hasAccess, institution } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'class',
    startDate: '',
    endDate: '',
    allDay: true,
    location: '',
    targetAudience: 'all',
  });

  const eventTypes = ['class', 'exam', 'holiday', 'event', 'deadline'];
  const audiences = ['all', 'students', 'faculty', 'staff'];
  const eventColors = {
    class: 'blue',
    exam: 'red',
    holiday: 'green',
    event: 'purple',
    deadline: 'orange',
  };

  useEffect(() => {
    if (institution?._id) fetchEvents();
  }, [institution]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await academicAPI.getCalendarEvents(institution._id);
      setEvents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await academicAPI.updateCalendarEvent(editingEvent._id, formData);
      } else {
        await academicAPI.createCalendarEvent(institution._id, formData);
      }
      fetchEvents();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await academicAPI.deleteCalendarEvent(id);
      fetchEvents();
    } catch (error) {
      alert('Failed to delete event');
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
        eventType: 'class',
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
        <div className="mb-6">
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
            <FiPlus /> Add Event
          </button>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => {
          const color = eventColors[event.eventType] || 'gray';
          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-${color}-500`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 text-xs rounded-full`}>
                      {event.eventType}
                    </span>
                    {event.targetAudience !== 'all' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {event.targetAudience}
                      </span>
                    )}
                  </div>
                  {event.description && <p className="text-gray-600 mb-3">{event.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div>📅 {new Date(event.startDate).toLocaleDateString()}</div>
                    {event.location && <div>📍 {event.location}</div>}
                  </div>
                </div>
                {hasAccess && (
                  <div className="flex gap-2">
                    <button onClick={() => openModal(event)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(event._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && <div className="text-center py-12 text-gray-500">No events scheduled yet.</div>}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
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

                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GenericPage>
  );
}

export default Calendar;
