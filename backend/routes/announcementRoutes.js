import express from 'express';
import Announcement from '../models/announcement.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const normalizeAnnouncementAuthor = (announcementDoc) => {
  if (!announcementDoc) return announcementDoc;

  const announcement =
    typeof announcementDoc.toObject === 'function'
      ? announcementDoc.toObject()
      : announcementDoc;

  if (announcement.author && typeof announcement.author === 'object') {
    const resolvedName = announcement.author.name || announcement.author.fullName;
    if (resolvedName) {
      announcement.author.name = resolvedName;
    }
  }

  return announcement;
};

// Get all announcements for an institution (PUBLIC - but filtered)
router.get('/:institutionId', async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { limit = 20, skip = 0, type, priority } = req.query;

    const query = { 
      institution: institutionId,
      isActive: true
    };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const announcements = await Announcement.find(query)
      .populate('author', 'name fullName email')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const normalizedAnnouncements = announcements.map(normalizeAnnouncementAuthor);

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      announcements: normalizedAnnouncements,
      total,
      hasMore: total > (parseInt(skip) + normalizedAnnouncements.length)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching announcements', 
      error: error.message 
    });
  }
});

// Create announcement (AUTH REQUIRED - Admin or Teacher)
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      institution, 
      title, 
      content, 
      type, 
      priority, 
      targetAudience, 
      attachments,
      isPinned 
    } = req.body;

    // Check if user is admin or teacher
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins and teachers can create announcements' 
      });
    }

    const announcement = await Announcement.create({
      institution,
      author: req.user.id,
      authorType: req.user.role === 'admin' ? 'Admin' : 'Teacher',
      title,
      content,
      type: type || 'general',
      priority: priority || 'normal',
      targetAudience: targetAudience || ['all'],
      attachments: attachments || [],
      isPinned: isPinned || false
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'name fullName email');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: normalizeAnnouncementAuthor(populatedAnnouncement)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating announcement', 
      error: error.message 
    });
  }
});

// Update announcement (AUTH REQUIRED - Author only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    // Check if user is the author
    if (announcement.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only edit your own announcements' 
      });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('author', 'name fullName email');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: normalizeAnnouncementAuthor(updatedAnnouncement)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating announcement', 
      error: error.message 
    });
  }
});

// Delete announcement (AUTH REQUIRED - Author only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ 
        success: false,
        message: 'Announcement not found' 
      });
    }

    // Check if user is the author
    if (announcement.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own announcements' 
      });
    }

    await Announcement.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting announcement', 
      error: error.message 
    });
  }
});

// Mark announcement as viewed (AUTH REQUIRED)
router.post('/:id/view', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Announcement.findByIdAndUpdate(id, {
      $addToSet: {
        viewedBy: {
          user: req.user.id,
          userType: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
          viewedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Announcement marked as viewed'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking announcement as viewed', 
      error: error.message 
    });
  }
});

export default router;
