import express from "express";
import { registerStudent, loginStudent, getUserProfile, logoutStudent } from "../controllers/studentController.js"
import { authenticate } from "../middleware/auth.js"
import Membership from "../models/membership.js";
import Institution from "../models/institution.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/logout", logoutStudent);

router.get("/check-auth", authenticate);
router.get("/me", authenticate, getUserProfile);

// Get student's institutions
router.get("/institutions", authenticate, async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user.userId,
      userType: 'Student',
      status: 'active'
    }).populate('institution');
    
    const institutions = memberships.map(m => ({
      id: m.institution._id,
      name: m.institution.name,
      code: m.institution.code,
      logo: m.institution.logo || m.institution.initials,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt
    }));
    
    res.json({ institutions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching institutions', error: error.message });
  }
});

// Leave institution
router.delete("/institutions/:id", authenticate, async (req, res) => {
  try {
    const membership = await Membership.findOneAndDelete({
      user: req.user.userId,
      institution: req.params.id,
      userType: 'Student'
    });
    
    if (!membership) {
      return res.status(404).json({ message: 'Not a member of this institution' });
    }
    
    // Update institution stats
    const institution = await Institution.findById(req.params.id);
    if (institution) {
      institution.students.pull(req.user.userId);
      institution.stats.totalStudents = Math.max(0, institution.stats.totalStudents - 1);
      await institution.save();
    }
    
    res.json({ message: 'Left institution successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving institution', error: error.message });
  }
});

export default router;

