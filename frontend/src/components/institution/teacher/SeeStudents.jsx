import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import toast from "react-hot-toast";
import api from "../../../services/api";
import {
    FiUsers,
    FiSearch,
    FiFilter,
    FiMail,
    FiPhone,
    FiBook,
    FiUser,
    FiAlertCircle
} from "react-icons/fi";

export default function SeeStudents() {
    const { user } = useAuth();
    const { currentInstitution } = useOutletContext();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");

    useEffect(() => {
        if (currentInstitution?._id && user?.role === 'teacher') {
            fetchCourses();
        }
    }, [currentInstitution, user]);

    useEffect(() => {
        if (courses.length > 0) {
            fetchStudents();
        }
    }, [selectedCourse, selectedDepartment, courses]);

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            console.log('📚 Fetching authorized courses...');
            
            const response = await api.get('/teacher/authorized-courses');
            console.log('📚 Authorized courses response:', response.data);
            
            const coursesData = response.data.courses || [];
            setCourses(coursesData);
            
            if (coursesData.length === 0) {
                toast.error('No authorized courses found. Contact your admin.');
            }
        } catch (error) {
            console.error("❌ Fetch courses error:", error);
            toast.error(error.response?.data?.message || "Failed to load courses");
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            console.log('👥 Fetching students...');
            console.log('Selected Course:', selectedCourse);
            console.log('Selected Department:', selectedDepartment);
            
            const params = new URLSearchParams();
            if (selectedCourse) params.append('courseId', selectedCourse);
            if (selectedDepartment) params.append('departmentId', selectedDepartment);

            const response = await api.get(`/teacher/students?${params.toString()}`);
            console.log('👥 Students response:', response.data);
            
            setStudents(response.data.students || []);
        } catch (error) {
            console.error("❌ Fetch students error:", error);
            toast.error(error.response?.data?.message || "Failed to load students");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Extract unique departments from courses
    const departments = [...new Map(
        courses
            .filter(c => c.department)
            .map(c => [c.department._id, c.department])
    ).values()];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <FiUsers className="text-2xl text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                My Students
                            </h1>
                            <p className="text-gray-600 mt-1">
                                View students enrolled in your authorized courses
                            </p>
                        </div>
                    </div>

                    {/* Authorized Courses Info */}
                    {!loadingCourses && courses.length > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <FiBook className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">
                                        You have access to {courses.length} authorized course{courses.length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {courses.map(c => c.name).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Loading State for Courses */}
                {loadingCourses ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600">Loading your authorized courses...</p>
                        </div>
                    </div>
                ) : courses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl md:rounded-2xl shadow-md p-8 md:p-12 text-center"
                    >
                        <FiAlertCircle className="text-6xl text-red-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Authorized Courses
                        </h3>
                        <p className="text-gray-600 mb-4">
                            You don't have access to any courses yet. Please contact your institution admin to assign courses to you.
                        </p>
                        <button
                            onClick={fetchCourses}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Refresh Courses
                        </button>
                    </motion.div>
                ) : (
                    <>
                        {/* Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 mb-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or username..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Course Filter */}
                                <div>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">All Courses</option>
                                        {courses.map(course => (
                                            <option key={course._id} value={course._id}>
                                                {course.code} - {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department Filter */}
                                <div>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>

                        {/* Students Count */}
                        <div className="mb-4 text-gray-600">
                            <span className="font-semibold text-gray-900">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''} found
                        </div>

                        {/* Students Grid */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-600">Loading students...</p>
                                </div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-xl md:rounded-2xl shadow-md p-8 md:p-12 text-center"
                            >
                                <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Students Found
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm || selectedCourse || selectedDepartment
                                        ? "Try adjusting your filters"
                                        : "No students are enrolled in your authorized courses yet"}
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6"
                                    >
                                        {/* Student Avatar */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FiUser className="text-white text-xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {student.fullName}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    @{student.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Student Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FiMail className="flex-shrink-0" />
                                                <span className="truncate">{student.email}</span>
                                            </div>
                                            {student.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FiPhone className="flex-shrink-0" />
                                                    <span>{student.phone}</span>
                                                </div>
                                            )}
                                            {student.department && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FiBook className="flex-shrink-0" />
                                                    <span className="truncate">{student.department.name}</span>
                                                </div>
                                            )}
                                            {student.semester && (
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Semester:</span> {student.semester.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Enrolled Courses Count */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="text-sm text-gray-600">
                                                <span className="font-semibold text-purple-600">
                                                    {student.enrolledCourses?.length || 0}
                                                </span> courses enrolled
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
