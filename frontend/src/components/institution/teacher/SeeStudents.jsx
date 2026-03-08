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

const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
        ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
        : '16, 185, 129';
};

export default function SeeStudents() {
    const { user } = useAuth();
    const outletContext = useOutletContext();
    const activeInstitution = outletContext?.currentInstitution || outletContext?.institution;
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");

    const brandColor = activeInstitution?.branding?.primaryColor || '#10b981';
    const rgb = hexToRgb(brandColor);

    useEffect(() => {
        if (user?.role === 'teacher') {
            fetchCourses();
        }
    }, [user]);

    useEffect(() => {
        if (courses.length > 0) {
            fetchStudents();
        }
    }, [selectedCourse, selectedDepartment, courses]);

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await api.get('/teacher/authorized-courses');
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
            const params = new URLSearchParams();
            if (selectedCourse) params.append('courseId', selectedCourse);
            if (selectedDepartment) params.append('departmentId', selectedDepartment);

            const response = await api.get(`/teacher/students?${params.toString()}`);
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
        <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: `rgba(${rgb},0.02)` }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div
                            className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }}
                        >
                            <FiUsers className="text-2xl" style={{ color: brandColor }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                My Students
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                View students enrolled in your authorized courses
                            </p>
                        </div>
                    </div>

                    {/* Authorized Courses Info */}
                    {!loadingCourses && courses.length > 0 && (
                        <div
                            className="mt-6 rounded-2xl p-5 border shadow-sm"
                            style={{ backgroundColor: `rgba(${rgb},0.03)`, borderColor: `rgba(${rgb},0.15)` }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${rgb},0.15)` }}>
                                    <FiBook className="w-3.5 h-3.5" style={{ color: brandColor }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        You have access to {courses.length} authorized course{courses.length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[13px] text-gray-600 mt-1 font-medium leading-relaxed">
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
                            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `rgba(${rgb}, 0.2)`, borderTopColor: brandColor }}></div>
                            <p className="text-gray-500 font-medium tracking-wide">Loading authorized courses...</p>
                        </div>
                    </div>
                ) : courses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-10 md:p-16 text-center max-w-2xl mx-auto mt-10"
                    >
                        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                            <FiAlertCircle className="text-4xl text-red-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">
                            No Authorized Courses
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            You don't have access to any courses yet. Please contact your institution admin to assign courses to you.
                        </p>
                        <button
                            onClick={fetchCourses}
                            className="px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                            style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px 0 rgba(${rgb}, 0.39)` }}
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
                            className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 mb-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or username..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[13px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
                                    />
                                </div>

                                {/* Course Filter */}
                                <div>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[13px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
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
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-medium text-[13px] transition-all"
                                        style={{ '--tw-ring-color': brandColor, '--tw-ring-opacity': '0.5' }}
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
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
                                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                            </h2>
                        </div>

                        {/* Students Grid */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `rgba(${rgb}, 0.2)`, borderTopColor: brandColor }}></div>
                                    <p className="text-gray-500 font-medium">Loading students...</p>
                                </div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-12 text-center"
                            >
                                <div className="w-20 h-20 rounded-full mb-6 mx-auto flex items-center justify-center border-dashed border-2" style={{ borderColor: `rgba(${rgb},0.2)`, backgroundColor: `rgba(${rgb},0.02)` }}>
                                    <FiUsers className="text-2xl" style={{ color: brandColor }} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">
                                    No Students Found
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto">
                                    {searchTerm || selectedCourse || selectedDepartment
                                        ? "Try adjusting your filters"
                                        : "No students are enrolled in your authorized courses yet"}
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 p-6 group cursor-pointer hover:border-transparent"
                                        style={{
                                            hover: {
                                                boxShadow: `0 10px 40px -10px rgba(${rgb},0.15)`,
                                                borderColor: brandColor
                                            }
                                        }}
                                    >
                                        {/* Student Avatar */}
                                        <div className="flex items-start gap-4 mb-5">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.2)` }}
                                            >
                                                <FiUser className="text-[18px]" style={{ color: brandColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[var(--brandColor)]" style={{ '--brandColor': brandColor }}>
                                                    {student.fullName}
                                                </h3>
                                                <p className="text-[12px] font-bold text-gray-400 mt-0.5 truncate uppercase tracking-wider">
                                                    @{student.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Student Info */}
                                        <div className="space-y-3 p-4 rounded-xl bg-gray-50/50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-50">
                                            <div className="flex items-center gap-3 text-[13px] text-gray-600 font-medium">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.05)` }}>
                                                    <FiMail className="w-3 h-3" style={{ color: brandColor }} />
                                                </div>
                                                <span className="truncate">{student.email}</span>
                                            </div>
                                            {student.phone && (
                                                <div className="flex items-center gap-3 text-[13px] text-gray-600 font-medium">
                                                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.05)` }}>
                                                        <FiPhone className="w-3 h-3" style={{ color: brandColor }} />
                                                    </div>
                                                    <span>{student.phone}</span>
                                                </div>
                                            )}
                                            {student.department && (
                                                <div className="flex items-center gap-3 text-[13px] text-gray-600 font-medium">
                                                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb},0.05)` }}>
                                                        <FiBook className="w-3 h-3" style={{ color: brandColor }} />
                                                    </div>
                                                    <span className="truncate">{student.department.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Enrolled Courses Count */}
                                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                                                Enrollment
                                            </div>
                                            <div
                                                className="text-[12px] font-bold px-2.5 py-1 rounded-md"
                                                style={{ backgroundColor: `rgba(${rgb},0.08)`, color: brandColor }}
                                            >
                                                {student.enrolledCourses?.length || 0} Courses
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
