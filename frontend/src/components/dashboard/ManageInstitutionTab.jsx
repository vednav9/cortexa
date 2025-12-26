import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiLoader,
  FiImage,
  FiGlobe,
  FiMapPin,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import { institutionAPI } from '../../services/api';
import { useAuth } from '../../context/authcontext';
import toast from 'react-hot-toast';

export default function ManageInstitutionTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [institutionData, setInstitutionData] = useState({
    name: '',
    slug: '',
    code: '',
    type: 'university',
    description: '',
    established: new Date().getFullYear(),
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    contact: {
      email: '',
      phone: '',
      website: ''
    },
    branding: {
      logo: '',
      primaryColor: '#10b981',
      secondaryColor: '#FFFFFF',
      accentColor: '#059669'
    },
    departments: [],
    stats: {
      totalStudents: 0,
      totalTeachers: 0,
      totalCourses: 0,
      totalAdmins: 1
    }
  });

  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    head: ''
  });

  useEffect(() => {
    if (user?.institution) {
      setInstitutionData(prev => ({
        ...prev,
        ...user.institution
      }));
    }
  }, [user]);

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    
    if (section) {
      setInstitutionData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setInstitutionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddDepartment = () => {
    if (!newDept.name || !newDept.code) {
      toast.error('Department name and code are required');
      return;
    }

    setInstitutionData(prev => ({
      ...prev,
      departments: [...prev.departments, { ...newDept, _id: Date.now().toString() }]
    }));

    setNewDept({ name: '', code: '', head: '' });
    toast.success('Department added');
  };

  const handleRemoveDepartment = (deptId) => {
    setInstitutionData(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d._id !== deptId && d.id !== deptId)
    }));
    toast.success('Department removed');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await institutionAPI.update(institutionData);
      
      if (response.data.success) {
        toast.success('Institution updated successfully!');
      }
    } catch (error) {
      console.error('Error updating institution:', error);
      toast.error(error.response?.data?.message || 'Failed to update institution');
    } finally {
      setSaving(false);
    }
  };

  // Check if user has permission
  const canEdit = user?.isSuperAdmin || user?.permissions?.canEditInstitution;

  if (!canEdit) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">You don't have permission to manage institution details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Institution</h2>
          <p className="text-gray-600 mt-1">Update your institution's information and settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
            <input
              type="text"
              name="name"
              value={institutionData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
            <input
              type="text"
              name="code"
              value={institutionData.code}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={institutionData.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="university">University</option>
              <option value="college">College</option>
              <option value="school">School</option>
              <option value="institute">Institute</option>
              <option value="academy">Academy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
            <input
              type="number"
              name="established"
              value={institutionData.established}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={institutionData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <FiPhone className="w-5 h-5" />
          <span>Contact Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMail className="inline w-4 h-4 mr-1" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={institutionData.contact.email}
              onChange={(e) => handleChange(e, 'contact')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiPhone className="inline w-4 h-4 mr-1" /> Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={institutionData.contact.phone}
              onChange={(e) => handleChange(e, 'contact')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiGlobe className="inline w-4 h-4 mr-1" /> Website
            </label>
            <input
              type="url"
              name="website"
              value={institutionData.contact.website}
              onChange={(e) => handleChange(e, 'contact')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <FiMapPin className="w-5 h-5" />
          <span>Address</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <input
              type="text"
              name="street"
              value={institutionData.address.street}
              onChange={(e) => handleChange(e, 'address')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={institutionData.address.city}
              onChange={(e) => handleChange(e, 'address')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              name="state"
              value={institutionData.address.state}
              onChange={(e) => handleChange(e, 'address')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={institutionData.address.country}
              onChange={(e) => handleChange(e, 'address')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={institutionData.address.zipCode}
              onChange={(e) => handleChange(e, 'address')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <FiImage className="w-5 h-5" />
          <span>Branding</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="primaryColor"
                value={institutionData.branding.primaryColor}
                onChange={(e) => handleChange(e, 'branding')}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={institutionData.branding.primaryColor}
                onChange={(e) => handleChange(e, 'branding')}
                name="primaryColor"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="secondaryColor"
                value={institutionData.branding.secondaryColor}
                onChange={(e) => handleChange(e, 'branding')}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={institutionData.branding.secondaryColor}
                onChange={(e) => handleChange(e, 'branding')}
                name="secondaryColor"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                name="accentColor"
                value={institutionData.branding.accentColor}
                onChange={(e) => handleChange(e, 'branding')}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={institutionData.branding.accentColor}
                onChange={(e) => handleChange(e, 'branding')}
                name="accentColor"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
          <input
            type="url"
            name="logo"
            value={institutionData.branding.logo}
            onChange={(e) => handleChange(e, 'branding')}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {institutionData.branding.logo && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
              <img 
                src={institutionData.branding.logo} 
                alt="Logo" 
                className="h-16 w-16 object-contain border border-gray-200 rounded-lg p-2"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Departments */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Departments</h3>
        
        {/* Add New Department */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="Department Name"
            value={newDept.name}
            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Code (e.g., CS)"
            value={newDept.code}
            onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Department Head"
            value={newDept.head}
            onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleAddDepartment}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>

        {/* Department List */}
        <div className="space-y-2">
          {institutionData.departments && institutionData.departments.length > 0 ? (
            institutionData.departments.map((dept) => (
              <div
                key={dept._id || dept.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                      {dept.code}
                    </span>
                    <span className="font-medium text-gray-800">{dept.name}</span>
                  </div>
                  {dept.head && (
                    <p className="text-sm text-gray-600 mt-1 ml-1">Head: {dept.head}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveDepartment(dept._id || dept.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No departments added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
