import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { FiUsers, FiMail, FiPhone, FiFilter, FiSearch } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI } from '../../../../services/api';
import GenericPage from '../../shared/GenericPage';

function Faculty() {
  const { institution } = useOutletContext();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const fetchData = useCallback(async () => {
    if (!institution?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [facultyRes, deptsRes] = await Promise.all([
        academicAPI.getFaculty(institution._id),
        academicAPI.getDepartments(institution._id),
      ]);

      // Support multiple backend payload shapes
      const facultyPayload = facultyRes?.data;
      const deptsPayload = deptsRes?.data;

      const facultyData = Array.isArray(facultyPayload?.faculty)
        ? facultyPayload.faculty
        : Array.isArray(facultyPayload?.data)
          ? facultyPayload.data
          : Array.isArray(facultyPayload)
            ? facultyPayload
            : [];

      const deptsData = Array.isArray(deptsPayload?.data)
        ? deptsPayload.data
        : Array.isArray(deptsPayload?.departments)
          ? deptsPayload.departments
          : Array.isArray(deptsPayload)
            ? deptsPayload
            : [];
      
      setFaculty(Array.isArray(facultyData) ? facultyData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFaculty([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [institution?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFaculty = Array.isArray(faculty) 
  ? faculty.filter(member => {
      const matchesSearch =
        member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        !filterDepartment || member.department?._id === filterDepartment;

      return matchesSearch && matchesDept;
    })
  : [];


  if (loading) {
    return (
      <GenericPage title="Faculty" icon={FiUsers}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage title="Faculty" icon={FiUsers} description="View faculty members and their assignments">
      {/* Header Actions */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <FiFilter className="text-gray-500" />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
          {filterDepartment && (
            <button
              onClick={() => setFilterDepartment('')}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((member, index) => (
          <Motion.div
            key={member._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-indigo-100/50"
          >
            <div className="flex flex-col items-center text-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
  {member.fullName?.charAt(0).toUpperCase() ||
    member.email?.charAt(0).toUpperCase()}
</div>

<h3 className="text-lg font-bold text-gray-800 mb-1">
  {member.fullName || 'N/A'}
</h3>
              
              
              
              {member.department && (
                <p className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-md">
                  {member.department.name}
                </p>
              )}

              {member.isHeadOfDepartment && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full shadow-md font-semibold">
                    ⭐ Head of Department
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                <FiMail className="text-indigo-600 w-4 h-4 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  <FiPhone className="text-indigo-600 w-4 h-4 flex-shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>

            {member.authorizedCourses && member.authorizedCourses.length > 0 && (
  <div className="pt-4 border-t border-gray-200">
    <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">
      Teaching Courses
    </p>

    <div className="flex flex-wrap gap-2">
      {member.authorizedCourses.slice(0, 3).map((course, idx) => (
        <span
          key={course._id || idx}
          className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium"
        >
          {course.code ? `${course.code} – ${course.name}` : course.name}
        </span>
      ))}

      {member.authorizedCourses.length > 3 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
          +{member.authorizedCourses.length - 3} more
        </span>
      )}
    </div>
  </div>
)}


          </Motion.div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUsers className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {searchQuery || filterDepartment ? 'No faculty members found' : 'No faculty members yet'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchQuery || filterDepartment
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Faculty members will appear here once they are added to the system.'}
          </p>
        </Motion.div>
      )}

      {/* Summary Stats */}
      {faculty.length > 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-indigo-50 via-red-50 to-pink-50 rounded-2xl p-6 border border-indigo-100"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-6">Faculty Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Faculty</p>
              <p className="text-2xl font-bold text-indigo-600">{faculty.length}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <FiFilter className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm mb-1">Departments</p>
              <p className="text-2xl font-bold text-red-600">{departments.length}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <span className="text-white text-xl font-bold">~</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Avg per Dept</p>
              <p className="text-2xl font-bold text-pink-600">
                {departments.length ? Math.round(faculty.length / departments.length) : 0}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <FiMail className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm mb-1">With Courses</p>
              <p className="text-2xl font-bold text-blue-600">
                {faculty.filter(f => f.authorizedCourses?.length > 0).length
                }
              </p>
            </div>
          </div>
        </Motion.div>
      )}
    </GenericPage>
  );
}

export default Faculty;
