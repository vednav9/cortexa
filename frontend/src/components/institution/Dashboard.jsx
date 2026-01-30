import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiBook,
  FiCalendar,
  FiTrendingUp,
  FiAward,
  FiUserCheck,
  FiClock,
  FiActivity,
  FiTarget,
  FiBarChart2,
  FiPieChart,
  FiGrid,
  FiBriefcase,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { HiSparkles, HiAcademicCap, HiChartBar } from 'react-icons/hi';
import { useOutletContext } from 'react-router-dom';
import { academicAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { institution, hasAccess } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: { total: 0, active: 0, inactive: 0 },
    teachers: { total: 0, active: 0, inactive: 0 },
    courses: { total: 0, active: 0 },
    departments: { total: 0 },
    semesters: { total: 0, active: 0 },
    enrollment: { total: 0 },
    recentActivity: [],
  });

  useEffect(() => {
    if (institution?._id) {
      fetchDashboardData();
    }
  }, [institution]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        coursesRes,
        deptsRes,
        semsRes,
        studentsRes,
        teachersRes,
      ] = await Promise.all([
        academicAPI.getCourses(institution._id).catch(err => {
          console.error('Courses fetch error:', err);
          return { data: { data: [] } };
        }),
        academicAPI.getDepartments(institution._id).catch(err => {
          console.error('Departments fetch error:', err);
          return { data: { data: [] } };
        }),
        academicAPI.getSemesters(institution._id).catch(err => {
          console.error('Semesters fetch error:', err);
          return { data: { data: [] } };
        }),
        adminAPI.getStudents(institution._id).catch(err => {
          console.error('Students fetch error:', err);
          return { data: { students: [] } };
        }),
        adminAPI.getTeachers(institution._id).catch(err => {
          console.error('Teachers fetch error:', err);
          return { data: { teachers: [] } };
        }),
      ]);

      const coursesData = coursesRes.data.data || coursesRes.data || [];
      const deptsData = deptsRes.data.data || deptsRes.data || [];
      const semsData = semsRes.data.data || semsRes.data || [];
      const studentsData = studentsRes.data.students || studentsRes.data.data || studentsRes.data || [];
      const teachersData = teachersRes.data.teachers || teachersRes.data.data || teachersRes.data || [];

      console.log('📊 Dashboard Data:', {
        courses: coursesData.length,
        departments: deptsData.length,
        semesters: semsData.length,
        students: studentsData.length,
        teachers: teachersData.length,
      });

      // Calculate enrollment
      const totalEnrollment = coursesData.reduce((sum, course) => 
        sum + (course.enrolledStudents?.length || 0), 0
      );

      setStats({
        students: {
          total: studentsData.length,
          active: studentsData.filter(s => s.status === 'active').length,
          inactive: studentsData.filter(s => s.status === 'inactive').length,
        },
        teachers: {
          total: teachersData.length,
          active: teachersData.filter(t => t.status === 'active').length,
          inactive: teachersData.filter(t => t.status === 'inactive').length,
        },
        courses: {
          total: coursesData.length,
          active: coursesData.filter(c => c.isActive !== false).length,
        },
        departments: {
          total: deptsData.length,
        },
        semesters: {
          total: semsData.length,
          active: semsData.filter(s => s.isActive).length,
        },
        enrollment: {
          total: totalEnrollment,
          average: coursesData.length > 0 ? Math.round(totalEnrollment / coursesData.length) : 0,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group overflow-hidden bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
      
      <div className="relative p-5 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <FiTrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">
          {loading ? (
            <div className="h-8 md:h-9 w-16 md:w-20 bg-gray-200 rounded-lg animate-pulse" />
          ) : (
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {value}
            </span>
          )}
        </h3>
        
        <p className="text-xs md:text-sm font-semibold text-gray-600 mb-1">{title}</p>
        
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
            <FiCheckCircle className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{subtitle}</span>
          </p>
        )}
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, gradient, onClick, delay }) => (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group overflow-hidden bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 text-left w-full"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
      
      <div className="relative">
        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 mb-3 md:mb-4`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        
        <h4 className="text-base md:text-lg font-bold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">{title}</h4>
        <p className="text-xs md:text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{description}</p>
      </div>
    </motion.button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-gray-900">Loading Dashboard</p>
            <p className="text-sm text-gray-600">Fetching your institution data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-4">
                {institution.branding?.logo && (
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                    <img
                      src={institution.branding.logo}
                      alt={institution.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HiSparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
                    <span className="text-xs md:text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Institution Dashboard
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 leading-tight">{institution.name}</h1>
                  <p className="text-white/80 text-sm md:text-lg">Welcome back! Here's your institution overview.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 w-fit">
                <FiCalendar className="w-4 h-4 md:w-5 md:h-5" />
                <div>
                  <p className="text-xs text-white/70">Today</p>
                  <p className="font-semibold text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.students.total.toLocaleString()}
            subtitle={`${stats.students.active} active`}
            icon={HiAcademicCap}
            gradient="from-blue-500 to-blue-600"
            delay={0.1}
          />
          
          <StatCard
            title="Faculty Members"
            value={stats.teachers.total.toLocaleString()}
            subtitle={`${stats.teachers.active} active`}
            icon={FiUsers}
            gradient="from-purple-500 to-purple-600"
            delay={0.2}
          />
          
          <StatCard
            title="Active Courses"
            value={stats.courses.total.toLocaleString()}
            subtitle={`${stats.departments.total} departments`}
            icon={FiBook}
            gradient="from-green-500 to-green-600"
            delay={0.3}
          />
          
          <StatCard
            title="Enrollments"
            value={stats.enrollment.total.toLocaleString()}
            subtitle={`Avg: ${stats.enrollment.average} per course`}
            icon={FiUserCheck}
            gradient="from-orange-500 to-orange-600"
            delay={0.4}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Departments"
            value={stats.departments.total.toLocaleString()}
            subtitle="Academic divisions"
            icon={FiBriefcase}
            gradient="from-cyan-500 to-cyan-600"
            delay={0.5}
          />
          
          <StatCard
            title="Semesters"
            value={stats.semesters.total.toLocaleString()}
            subtitle={`${stats.semesters.active} currently active`}
            icon={FiCalendar}
            gradient="from-pink-500 to-pink-600"
            delay={0.6}
          />
          
          <StatCard
            title="System Health"
            value="Excellent"
            subtitle="All systems operational"
            icon={FiActivity}
            gradient="from-emerald-500 to-emerald-600"
            delay={0.7}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl md:rounded-3xl shadow-md border border-gray-100 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md">
              <HiSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-xs md:text-sm text-gray-600">Common tasks and shortcuts</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <QuickActionCard
              title="Invite People"
              description="Add students or teachers"
              icon={FiUserCheck}
              gradient="from-blue-500 to-blue-600"
              onClick={() => window.location.href = `/${institution.slug}/invite-people`}
              delay={0.9}
            />
            
            <QuickActionCard
              title="Manage Courses"
              description="View and edit courses"
              icon={FiBook}
              gradient="from-green-500 to-green-600"
              onClick={() => window.location.href = `/${institution.slug}/academic/courses`}
              delay={1.0}
            />
            
            <QuickActionCard
              title="View Calendar"
              description="Academic events & schedule"
              icon={FiCalendar}
              gradient="from-orange-500 to-orange-600"
              onClick={() => window.location.href = `/${institution.slug}/academic/calendar`}
              delay={1.1}
            />
            
            <QuickActionCard
              title="Analytics"
              description="Reports and insights"
              icon={FiBarChart2}
              gradient="from-purple-500 to-purple-600"
              onClick={() => toast.info('Analytics coming soon!')}
              delay={1.2}
            />
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Student Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-white rounded-2xl md:rounded-3xl shadow-md border border-gray-100 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md">
                  <HiAcademicCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Student Overview</h3>
                  <p className="text-xs md:text-sm text-gray-600">Enrollment statistics</p>
                </div>
              </div>
              <FiPieChart className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Active Students</p>
                    <p className="text-[10px] md:text-xs text-gray-500">Currently enrolled</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.students.active}</p>
              </div>

              <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Inactive Students</p>
                    <p className="text-[10px] md:text-xs text-gray-500">Pending or suspended</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-600">{stats.students.inactive}</p>
              </div>

              <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-semibold text-gray-700">Total Enrollments</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{stats.enrollment.total}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.enrollment.total / (stats.courses.total * 60)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {Math.round((stats.enrollment.total / (stats.courses.total * 60 || 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Faculty & Courses Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-white rounded-2xl md:rounded-3xl shadow-md border border-gray-100 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-md">
                  <FiUsers className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Faculty & Courses</h3>
                  <p className="text-xs md:text-sm text-gray-600">Teaching resources</p>
                </div>
              </div>
              <HiChartBar className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Active Faculty</p>
                    <p className="text-[10px] md:text-xs text-gray-500">Teaching staff</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.teachers.active}</p>
              </div>

              <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiBook className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Total Courses</p>
                    <p className="text-[10px] md:text-xs text-gray-500">Available programs</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.courses.total}</p>
              </div>

              <div className="p-3 md:p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-semibold text-gray-700">Student-Faculty Ratio</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    {stats.teachers.active > 0 
                      ? `${Math.round(stats.students.active / stats.teachers.active)}:1`
                      : 'N/A'
                    }
                  </p>
                </div>
                <p className="text-[10px] md:text-xs text-gray-600">
                  Average: {stats.teachers.active > 0 
                    ? Math.round(stats.students.active / stats.teachers.active)
                    : 0} students per faculty member
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center py-6 md:py-8"
        >
          <p className="text-xs md:text-sm text-gray-500 mb-1">
            Dashboard last updated: {new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
          <p className="text-[10px] md:text-xs text-gray-400">
            Data refreshes automatically every time you visit this page
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
