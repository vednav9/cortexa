import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AcademicStructureTab({ institution }) {
  const [departments, setDepartments] = useState(institution?.departments || []);
  const [newDept, setNewDept] = useState({ name: '', code: '', head: '' });

  const handleAddDepartment = () => {
    if (!newDept.name || !newDept.code) {
      toast.error('Department name and code are required');
      return;
    }

    setDepartments([...departments, { ...newDept, _id: Date.now().toString() }]);
    setNewDept({ name: '', code: '', head: '' });
    toast.success('Department added successfully!');
  };

  const handleRemoveDepartment = (id) => {
    setDepartments(departments.filter(d => d._id !== id && d.id !== id));
    toast.success('Department removed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Academic Structure</h2>
        <p className="text-gray-600 mt-1">Manage departments, classes, and divisions</p>
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
            onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
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
          {departments.length > 0 ? (
            departments.map((dept) => (
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

      {/* Classes & Years */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Classes</h3>
          <p className="text-gray-500 text-center py-8">Coming Soon</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Divisions</h3>
          <p className="text-gray-500 text-center py-8">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}
