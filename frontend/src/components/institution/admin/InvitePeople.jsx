import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUpload,
  FiUserPlus,
  FiDownload,
  FiTrash2,
  FiUsers,
  FiFile,
  FiEdit2,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../context/authcontext';
import { adminAPI } from '../../../services/api';

const InvitePeople = () => {
  const { user } = useAuth();
  const { institution, hasAccess } = useOutletContext();
  
  // Get institutionId from the institution object
  const institutionId = institution?._id;

  const [userType, setUserType] = useState('student');
  const [uploadMethod, setUploadMethod] = useState('csv');
  const [dragActive, setDragActive] = useState(false);
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    department: '',
    username: '',
    year: '',
    division: '',
    jobTitle: '',
    qualifications: '',
    specialization: ''
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        const newUsers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const user = {
            id: Date.now() + i,
            role: userType
          };

          headers.forEach((header, index) => {
            user[header] = values[index] || '';
          });

          newUsers.push(user);
        }

        setUsers(prev => [...prev, ...newUsers]);
        toast.success(`${newUsers.length} ${userType}(s) added to queue`);
      } catch (error) {
        toast.error('Error parsing CSV file');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    if (!manualForm.fullName || !manualForm.email || !manualForm.mobile || !manualForm.department || !manualForm.username) {
      toast.error('Please fill all required fields');
      return;
    }

    if (userType === 'student' && (!manualForm.year || !manualForm.division)) {
      toast.error('Please fill year and division for student');
      return;
    }

    if (userType === 'teacher' && (!manualForm.jobTitle || !manualForm.qualifications)) {
      toast.error('Please fill job title and qualifications for teacher');
      return;
    }

    const newUser = {
      id: Date.now(),
      role: userType,
      fullName: manualForm.fullName,
      email: manualForm.email,
      mobile: manualForm.mobile,
      department: manualForm.department,
      username: manualForm.username,
      ...(userType === 'student' && {
        year: manualForm.year,
        division: manualForm.division
      }),
      ...(userType === 'teacher' && {
        jobTitle: manualForm.jobTitle,
        qualifications: manualForm.qualifications,
        specialization: manualForm.specialization
      })
    };

    setUsers(prev => [...prev, newUser]);
    toast.success(`${userType} added to queue`);
    
    setManualForm({
      fullName: '',
      email: '',
      mobile: '',
      department: '',
      username: '',
      year: '',
      division: '',
      jobTitle: '',
      qualifications: '',
      specialization: ''
    });
  };

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success('User removed from queue');
  };

  const downloadTemplate = () => {
    let headers = 'fullName,email,mobile,department,username';
    
    if (userType === 'student') {
      headers += ',year,division';
    } else if (userType === 'teacher') {
      headers += ',jobTitle,qualifications,specialization';
    }

    const csvContent = headers + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleBulkUpload = async () => {
    if (users.length === 0) {
      toast.error('No users to upload');
      return;
    }

    if (!institutionId) {
      toast.error('Institution ID not found');
      console.error('Institution object:', institution);
      return;
    }

    console.log('Uploading users:', users);
    console.log('Institution ID:', institutionId);

    setUploading(true);
    try {
      const response = await adminAPI.bulkAddUsers(institutionId, { users });
      toast.success(`${response.data.successCount} users added successfully`);
      
      if (response.data.errors?.length > 0) {
        toast.error(`${response.data.errors.length} users failed to add`);
        console.error('Errors:', response.data.errors);
      }
      
      setUsers([]);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add users';
      toast.error(errorMessage);
      
      // Log specific error details
      if (error.response?.data?.errors) {
        console.error('Specific errors:', error.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to invite users.</p>
        </motion.div>
      </div>
    );
  }

  const displayedUsers = users.filter(u => u.role === userType);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header with Stats */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <HiSparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Invite People</h1>
                  <p className="text-emerald-100 text-sm mt-1">
                    Add students and teachers to {institution?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* User Type Toggle */}
            <div className="flex gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <button
                onClick={() => setUserType('student')}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  userType === 'student'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FiUsers className="w-4 h-4" />
                Students
              </button>
              <button
                onClick={() => setUserType('teacher')}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  userType === 'teacher'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FiUsers className="w-4 h-4" />
                Teachers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Method Selector - Bento Style */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setUploadMethod('csv')}
          className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all ${
            uploadMethod === 'csv'
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100'
              : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'
          }`}
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              uploadMethod === 'csv' ? 'bg-emerald-500' : 'bg-gray-100'
            }`}>
              <FiFile className={`w-7 h-7 ${uploadMethod === 'csv' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900">CSV Upload</h3>
              <p className="text-sm text-gray-600 mt-1">Bulk import multiple users at once</p>
            </div>
          </div>
          {uploadMethod === 'csv' && (
            <motion.div
              layoutId="activeMethod"
              className="absolute top-4 right-4"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setUploadMethod('manual')}
          className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all ${
            uploadMethod === 'manual'
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100'
              : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'
          }`}
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              uploadMethod === 'manual' ? 'bg-emerald-500' : 'bg-gray-100'
            }`}>
              <FiEdit2 className={`w-7 h-7 ${uploadMethod === 'manual' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900">Manual Entry</h3>
              <p className="text-sm text-gray-600 mt-1">Add individual users one at a time</p>
            </div>
          </div>
          {uploadMethod === 'manual' && (
            <motion.div
              layoutId="activeMethod"
              className="absolute top-4 right-4"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {uploadMethod === 'csv' ? (
          <motion.div
            key="csv"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden"
          >
            {/* Header with Action */}
            <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FiUpload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Upload CSV File</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Import multiple users in one go</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                >
                  <FiDownload className="w-4 h-4" />
                  Download Template
                </motion.button>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="p-8">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-emerald-400'
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <motion.div
                  animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                    <FiUpload className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {dragActive ? 'Drop it here!' : 'Drag & drop your file'}
                  </h4>
                  <p className="text-gray-600 mb-1">or click to browse</p>
                  <p className="text-sm text-gray-400">Supports CSV files up to 10MB</p>
                </motion.div>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FiAlertCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">CSV Format Guidelines</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><strong>Required columns:</strong> fullName, email, mobile, department, username</p>
                      {userType === 'student' && (
                        <p><strong>Additional for students:</strong> year, division</p>
                      )}
                      {userType === 'teacher' && (
                        <p><strong>Additional for teachers:</strong> jobTitle, qualifications, specialization</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FiUserPlus className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Individual User</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Fill in the form to add one user at a time</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.fullName}
                    onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={manualForm.mobile}
                    onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                    required
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.department}
                    onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                    required
                    placeholder="Computer Science"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.username}
                    onChange={(e) => setManualForm({ ...manualForm, username: e.target.value })}
                    required
                    placeholder="johndoe123"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>

                {userType === 'student' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualForm.year}
                        onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                      >
                        <option value="">Select Year</option>
                        <option value="1">First Year</option>
                        <option value="2">Second Year</option>
                        <option value="3">Third Year</option>
                        <option value="4">Fourth Year</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Division <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualForm.division}
                        onChange={(e) => setManualForm({ ...manualForm, division: e.target.value })}
                        required
                        placeholder="A, B, C"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                      />
                    </div>
                  </>
                )}

                {userType === 'teacher' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualForm.jobTitle}
                        onChange={(e) => setManualForm({ ...manualForm, jobTitle: e.target.value })}
                        required
                        placeholder="Professor"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Qualifications <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualForm.qualifications}
                        onChange={(e) => setManualForm({ ...manualForm, qualifications: e.target.value })}
                        required
                        placeholder="PhD in Computer Science"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={manualForm.specialization}
                        onChange={(e) => setManualForm({ ...manualForm, specialization: e.target.value })}
                        placeholder="Machine Learning"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                >
                  <FiUserPlus className="w-5 h-5" />
                  Add {userType === 'student' ? 'Student' : 'Teacher'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <AnimatePresence>
        {displayedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden"
          >
            {/* Table Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <FiCheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {displayedUsers.length} {userType === 'student' ? 'Student' : 'Teacher'}{displayedUsers.length !== 1 ? 's' : ''} Ready
                    </h3>
                    <p className="text-emerald-100 text-sm mt-0.5">Review and upload to database</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkUpload}
                  disabled={uploading || users.length === 0}
                  className="px-6 py-3.5 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-2xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-5 h-5" />
                      Upload All Users
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Department</th>
                    {userType === 'student' && (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Div</th>
                      </>
                    )}
                    {userType === 'teacher' && (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Job Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Qualifications</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all group"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.department}
                      </td>
                      {userType === 'student' && (
                        <>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                              {user.year}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700">
                              {user.division}
                            </span>
                          </td>
                        </>
                      )}
                      {userType === 'teacher' && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.jobTitle}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.qualifications}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600 font-semibold">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all group-hover:opacity-100 opacity-70"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitePeople;
