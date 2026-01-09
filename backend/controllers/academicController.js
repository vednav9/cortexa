import Department from "../models/department.js";
import Course from "../models/course.js";
import Semester from "../models/semester.js";
import AcademicCalendar from "../models/academicCalendar.js";
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";

/* ====================================
   DEPARTMENTS CRUD
==================================== */

// Get all departments for institution
export const getDepartments = async (req, res) => {
  try {
    const { institutionId } = req.params;

    const departments = await Department.find({ institution: institutionId })
      .populate("headOfDepartment", "fullName email jobTitle")
      .populate("faculty", "fullName email jobTitle")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { name, code, description, headOfDepartment } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required",
      });
    }

    const department = await Department.create({
      institution: institutionId,
      name,
      code: code.toUpperCase(),
      description,
      headOfDepartment: headOfDepartment || null,
    });

    await department.populate("headOfDepartment", "fullName email jobTitle");

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    console.error("Create department error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Department code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, code, description, headOfDepartment, isActive } = req.body;

    const department = await Department.findByIdAndUpdate(
      departmentId,
      {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(headOfDepartment !== undefined && { headOfDepartment }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    ).populate("headOfDepartment", "fullName email jobTitle");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Check if department has courses
    const coursesCount = await Course.countDocuments({ department: departmentId });
    if (coursesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${coursesCount} course(s). Please remove courses first.`,
      });
    }

    const department = await Department.findByIdAndDelete(departmentId);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};

/* ====================================
   COURSES CRUD
==================================== */

// Get all courses for institution
export const getCourses = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { departmentId, semester } = req.query;

    const filter = { institution: institutionId };
    if (departmentId) filter.department = departmentId;
    if (semester) filter.semester = parseInt(semester);

    const courses = await Course.find(filter)
      .populate("department", "name code")
      .populate("instructor", "fullName email jobTitle")
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const {
      department,
      code,
      name,
      description,
      credits,
      semester,
      instructor,
      maxCapacity,
      syllabus,
    } = req.body;

    if (!department || !code || !name || !credits || !semester) {
      return res.status(400).json({
        success: false,
        message: "Department, code, name, credits, and semester are required",
      });
    }

    const course = await Course.create({
      institution: institutionId,
      department,
      code: code.toUpperCase(),
      name,
      description,
      credits,
      semester,
      instructor: instructor || null,
      maxCapacity: maxCapacity || 60,
      syllabus,
    });

    await course.populate([
      { path: "department", select: "name code" },
      { path: "instructor", select: "fullName email jobTitle" },
    ]);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Course code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: "department", select: "name code" },
      { path: "instructor", select: "fullName email jobTitle" },
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

/* ====================================
   SEMESTERS CRUD
==================================== */

// Get all semesters
export const getSemesters = async (req, res) => {
  try {
    const { institutionId } = req.params;
    console.log('=== GET SEMESTERS ===');
    console.log('Institution ID:', institutionId);

    const semesters = await Semester.find({ institution: institutionId })
      .populate("courses", "code name credits")
      .sort({ startDate: -1 });

    console.log('Found semesters:', semesters.length);
    console.log('Semesters data:', JSON.stringify(semesters, null, 2));

    res.status(200).json({
      success: true,
      count: semesters.length,
      data: semesters,
    });
  } catch (error) {
    console.error("Get semesters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch semesters",
    });
  }
};

// Create semester
export const createSemester = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { name, academicYear, startDate, endDate, isActive } = req.body;

    if (!name || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, academic year, start date, and end date are required",
      });
    }

    const semester = await Semester.create({
      institution: institutionId,
      name,
      academicYear,
      startDate,
      endDate,
      isActive: isActive || false,
    });

    res.status(201).json({
      success: true,
      message: "Semester created successfully",
      data: semester,
    });
  } catch (error) {
    console.error("Create semester error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create semester",
    });
  }
};

// Update semester
export const updateSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findByIdAndUpdate(
      semesterId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      data: semester,
    });
  } catch (error) {
    console.error("Update semester error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update semester",
    });
  }
};

// Delete semester
export const deleteSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findByIdAndDelete(semesterId);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Semester deleted successfully",
    });
  } catch (error) {
    console.error("Delete semester error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete semester",
    });
  }
};

/* ====================================
   ACADEMIC CALENDAR CRUD
==================================== */

// Get all calendar events
export const getCalendarEvents = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { institution: institutionId };
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const events = await AcademicCalendar.find(filter).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Get calendar events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar events",
    });
  }
};

// Create calendar event
export const createCalendarEvent = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      targetAudience,
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      });
    }

    const event = await AcademicCalendar.create({
      institution: institutionId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      targetAudience,
    });

    res.status(201).json({
      success: true,
      message: "Calendar event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Create calendar event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create calendar event",
    });
  }
};

// Update calendar event
export const updateCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await AcademicCalendar.findByIdAndUpdate(
      eventId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Calendar event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Update calendar event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update calendar event",
    });
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await AcademicCalendar.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Calendar event deleted successfully",
    });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete calendar event",
    });
  }
};

/* ====================================
   FACULTY MANAGEMENT
==================================== */

// Get all faculty (teachers)
export const getFaculty = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { departmentId } = req.query;

    const filter = { institution: institutionId };
    
    const faculty = await Teacher.find(filter)
      .select("fullName email phone jobTitle department qualifications specialization")
      .populate("department", "name code")
      .sort({ fullName: 1 });

    // Filter by department if provided
    let result = faculty;
    if (departmentId) {
      result = faculty.filter(
        (f) => f.department && f.department._id.toString() === departmentId
      );
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get faculty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty",
    });
  }
};
