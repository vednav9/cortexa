import Question from '../models/question.js';
import Answer from '../models/answer.js';
import Teacher from '../models/teacher.js';

// Get all questions for courses the teacher teaches
export const getQuestions = async (req, res) => {
  try {
    const { institutionId, courseId } = req.query;
    const teacherId = req.user.id;

    // Verify teacher is part of the institution
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teaching = teacher.teachingAt.find(
      t => t.institution.toString() === institutionId
    );

    if (!teaching) {
      return res.status(403).json({ error: 'Not teaching at this institution' });
    }

    // Build query
    const query = { institution: institutionId };
    
    if (courseId) {
      // Check if teacher teaches this course
      const teachesCourse = teaching.courses.some(c => c.toString() === courseId);
      if (!teachesCourse) {
        return res.status(403).json({ error: 'Not teaching this course' });
      }
      query.course = courseId;
    } else {
      // Get all courses teacher teaches
      query.course = { $in: teaching.courses };
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
    const teacherId = req.user.id;

    const question = await Question.findById(questionId)
      .populate('askedBy', 'name email')
      .populate('course', 'name code')
      .populate('institution', 'name');

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify teacher teaches this course
    const teacher = await Teacher.findById(teacherId);
    const teaching = teacher.teachingAt.find(
      t => t.institution.toString() === question.institution._id.toString()
    );

    if (!teaching || !teaching.courses.includes(question.course._id)) {
      return res.status(403).json({ error: 'Not teaching this course' });
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

// Answer a question (teacher response)
export const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const teacherId = req.user.id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify teacher teaches this course
    const teacher = await Teacher.findById(teacherId);
    const teaching = teacher.teachingAt.find(
      t => t.institution.toString() === question.institution.toString()
    );

    if (!teaching || !teaching.courses.includes(question.course)) {
      return res.status(403).json({ error: 'Not teaching this course' });
    }

    const answer = new Answer({
      question: questionId,
      content,
      answeredBy: teacherId,
      answeredByModel: 'Teacher'
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

// Mark answer as accepted (resolve question)
export const acceptAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const teacherId = req.user.id;

    const answer = await Answer.findById(answerId).populate('question');
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const question = answer.question;

    // Verify teacher teaches this course
    const teacher = await Teacher.findById(teacherId);
    const teaching = teacher.teachingAt.find(
      t => t.institution.toString() === question.institution.toString()
    );

    if (!teaching || !teaching.courses.includes(question.course)) {
      return res.status(403).json({ error: 'Not teaching this course' });
    }

    // Unmark previous accepted answer if exists
    if (question.resolvedBy) {
      await Answer.findByIdAndUpdate(question.resolvedBy, { isAccepted: false });
    }

    // Mark this answer as accepted
    answer.isAccepted = true;
    await answer.save();

    // Update question
    question.isResolved = true;
    question.resolvedBy = answerId;
    await question.save();

    res.json({ message: 'Answer accepted successfully' });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};

// Get teacher's answer statistics
export const getStats = async (req, res) => {
  try {
    const { institutionId } = req.query;
    const teacherId = req.user.id;

    const teacher = await Teacher.findById(teacherId);
    const teaching = teacher.teachingAt.find(
      t => t.institution.toString() === institutionId
    );

    if (!teaching) {
      return res.status(403).json({ error: 'Not teaching at this institution' });
    }

    // Get all questions for courses teacher teaches
    const totalQuestions = await Question.countDocuments({
      institution: institutionId,
      course: { $in: teaching.courses }
    });

    const resolvedQuestions = await Question.countDocuments({
      institution: institutionId,
      course: { $in: teaching.courses },
      isResolved: true
    });

    const myAnswers = await Answer.countDocuments({
      answeredBy: teacherId,
      answeredByModel: 'Teacher'
    });

    const acceptedAnswers = await Answer.countDocuments({
      answeredBy: teacherId,
      answeredByModel: 'Teacher',
      isAccepted: true
    });

    res.json({
      stats: {
        totalQuestions,
        resolvedQuestions,
        myAnswers,
        acceptedAnswers
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export default {
  getQuestions,
  getQuestionById,
  answerQuestion,
  acceptAnswer,
  getStats
};
