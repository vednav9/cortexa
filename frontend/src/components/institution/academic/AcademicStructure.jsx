import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiLayers, FiBook, FiCalendar, FiClock, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { academicAPI } from '../../../services/api';

export default function AcademicStructure() {
  const { hasAccess, institution } = useOutletContext();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [stats, setStats] = useState({
    departments: 0,
    courses: 0,
    semesters: 0,
    faculty: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institution?._id) {
      fetchStats();
    } else {
      // If no institution, just stop loading
      setLoading(false);
    }
  }, [institution]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [departments, courses, semesters, faculty, events] = await Promise.all([
        academicAPI.getDepartments(institution._id).catch(() => ({ data: [] })),
        academicAPI.getCourses(institution._id).catch(() => ({ data: [] })),
        academicAPI.getSemesters(institution._id).catch(() => ({ data: [] })),
        academicAPI.getFaculty(institution._id).catch(() => ({ data: [] })),
        academicAPI.getCalendarEvents(institution._id, { upcoming: true }).catch(() => ({ data: [] })),
      ]);

      setStats({
        departments: departments.data.length,
        courses: courses.data.length,
        semesters: semesters.data.length,
        faculty: faculty.data.length,
        upcomingEvents: events.data.length,
      });
    } catch (error) {
      console.error('Error fetching academic stats:', error);
      // Set default stats on error
      setStats({
        departments: 0,
        courses: 0,
        semesters: 0,
        faculty: 0,
        upcomingEvents: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const academicSections = [
    {
      title: 'Departments',
      description: 'Manage academic departments and their structure',
      icon: FiLayers,
      color: 'blue',
      stat: stats.departments,
      path: 'departments',
    },
    {
      title: 'Courses',
      description: 'Manage courses, prerequisites, and enrollment',
      icon: FiBook,
      color: 'green',
      stat: stats.courses,
      path: 'courses',
    },
    {
      title: 'Semesters',
      description: 'Manage academic semesters and terms',
      icon: FiClock,
      color: 'purple',
      stat: stats.semesters,
      path: 'semesters',
    },
    {
      title: 'Academic Calendar',
      description: 'Manage events, exams, and deadlines',
      icon: FiCalendar,
      color: 'orange',
      stat: `${stats.upcomingEvents} upcoming`,
      path: 'calendar',
    },
    {
      title: 'Faculty',
      description: 'View faculty members and their assignments',
      icon: FiUsers,
      color: 'indigo',
      stat: stats.faculty,
      path: 'faculty',
    },
  ];

  const colorVariants = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <FiBookOpen className="text-4xl text-blue-600" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Academic Structure</h1>
            <p className="text-gray-600 mt-1">Manage your institution's academic organization</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academicSections.map((section, index) => (
              <motion.div
                key={section.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/${slug}/academic-structure/${section.path}`)}
                className={`${colorVariants[section.color]} rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <section.icon className="text-4xl mb-4" />
                <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <div className="text-3xl font-bold">{section.stat}</div>
              </motion.div>
            ))}
          </div>
        )}

        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6"
          >
            <p className="text-yellow-800">
              You have limited access to academic structure features. Contact an administrator for full access.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
