import Question from '../models/question.js';
import Answer from '../models/answer.js';
import Student from '../models/student.js';
import Course from '../models/course.js';

// Get all questions for courses the student is enrolled in
export const getQuestions = async (req, res) => {
  try {
    const { institutionId, courseId } = req.query;
    const studentId = req.user.id;

    // Verify student is enrolled in the institution
    const student = await Student.findById(studentId).populate('enrolledInstitutions.institution');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const enrollment = student.enrolledInstitutions.find(
      e => e.institution._id.toString() === institutionId
    );

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this institution' });
    }

    // Build query
    const query = { institution: institutionId };
    
    if (courseId) {
      // Check if student is enrolled in this course
      const isEnrolled = enrollment.courses.some(c => c.toString() === courseId);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
      query.course = courseId;
    } else {
      // Get all courses student is enrolled in
      query.course = { $in: enrollment.courses };
    }

    const questions = await Question.find(query)
      .populate('askedBy', 'name email')
      .populate('course', 'name code')
      .populate({
        path: 'answers',
        options: { sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Add answer count to each question
    const questionsWithCount = questions.map(q => ({
      ...q,
      answerCount: q.answers?.length || 0
    }));

    res.json({ questions: questionsWithCount });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get single question with all answers
export const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user.id;

    const question = await Question.findById(questionId)
      .populate('askedBy', 'name email')
      .populate('course', 'name code')
      .populate('institution', 'name');

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify student is enrolled in the course
    const student = await Student.findById(studentId);
    const enrollment = student.enrolledInstitutions.find(
      e => e.institution.toString() === question.institution._id.toString()
    );

    if (!enrollment || !enrollment.courses.includes(question.course._id)) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    // Get answers with populated data
    const answers = await Answer.find({ question: questionId })
      .populate('answeredBy', 'name email')
      .sort({ isAccepted: -1, createdAt: -1 })
      .lean();

    res.json({
      question: {
        ...question.toObject(),
        answerCount: answers.length
      },
      answers
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

// Ask a new question
export const askQuestion = async (req, res) => {
  try {
    const { title, description, courseId, institutionId, tags } = req.body;
    const studentId = req.user.id;

    // Verify student is enrolled in the course
    const student = await Student.findById(studentId);
    const enrollment = student.enrolledInstitutions.find(
      e => e.institution.toString() === institutionId
    );

    if (!enrollment || !enrollment.courses.includes(courseId)) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const question = new Question({
      title,
      description,
      course: courseId,
      institution: institutionId,
      askedBy: studentId,
      tags: tags || []
    });

    await question.save();
    await question.populate('askedBy', 'name email');
    await question.populate('course', 'name code');

    res.status(201).json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Post an answer to a question
export const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const studentId = req.user.id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify student is enrolled in the course
    const student = await Student.findById(studentId);
    const enrollment = student.enrolledInstitutions.find(
      e => e.institution.toString() === question.institution.toString()
    );

    if (!enrollment || !enrollment.courses.includes(question.course)) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const answer = new Answer({
      question: questionId,
      content,
      answeredBy: studentId,
      answeredByModel: 'Student'
    });

    await answer.save();
    
    // Add answer to question
    question.answers.push(answer._id);
    await question.save();

    await answer.populate('answeredBy', 'name email');

    res.status(201).json({ answer });
  } catch (error) {
    console.error('Error posting answer:', error);
    res.status(500).json({ error: 'Failed to post answer' });
  }
};

// Upvote a question
export const upvoteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user.id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const upvoteIndex = question.upvotes.indexOf(studentId);
    
    if (upvoteIndex > -1) {
      // Remove upvote
      question.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      question.upvotes.push(studentId);
    }

    await question.save();
    res.json({ upvotes: question.upvotes.length });
  } catch (error) {
    console.error('Error upvoting question:', error);
    res.status(500).json({ error: 'Failed to upvote question' });
  }
};

// Upvote an answer
export const upvoteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const studentId = req.user.id;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const upvoteIndex = answer.upvotes.indexOf(studentId);
    
    if (upvoteIndex > -1) {
      // Remove upvote
      answer.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      answer.upvotes.push(studentId);
    }

    await answer.save();
    res.json({ upvotes: answer.upvotes.length });
  } catch (error) {
    console.error('Error upvoting answer:', error);
    res.status(500).json({ error: 'Failed to upvote answer' });
  }
};

export default {
  getQuestions,
  getQuestionById,
  askQuestion,
  answerQuestion,
  upvoteQuestion,
  upvoteAnswer
};
