import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiCalendar } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI } from '../../../../services/api';
import GenericPage from '../../shared/GenericPage';

function Semesters() {
  const { hasAccess, institution } = useOutletContext();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    isActive: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (institution?._id) {
      fetchSemesters();
    }
  }, [institution]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await academicAPI.getSemesters(institution._id);
      setSemesters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingSemester) {
        await academicAPI.updateSemester(editingSemester._id, formData);
      } else {
        await academicAPI.createSemester(institution._id, formData);
      }
      fetchSemesters();
      closeModal();
    } catch (error) {
      console.error('Error saving semester:', error);
      alert(error.response?.data?.message || 'Failed to save semester');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this semester?')) return;
    try {
      await academicAPI.deleteSemester(id);
      fetchSemesters();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete semester');
    }
  };

  const openModal = (semester = null) => {
    if (semester) {
      setEditingSemester(semester);
      setFormData({
        name: semester.name,
        academicYear: semester.academicYear,
        startDate: semester.startDate.split('T')[0],
        endDate: semester.endDate.split('T')[0],
        isActive: semester.isActive,
      });
    } else {
      setEditingSemester(null);
      setFormData({
        name: '',
        academicYear: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        isActive: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSemester(null);
  };

  if (loading) {
    return (
      <GenericPage title="Semesters" icon={FiClock}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage title="Semesters" icon={FiClock} description="Manage academic semesters and terms">
      {hasAccess && (
        <div className="mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="w-5 h-5" /> Add Semester
          </motion.button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map((sem, index) => (
          <motion.div
            key={sem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className={`bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border ${
              sem.isActive ? 'border-purple-400 ring-2 ring-purple-400 ring-offset-2' : 'border-purple-100/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <FiClock className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{sem.name}</h3>
                <p className="text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-md inline-block">
                  {sem.academicYear}
                </p>
                {sem.isActive && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full shadow-md">
                      <FiCheck className="w-3 h-3" /> Active Semester
                    </span>
                  </div>
                )}
              </div>
              {hasAccess && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal(sem)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(sem._id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(sem.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(sem.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 font-semibold mb-1">COURSES</p>
                <p className="text-lg font-bold text-gray-800">{sem.courses?.length || 0}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {semesters.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiClock className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No semesters yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by creating your first semester to organize your academic calendar.
          </p>
          {hasAccess && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="w-5 h-5" /> Create First Semester
            </motion.button>
          )}
        </motion.div>
      )}

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
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingSemester ? 'Edit' : 'Add'} Semester</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Fall 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label className="text-sm text-gray-700">Mark as active semester</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingSemester ? 'Update' : 'Create'}
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

export default Semesters;
