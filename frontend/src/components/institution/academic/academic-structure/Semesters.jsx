import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
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
      setSemesters(response.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
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
        <div className="mb-6">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <FiPlus /> Add Semester
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map((sem, index) => (
          <motion.div
            key={sem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl shadow-sm p-6 ${sem.isActive ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{sem.name}</h3>
                <p className="text-sm text-purple-600">{sem.academicYear}</p>
                {sem.isActive && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <FiCheck /> Active
                  </span>
                )}
              </div>
              {hasAccess && (
                <div className="flex gap-2">
                  <button onClick={() => openModal(sem)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(sem._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <FiTrash2 />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Start: </span>
                {new Date(sem.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">End: </span>
                {new Date(sem.endDate).toLocaleDateString()}
              </div>
              <div className="pt-2 border-t">
                <span className="font-medium">{sem.courses?.length || 0} courses</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {semesters.length === 0 && (
        <div className="text-center py-12 text-gray-500">No semesters created yet.</div>
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
