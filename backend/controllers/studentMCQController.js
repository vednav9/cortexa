import MCQSet from "../models/mcqSet.js";
import MCQAttempt from "../models/mcqAttempt.js";

// Get assigned MCQ sets for student
export const getAssignedMCQs = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { institutionId } = req.query;

        const assignedMCQs = await MCQSet.find({
            institution: institutionId,
            isAssigned: true,
            assignedTo: studentId
        })
        .populate("course", "name code")
        .populate("createdBy", "fullName")
        .sort({ dueDate: 1 });

        // Get attempts for each MCQ
        const mcqsWithAttempts = await Promise.all(
            assignedMCQs.map(async (mcq) => {
                const attempt = await MCQAttempt.findOne({
                    mcqSet: mcq._id,
                    student: studentId
                });

                return {
                    ...mcq.toObject(),
                    hasAttempted: !!attempt,
                    attemptScore: attempt?.percentage || null,
                    attemptId: attempt?._id || null
                };
            })
        );

        res.json({ success: true, mcqSets: mcqsWithAttempts });
    } catch (error) {
        console.error("Get assigned MCQs error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get MCQ set details for attempt
export const getMCQSetDetails = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const studentId = req.user.id;

        const mcqSet = await MCQSet.findOne({
            _id: mcqSetId,
            assignedTo: studentId
        })
        .populate("course", "name")
        .populate("createdBy", "fullName");

        if (!mcqSet) {
            return res.status(404).json({ error: "MCQ set not found or not assigned to you" });
        }

        // Check if already attempted
        const existingAttempt = await MCQAttempt.findOne({
            mcqSet: mcqSetId,
            student: studentId
        });

        if (existingAttempt) {
            return res.status(400).json({ 
                error: "You have already attempted this test",
                attemptId: existingAttempt._id
            });
        }

        // Return questions without correct answers
        const questionsWithoutAnswers = mcqSet.questions.map((q, index) => ({
            index,
            question: q.question,
            options: q.options
        }));

        res.json({
            success: true,
            mcqSet: {
                _id: mcqSet._id,
                title: mcqSet.title,
                description: mcqSet.description,
                course: mcqSet.course,
                duration: mcqSet.duration,
                totalQuestions: mcqSet.questions.length,
                questions: questionsWithoutAnswers
            }
        });
    } catch (error) {
        console.error("Get MCQ set details error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Submit MCQ attempt
export const submitMCQAttempt = async (req, res) => {
    try {
        const { mcqSetId } = req.params;
        const { answers, timeTaken } = req.body;
        const studentId = req.user.id;

        // Verify MCQ set exists and is assigned to student
        const mcqSet = await MCQSet.findOne({
            _id: mcqSetId,
            assignedTo: studentId
        });

        if (!mcqSet) {
            return res.status(404).json({ error: "MCQ set not found or not assigned to you" });
        }

        // Check if already attempted
        const existingAttempt = await MCQAttempt.findOne({
            mcqSet: mcqSetId,
            student: studentId
        });

        if (existingAttempt) {
            return res.status(400).json({ error: "You have already attempted this test" });
        }

        // Calculate score
        let correctCount = 0;
        const answersWithCorrect = answers.map((answer) => {
            const question = mcqSet.questions[answer.questionIndex];
            const isCorrect = answer.selectedAnswer === question.correctAnswer;
            if (isCorrect) correctCount++;

            return {
                questionIndex: answer.questionIndex,
                selectedAnswer: answer.selectedAnswer,
                isCorrect
            };
        });

        const totalQuestions = mcqSet.questions.length;
        const percentage = (correctCount / totalQuestions) * 100;

        // Create attempt record
        const attempt = new MCQAttempt({
            mcqSet: mcqSetId,
            student: studentId,
            answers: answersWithCorrect,
            score: correctCount,
            totalQuestions,
            percentage,
            timeTaken
        });

        await attempt.save();

        // Update MCQ set stats
        mcqSet.totalAttempts += 1;
        mcqSet.averageScore = await MCQAttempt.aggregate([
            { $match: { mcqSet: mcqSet._id } },
            { $group: { _id: null, avgScore: { $avg: "$percentage" } } }
        ]).then(result => result[0]?.avgScore || 0);

        await mcqSet.save();

        res.json({
            success: true,
            message: "Test submitted successfully",
            results: {
                attemptId: attempt._id,
                score: correctCount,
                totalQuestions,
                percentage: percentage.toFixed(2),
                timeTaken,
                grade: getGrade(percentage)
            }
        });
    } catch (error) {
        console.error("Submit MCQ attempt error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get attempt results
export const getAttemptResults = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;

        const attempt = await MCQAttempt.findOne({
            _id: attemptId,
            student: studentId
        })
        .populate({
            path: "mcqSet",
            populate: {
                path: "course",
                select: "name"
            }
        });

        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        // Get questions with student's answers and correct answers
        const mcqSet = await MCQSet.findById(attempt.mcqSet._id);
        
        const questionsWithAnswers = mcqSet.questions.map((q, index) => {
            const studentAnswer = attempt.answers.find(a => a.questionIndex === index);
            
            return {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                studentAnswer: studentAnswer?.selectedAnswer,
                isCorrect: studentAnswer?.isCorrect,
                explanation: q.explanation
            };
        });

        res.json({
            success: true,
            attempt: {
                _id: attempt._id,
                mcqSet: {
                    title: attempt.mcqSet.title,
                    course: attempt.mcqSet.course
                },
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                percentage: attempt.percentage,
                timeTaken: attempt.timeTaken,
                submittedAt: attempt.submittedAt,
                grade: getGrade(attempt.percentage)
            },
            questions: questionsWithAnswers
        });
    } catch (error) {
        console.error("Get attempt results error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to calculate grade
function getGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "D";
}

export default {
    getAssignedMCQs,
    getMCQSetDetails,
    submitMCQAttempt,
    getAttemptResults
};
