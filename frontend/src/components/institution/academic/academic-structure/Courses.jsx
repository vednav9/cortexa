import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBook,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiUsers,
  FiClock,
  FiAward,
  FiBookOpen,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useAuth } from "../../../../context/authcontext";
import { useOutletContext, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { academicAPI } from "../../../../services/api";

export default function Courses() {
  const { user } = useAuth();
  const { institution } = useOutletContext();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  const [formData, setFormData] = useState({
    department: "",
    code: "",
    name: "",
    description: "",
    credits: "",
    semester: "",
    semesterAvailable: "",
    instructor: "",
    facultyAvailable: "",
    maxCapacity: 60,
    syllabus: "",
  });

  const brandColor = institution?.branding?.primaryColor || "#3b82f6";
  const hasAccess = user?.role === "admin";

  useEffect(() => {
    if (institution?._id) {
      fetchCourses();
      fetchDepartments();
      fetchSemesters();
      fetchTeachers();
    }
  }, [institution?._id]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log("📚 Fetching courses for institution:", institution._id);

      const response = await academicAPI.getCourses(institution._id);
      console.log("📚 API Response:", response.data);

      // ✅ KEY FIX: Extract courses from response.data.courses
      const coursesData = response.data?.courses || [];
      console.log("📚 Courses loaded:", coursesData.length);

      setCourses(coursesData);
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
      toast.error(error.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await academicAPI.getDepartments(institution._id);
      setDepartments(response.data?.data || response.data?.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await academicAPI.getSemesters(institution._id);
      setSemesters(response.data?.data || response.data?.semesters || []);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await academicAPI.getFaculty(institution._id);
      setTeachers(response.data?.faculty || response.data?.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.department || !formData.code || !formData.name || !formData.credits) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingCourse) {
        await academicAPI.updateCourse(editingCourse._id, formData);
        toast.success("Course updated successfully!");
      } else {
        const response = await academicAPI.createCourse(institution._id, formData);
        console.log("✅ Course created:", response.data);
        toast.success("Course created successfully!");
      }

      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(error.response?.data?.message || "Failed to save course");
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      department: course.department?._id || course.department || "",
      code: course.code || "",
      name: course.name || "",
      description: course.description || "",
      credits: course.credits || "",
      semester: course.semester || "",
      semesterAvailable: course.semesterAvailable?._id || course.semesterAvailable || "",
      instructor: course.instructor?._id || course.instructor || "",
      facultyAvailable: course.facultyAvailable?._id || course.facultyAvailable || "",
      maxCapacity: course.maxCapacity || 60,
      syllabus: course.syllabus || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await academicAPI.deleteCourse(courseId);
      toast.success("Course deleted successfully!");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  const resetForm = () => {
    setFormData({
      department: "",
      code: "",
      name: "",
      description: "",
      credits: "",
      semester: "",
      semesterAvailable: "",
      instructor: "",
      facultyAvailable: "",
      maxCapacity: 60,
      syllabus: "",
    });
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = !filterDepartment || course.department?._id === filterDepartment;
    const matchesSemester = !filterSemester || course.semesterAvailable?._id === filterSemester;

    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const handleCourseCardClick = (course) => {
    if (!institution?.slug || !course?.code) return;
    navigate(`/${institution.slug}/courses/${course.code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: brandColor }}
          />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <FiBook style={{ color: brandColor }} className="w-6 h-6" />
              </div>
              <span>Courses</span>
            </h1>
            <p className="text-gray-600">
              Manage your academic courses and curriculum
            </p>
          </div>

          {hasAccess && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingCourse(null);
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColor }}
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Course</span>
            </motion.button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <FiBookOpen style={{ color: brandColor }} className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Departments</p>
                <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Semesters</p>
                <p className="text-3xl font-bold text-gray-900">
                  {semesters.filter((s) => s.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (parseInt(course.credits) || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                <FiAward className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.name} - {sem.academicYear}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          {(searchQuery || filterDepartment || filterSemester) && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center space-x-1">
                  <span>Search: {searchQuery}</span>
                  <button onClick={() => setSearchQuery("")}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterDepartment && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center space-x-1">
                  <span>
                    Dept: {departments.find((d) => d._id === filterDepartment)?.name}
                  </span>
                  <button onClick={() => setFilterDepartment("")}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterSemester && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm flex items-center space-x-1">
                  <span>
                    Sem: {semesters.find((s) => s._id === filterSemester)?.name}
                  </span>
                  <button onClick={() => setFilterSemester("")}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterDepartment("");
                  setFilterSemester("");
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterDepartment || filterSemester
                ? "No courses found"
                : "No courses yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterDepartment || filterSemester
                ? "Try adjusting your filters to find what you're looking for."
                : "Get started by creating your first course to organize your curriculum."}
            </p>
            {!searchQuery && !filterDepartment && !filterSemester && hasAccess && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center space-x-2"
                style={{ backgroundColor: brandColor }}
              >
                <FiPlus className="w-5 h-5" />
                <span>Create First Course</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
                onClick={() => handleCourseCardClick(course)}
              >
                {/* Course Header */}
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="px-3 py-1 bg-white rounded-lg text-sm font-bold"
                        style={{ color: brandColor }}
                      >
                        {course.code}
                      </div>
                      {hasAccess && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(course);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(course._id);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-2">{course.name}</h3>

                    <div className="flex items-center space-x-4 text-sm opacity-90">
                      <div className="flex items-center space-x-1">
                        <FiAward className="w-4 h-4" />
                        <span>{course.credits} Credits</span>
                      </div>
                      {course.maxCapacity && (
                        <div className="flex items-center space-x-1">
                          <FiUsers className="w-4 h-4" />
                          <span>{course.maxCapacity} Max</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-white/20 rounded-lg px-3 py-1.5">
                      <span>Open course page</span>
                    </div>
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  {course.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    {/* Department */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FiBookOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">DEPARTMENT</p>
                        <p className="font-semibold text-gray-900 truncate">
                          {course.department?.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Semester */}
                    {course.semesterAvailable && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FiClock className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">SEMESTER</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {course.semesterAvailable.name} ({course.semesterAvailable.academicYear})
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Faculty */}
                    {course.facultyAvailable && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FiUsers className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">FACULTY</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {course.facultyAvailable.fullName || course.facultyAvailable}
                          </p>
                          {course.facultyAvailable.jobTitle && (
                            <p className="text-xs text-gray-500">{course.facultyAvailable.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      {editingCourse ? "Edit Course" : "Add New Course"}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FiBookOpen className="w-5 h-5" />
                      <span>Basic Information</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Course Code *
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({ ...formData, code: e.target.value.toUpperCase() })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          placeholder="CS101"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Credits *
                        </label>
                        <input
                          type="number"
                          value={formData.credits}
                          onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          placeholder="3"
                          required
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Course Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        placeholder="Introduction to Computer Science"
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        placeholder="Course description..."
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Department & Semester */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FiUsers className="w-5 h-5" />
                      <span>Academic Details</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department *
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({ ...formData, department: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Semester Number
                        </label>
                        <input
                          type="number"
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          placeholder="1"
                          min="1"
                          max="12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Semester Available
                        </label>
                        <select
                          value={formData.semesterAvailable}
                          onChange={(e) =>
                            setFormData({ ...formData, semesterAvailable: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Semester</option>
                          {semesters.map((sem) => (
                            <option key={sem._id} value={sem._id}>
                              {sem.name} - {sem.academicYear}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Max Capacity
                        </label>
                        <input
                          type="number"
                          value={formData.maxCapacity}
                          onChange={(e) =>
                            setFormData({ ...formData, maxCapacity: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                          placeholder="60"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Faculty Assignment */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FiUsers className="w-5 h-5" />
                      <span>Faculty Assignment</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Instructor
                        </label>
                        <select
                          value={formData.instructor}
                          onChange={(e) =>
                            setFormData({ ...formData, instructor: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Instructor</option>
                          {teachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Faculty Available
                        </label>
                        <select
                          value={formData.facultyAvailable}
                          onChange={(e) =>
                            setFormData({ ...formData, facultyAvailable: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Faculty</option>
                          {teachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Syllabus */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Syllabus / Course Outline
                    </label>
                    <textarea
                      value={formData.syllabus}
                      onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      placeholder="Enter course syllabus or outline..."
                      rows="4"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCourse(null);
                        resetForm();
                      }}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      style={{ backgroundColor: brandColor }}
                    >
                      {editingCourse ? "Update Course" : "Create Course"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
