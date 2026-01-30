import QA from '../models/qa.js';
import Course from '../models/course.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Admin from '../models/admin.js';

// ===============================
// GET ALL Q&A FOR A COURSE
// ===============================
export const getQAsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, category, priority, search, sort = '-createdAt' } = req.query;

    // Build query
    const query = { course: courseId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const qas = await QA.find(query)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .populate('assignedTo', 'fullName email')
      .sort(sort)
      .lean();

    res.json({
      success: true,
      count: qas.length,
      qas
    });
  } catch (error) {
    console.error('Error fetching QAs:', error);
    res.status(500).json({
      message: 'Error fetching Q&A',
      error: error.message
    });
  }
};

// ===============================
// GET ALL Q&A FOR AN INSTITUTION
// ===============================
export const getQAsByInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { status, category, search, courseId, sort = '-createdAt', limit = 50 } = req.query;

    const query = { institution: institutionId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (courseId) {
      query.course = courseId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const qas = await QA.find(query)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .populate('assignedTo', 'fullName email')
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: qas.length,
      qas
    });
  } catch (error) {
    console.error('Error fetching QAs:', error);
    res.status(500).json({
      message: 'Error fetching Q&A',
      error: error.message
    });
  }
};

// ===============================
// GET Q&A STATS
// ===============================
export const getQAStats = async (req, res) => {
  try {
    const { courseId, institutionId } = req.params;
    
    const query = courseId ? { course: courseId } : { institution: institutionId };

    const [total, open, inProgress, resolved] = await Promise.all([
      QA.countDocuments(query),
      QA.countDocuments({ ...query, status: 'open' }),
      QA.countDocuments({ ...query, status: 'in-progress' }),
      QA.countDocuments({ ...query, status: 'resolved' })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed: total - open - inProgress - resolved
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// ===============================
// GET SINGLE Q&A
// ===============================
export const getQAById = async (req, res) => {
  try {
    const { qaId } = req.params;

    const qa = await QA.findByIdAndUpdate(
      qaId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .populate('assignedTo', 'fullName email')
      .lean();

    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    res.json({
      success: true,
      qa
    });
  } catch (error) {
    console.error('Error fetching Q&A:', error);
    res.status(500).json({
      message: 'Error fetching Q&A',
      error: error.message
    });
  }
};

// ===============================
// CREATE Q&A
// ===============================
export const createQA = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      category,
      priority,
      tags,
      isAnonymous
    } = req.body;

    // Validate
    if (!title || !description) {
      return res.status(400).json({
        message: 'Title and description are required'
      });
    }

    // Get course details
    const course = await Course.findById(courseId)
      .select('institution department semesterAvailable');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get user details
    let userName, userEmail;
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).select('fullName email');
      userName = student.fullName;
      userEmail = student.email;
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.id).select('fullName email');
      userName = teacher.fullName;
      userEmail = teacher.email;
    }

    // Create Q&A
    const qa = await QA.create({
      institution: course.institution,
      course: courseId,
      department: course.department,
      semester: course.semesterAvailable,
      title,
      description,
      category: category || 'general',
      priority: priority || 'normal',
      tags: tags || [],
      isAnonymous: isAnonymous || false,
      askedBy: {
        userId: req.user.id,
        userType: req.user.role === 'student' ? 'Student' : 'Teacher',
        name: isAnonymous ? 'Anonymous' : userName,
        email: userEmail
      }
    });

    // Populate and return
    const populatedQA = await QA.findById(qa._id)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name');

    // 🔔 Emit real-time notification to course teachers
    global.io?.to(`course:${courseId}`).emit('qa:new', {
      qaId: qa._id,
      title: qa.title,
      course: courseId,
      askedBy: qa.askedBy.name,
      createdAt: qa.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      qa: populatedQA
    });
  } catch (error) {
    console.error('Error creating Q&A:', error);
    res.status(500).json({
      message: 'Error creating Q&A',
      error: error.message
    });
  }
};

// ===============================
// ADD ANSWER
// ===============================
export const addAnswer = async (req, res) => {
  try {
    const { qaId } = req.params;
    const { text, attachments } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    const qa = await QA.findById(qaId);
    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    // Get user details
    let userName, userEmail, userType;
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).select('fullName email');
      userName = student.fullName;
      userEmail = student.email;
      userType = 'Student';
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.id).select('fullName email');
      userName = teacher.fullName;
      userEmail = teacher.email;
      userType = 'Teacher';
    } else if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user.id).select('fullName email');
      userName = admin.fullName;
      userEmail = admin.email;
      userType = 'Admin';
    }

    // Add answer
    qa.answers.push({
      answeredBy: {
        userId: req.user.id,
        userType,
        name: userName,
        email: userEmail
      },
      text,
      attachments: attachments || [],
      upvotes: [],
      downvotes: []
    });

    // Update status if first answer
    if (qa.answers.length === 1 && qa.status === 'open') {
      qa.status = 'in-progress';
    }

    await qa.save();

    const populatedQA = await QA.findById(qaId)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .populate('assignedTo', 'fullName email');

    // 🔔 Emit notification to question asker
    global.io?.to(`user:${qa.askedBy.userId}`).emit('qa:answer', {
      qaId: qa._id,
      title: qa.title,
      answeredBy: userName,
      answeredAt: new Date()
    });

    res.json({
      success: true,
      message: 'Answer added successfully',
      qa: populatedQA
    });
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({
      message: 'Error adding answer',
      error: error.message
    });
  }
};

// ===============================
// UPDATE Q&A STATUS
// ===============================
export const updateQAStatus = async (req, res) => {
  try {
    const { qaId } = req.params;
    const { status } = req.body;

    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (status === 'closed') {
      updateData.closedAt = new Date();
    }

    const qa = await QA.findByIdAndUpdate(
      qaId,
      updateData,
      { new: true }
    )
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .populate('assignedTo', 'fullName email');

    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      qa
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      message: 'Error updating status',
      error: error.message
    });
  }
};

// ===============================
// ACCEPT ANSWER
// ===============================
export const acceptAnswer = async (req, res) => {
  try {
    const { qaId, answerId } = req.params;

    const qa = await QA.findById(qaId);
    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    // Check authorization
    if (qa.askedBy.userId.toString() !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the question asker, teachers, or admins can accept answers' });
    }

    // Find and update answer
    const answer = qa.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Unaccept all other answers
    qa.answers.forEach(a => {
      a.isAccepted = false;
    });

    // Accept this answer
    answer.isAccepted = true;
    qa.status = 'resolved';
    qa.resolvedAt = new Date();

    await qa.save();

    const populatedQA = await QA.findById(qaId)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name');

    res.json({
      success: true,
      message: 'Answer accepted',
      qa: populatedQA
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({
      message: 'Error accepting answer',
      error: error.message
    });
  }
};

// ===============================
// UPVOTE Q&A
// ===============================
export const upvoteQA = async (req, res) => {
  try {
    const { qaId } = req.params;

    const qa = await QA.findById(qaId);
    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    const userIdIndex = qa.upvotes.findIndex(id => id.toString() === req.user.id);

    if (userIdIndex > -1) {
      // Remove upvote
      qa.upvotes.splice(userIdIndex, 1);
    } else {
      // Add upvote
      qa.upvotes.push(req.user.id);
    }

    await qa.save();

    res.json({
      success: true,
      upvotes: qa.upvotes.length,
      hasUpvoted: userIdIndex === -1
    });
  } catch (error) {
    console.error('Error upvoting Q&A:', error);
    res.status(500).json({
      message: 'Error upvoting Q&A',
      error: error.message
    });
  }
};

// ===============================
// UPVOTE ANSWER
// ===============================
export const upvoteAnswer = async (req, res) => {
  try {
    const { qaId, answerId } = req.params;

    const qa = await QA.findById(qaId);
    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    const answer = qa.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userIdIndex = answer.upvotes.findIndex(id => id.toString() === req.user.id);

    if (userIdIndex > -1) {
      // Remove upvote
      answer.upvotes.splice(userIdIndex, 1);
    } else {
      // Add upvote and remove from downvotes if exists
      answer.upvotes.push(req.user.id);
      const downvoteIndex = answer.downvotes.findIndex(id => id.toString() === req.user.id);
      if (downvoteIndex > -1) {
        answer.downvotes.splice(downvoteIndex, 1);
      }
    }

    await qa.save();

    res.json({
      success: true,
      upvotes: answer.upvotes.length,
      downvotes: answer.downvotes.length,
      hasUpvoted: userIdIndex === -1
    });
  } catch (error) {
    console.error('Error upvoting answer:', error);
    res.status(500).json({
      message: 'Error upvoting answer',
      error: error.message
    });
  }
};

// ===============================
// DELETE Q&A
// ===============================
export const deleteQA = async (req, res) => {
  try {
    const { qaId } = req.params;

    const qa = await QA.findById(qaId);
    if (!qa) {
      return res.status(404).json({ message: 'Q&A not found' });
    }

    // Check authorization
    if (qa.askedBy.userId.toString() !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this Q&A' });
    }

    await qa.deleteOne();

    res.json({
      success: true,
      message: 'Q&A deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Q&A:', error);
    res.status(500).json({
      message: 'Error deleting Q&A',
      error: error.message
    });
  }
};

// ===============================
// GET USER'S Q&As
// ===============================
export const getUserQAs = async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;

    const query = { 'askedBy.userId': req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const qas = await QA.find(query)
      .populate('course', 'name code')
      .populate('department', 'name')
      .populate('semester', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: qas.length,
      qas
    });
  } catch (error) {
    console.error('Error fetching user QAs:', error);
    res.status(500).json({
      message: 'Error fetching Q&As',
      error: error.message
    });
  }
};
