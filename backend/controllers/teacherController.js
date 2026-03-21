// controllers/teacherController.js
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Admin from "../models/admin.js";
import Course from "../models/course.js";
import Document from "../models/document.js";
import DocumentChunk from "../models/documentChunk.js";
import EmbeddingStore from "../models/embeddingStore.js";
import MCQSet from "../models/mcqSet.js";
import MCQAttempt from "../models/mcqAttempt.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import { uploadToR2, deleteFromR2 } from "../services/cloudflareR2.js";
import aiService from "../services/aiService.js";

const stripQuestionPrefix = (question = "") =>
    String(question)
        .replace(/^\s*(Q|Question)\s*\d+\s*[:.)-]\s*/i, "")
        .trim();

const normalizeOptions = (options, fallback = {}) => {
    if (Array.isArray(options)) {
        const result = options.map((o) => String(o ?? "").trim()).filter(Boolean);
        return result.length >= 4 ? result.slice(0, 4) : [
            ...result,
            String(fallback.option_a ?? "Option A"),
            String(fallback.option_b ?? "Option B"),
            String(fallback.option_c ?? "Option C"),
            String(fallback.option_d ?? "Option D"),
        ].slice(0, 4);
    }

    if (options && typeof options === "object") {
        return [
            String(options.A ?? options.a ?? fallback.option_a ?? "Option A"),
            String(options.B ?? options.b ?? fallback.option_b ?? "Option B"),
            String(options.C ?? options.c ?? fallback.option_c ?? "Option C"),
            String(options.D ?? options.d ?? fallback.option_d ?? "Option D"),
        ];
    }

    return [
        String(fallback.option_a ?? "Option A"),
        String(fallback.option_b ?? "Option B"),
        String(fallback.option_c ?? "Option C"),
        String(fallback.option_d ?? "Option D"),
    ];
};

const normalizeCorrectAnswer = (correctAnswer, optionsLength = 4) => {
    const maxIndex = Math.max(0, Math.min(3, optionsLength - 1));
    if (typeof correctAnswer === "number" && Number.isFinite(correctAnswer)) {
        return Math.max(0, Math.min(maxIndex, Math.floor(correctAnswer)));
    }

    if (typeof correctAnswer === "string") {
        const raw = correctAnswer.trim().toUpperCase();
        if (/^[A-D]$/.test(raw)) {
            return raw.charCodeAt(0) - 65;
        }
        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            return Math.max(0, Math.min(maxIndex, Math.floor(numeric)));
        }
    }

    return 0;
};

const normalizeMCQ = (mcq, difficulty = "medium") => {
    const options = normalizeOptions(mcq.options, mcq);
    const correctRaw = mcq.correctAnswer ?? mcq.correct_answer;
    return {
        question: stripQuestionPrefix(mcq.question || "Question"),
        options,
        correctAnswer: normalizeCorrectAnswer(correctRaw, options.length),
        explanation: String(mcq.explanation || "").trim(),
        difficulty: ["easy", "medium", "hard"].includes(String(mcq.difficulty || "").toLowerCase())
            ? String(mcq.difficulty).toLowerCase()
            : difficulty,
    };
};

const mergeUniqueMcqs = (mcqs) => {
    const seen = new Set();
    return mcqs.filter((item) => {
        const key = stripQuestionPrefix(item.question).toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const buildFallbackMcqs = (context, count, difficulty = "medium") => {
    const sentences = String(context || "")
        .split(/[.?!]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 30)
        .slice(0, count * 2);

    const fallback = [];
    for (let i = 0; i < count; i++) {
        const basis = sentences[i] || `Core concept ${i + 1}`;
        const clipped = basis.length > 160 ? `${basis.slice(0, 157)}...` : basis;
        fallback.push({
            question: `Which statement is most accurate about: ${clipped}?`,
            options: [
                clipped,
                `A common misconception about ${clipped.split(" ").slice(0, 4).join(" ")}`,
                "An unrelated statement that does not match the topic",
                "None of the above",
            ],
            correctAnswer: 0,
            explanation: "The first option is directly supported by the source context.",
            difficulty,
        });
    }
    return fallback;
};

const buildTopicWebContext = async (topic) => {
    const safeTopic = String(topic || "").trim();
    if (!safeTopic) return "";

    try {
        const webResult = await aiService.queryHybridAssistant(
            `Provide concise study notes with key facts, definitions, and examples for: ${safeTopic}`,
            true
        );

        const answer = String(webResult?.answer || "").trim();
        const sources = Array.isArray(webResult?.sources) ? webResult.sources : [];
        const sourceSnippets = sources
            .map((s) => `${s?.title || "Source"}: ${String(s?.snippet || s?.content || "").trim()}`)
            .filter((x) => x.length > 12)
            .slice(0, 4)
            .join("\n");

        const combined = `${answer}\n${sourceSnippets}`.trim();
        if (combined.length > 80) {
            return combined.slice(0, 5000);
        }
    } catch (_) {
        // Fall through to lightweight fallback prompt context.
    }

    return `Topic: ${safeTopic}`;
};

const buildDocumentChunkContext = async ({ documentId, documentName, teacherId, courseId }) => {
    let document = null;

    if (documentId) {
        document = await Document.findOne({
            _id: documentId,
            course: courseId,
            uploadedBy: teacherId,
        });
    }

    if (!document && documentName) {
        document = await Document.findOne({
            course: courseId,
            uploadedBy: teacherId,
            $or: [
                { originalName: documentName },
                { fileName: documentName },
            ],
        }).sort({ createdAt: -1 });
    }

    if (!document) {
        throw new Error("Selected document not found for this course.");
    }

    const chunks = await DocumentChunk.find({ document: document._id })
        .sort({ chunkIndex: 1 })
        .limit(25)
        .select("text chunkIndex");

    let text = chunks
        .map((chunk) => String(chunk.text || "").trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 8000);

    // Fallback when DB chunks are missing or stale: ask AI service for document chunks by name.
// Fallback: chunks not in MongoDB yet — use document title as minimal context
if (!text) {
  text = `Document title: ${document.originalName || document.fileName || documentName || 'Uploaded document'}`;
}

    if (!text) {
        text = `Document title: ${document.originalName || document.fileName || documentName || "Uploaded document"}`;
    }

    return {
        document,
        contextText: text,
    };
};

// ✅ FIX: Accept chunks directly from request body — no HF GET call needed
const persistChunksToMongo = async (document, chunks, embeddingModel = 'paraphrase-MiniLM-L3-v2') => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('No chunks provided for persistence');
  }

  // Clean slate — remove any stale data for this document
  await Promise.all([
    DocumentChunk.deleteMany({ document: document._id }),
    EmbeddingStore.deleteMany({ documentId: document._id }),
  ]);

  const chunkDocs = chunks
    .map((chunk, i) => {
      const meta = chunk?.metadata || {};
      const embedding = Array.isArray(chunk?.embedding)
        ? chunk.embedding.map((v) => Number(v)).filter((n) => Number.isFinite(n))
        : [];

      return {
        document: document._id,
        chunkIndex: Number.isFinite(Number(meta?.chunk_index)) ? Number(meta.chunk_index) : i,
        text: String(chunk?.text || '').trim(),
        embedding,
        embeddingModel,
        metadata: {
          institution_id: document.institution?.toString() ?? '',
          course_id: document.course?.toString() ?? '',
          fileName: document.originalName,
          fileType: document.fileType,
          uploadedBy: document.uploadedBy?.toString() ?? '',
        },
      };
    })
    .filter((doc) => doc.text.length > 0);

  if (chunkDocs.length === 0) {
    throw new Error('All chunks were empty after filtering — nothing to persist');
  }

  const insertedChunks = await DocumentChunk.insertMany(chunkDocs, { ordered: false });

  const embeddingDocs = insertedChunks.map((chunkDoc) => ({
    documentId: document._id,
    chunkId: chunkDoc._id,
    text: chunkDoc.text,
    embedding: Array.isArray(chunkDoc.embedding) ? chunkDoc.embedding : [],
    embeddingDimension: Array.isArray(chunkDoc.embedding) ? chunkDoc.embedding.length : 0,
    embeddingModel: chunkDoc.embeddingModel || embeddingModel,
    metadata: {
      institution_id: document.institution,
      course_id: document.course,
      fileName: document.originalName,
      fileType: document.fileType,
      chunkIndex: chunkDoc.chunkIndex,
    },
  }));

  await EmbeddingStore.insertMany(embeddingDocs, { ordered: false });

  const [dbChunkCount, dbEmbeddingCount] = await Promise.all([
    DocumentChunk.countDocuments({ document: document._id }),
    EmbeddingStore.countDocuments({ documentId: document._id }),
  ]);

  return { chunkCount: dbChunkCount, embeddingCount: dbEmbeddingCount };
};





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

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully. Processing has started.",
            document: document.toObject(),
            statusSyncSupported: true,
            aiIndexed: false,
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

        // Delete all chunks and embeddings associated with this document
        await Promise.all([
            DocumentChunk.deleteMany({ document: documentId }),
            EmbeddingStore.deleteMany({ documentId: documentId }),
        ]);

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
    // ✅ FIX: chunks + embeddingModel now come from the request body directly
    const { chunksCount, chunks, embeddingModel } = req.body || {};
    const teacherId = req.user.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (document.uploadedBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const incomingChunks = Array.isArray(chunks) ? chunks : [];
    const requestedCount = Number.isFinite(Number(chunksCount))
      ? Math.max(0, Math.floor(Number(chunksCount)))
      : 0;

    // Guard: if frontend says chunks were added but sent none, reject early
    if (requestedCount > 0 && incomingChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: `AI reported ${requestedCount} chunks but none were included in the request body`,
      });
    }

    let persisted = { chunkCount: 0, embeddingCount: 0 };

    if (incomingChunks.length > 0) {
      persisted = await persistChunksToMongo(
        document,
        incomingChunks,
        embeddingModel || 'paraphrase-MiniLM-L3-v2'
      );
    }

    // Consistency checks
    if (persisted.chunkCount > 0 && persisted.embeddingCount <= 0) {
      throw new Error('Chunks were stored but embeddings were not stored');
    }
    if (persisted.chunkCount !== persisted.embeddingCount) {
      throw new Error(
        `Chunk/embedding count mismatch: ${persisted.chunkCount} chunks vs ${persisted.embeddingCount} embeddings`
      );
    }

    await Document.findByIdAndUpdate(documentId, {
      isProcessed: true,
      processingError: null,
      chunksCount: Math.max(0, persisted.chunkCount),
    });

    return res.status(200).json({
      success: true,
      message: 'Document marked as processed',
      chunksPersisted: persisted.chunkCount,
      embeddingsPersisted: persisted.embeddingCount,
    });
  } catch (error) {
    console.error('Mark processed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message,
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
        const { courseId, topic, count, difficulty, sourceType, documentId } = req.body;
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

        const normalizedSourceType = ["topic", "document"].includes(sourceType)
            ? sourceType
            : "topic";
        const normalizedDifficulty = ["easy", "medium", "hard"].includes((difficulty || "").toLowerCase())
            ? difficulty.toLowerCase()
            : "medium";
        const requestedCount = Number.isFinite(Number(count))
            ? Math.max(1, Math.min(10, Number(count)))
            : 5;

        let contextText = "";
        let sourceMeta = topic;

        if (normalizedSourceType === "document") {
            const docContext = await buildDocumentChunkContext({
                documentId,
                documentName: topic,
                teacherId,
                courseId,
            });
            contextText = docContext.contextText;
            sourceMeta = docContext.document?.originalName || topic;
        } else {
            // Topic mode: build context from web first, no document/chunk lookup.
            contextText = await buildTopicWebContext(topic);
        }

        const aiPrompt = `Topic: ${topic}\n\nUse the following reference context to create accurate MCQs:\n${contextText}`;

        let firstPass = null;
        try {
            firstPass = await aiService.generateMCQs(
                "text",
                aiPrompt,
                requestedCount,
                normalizedDifficulty
            );
        } catch (firstPassError) {
            console.warn("Primary AI generation failed:", firstPassError?.message || firstPassError);
        }

        const rawFirstPass = Array.isArray(firstPass?.mcqs) ? firstPass.mcqs : [];
        let mcqs = mergeUniqueMcqs(rawFirstPass.map((mcq) => normalizeMCQ(mcq, normalizedDifficulty)));

        // Top-up pass for missing MCQs.
        if (mcqs.length < requestedCount) {
            const deficit = requestedCount - mcqs.length;
            const topUpPrompt = `${aiPrompt}\n\nGenerate ${deficit} additional MCQs that are different from previous ones.`;
            let secondPass = null;
            try {
                secondPass = await aiService.generateMCQs(
                    "text",
                    topUpPrompt,
                    deficit,
                    normalizedDifficulty
                );
            } catch (topUpError) {
                console.warn("Top-up AI generation failed:", topUpError?.message || topUpError);
            }
            const rawSecondPass = Array.isArray(secondPass?.mcqs) ? secondPass.mcqs : [];
            mcqs = mergeUniqueMcqs([
                ...mcqs,
                ...rawSecondPass.map((mcq) => normalizeMCQ(mcq, normalizedDifficulty)),
            ]);
        }

        if (mcqs.length < requestedCount) {
            const fallback = buildFallbackMcqs(contextText || topic, requestedCount - mcqs.length, normalizedDifficulty);
            mcqs = mergeUniqueMcqs([...mcqs, ...fallback]);
        }

        mcqs = mcqs.slice(0, requestedCount);

        if (mcqs.length === 0) {
            return res.status(502).json({
                success: false,
                message: "AI returned no MCQs. Try a broader topic or different source type."
            });
        }

        res.status(200).json({
            success: true,
            mcqs,
            generatedCount: mcqs.length,
            sourceType: normalizedSourceType,
            source: sourceMeta,
            message: "MCQs generated successfully"
        });
    } catch (error) {
        console.error("Generate MCQs error:", error);
        const errorMessage = error?.message || "Unknown MCQ generation error";
        res.status(500).json({
            success: false,
            message: "Failed to generate MCQs",
            error: errorMessage
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

        const normalizedQuestions = mcqs.map((mcq) => normalizeMCQ(mcq));

        // Create MCQ set
        const mcqSet = await MCQSet.create({
            title,
            description: description || "",
            course: courseId,
            institution: teacher.institution,
            createdBy: teacherId,
            questions: normalizedQuestions,
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

        const newQuestions = mcqs.map((mcq) => normalizeMCQ(mcq));

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
