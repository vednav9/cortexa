import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    if (institution?._id) {
      fetchData();
    }
  }, [institution]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facultyRes, deptsRes] = await Promise.all([
        academicAPI.getFaculty(institution._id),
        academicAPI.getDepartments(institution._id),
      ]);
      setFaculty(facultyRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !filterDepartment || member.department?._id === filterDepartment;
    return matchesSearch && matchesDept;
  });

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
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500" />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((member, index) => (
          <motion.div
            key={member._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{member.name || 'N/A'}</h3>
                
                {member.department && (
                  <p className="text-sm text-indigo-600 font-medium mb-2">
                    {member.department.name}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {member.courses && member.courses.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Teaching:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.courses.slice(0, 3).map((course, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                          {course.code || course.name}
                        </span>
                      ))}
                      {member.courses.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{member.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {member.isHeadOfDepartment && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      ⭐ Head of Department
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchQuery || filterDepartment ? 'No faculty members found matching your filters.' : 'No faculty members found.'}
        </div>
      )}

      {/* Summary Stats */}
      {faculty.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Faculty Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Faculty</p>
              <p className="text-2xl font-bold text-indigo-600">{faculty.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Departments</p>
              <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Average per Dept</p>
              <p className="text-2xl font-bold text-pink-600">
                {departments.length ? Math.round(faculty.length / departments.length) : 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">With Assignments</p>
              <p className="text-2xl font-bold text-blue-600">
                {faculty.filter(f => f.courses?.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </GenericPage>
  );
}

export default Faculty;
