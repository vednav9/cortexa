import Document from "../models/document.js";
import MCQSet from "../models/mcqSet.js";
import MCQAttempt from "../models/mcqAttempt.js";
import { uploadDocument } from "../services/cloudflareR2.js";
import aiService from "../services/aiService.js";

// Upload Notes/Document
export const uploadNotes = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File is required" });
        }

        const { fileName, courseId, institutionId } = req.body;
        const userId = req.user.id;

        // Upload to Cloudflare R2
        const fileUrl = await uploadDocument(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        // Upload to AI service for processing (chunks + embeddings)
        let isProcessed = false;
        let processingError = null;
        let chunks = [];

        try {
            const aiResult = await aiService.uploadDocument(
                req.file.buffer,
                req.file.originalname,
                institutionId,
                courseId
            );
            
            isProcessed = true;
            chunks = aiResult.chunks || [];
        } catch (aiError) {
            console.error("AI processing error:", aiError);
            processingError = aiError.message;
        }

        // Save document metadata to MongoDB
        const document = new Document({
            fileName: fileName || req.file.originalname,
            originalName: req.file.originalname,
            fileUrl,
            fileType: req.file.mimetype.includes("pdf") ? "pdf" 
                : req.file.mimetype.includes("word") ? "docx"
                : req.file.mimetype.includes("text") ? "txt"
                : "pptx",
            fileSize: req.file.size,
            course: courseId,
            institution: institutionId,
            uploadedBy: userId,
            chunks: chunks.map(chunk => ({
                text: chunk.text,
                embedding: chunk.embedding,
                metadata: chunk.metadata
            })),
            isProcessed,
            processingError
        });

        await document.save();

        res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            document: {
                id: document._id,
                fileName: document.fileName,
                fileUrl: document.fileUrl,
                isProcessed: document.isProcessed
            }
        });
    } catch (error) {
        console.error("Upload notes error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all documents for a course
export const getDocuments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { institutionId } = req.query;

        const documents = await Document.find({
            course: courseId,
            institution: institutionId
        })
        .populate("uploadedBy", "fullName")
        .populate("course", "name")
        .sort({ createdAt: -1 });

        res.json({ success: true, documents });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete document
export const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.id;

        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        await Document.deleteOne({ _id: documentId });

        res.json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Generate MCQs
export const generateMCQs = async (req, res) => {
    try {
        const { sourceType, source, numQuestions, difficulty } = req.body;

        if (!sourceType || !source) {
            return res.status(400).json({
                error: "sourceType and source are required"
            });
        }

        const mcqs = await aiService.generateMCQs(
            sourceType,
            source,
            numQuestions || 5,
            difficulty || "medium"
        );

        res.json({
            success: true,
            mcqs: mcqs.mcqs || [],
            count: mcqs.mcqs?.length || 0
        });
    } catch (error) {
        console.error("Generate MCQs error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Save MCQ Set
export const saveMCQSet = async (req, res) => {
    try {
        const { title, description, courseId, institutionId, questions } = req.body;
        const userId = req.user.id;

        if (!title || !courseId || !questions || questions.length === 0) {
            return res.status(400).json({
                error: "Title, courseId, and questions are required"
            });
        }

        const mcqSet = new MCQSet({
            title,
            description,
            course: courseId,
            institution: institutionId,
            createdBy: userId,
            questions
        });

        await mcqSet.save();

        res.status(201).json({
            success: true,
            message: "MCQ set saved successfully",
            mcqSet: {
                id: mcqSet._id,
                title: mcqSet.title,
                questionCount: mcqSet.questions.length
            }
        });
    } catch (error) {
        console.error("Save MCQ set error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Add MCQs to existing set
export const addToMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { questions } = req.body;
        const userId = req.user.id;

        const mcqSet = await MCQSet.findOne({
            _id: mcqSetId,
            createdBy: userId
        });

        if (!mcqSet) {
            return res.status(404).json({ error: "MCQ set not found" });
        }

        mcqSet.questions.push(...questions);
        await mcqSet.save();

        res.json({
            success: true,
            message: "Questions added successfully",
            totalQuestions: mcqSet.questions.length
        });
    } catch (error) {
        console.error("Add to MCQ set error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all MCQ sets for teacher
export const getMCQSets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { institutionId } = req.query;

        const mcqSets = await MCQSet.find({
            createdBy: userId,
            institution: institutionId
        })
        .populate("course", "name")
        .sort({ createdAt: -1 });

        res.json({ success: true, mcqSets });
    } catch (error) {
        console.error("Get MCQ sets error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Assign MCQ set to students
export const assignMCQSet = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { studentIds, dueDate, duration } = req.body;
        const userId = req.user.id;

        const mcqSet = await MCQSet.findOne({
            _id: mcqSetId,
            createdBy: userId
        });

        if (!mcqSet) {
            return res.status(404).json({ error: "MCQ set not found" });
        }

        mcqSet.isAssigned = true;
        mcqSet.assignedTo = studentIds;
        if (dueDate) mcqSet.dueDate = dueDate;
        if (duration) mcqSet.duration = duration;

        await mcqSet.save();

        res.json({
            success: true,
            message: "MCQ set assigned successfully",
            assignedTo: studentIds.length
        });
    } catch (error) {
        console.error("Assign MCQ set error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get MCQ set attempts/results
export const getMCQResults = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const mcqSet = await MCQSet.findOne({
            _id: mcqSetId,
            createdBy: userId
        });

        if (!mcqSet) {
            return res.status(404).json({ error: "MCQ set not found" });
        }

        const attempts = await MCQAttempt.find({ mcqSet: mcqSetId })
            .populate("student", "fullName email")
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            mcqSet: {
                title: mcqSet.title,
                totalQuestions: mcqSet.questions.length
            },
            attempts,
            stats: {
                totalAttempts: attempts.length,
                averageScore: attempts.length > 0 
                    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
                    : 0
            }
        });
    } catch (error) {
        console.error("Get MCQ results error:", error);
        res.status(500).json({ error: error.message });
    }
};

export default {
    uploadNotes,
    getDocuments,
    deleteDocument,
    generateMCQs,
    saveMCQSet,
    addToMCQSet,
    getMCQSets,
    assignMCQSet,
    getMCQResults
};
