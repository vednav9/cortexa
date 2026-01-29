import Invitation from '../models/invitation.js';
import Institution from '../models/institution.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Admin from '../models/admin.js';
import Course from '../models/course.js';

// ===============================
// HELPER: Find user by email or username
// ===============================
const findUserByEmailOrUsername = async (identifier, recipientType) => {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    const UserModel = recipientType === 'Student' ? Student : Teacher;
    
    // Try to find by email first, then by username
    let user = await UserModel.findOne({ 
        email: normalizedIdentifier 
    }).select('_id email fullName');
    
    if (!user) {
        user = await UserModel.findOne({ 
            username: normalizedIdentifier 
        }).select('_id email fullName');
    }
    
    return user;
};

// ===============================
// GET USER INVITATIONS
// ===============================
export const getInvitations = async (req, res) => {
    try {
        const { status } = req.query;

        let userEmail = null;
        let userUsername = null;

        if (req.user.role === 'student') {
            const student = await Student.findById(req.user.id).select('email username');
            userEmail = student?.email?.toLowerCase();
            userUsername = student?.username?.toLowerCase();
        } else if (req.user.role === 'teacher') {
            const teacher = await Teacher.findById(req.user.id).select('email username');
            userEmail = teacher?.email?.toLowerCase();
            userUsername = teacher?.username?.toLowerCase();
        }

        const query = {
            recipientType: req.user.role === 'student' ? 'Student' : 'Teacher',
            $or: [
                { recipient: req.user.id },
                ...(userEmail ? [{
                    email: userEmail,
                    $or: [
                        { recipient: null },
                        { recipient: { $exists: false } }
                    ]
                }] : []),
                ...(userUsername ? [{
                    email: userUsername,
                    $or: [
                        { recipient: null },
                        { recipient: { $exists: false } }
                    ]
                }] : [])
            ]
        };

        if (status) {
            query.status = status;
        }

        const invitations = await Invitation.find(query)
            .populate('institution', 'name code logo description')
            .populate('sender', 'fullName email')
            .populate('department', 'name code')
            .populate('semester', 'name')
            .populate('courses', 'name code')
            .sort('-createdAt');

        res.json({ invitations });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching invitations',
            error: error.message,
        });
    }
};

// ===============================
// CREATE INVITATION (ADMIN)
// ===============================
export const createInvitation = async (req, res) => {
    try {
        const {
            institutionId,
            recipientId,
            recipientType,
            emailOrUsername,
            message,
            type = "join",
            department,
            semester,
            courses,
        } = req.body;

        if (!institutionId || !recipientType) {
            return res.status(400).json({
                message: 'institutionId and recipientType are required',
            });
        }

        // Validate department and semester for Students
        if (recipientType === 'Student' && (!department || !semester)) {
            return res.status(400).json({
                message: 'department and semester are required for students',
            });
        }

        // Validate department, semester, and courses for Teachers
        if (recipientType === 'Teacher' && (!department || !semester || !courses || courses.length === 0)) {
            return res.status(400).json({
                message: 'department, semester, and at least one course are required for teachers',
            });
        }

        // 🔐 Only admins can invite
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can send invitations',
            });
        }

        // ✅ VERIFY ADMIN ↔ INSTITUTION
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(403).json({ message: 'Admin not found' });
        }

        if (admin.institution.toString() !== institutionId) {
            return res.status(403).json({
                message: 'Not authorized to invite for this institution',
            });
        }

        // Auto-allocate courses for students based on department and semester
        let coursesToAllocate = courses || [];
        
        if (recipientType === 'Student') {
            const matchingCourses = await Course.find({
                institution: institutionId,
                department: department,
                semesterAvailable: semester
            }).select('_id');
            
            coursesToAllocate = matchingCourses.map(c => c._id);
        }

        /* ======================================================
           EMAIL/USERNAME-BASED INVITE (RESEND SUPPORTED)
        ====================================================== */
        if (emailOrUsername) {
            const normalizedIdentifier = emailOrUsername.toLowerCase().trim();

            // Check if user already exists
            const existingUser = await findUserByEmailOrUsername(normalizedIdentifier, recipientType);

            const existingInvite = await Invitation.findOne({
                institution: institutionId,
                email: normalizedIdentifier,
                status: 'pending',
            });

            // 🔁 RESEND INSTEAD OF BLOCK
            if (existingInvite) {
                existingInvite.message = message;
                existingInvite.sender = req.user.id;
                existingInvite.type = type;
                existingInvite.department = department;
                existingInvite.semester = semester;
                existingInvite.courses = coursesToAllocate;
                existingInvite.recipient = existingUser?._id || null;
                existingInvite.createdAt = new Date();
                existingInvite.expiresAt = new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                );

                await existingInvite.save();

                // 🔔 REALTIME NOTIFICATION - FIXED
                if (existingUser?._id) {
                    console.log('🔔 Emitting invitation to user:', existingUser._id);
                    global.io?.to(`user:${existingUser._id}`).emit("invitation:new", {
                        _id: existingInvite._id,
                        email: existingInvite.email,
                        institution: existingInvite.institution,
                        recipientType: existingInvite.recipientType,
                        message: existingInvite.message,
                        createdAt: existingInvite.createdAt,
                    });
                }

                return res.status(200).json({
                    message: 'Invitation re-sent successfully',
                    invitation: existingInvite,
                });
            }

            // ✅ CREATE NEW INVITE
            const invitation = await Invitation.create({
                institution: institutionId,
                recipientType,
                email: normalizedIdentifier,
                recipient: existingUser?._id || null,
                sender: req.user.id,
                message,
                type,
                department,
                semester,
                courses: coursesToAllocate,
                expiresAt: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
            });

            // 🔔 REALTIME NOTIFICATION - FIXED
            if (existingUser?._id) {
                console.log('🔔 Emitting new invitation to user:', existingUser._id);
                global.io?.to(`user:${existingUser._id}`).emit("invitation:new", {
                    _id: invitation._id,
                    email: invitation.email,
                    institution: invitation.institution,
                    recipientType: invitation.recipientType,
                    message: invitation.message,
                    createdAt: invitation.createdAt,
                });
            }

            return res.status(201).json({
                message: 'Invitation sent successfully',
                invitation,
            });
        }

        /* ======================================================
           USER-ID BASED INVITE (UNCHANGED)
        ====================================================== */
        if (!recipientId) {
            return res.status(400).json({
                message: 'recipientId or emailOrUsername is required',
            });
        }

        const existingInvite = await Invitation.findOne({
            institution: institutionId,
            recipient: recipientId,
            status: 'pending',
        });

        if (existingInvite) {
            return res.status(400).json({
                message: 'Invitation already sent',
            });
        }

        const invitation = await Invitation.create({
            institution: institutionId,
            recipient: recipientId,
            recipientType,
            sender: req.user.id,
            message,
            type,
            department,
            semester,
            courses: coursesToAllocate,
            expiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
        });

        // 🔔 REALTIME NOTIFICATION (USER-ID BASED)
        console.log('🔔 Emitting invitation to recipient:', recipientId);
        global.io?.to(`user:${recipientId}`).emit("invitation:new", {
            invitationId: invitation._id,
            recipient: recipientId,
            recipientType: invitation.recipientType,
            institution: institutionId,
            message: invitation.message,
            createdAt: invitation.createdAt,
        });

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation,
        });

    } catch (error) {
        console.error('Create invitation error:', error);
        res.status(500).json({
            message: 'Error creating invitation',
            error: error.message,
        });
    }
};

// ===============================
// ACCEPT INVITATION
// ===============================
export const acceptInvitation = async (req, res) => {
    try {
        console.log("Accept invitation:", req.params.id, req.user);

        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({ message: "Invitation already processed" });
        }

        // Expiry check
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            invitation.status = "expired";
            await invitation.save();
            return res.status(400).json({ message: "Invitation expired" });
        }

        // 🔐 Authorization
        let isAuthorized = false;
        
        if (invitation.recipient && invitation.recipient.toString() === req.user.id) {
            isAuthorized = true;
        } else if (invitation.email) {
            const UserModel = invitation.recipientType === 'Student' ? Student : Teacher;
            const currentUser = await UserModel.findById(req.user.id).select('email username');
            
            const normalizedEmail = invitation.email.toLowerCase();
            const userEmail = currentUser?.email?.toLowerCase();
            const userUsername = currentUser?.username?.toLowerCase();
            
            if (normalizedEmail === userEmail || normalizedEmail === userUsername) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to accept this invitation" });
        }

        // 🚫 Enforce single institution
        if (invitation.recipientType === "Student") {
            const student = await Student.findById(req.user.id);
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.institution) {
                return res.status(400).json({ message: "Already joined an institution" });
            }

            student.institution = invitation.institution;
            student.department = invitation.department;
            student.semester = invitation.semester;
            student.enrolledCourses = invitation.courses || [];
            student.status = "active";
            await student.save();

            // Add student to courses
            if (invitation.courses && invitation.courses.length > 0) {
                await Course.updateMany(
                    { _id: { $in: invitation.courses } },
                    { $addToSet: { enrolledStudents: req.user.id } }
                );
            }
        }

        if (invitation.recipientType === "Teacher") {
            const teacher = await Teacher.findById(req.user.id);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });
            if (teacher.institution) {
                return res.status(400).json({ message: "Already joined an institution" });
            }

            teacher.institution = invitation.institution;
            teacher.department = invitation.department;
            teacher.semester = invitation.semester;
            teacher.authorizedCourses = invitation.courses || [];
            teacher.status = "active";
            await teacher.save();
        }

        // Finalize invitation
        invitation.status = "accepted";
        invitation.recipient = req.user.id;
        invitation.respondedAt = new Date();
        await invitation.save();

        global.io?.to(`user:${req.user.id}`).emit("auth:refresh");

        res.json({ message: "Invitation accepted successfully" });

    } catch (error) {
        console.error("ACCEPT INVITATION ERROR:", error);
        res.status(500).json({
            message: "Internal server error while accepting invitation",
        });
    }
};

// ===============================
// REJECT INVITATION
// ===============================
export const rejectInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Authorization check
        let isAuthorized = false;
        
        if (invitation.recipient && invitation.recipient.toString() === req.user.id) {
            isAuthorized = true;
        } else if (invitation.email) {
            const UserModel = invitation.recipientType === 'Student' ? Student : Teacher;
            const currentUser = await UserModel.findById(req.user.id).select('email username');
            
            const normalizedEmail = invitation.email.toLowerCase();
            const userEmail = currentUser?.email?.toLowerCase();
            const userUsername = currentUser?.username?.toLowerCase();
            
            if (normalizedEmail === userEmail || normalizedEmail === userUsername) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation already processed' });
        }

        invitation.status = 'rejected';
        invitation.respondedAt = new Date();
        invitation.recipient = req.user.id;
        await invitation.save();

        res.json({ message: 'Invitation rejected' });
    } catch (error) {
        res.status(500).json({
            message: 'Error rejecting invitation',
            error: error.message,
        });
    }
};

// ===============================
// DELETE INVITATION (ADMIN)
// ===============================
export const deleteInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id).populate('institution');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin || admin.institution.toString() !== invitation.institution._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await invitation.deleteOne();

        res.json({ message: 'Invitation deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting invitation',
            error: error.message,
        });
    }
};

// ===============================
// GET ADMIN INVITATIONS (BY INSTITUTION)
// ===============================
export const getAdminInvitations = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins allowed' });
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin || !admin.institution) {
            return res.status(403).json({ message: 'Admin institution not found' });
        }

        const query = {
            institution: admin.institution,
        };

        if (req.query.status) {
            query.status = req.query.status;
        }

        query.$or = [
            { expiresAt: { $gt: new Date() } },
            { status: { $ne: 'pending' } }
        ];

        const invitations = await Invitation.find(query)
            .populate('sender', 'fullName email')
            .populate('recipient', 'fullName email username')
            .populate('department', 'name code')
            .populate('semester', 'name')
            .populate('courses', 'name code')
            .sort('-createdAt');

        res.json({
            success: true,
            invitations,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch invitations',
            error: error.message,
        });
    }
};

// ===============================
// BULK INVITE USERS (STUDENT ONLY)
// ===============================
export const bulkInviteUsers = async (req, res) => {
    try {
        const { institutionId, recipientType, users, department, semester } = req.body;

        // Validation
        if (!institutionId || !recipientType || !Array.isArray(users)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        if (recipientType !== "Student") {
            return res.status(400).json({ 
                message: "Bulk invite is only available for students. Use manual entry for teachers." 
            });
        }

        if (!department || !semester) {
            return res.status(400).json({
                message: 'department and semester are required for student invitations',
            });
        }

        // Admin check
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can invite users" });
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin || admin.institution.toString() !== institutionId) {
            return res.status(403).json({ message: "Unauthorized institution access" });
        }

        // Auto-allocate courses
        const matchingCourses = await Course.find({
            institution: institutionId,
            department: department,
            semesterAvailable: semester
        }).select('_id');
        
        const coursesToAllocate = matchingCourses.map(c => c._id);

        const results = {
            successCount: 0,
            errors: [],
        };

        // Loop users
        for (let i = 0; i < users.length; i++) {
            const { emailOrUsername, message } = users[i];

            try {
                if (!emailOrUsername) {
                    results.errors.push({
                        index: i,
                        emailOrUsername: null,
                        error: "emailOrUsername required",
                    });
                    continue;
                }

                const normalizedIdentifier = emailOrUsername.toLowerCase().trim();
                const existingUser = await findUserByEmailOrUsername(normalizedIdentifier, recipientType);

                const existing = await Invitation.findOne({
                    institution: institutionId,
                    email: normalizedIdentifier,
                    status: "pending",
                });

                if (existing) {
                    // RESEND
                    existing.message = message;
                    existing.sender = req.user.id;
                    existing.recipientType = recipientType;
                    existing.recipient = existingUser?._id || null;
                    existing.department = department;
                    existing.semester = semester;
                    existing.courses = coursesToAllocate;
                    existing.createdAt = new Date();
                    existing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    await existing.save();

                    if (existingUser?._id) {
                        console.log('🔔 Bulk: Emitting to user:', existingUser._id);
                        global.io?.to(`user:${existingUser._id}`).emit("invitation:new", {
                            _id: existing._id,
                            email: existing.email,
                            institution: existing.institution,
                            recipientType: existing.recipientType,
                            message: existing.message,
                            createdAt: existing.createdAt,
                        });
                    }

                    results.successCount++;
                    continue;
                }

                // Create new invite
                const invite = await Invitation.create({
                    institution: institutionId,
                    email: normalizedIdentifier,
                    recipient: existingUser?._id || null,
                    recipientType,
                    sender: req.user.id,
                    message,
                    type: "join",
                    department,
                    semester,
                    courses: coursesToAllocate,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });

                if (existingUser?._id) {
                    console.log('🔔 Bulk: Emitting new invitation to user:', existingUser._id);
                    global.io?.to(`user:${existingUser._id}`).emit("invitation:new", {
                        _id: invite._id,
                        email: invite.email,
                        institution: invite.institution,
                        recipientType: invite.recipientType,
                        message: invite.message,
                        createdAt: invite.createdAt,
                    });
                }

                results.successCount++;
            } catch (err) {
                results.errors.push({
                    index: i,
                    emailOrUsername,
                    error: err.message,
                });
            }
        }

        res.status(200).json({
            success: true,
            successCount: results.successCount,
            errors: results.errors,
            total: users.length,
        });
    } catch (error) {
        console.error("Bulk invite error:", error);
        res.status(500).json({ message: "Bulk invite failed" });
    }
};
