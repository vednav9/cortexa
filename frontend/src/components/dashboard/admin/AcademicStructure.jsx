// AcademicStructure.jsx - Manage departments, courses, semesters, and academic calendar
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiX,
    FiSave,
    FiBook,
    FiUsers,
    FiCalendar,
    FiFolder,
    FiClock,
    FiGrid,
    FiList,
    FiChevronRight
} from "react-icons/fi";
import toast from "react-hot-toast";

const AcademicStructure = ({ institution }) => {
    const [activeSection, setActiveSection] = useState("departments");
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    // Departments state
    const [departments, setDepartments] = useState([
        {
            id: 1,
            name: "Computer Science",
            code: "CS",
            head: "Dr. John Smith",
            students: 450,
            teachers: 25,
            courses: 45,
            established: "2010"
        },
        {
            id: 2,
            name: "Electronics & Communication",
            code: "EC",
            head: "Dr. Sarah Johnson",
            students: 380,
            teachers: 22,
            courses: 38,
            established: "2012"
        },
        {
            id: 3,
            name: "Mechanical Engineering",
            code: "ME",
            head: "Dr. Michael Brown",
            students: 420,
            teachers: 28,
            courses: 42,
            established: "2008"
        }
    ]);

    // Courses state
    const [courses, setCourses] = useState([
        {
            id: 1,
            name: "Data Structures & Algorithms",
            code: "CS301",
            department: "Computer Science",
            semester: "3rd",
            credits: 4,
            type: "Core",
            teacher: "Prof. Alice Williams",
            students: 85
        },
        {
            id: 2,
            name: "Machine Learning",
            code: "CS401",
            department: "Computer Science",
            semester: "4th",
            credits: 4,
            type: "Elective",
            teacher: "Dr. Bob Chen",
            students: 72
        },
        {
            id: 3,
            name: "Digital Signal Processing",
            code: "EC302",
            department: "Electronics & Communication",
            semester: "3rd",
            credits: 3,
            type: "Core",
            teacher: "Dr. Carol Davis",
            students: 68
        }
    ]);

    // Semesters state
    const [semesters, setSemesters] = useState([
        {
            id: 1,
            name: "Fall 2024",
            startDate: "2024-08-01",
            endDate: "2024-12-15",
            status: "completed",
            totalCourses: 120,
            enrolledStudents: 1250
        },
        {
            id: 2,
            name: "Spring 2025",
            startDate: "2025-01-15",
            endDate: "2025-05-31",
            status: "active",
            totalCourses: 125,
            enrolledStudents: 1280
        },
        {
            id: 3,
            name: "Fall 2025",
            startDate: "2025-08-01",
            endDate: "2025-12-15",
            status: "upcoming",
            totalCourses: 0,
            enrolledStudents: 0
        }
    ]);

    // Calendar events state
    const [calendarEvents, setCalendarEvents] = useState([
        {
            id: 1,
            title: "Mid-term Examinations",
            startDate: "2025-03-15",
            endDate: "2025-03-22",
            type: "exam",
            description: "Mid-semester examinations for all courses"
        },
        {
            id: 2,
            title: "Spring Break",
            startDate: "2025-04-01",
            endDate: "2025-04-07",
            type: "holiday",
            description: "Spring break for all students"
        },
        {
            id: 3,
            title: "Final Examinations",
            startDate: "2025-05-15",
            endDate: "2025-05-25",
            type: "exam",
            description: "End-semester examinations"
        },
        {
            id: 4,
            title: "Project Submissions",
            startDate: "2025-05-10",
            endDate: "2025-05-10",
            type: "deadline",
            description: "Final project submission deadline"
        }
    ]);

    // Modal states
    const [addDeptModal, setAddDeptModal] = useState(false);
    const [addCourseModal, setAddCourseModal] = useState(false);
    const [addSemesterModal, setAddSemesterModal] = useState(false);
    const [addEventModal, setAddEventModal] = useState(false);

    // Form states
    const [deptForm, setDeptForm] = useState({
        name: "",
        code: "",
        head: "",
        established: ""
    });

    const [courseForm, setCourseForm] = useState({
        name: "",
        code: "",
        department: "",
        semester: "",
        credits: "",
        type: "Core",
        teacher: ""
    });

    const [semesterForm, setSemesterForm] = useState({
        name: "",
        startDate: "",
        endDate: ""
    });

    const [eventForm, setEventForm] = useState({
        title: "",
        startDate: "",
        endDate: "",
        type: "exam",
        description: ""
    });

    // Handlers
    const handleAddDepartment = () => {
        if (!deptForm.name || !deptForm.code) {
            toast.error("Name and code are required");
            return;
        }
        const newDept = {
            id: departments.length + 1,
            ...deptForm,
            students: 0,
            teachers: 0,
            courses: 0
        };
        setDepartments([...departments, newDept]);
        toast.success("Department added successfully");
        setAddDeptModal(false);
        setDeptForm({ name: "", code: "", head: "", established: "" });
    };

    const handleDeleteDepartment = (id) => {
        setDepartments(departments.filter(d => d.id !== id));
        toast.success("Department deleted");
    };

    const handleAddCourse = () => {
        if (!courseForm.name || !courseForm.code || !courseForm.department) {
            toast.error("Name, code, and department are required");
            return;
        }
        const newCourse = {
            id: courses.length + 1,
            ...courseForm,
            students: 0
        };
        setCourses([...courses, newCourse]);
        toast.success("Course added successfully");
        setAddCourseModal(false);
        setCourseForm({
            name: "",
            code: "",
            department: "",
            semester: "",
            credits: "",
            type: "Core",
            teacher: ""
        });
    };

    const handleDeleteCourse = (id) => {
        setCourses(courses.filter(c => c.id !== id));
        toast.success("Course deleted");
    };

    const handleAddSemester = () => {
        if (!semesterForm.name || !semesterForm.startDate || !semesterForm.endDate) {
            toast.error("All fields are required");
            return;
        }
        const newSemester = {
            id: semesters.length + 1,
            ...semesterForm,
            status: "upcoming",
            totalCourses: 0,
            enrolledStudents: 0
        };
        setSemesters([...semesters, newSemester]);
        toast.success("Semester added successfully");
        setAddSemesterModal(false);
        setSemesterForm({ name: "", startDate: "", endDate: "" });
    };

    const handleDeleteSemester = (id) => {
        setSemesters(semesters.filter(s => s.id !== id));
        toast.success("Semester deleted");
    };

    const handleAddEvent = () => {
        if (!eventForm.title || !eventForm.startDate) {
            toast.error("Title and start date are required");
            return;
        }
        const newEvent = {
            id: calendarEvents.length + 1,
            ...eventForm,
            endDate: eventForm.endDate || eventForm.startDate
        };
        setCalendarEvents([...calendarEvents, newEvent]);
        toast.success("Event added successfully");
        setAddEventModal(false);
        setEventForm({
            title: "",
            startDate: "",
            endDate: "",
            type: "exam",
            description: ""
        });
    };

    const handleDeleteEvent = (id) => {
        setCalendarEvents(calendarEvents.filter(e => e.id !== id));
        toast.success("Event deleted");
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-700";
            case "completed": return "bg-gray-100 text-gray-700";
            case "upcoming": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case "exam": return "bg-red-100 text-red-700 border-red-200";
            case "holiday": return "bg-green-100 text-green-700 border-green-200";
            case "deadline": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-blue-100 text-blue-700 border-blue-200";
        }
    };

    const primaryColor = institution?.branding?.primaryColor || "#6366f1";

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Academic Structure</h1>
                    <p className="text-gray-600 mt-1">Manage departments, courses, semesters, and academic calendar</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                <div className="flex gap-2">
                    {[
                        { id: "departments", label: "Departments", icon: FiFolder },
                        { id: "courses", label: "Courses", icon: FiBook },
                        { id: "semesters", label: "Semesters", icon: FiClock },
                        { id: "calendar", label: "Academic Calendar", icon: FiCalendar }
                    ].map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                                activeSection === section.id
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Departments Section */}
            {activeSection === "departments" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Departments</h2>
                        <button
                            onClick={() => setAddDeptModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Department
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map((dept, index) => (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <FiFolder className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{dept.name}</h3>
                                            <p className="text-sm text-gray-500">Code: {dept.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDepartment(dept.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Head:</span>
                                        <span className="font-medium text-gray-900">{dept.head || "Not assigned"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Students:</span>
                                        <span className="font-medium text-gray-900">{dept.students}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Teachers:</span>
                                        <span className="font-medium text-gray-900">{dept.teachers}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Courses:</span>
                                        <span className="font-medium text-gray-900">{dept.courses}</span>
                                    </div>
                                    {dept.established && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Established:</span>
                                            <span className="font-medium text-gray-900">{dept.established}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Courses Section */}
            {activeSection === "courses" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Courses</h2>
                        <button
                            onClick={() => setAddCourseModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Course
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {courses.map((course, index) => (
                                    <motion.tr
                                        key={course.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{course.name}</div>
                                                <div className="text-sm text-gray-500">{course.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{course.department}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{course.semester}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{course.credits}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                course.type === "Core"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}>
                                                {course.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{course.teacher}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{course.students}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteCourse(course.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Semesters Section */}
            {activeSection === "semesters" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Semesters</h2>
                        <button
                            onClick={() => setAddSemesterModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Semester
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {semesters.map((semester, index) => (
                            <motion.div
                                key={semester.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{semester.name}</h3>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(semester.status)}`}>
                                            {semester.status.charAt(0).toUpperCase() + semester.status.slice(1)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSemester(semester.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>
                                            {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Courses:</span>
                                        <span className="font-medium text-gray-900">{semester.totalCourses}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Students:</span>
                                        <span className="font-medium text-gray-900">{semester.enrolledStudents}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Academic Calendar Section */}
            {activeSection === "calendar" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Academic Calendar</h2>
                        <button
                            onClick={() => setAddEventModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Event
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {calendarEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-white rounded-xl p-5 shadow-sm border-2 ${getEventTypeColor(event.type)}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <FiCalendar className="w-4 h-4" />
                                        <span>
                                            {new Date(event.startDate).toLocaleDateString()}
                                            {event.endDate !== event.startDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                                        </span>
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Department Modal */}
            <AnimatePresence>
                {addDeptModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setAddDeptModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Add Department</h3>
                                <button
                                    onClick={() => setAddDeptModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
                                    <input
                                        type="text"
                                        value={deptForm.name}
                                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Computer Science"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Code *</label>
                                    <input
                                        type="text"
                                        value={deptForm.code}
                                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., CS"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department Head</label>
                                    <input
                                        type="text"
                                        value={deptForm.head}
                                        onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Dr. John Smith"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                                    <input
                                        type="text"
                                        value={deptForm.established}
                                        onChange={(e) => setDeptForm({ ...deptForm, established: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 2010"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setAddDeptModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDepartment}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Add Department
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Course Modal */}
            <AnimatePresence>
                {addCourseModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setAddCourseModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Add Course</h3>
                                <button
                                    onClick={() => setAddCourseModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                                        <input
                                            type="text"
                                            value={courseForm.name}
                                            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Data Structures"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Code *</label>
                                        <input
                                            type="text"
                                            value={courseForm.code}
                                            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., CS301"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                                        <select
                                            value={courseForm.department}
                                            onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                        <input
                                            type="text"
                                            value={courseForm.semester}
                                            onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 3rd"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                                        <input
                                            type="number"
                                            value={courseForm.credits}
                                            onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 4"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select
                                            value={courseForm.type}
                                            onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Core">Core</option>
                                            <option value="Elective">Elective</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                                        <input
                                            type="text"
                                            value={courseForm.teacher}
                                            onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Prof. Alice Williams"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setAddCourseModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCourse}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Add Course
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Semester Modal */}
            <AnimatePresence>
                {addSemesterModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setAddSemesterModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Add Semester</h3>
                                <button
                                    onClick={() => setAddSemesterModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester Name *</label>
                                    <input
                                        type="text"
                                        value={semesterForm.name}
                                        onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Fall 2025"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                                    <input
                                        type="date"
                                        value={semesterForm.startDate}
                                        onChange={(e) => setSemesterForm({ ...semesterForm, startDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                                    <input
                                        type="date"
                                        value={semesterForm.endDate}
                                        onChange={(e) => setSemesterForm({ ...semesterForm, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setAddSemesterModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSemester}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Add Semester
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Event Modal */}
            <AnimatePresence>
                {addEventModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setAddEventModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Add Calendar Event</h3>
                                <button
                                    onClick={() => setAddEventModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                                    <input
                                        type="text"
                                        value={eventForm.title}
                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Mid-term Examinations"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                                    <select
                                        value={eventForm.type}
                                        onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="exam">Exam</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="deadline">Deadline</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                                        <input
                                            type="date"
                                            value={eventForm.startDate}
                                            onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={eventForm.endDate}
                                            onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="Enter event description..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setAddEventModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddEvent}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    Add Event
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcademicStructure;
