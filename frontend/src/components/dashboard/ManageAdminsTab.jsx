import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiShield, FiCheck, FiX, FiMail, FiPhone, FiUser, FiLock } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/authcontext';

export default function ManageAdminsTab() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    password: '',
    jobTitle: '',
    phone: '',
    permissions: {
      canAddAdmins: false,
      canManageStudents: true,
      canManageTeachers: true,
      canManageCourses: true,
      canViewReports: true,
      canEditInstitution: false
    }
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getAllAdmins();
      setAdmins(response.data.admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addAdmin(newAdmin);
      toast.success('Admin added successfully');
      setShowAddModal(false);
      setNewAdmin({
        fullName: '',
        email: '',
        password: '',
        jobTitle: '',
        phone: '',
        permissions: {
          canAddAdmins: false,
          canManageStudents: true,
          canManageTeachers: true,
          canManageCourses: true,
          canViewReports: true,
          canEditInstitution: false
        }
      });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add admin');
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await adminAPI.updateAdminPermissions(selectedAdmin.id, selectedAdmin.permissions);
      toast.success('Permissions updated successfully');
      setShowPermissionsModal(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    
    try {
      await adminAPI.removeAdmin(adminId);
      toast.success('Admin removed successfully');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove admin');
    }
  };

  const canManageAdmins = user?.isSuperAdmin || user?.permissions?.canAddAdmins;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiShield className="w-8 h-8 text-blue-600" />
            Manage Admins
          </h2>
          <p className="text-gray-600 mt-1">Add and manage institution administrators</p>
        </div>
        {canManageAdmins && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
            Add Admin
          </button>
        )}
      </div>

      {/* Admins List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <motion.div
            key={admin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            {/* Admin Badge */}
            {admin.isSuperAdmin && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full mb-3">
                <FiShield className="w-3 h-3" />
                Super Admin
              </div>
            )}

            {/* Admin Info */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                {admin.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{admin.fullName}</h3>
                <p className="text-sm text-gray-600">{admin.jobTitle}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="w-4 h-4" />
                <span className="truncate">{admin.email}</span>
              </div>
              {admin.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiPhone className="w-4 h-4" />
                  <span>{admin.phone}</span>
                </div>
              )}
            </div>

            {/* Permissions Summary */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {admin.permissions?.canManageStudents && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Students</span>
                )}
                {admin.permissions?.canManageTeachers && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Teachers</span>
                )}
                {admin.permissions?.canManageCourses && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Courses</span>
                )}
                {admin.permissions?.canAddAdmins && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Add Admins</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {canManageAdmins && !admin.isSuperAdmin && (
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setShowPermissionsModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}

            {/* Added By */}
            {admin.addedBy && (
              <p className="text-xs text-gray-400 mt-3">
                Added by {admin.addedBy.fullName}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Admin</h3>
                
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={newAdmin.fullName}
                        onChange={(e) => setNewAdmin({...newAdmin, fullName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  {/* Job Title & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={newAdmin.jobTitle}
                        onChange={(e) => setNewAdmin({...newAdmin, jobTitle: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={newAdmin.phone}
                          onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                    <div className="space-y-2">
                      {Object.keys(newAdmin.permissions).map((key) => (
                        <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={newAdmin.permissions[key]}
                            onChange={(e) => setNewAdmin({
                              ...newAdmin,
                              permissions: {...newAdmin.permissions, [key]: e.target.checked}
                            })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Add Admin
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Edit Permissions: {selectedAdmin.fullName}
                </h3>
                
                <div className="space-y-2 mb-6">
                  {Object.keys(selectedAdmin.permissions).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedAdmin.permissions[key]}
                        onChange={(e) => setSelectedAdmin({
                          ...selectedAdmin,
                          permissions: {...selectedAdmin.permissions, [key]: e.target.checked}
                        })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePermissions}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
