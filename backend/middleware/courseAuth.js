import Teacher from '../models/teacher.js';

/**
 * Middleware to check if a teacher is authorized for a specific course
 * Use this for: notes upload, MCQ generation, voice-to-text, Q&A portal
 */
export const checkCourseAuthorization = async (req, res, next) => {
    try {
        // Only apply to teachers
        if (req.user.role !== 'teacher') {
            return next();
        }

        const { courseId } = req.params || req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required',
            });
        }

        const teacher = await Teacher.findById(req.user.id).select('authorizedCourses');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found',
            });
        }

        // Check if course is in authorized list
        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId.toString()
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this course. Please contact your administrator to get access.',
            });
        }

        // Add authorization info to request
        req.courseAuthorization = {
            isAuthorized: true,
            teacherId: teacher._id,
        };

        next();
    } catch (error) {
        console.error('Course authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking course authorization',
            error: error.message,
        });
    }
};

/**
 * Helper function to check course authorization without middleware
 * @param {string} teacherId - Teacher's user ID
 * @param {string} courseId - Course ID to check
 * @returns {Promise<boolean>} - Whether teacher is authorized
 */
export const isTeacherAuthorizedForCourse = async (teacherId, courseId) => {
    try {
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses');
        
        if (!teacher) {
            return false;
        }

        return teacher.authorizedCourses.some(
            course => course.toString() === courseId.toString()
        );
    } catch (error) {
        console.error('Error checking course authorization:', error);
        return false;
    }
};

/**
 * Get all authorized courses for a teacher
 * @param {string} teacherId - Teacher's user ID
 * @returns {Promise<Array>} - Array of authorized course IDs
 */
export const getAuthorizedCourses = async (teacherId) => {
    try {
        const teacher = await Teacher.findById(teacherId)
            .select('authorizedCourses')
            .populate('authorizedCourses', 'name code department semester');
        
        if (!teacher) {
            return [];
        }

        return teacher.authorizedCourses || [];
    } catch (error) {
        console.error('Error fetching authorized courses:', error);
        return [];
    }
};
