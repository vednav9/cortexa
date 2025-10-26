import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiUserPlus, FiX, FiDownload, FiTrash2 } from 'react-icons/fi';

const AddUsersTab = () => {
  const [userType, setUserType] = useState('student');
  const [dragActive, setDragActive] = useState(false);
  const [users, setUsers] = useState([]);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    year: '',
    dept: '',
    division: '', // Fixed typo: "divison" -> "division"
    cortexaUsername: ''
  });

  // Drag handlers
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
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n');
      const parsedUsers = lines.slice(1).filter(line => line.trim()).map((line, i) => {
        // Fixed: Added year and division to CSV parsing
        const [fullName, email, mobile, year, dept, division, cortexaUsername] = line.split(',');
        return {
          id: Date.now() + i,
          srNo: users.length + i + 1,
          fullName: fullName?.trim() || '',
          email: email?.trim() || '',
          mobile: mobile?.trim() || '',
          year: year?.trim() || '',
          dept: dept?.trim() || '',
          division: division?.trim() || '', // Fixed typo
          cortexaUsername: cortexaUsername?.trim() || '',
          userType
        };
      });
      setUsers([...users, ...parsedUsers]);
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setUsers([...users, {
      id: Date.now(),
      srNo: users.length + 1,
      ...manualForm,
      userType
    }]);
    // Fixed: Reset form with correct field name
    setManualForm({ 
      fullName: '', 
      email: '', 
      mobile: '', 
      year: '', 
      dept: '', 
      division: '', // Fixed typo
      cortexaUsername: '' 
    });
  };

  const handleDeleteUser = (id) => setUsers(users.filter(u => u.id !== id));

  const downloadTemplate = () => {
    const csv = 'Full Name,Email,Mobile,Year,Department,Division,Cortexa Username\nJohn Doe,john@example.com,1234567890,BE,Computer Science,A,johndoe\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userType}_template.csv`;
    a.click();
  };

  const handleUpload = () => {
    console.log('Uploading:', users);
    alert(`${users.length} ${userType}s uploaded successfully!`);
  };

  const displayedUsers = users.filter(u => u.userType === userType);

  return (
    <div className="space-y-6">
      {/* User Type Toggle */}
      <div className="flex gap-3 p-1 bg-emerald-50 rounded-xl border border-emerald-200 max-w-md">
        <button
          onClick={() => setUserType('student')}
          className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
            userType === 'student'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-emerald-100'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setUserType('teacher')}
          className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
            userType === 'teacher'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-emerald-100'
          }`}
        >
          Teachers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Upload CSV File</h3>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white border border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50"
            >
              <FiDownload className="w-4 h-4" />
              <span>Template</span>
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-emerald-300 bg-white hover:border-emerald-400'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <FiUpload className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Drop CSV here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <strong>CSV Format:</strong> Full Name, Email, Mobile, Year, Department, Division, Cortexa Username
          </div>
        </div>

        {/* Manual Entry Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add Manually</h3>
          <form onSubmit={handleManualSubmit} className="bg-white border border-emerald-100 rounded-xl p-5 space-y-3">
            <input
              type="text"
              value={manualForm.fullName}
              onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
              required
              placeholder="Full Name"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
              required
              placeholder="Email"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="tel"
              value={manualForm.mobile}
              onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
              required
              placeholder="Mobile"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={manualForm.year}
              onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })}
              required
              placeholder="Year (e.g., FE, SE, TE, BE)"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={manualForm.dept}
              onChange={(e) => setManualForm({ ...manualForm, dept: e.target.value })}
              required
              placeholder="Department"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={manualForm.division}
              onChange={(e) => setManualForm({ ...manualForm, division: e.target.value })}
              required
              placeholder="Division (e.g., A, B, C)"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={manualForm.cortexaUsername}
              onChange={(e) => setManualForm({ ...manualForm, cortexaUsername: e.target.value })}
              required
              placeholder="Cortexa Username"
              className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <FiUserPlus className="w-5 h-5" />
              <span>Add {userType === 'student' ? 'Student' : 'Teacher'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      {displayedUsers.length > 0 && (
        <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">
              {userType === 'student' ? 'Students' : 'Teachers'} ({displayedUsers.length})
            </h3>
            <button
              onClick={handleUpload}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-lg hover:shadow-lg"
            >
              Upload All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Sr.</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Mobile</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Year</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Dept</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Division</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Username</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-emerald-100 hover:bg-emerald-50">
                    <td className="px-4 py-2.5 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-800 font-medium">{user.fullName}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.mobile}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.year}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.dept}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.division}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{user.cortexaUsername}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUsersTab;
