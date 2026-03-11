// controllers/teacherController.js
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Admin from "../models/admin.js";
import Course from "../models/course.js";
import Document from "../models/document.js";
import MCQSet from "../models/mcqSet.js";
import MCQAttempt from "../models/mcqAttempt.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadToR2, deleteFromR2 } from "../services/cloudflareR2.js";





/* =========================
   REGISTER TEACHER
========================= */
export const registerTeacher = async (req, res) => {
    try {
        const { fullName, email, password, username } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Username is required",
            });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: "Teacher already exists",
            });
        }

        // Check if username is already taken
        const existingUsername = await Teacher.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }

        const teacher = await Teacher.create({
            fullName,
            email,
            password,
            username,
            role: "teacher",
        });

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
            name: teacher.fullName,
            email: teacher.email
        });

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            user: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Register Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

/* =========================
   LOGIN TEACHER
========================= */
export const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const teacher = await Teacher.findOne({ 
            $or: [{ email }, { username: email }] 
        }).select("+password");
        
        if (!teacher) {
            // Check if email/username exists in other roles
            const student = await Student.findOne({ 
                $or: [{ email }, { username: email }] 
            });
            if (student) {
                return res.status(400).json({
                    success: false,
                    message: "This account is registered as a Student. Please select Student role.",
                });
            }

            const admin = await Admin.findOne({ 
                $or: [{ email }, { username: email }] 
            });
            if (admin) {
                return res.status(400).json({
                    success: false,
                    message: "This account is registered as an Admin. Please select Admin role.",
                });
            }

            return res.status(404).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/username or password",
            });
        }

        const token = generateToken({
            id: teacher._id,
            role: "teacher",
            name: teacher.fullName,
            email: teacher.email
        });

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            user: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.role,
            },
        });
    } catch (error) {
        console.error("Login Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

/* =========================
   LOGOUT TEACHER
========================= */
export const logoutTeacher = (req, res) => {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({
        success: true,
        message: "Teacher logged out successfully",
    });
};


export const getMyInstitution = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id).populate("institution");

        if (!teacher || !teacher.institution) {
            return res.json({ institution: null });
        }

        const institutionId = teacher.institution._id;

        const [studentsCount, teachersCount] = await Promise.all([
            Student.countDocuments({ institution: institutionId }),
            Teacher.countDocuments({ institution: institutionId }),
        ]);

        res.json({
            institution: {
                ...teacher.institution.toObject(),
                role: "teacher",
                stats: {
                    students: studentsCount,
                    teachers: teachersCount,
                    courses: 0,
                },
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch institution" });
    }
};

/* =========================
   GET AUTHORIZED COURSES
========================= */
export const getAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        console.log('📚 [GET AUTHORIZED COURSES] Teacher ID:', teacherId);
        
        // Get teacher with populated authorized courses
        const teacher = await Teacher.findById(teacherId)
            .populate({
                path: "authorizedCourses",
                populate: [
                    { path: "department", select: "name code" },
                    { path: "semesterAvailable", select: "name academicYear" }
                ]
            });

        if (!teacher) {
            console.log('❌ Teacher not found');
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        console.log('👨‍🏫 Teacher found:', teacher.fullName);
        console.log('📋 Raw authorizedCourses:', teacher.authorizedCourses);
        console.log('📊 Number of authorized courses:', teacher.authorizedCourses?.length || 0);

        if (!teacher.authorizedCourses || teacher.authorizedCourses.length === 0) {
            console.log('⚠️ No authorized courses found for teacher');
            return res.status(200).json({
                success: true,
                count: 0,
                courses: [],
                message: "No courses assigned yet. Please contact your admin to assign courses."
            });
        }

        // Filter out null/undefined courses and check if active
        const validCourses = teacher.authorizedCourses.filter(course => {
            if (!course) {
                console.log('⚠️ Found null/undefined course in authorizedCourses');
                return false;
            }
            console.log(`📖 Course: ${course.name} (${course.code}), isActive: ${course.isActive}`);
            return course.isActive !== false; // Include if isActive is true or undefined
        });
        
        console.log('✅ Valid courses after filtering:', validCourses.length);

        res.status(200).json({
            success: true,
            count: validCourses.length,
            courses: validCourses
        });
    } catch (error) {
        console.error("❌ Get authorized courses error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch authorized courses",
            error: error.message
        });
    }
};

/* =========================
   GET STUDENTS IN AUTHORIZED COURSES
========================= */
export const getStudentsInAuthorizedCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { courseId, departmentId, semesterId } = req.query;

        // Get teacher with authorized courses
        const teacher = await Teacher.findById(teacherId)
            .select('authorizedCourses institution department semester');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        // Build query for students
        let studentQuery = {
            institution: teacher.institution,
            status: 'active'
        };

        // If specific course is requested, check if teacher is authorized
        if (courseId) {
            const isAuthorized = teacher.authorizedCourses.some(
                course => course.toString() === courseId
            );
            
            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view students for this course"
                });
            }
            
            studentQuery.enrolledCourses = courseId;
        } else {
            // Show students enrolled in ANY of teacher's authorized courses
            if (teacher.authorizedCourses.length > 0) {
                studentQuery.enrolledCourses = { $in: teacher.authorizedCourses };
            }
        }

        // Add optional filters
        if (departmentId) {
            studentQuery.department = departmentId;
        }
        if (semesterId) {
            studentQuery.semester = semesterId;
        }

        // Fetch students with populated fields
        const students = await Student.find(studentQuery)
            .populate('department', 'name code')
            .populate('semester', 'name academicYear')
            .populate('enrolledCourses', 'name code')
            .select('fullName email phone username enrolledCourses department semester status')
            .sort({ fullName: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get students error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

/* =========================
   UPLOAD NOTES/DOCUMENTS
========================= */
export const uploadNotes = async (req, res) => {
    try {
        const { courseId, fileName } = req.body;
        const file = req.file;
        const teacherId = req.user.id;

        if (!file || !courseId) {
            return res.status(400).json({
                success: false,
                message: "File and course ID are required"
            });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses institution');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to upload notes for this course"
            });
        }

        // Upload to Cloudflare R2
        let fileUrl;
        try {
            fileUrl = await uploadToR2(file.buffer, file.originalname, 'docs', file.mimetype);
        } catch (r2Err) {
            console.error("R2 upload error:", r2Err);
            return res.status(500).json({
                success: false,
                message: "Failed to store file. Please try again."
            });
        }

        // Determine canonical file type for the Document schema enum
        const mime = file.mimetype;
        const fileType = mime.includes('pdf') ? 'pdf'
            : mime.includes('word') ? 'docx'
            : mime.includes('text') ? 'txt'
            : 'pptx';

        // Create document record
        const displayName = fileName || file.originalname.replace(/\.[^.]+$/, '');
        const document = await Document.create({
            fileName: displayName,
            originalName: file.originalname,
            fileUrl,
            fileType,
            fileSize: file.size,
            course: courseId,
            institution: teacher.institution,
            uploadedBy: teacherId,
            isProcessed: false
        });

        // Respond immediately — AI indexing is handled by the Flutter app
        // to avoid Vercel's serverless function timeout (HF cold-start alone
        // can exceed 60 s, the maximum Vercel allows).
        res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            document: document.toObject(),
            statusSyncSupported: true
        });
    } catch (error) {
        console.error("Upload notes error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload document",
            error: error.message
        });
    }
};

/* =========================
   GET DOCUMENTS BY COURSE
========================= */
export const getDocuments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const teacherId = req.user.id;

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view documents for this course"
            });
        }

        // Fetch documents
        const documents = await Document.find({ course: courseId })
            .populate('uploadedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
            error: error.message
        });
    }
};

/* =========================
   DELETE DOCUMENT
========================= */
export const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const teacherId = req.user.id;

        // Find document
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Verify teacher owns this document
        if (document.uploadedBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own documents"
            });
        }

        // Delete from R2 first so we do not orphan storage objects.
        if (document.fileUrl) {
            const r2Deleted = await deleteFromR2(document.fileUrl);
            if (!r2Deleted) {
                return res.status(502).json({
                    success: false,
                    message: "Failed to delete file from storage. Please retry."
                });
            }
        }

        // Delete from MongoDB only after storage deletion succeeds
        await Document.findByIdAndDelete(documentId);

        res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete document",
            error: error.message
        });
    }
};

/* =========================
   MARK DOCUMENT PROCESSED
========================= */
export const markDocumentProcessed = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { chunksCount } = req.body || {};
        const teacherId = req.user.id;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        if (document.uploadedBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        const update = {
            isProcessed: true,
            processingError: null,
        };

        if (typeof chunksCount === "number" && Number.isFinite(chunksCount) && chunksCount >= 0) {
            update.chunksCount = Math.floor(chunksCount);
        }

        await Document.findByIdAndUpdate(documentId, update);

        res.status(200).json({
            success: true,
            message: "Document marked as processed"
        });
    } catch (error) {
        console.error("Mark processed error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update document",
            error: error.message
        });
    }
};

/* =========================
   MARK DOCUMENT FAILED
========================= */
export const markDocumentFailed = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { error } = req.body || {};
        const teacherId = req.user.id;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        if (document.uploadedBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        const message = typeof error === "string" && error.trim().length > 0
            ? error.trim().slice(0, 500)
            : "AI indexing failed";

        await Document.findByIdAndUpdate(documentId, {
            isProcessed: false,
            processingError: message,
        });

        res.status(200).json({
            success: true,
            message: "Document marked as failed"
        });
    } catch (err) {
        console.error("Mark failed error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update document",
            error: err.message
        });
    }
};

/* =========================
   GENERATE MCQs
========================= */
export const generateMCQs = async (req, res) => {
    try {
        const { courseId, topic, count, difficulty } = req.body;
        const teacherId = req.user.id;

        if (!courseId || !topic) {
            return res.status(400).json({
                success: false,
                message: "Course and topic are required"
            });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to generate MCQs for this course"
            });
        }

        // TODO: Integrate with AI service to generate MCQs
        // For now, return sample MCQs
        const sampleMCQs = [];
        for (let i = 0; i < (count || 5); i++) {
            sampleMCQs.push({
                question: `Sample question ${i + 1} about ${topic}`,
                option_a: "Option A",
                option_b: "Option B",
                option_c: "Option C",
                option_d: "Option D",
                correct_answer: 0,
                explanation: `This is the explanation for question ${i + 1}`,
                difficulty: difficulty || "medium"
            });
        }

        res.status(200).json({
            success: true,
            mcqs: sampleMCQs,
            message: "MCQs generated successfully (AI integration pending)"
        });
    } catch (error) {
        console.error("Generate MCQs error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate MCQs",
            error: error.message
        });
    }
};

/* =========================
   SAVE MCQ SET
========================= */
export const saveMCQSet = async (req, res) => {
    try {
        const { courseId, title, description, mcqs } = req.body;
        const teacherId = req.user.id;

        if (!courseId || !title || !mcqs || mcqs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Course, title, and MCQs are required"
            });
        }

        // Verify teacher is authorized for this course
        const teacher = await Teacher.findById(teacherId).select('authorizedCourses institution');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        const isAuthorized = teacher.authorizedCourses.some(
            course => course.toString() === courseId
        );

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create MCQ sets for this course"
            });
        }

        // Create MCQ set
        const mcqSet = await MCQSet.create({
            title,
            description: description || "",
            course: courseId,
            institution: teacher.institution,
            createdBy: teacherId,
            questions: mcqs.map(mcq => ({
                question: mcq.question,
                options: mcq.options || [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d],
                correctAnswer: mcq.correctAnswer || mcq.correct_answer,
                explanation: mcq.explanation || "",
                difficulty: mcq.difficulty || "medium"
            }))
        });

        res.status(201).json({
            success: true,
            message: "MCQ set saved successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Save MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save MCQ set",
            error: error.message
        });
    }
};

/* =========================
   ADD TO MCQ SET
========================= */
export const addToMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { mcqs } = req.body;
        const teacherId = req.user.id;

        if (!mcqs || mcqs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "MCQs are required"
            });
        }

        // Find MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        // Verify teacher owns this set
        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only add questions to your own MCQ sets"
            });
        }

        // Add questions
        const newQuestions = mcqs.map(mcq => ({
            question: mcq.question,
            options: mcq.options || [mcq.option_a, mcq.option_b, mcq.option_c, mcq.option_d],
            correctAnswer: mcq.correctAnswer || mcq.correct_answer,
            explanation: mcq.explanation || "",
            difficulty: mcq.difficulty || "medium"
        }));

        mcqSet.questions.push(...newQuestions);
        await mcqSet.save();

        res.status(200).json({
            success: true,
            message: "MCQs added to set successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Add to MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add MCQs to set",
            error: error.message
        });
    }
};

/* =========================
   GET MCQ SETS
========================= */
export const getMCQSets = async (req, res) => {
    try {
        const { courseId } = req.query;
        const teacherId = req.user.id;

        // Build query
        const query = { createdBy: teacherId };
        if (courseId) {
            query.course = courseId;
        }

        // Fetch MCQ sets
        const mcqSets = await MCQSet.find(query)
            .populate('course', 'name code')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: mcqSets.length,
            mcqSets
        });
    } catch (error) {
        console.error("Get MCQ sets error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch MCQ sets",
            error: error.message
        });
    }
};

/* =========================
   ASSIGN MCQ SET
========================= */
export const assignMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { studentIds, dueDate, duration } = req.body;
        const teacherId = req.user.id;

        if (!studentIds || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Student IDs are required"
            });
        }

        // Find MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        // Verify teacher owns this set
        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only assign your own MCQ sets"
            });
        }

        // Update assignment
        mcqSet.isAssigned = true;
        mcqSet.assignedTo = studentIds;
        mcqSet.dueDate = dueDate;
        mcqSet.duration = duration || 30;
        await mcqSet.save();

        res.status(200).json({
            success: true,
            message: "MCQ set assigned successfully",
            mcqSet
        });
    } catch (error) {
        console.error("Assign MCQ set error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign MCQ set",
            error: error.message
        });
    }
};

/* =========================
   GET MCQ RESULTS
========================= */
export const getMCQResults = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const teacherId = req.user.id;

        // Verify teacher owns this MCQ set
        const mcqSet = await MCQSet.findById(mcqSetId);

        if (!mcqSet) {
            return res.status(404).json({
                success: false,
                message: "MCQ set not found"
            });
        }

        if (mcqSet.createdBy.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "You can only view results for your own MCQ sets"
            });
        }

        // Fetch attempts
        const attempts = await MCQAttempt.find({ mcqSet: mcqSetId })
            .populate('student', 'fullName email username')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: attempts.length,
            results: attempts
        });
    } catch (error) {
        console.error("Get MCQ results error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch MCQ results",
            error: error.message
        });
    }
};
