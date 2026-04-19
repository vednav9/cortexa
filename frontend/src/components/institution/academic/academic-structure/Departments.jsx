import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayers, FiPlus, FiEdit2, FiTrash2, FiUsers, FiX, FiSearch } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI } from '../../../../services/api';
import GenericPage from '../../shared/GenericPage';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/authcontext';

function Departments() {
  const { institution } = useOutletContext();
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (institution?._id) {
      fetchDepartments();
    }
  }, [institution]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await academicAPI.getDepartments(institution._id);
      // Backend returns { success, count, data: [...] }
      const departmentsData = response.data.data || response.data || [];
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingDepartment) {
        await academicAPI.updateDepartment(editingDepartment._id, formData);
        toast.success('Department updated successfully!');
      } else {
        await academicAPI.createDepartment(institution._id, formData);
        toast.success('Department created successfully!');
      }
      await fetchDepartments();
      closeModal();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will affect related courses.')) return;
    try {
      await academicAPI.deleteDepartment(id);
      toast.success('Department deleted successfully!');
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const openModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', code: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', code: '', description: '' });
  };

  // Ensure departments is always an array before filtering
  const filteredDepartments = Array.isArray(departments) 
    ? departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <GenericPage title="Departments" icon={FiLayers}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage
      title="Departments"
      icon={FiLayers}
      description="Manage academic departments and their structure"
    >
      {/* Header Actions */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        {canManage && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="w-5 h-5" /> Add Department
          </motion.button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept, index) => (
          <motion.div
            key={dept._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-orange-100/50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiLayers className="text-white text-2xl" />
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal(dept)}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(dept._id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.name}</h3>
            <p className="text-sm text-orange-600 font-semibold mb-3 bg-orange-50 px-2 py-1 rounded-md inline-block">{dept.code}</p>
            {dept.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dept.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium">{dept.facultyCount ?? 0} Faculty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">{dept.studentCount ?? 0} Students</span>
              </div>
            </div>

            {dept.headOfDepartment && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 font-semibold mb-1">HEAD OF DEPARTMENT</p>
                <p className="text-sm font-bold text-gray-800">
                  {dept.headOfDepartment.name || dept.headOfDepartment.email}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiLayers className="w-12 h-12 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchQuery ? 'No departments found' : 'No departments yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search to find what you\'re looking for.'
              : 'Get started by creating your first department to organize your institution.'}
          </p>
          {!searchQuery && canManage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="w-5 h-5" /> Create First Department
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Add/Edit Modal */}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingDepartment ? 'Edit Department' : 'Add Department'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., CS"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the department..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingDepartment ? 'Update' : 'Create'}
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

export default Departments;
