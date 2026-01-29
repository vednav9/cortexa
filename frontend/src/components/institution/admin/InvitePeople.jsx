import React, { useState, useEffect } from 'react';
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
import { invitationAPI, adminInvitationAPI, academicAPI } from '../../../services/api';

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
    emailOrUsername: '', // Changed from email
    message: '',
  });

  // Academic data states
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loadingAcademic, setLoadingAcademic] = useState(false);

  // ===============================
  // INVITATION STATUS MODAL (ADMIN)
  // ===============================
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('all');
  const [adminInvites, setAdminInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [filterRole, setFilterRole] = useState('all'); // all | Student | Teacher

  // Fetch academic data on mount
  useEffect(() => {
    if (institution?._id) {
      fetchAcademicData();
    }
  }, [institution]);

  // Filter courses when department or semester changes
  useEffect(() => {
    if (selectedDepartment && selectedSemester) {
      const filtered = courses.filter(
        course =>
          course.department?._id === selectedDepartment &&
          course.semesterAvailable?._id === selectedSemester
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [selectedDepartment, selectedSemester, courses]);

  const fetchAcademicData = async () => {
    try {
      setLoadingAcademic(true);
      const [deptsRes, semsRes, coursesRes] = await Promise.all([
        academicAPI.getDepartments(institution._id),
        academicAPI.getSemesters(institution._id),
        academicAPI.getCourses(institution._id),
      ]);

      const deptsData = deptsRes.data.data || deptsRes.data || [];
      const semsData = semsRes.data.data || semsRes.data || [];
      const coursesData = coursesRes.data.data || coursesRes.data || [];

      setDepartments(Array.isArray(deptsData) ? deptsData : []);
      setSemesters(Array.isArray(semsData) ? semsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error fetching academic data:', error);
      toast.error('Failed to load academic data');
    } finally {
      setLoadingAcademic(false);
    }
  };

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

        // Updated: Remove fullName, use emailOrUsername
        const allowedHeaders = ['emailOrUsername', 'message'];

        const isValid = headers.every(h => allowedHeaders.includes(h));
        if (!isValid) {
          toast.error('Invalid CSV format. Use: emailOrUsername,message');
          return;
        }

        const newUsers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const user = {
            id: Date.now() + i,
            emailOrUsername: '',
            message: '',
          };

          headers.forEach((header, index) => {
            user[header] = values[index] || '';
          });

          if (user.emailOrUsername) {
            newUsers.push(user);
          }
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

  const fetchAdminInvitations = async (status = 'all', role = 'all') => {
    try {
      setLoadingInvites(true);
      const params = {};
      if (status !== 'all') params.status = status;
      if (role !== 'all') params.recipientType = role;

      const res = await adminInvitationAPI.getAll(params);

      setAdminInvites(res.data.invitations || []);
    } catch (err) {
      toast.error('Failed to fetch invitations');
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualForm.emailOrUsername) {
      toast.error('Email or username is required');
      return;
    }

    if (!selectedDepartment || !selectedSemester) {
      toast.error('Department and semester are required');
      return;
    }

    if (userType === 'teacher' && selectedCourses.length === 0) {
      toast.error('At least one course is required for teachers');
      return;
    }

    if (!institutionId) {
      toast.error('Institution not found');
      return;
    }

    try {
      const payload = {
        institutionId,
        recipientType: userType === 'student' ? 'Student' : 'Teacher',
        emailOrUsername: manualForm.emailOrUsername, // Changed from email
        message: manualForm.message || 'You are invited to join the institution',
        department: selectedDepartment,
        semester: selectedSemester,
        courses: userType === 'teacher' ? selectedCourses : undefined,
      };

      await invitationAPI.create(payload);

      toast.success('Invitation sent successfully');

      setManualForm({
        emailOrUsername: '',
        message: '',
      });
      setSelectedDepartment('');
      setSelectedSemester('');
      setSelectedCourses([]);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Failed to send invitation'
      );
    }
  };

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success('User removed from queue');
  };

  const downloadTemplate = () => {
    // Updated CSV template
    const headers = 'emailOrUsername,message\n';
    const example = 'john@example.com,Welcome to our institution!\njohn_doe,Join our learning platform!\n';
    const blob = new Blob([headers + example], { type: 'text/csv' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invite_template.csv';
    a.click();

    window.URL.revokeObjectURL(url);
    toast.success('CSV template downloaded');
  };

  const handleBulkUpload = async () => {
    if (users.length === 0) {
      toast.error('No users to upload');
      return;
    }

    if (!selectedDepartment || !selectedSemester) {
      toast.error('Department and semester are required for bulk upload');
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
      const payload = {
        institutionId,
        recipientType: 'Student', // Only students can be bulk uploaded
        users: users.map(u => ({
          emailOrUsername: u.emailOrUsername, // Changed from email and fullName
          message: u.message || 'You are invited to join the institution',
        })),
        department: selectedDepartment,
        semester: selectedSemester,
      };

      const response = await invitationAPI.bulkInviteUsers(payload);

      toast.success(`${response.data.successCount} users added successfully`);

      if (response.data.errors?.length > 0) {
        toast.error(`${response.data.errors.length} users failed to add`);
        console.error('Errors:', response.data.errors);
      }

      setUsers([]);
      setSelectedDepartment('');
      setSelectedSemester('');
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

  const displayedUsers = users;

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
            {uploadMethod === 'manual' && (
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
            )}
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
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                uploadMethod === 'csv' ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            >
              <FiFile className={`w-7 h-7 ${uploadMethod === 'csv' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900">CSV Upload</h3>
              <p className="text-sm text-gray-600 mt-1">Bulk import multiple users at once</p>
            </div>
          </div>
          {uploadMethod === 'csv' && (
            <motion.div layoutId="activeMethod" className="absolute top-4 right-4">
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
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                uploadMethod === 'manual' ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            >
              <FiEdit2 className={`w-7 h-7 ${uploadMethod === 'manual' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900">Manual Entry</h3>
              <p className="text-sm text-gray-600 mt-1">Add individual users one at a time</p>
            </div>
          </div>
          {uploadMethod === 'manual' && (
            <motion.div layoutId="activeMethod" className="absolute top-4 right-4">
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
            <div className="p-8 space-y-6">
              {/* Department and Semester Selection for CSV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name} ({sem.academicYear})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">CSV Bulk Upload - Students Only</p>
                      <p className="text-xs text-blue-700 mt-1">
                        All students will be automatically enrolled in courses matching the selected department and semester.
                        {filteredCourses.length > 0 && ` (${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} will be assigned)`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                      <p><strong>Required columns:</strong> emailOrUsername</p>
                      <p><strong>Optional:</strong> message</p>
                      <p className="text-xs text-blue-700 mt-1">
                        <strong>Note:</strong> You can use either email addresses (john@example.com) or usernames (john_doe) in the emailOrUsername column.
                      </p>
                      <p className="text-xs text-blue-700">
                        CSV bulk upload is only available for students. Teachers must be added manually with course selection.
                      </p>
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
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email or Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.emailOrUsername}
                    onChange={(e) => setManualForm({ ...manualForm, emailOrUsername: e.target.value })}
                    required
                    placeholder="john@example.com or john_doe"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500">
                    Enter either an email address or a username
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name} ({sem.academicYear})</option>
                    ))}
                  </select>
                </div>

                {userType === 'teacher' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Authorized Courses <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto hover:border-gray-300 transition-all">
                      {filteredCourses.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {selectedDepartment && selectedSemester
                            ? 'No courses available for selected department and semester'
                            : 'Select department and semester first'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredCourses.map(course => (
                            <label key={course._id} className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCourses.includes(course._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCourses([...selectedCourses, course._id]);
                                  } else {
                                    setSelectedCourses(selectedCourses.filter(id => id !== course._id));
                                  }
                                }}
                                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{course.name}</p>
                                <p className="text-xs text-gray-500">{course.code}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Teacher will only have full access to selected courses for notes upload, MCQ generation, voice-to-text, and Q&A portal.
                    </p>
                  </div>
                )}

                {userType === 'student' && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Auto Course Enrollment</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Student will be automatically enrolled in all courses matching the selected department and semester.
                          {filteredCourses.length > 0 && ` (${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} available)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Message
                  </label>
                  <textarea
                    value={manualForm.message}
                    onChange={(e) => setManualForm({ ...manualForm, message: e.target.value })}
                    rows="3"
                    placeholder="You are invited to join the institution"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
                >
                  <FiUserPlus className="w-5 h-5" />
                  Add {userType === 'student' ? 'Student' : 'Teacher'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(true);
                    fetchAdminInvitations(inviteStatus, filterRole);
                  }}
                  className="bg-white text-emerald-600 px-5 py-2 rounded-xl font-bold shadow border border-emerald-200 hover:shadow-md flex items-center gap-2"
                >
                  Check Status
                </button>
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Email/Username</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Message</th>
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
                        {user.emailOrUsername}
                      </td>

                      <td className="px-6 py-4 text-sm italic text-gray-500">
                        {user.message || '—'}
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

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatusModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Invitation Status</h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                {['all', 'pending', 'accepted', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setInviteStatus(status);
                      fetchAdminInvitations(status, filterRole);
                    }}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      inviteStatus === status
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Role Filter */}
              <div className="flex gap-3 mb-6">
                {['all', 'Student', 'Teacher'].map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setFilterRole(role);
                      fetchAdminInvitations(inviteStatus, role);
                    }}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                      filterRole === role
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role === 'all' ? 'ALL ROLES' : role}
                  </button>
                ))}
              </div>

              {/* Content */}
              {loadingInvites ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading invitations...</p>
                </div>
              ) : adminInvites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiAlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">No invitations found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
                        <th className="text-left py-4 px-4 font-bold text-emerald-700">Email/Username</th>
                        <th className="text-center py-4 px-4 font-bold text-emerald-700">Status</th>
                        <th className="text-center py-4 px-4 font-bold text-emerald-700">Role</th>
                        <th className="text-center py-4 px-4 font-bold text-emerald-700">Sent On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {adminInvites.map(inv => (
                        <tr key={inv._id} className="hover:bg-emerald-50/30 transition-all">
                          <td className="py-4 px-4 font-medium text-gray-900">{inv.email}</td>
                          <td className="text-center py-4 px-4">
                            <span
                              className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                                inv.status === 'accepted'
                                  ? 'bg-green-100 text-green-700'
                                  : inv.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : inv.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4 font-medium text-gray-700">
                            {inv.recipientType}
                          </td>
                          <td className="text-center py-4 px-4 text-gray-600">
                            {new Date(inv.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitePeople;
