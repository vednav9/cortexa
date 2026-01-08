import Invitation from '../models/invitation.js';
import Institution from '../models/institution.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import Admin from '../models/admin.js';
// ===============================
// GET USER INVITATIONS
// ===============================
export const getInvitations = async (req, res) => {
    try {
        const { status } = req.query;

        let userEmail = null;

        if (req.user.role === 'student') {
            const student = await Student.findById(req.user.id).select('email');
            userEmail = student?.email?.toLowerCase();
        } else if (req.user.role === 'teacher') {
            const teacher = await Teacher.findById(req.user.id).select('email');
            userEmail = teacher?.email?.toLowerCase();
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
                }] : [])
            ]
        };

        if (status) {
            query.status = status;
        }

        const invitations = await Invitation.find(query)
            .populate('institution', 'name code logo description')
            .populate('sender', 'fullName email')
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
            email,
            message,
            type = "join",
        } = req.body;

        if (!institutionId || !recipientType) {
            return res.status(400).json({
                message: 'institutionId and recipientType are required',
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

        /* ======================================================
           EMAIL-BASED INVITE (RESEND SUPPORTED)
        ====================================================== */
        if (email) {
            const normalizedEmail = email.toLowerCase();

            const existingInvite = await Invitation.findOne({
                institution: institutionId,
                email: normalizedEmail,
                status: 'pending',
            });

            // 🔁 RESEND INSTEAD OF BLOCK
            if (existingInvite) {
                existingInvite.message = message;
                existingInvite.sender = req.user.id;
                existingInvite.type = type;
                existingInvite.createdAt = new Date();
                existingInvite.expiresAt = new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
                );

                await existingInvite.save();

                return res.status(200).json({
                    message: 'Invitation re-sent successfully',
                    invitation: existingInvite,
                });
            }

            // ✅ CREATE NEW INVITE
            const invitation = await Invitation.create({
                institution: institutionId,
                recipientType,
                email: normalizedEmail,
                sender: req.user.id,
                message,
                type,
                expiresAt: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
            });

            // 🔔 REALTIME NOTIFICATION (EMAIL BASED)
            // EMAIL invite → broadcast (no userId yet)
            global.io.emit("invitation:new", {
                invitationId: invitation._id,
                email: invitation.email,
                recipientType: invitation.recipientType,
                institution: institutionId,
                message: invitation.message,
                createdAt: invitation.createdAt,
            });


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
                message: 'recipientId or email is required',
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
            expiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
        });
        // 🔔 REALTIME NOTIFICATION (USER-ID BASED)
        global.io
            .to(`user:${recipientId}`)
            .emit("invitation:new", {
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

        // Expiry check (SAFE)
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            invitation.status = "expired";
            await invitation.save();
            return res.status(400).json({ message: "Invitation expired" });
        }

        // 🔐 Authorization
        if (
            invitation.recipient &&
            invitation.recipient.toString() !== req.user.id
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // 🚫 Enforce single institution
        if (invitation.recipientType === "Student") {
            const student = await Student.findById(req.user.id);
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.institution) {
                return res.status(400).json({ message: "Already joined an institution" });
            }

            student.institution = invitation.institution;
            student.status = "active";
            await student.save();
        }

        if (invitation.recipientType === "Teacher") {
            const teacher = await Teacher.findById(req.user.id);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });
            if (teacher.institution) {
                return res.status(400).json({ message: "Already joined an institution" });
            }

            teacher.institution = invitation.institution;
            teacher.status = "active";
            await teacher.save();
        }

        // // 📊 Update institution (SAFE)
        // const institution = await Institution.findById(invitation.institution);
        // if (institution) {
        //     // ✅ ensure arrays
        //     institution.students = institution.students || [];
        //     institution.teachers = institution.teachers || [];

        //     // ✅ ensure stats object
        //     institution.stats = institution.stats || {
        //         totalStudents: 0,
        //         totalTeachers: 0,
        //     };

        //     if (
        //         invitation.recipientType === "Student" &&
        //         !institution.students.includes(req.user.id)
        //     ) {
        //         institution.students.push(req.user.id);
        //         institution.stats.totalStudents += 1;
        //     }

        //     if (
        //         invitation.recipientType === "Teacher" &&
        //         !institution.teachers.includes(req.user.id)
        //     ) {
        //         institution.teachers.push(req.user.id);
        //         institution.stats.totalTeachers += 1;
        //     }

        //     await institution.save();
        // }


        // Finalize invitation
        invitation.status = "accepted";
        invitation.recipient = req.user.id;
        invitation.respondedAt = new Date();
        await invitation.save();

        global.io
            .to(`user:${req.user.id}`)
            .emit("institution-updated", {
                institutionId: invitation.institution,
                role: invitation.recipientType,
            });

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

        if (invitation.recipient && invitation.recipient.toString() !== req.user.id) {
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

        if (invitation.institution.admin.toString() !== req.user.id) {
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

        // 👇 Explicit expiry handling
        query.$or = [
            { expiresAt: { $gt: new Date() } },
            { status: { $ne: 'pending' } }
        ];

        const invitations = await Invitation.find(query)
            .populate('sender', 'fullName email')
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
// BULK INVITE USERS (STUDENT / TEACHER)
// ===============================
export const bulkInviteUsers = async (req, res) => {
    try {
        const { institutionId, recipientType, users } = req.body;

        // 1️⃣ Validation
        if (!institutionId || !recipientType || !Array.isArray(users)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        if (!["Student", "Teacher"].includes(recipientType)) {
            return res.status(400).json({ message: "Invalid recipientType" });
        }

        // 2️⃣ Admin check
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can invite users" });
        }

        const admin = await Admin.findById(req.user.id);
        if (!admin || admin.institution.toString() !== institutionId) {
            return res.status(403).json({ message: "Unauthorized institution access" });
        }

        const results = {
            successCount: 0,
            errors: [],
        };

        // 3️⃣ Loop users
        for (let i = 0; i < users.length; i++) {
            const { fullName, email, message } = users[i];

            try {
                if (!fullName || !email) {
                    results.errors.push({
                        index: i,
                        email,
                        error: "fullName and email required",
                    });
                    continue;
                }

                const normalizedEmail = email.toLowerCase();

                // 4️⃣ Check existing pending invite
                const existing = await Invitation.findOne({
                    institution: institutionId,
                    email: normalizedEmail,
                    status: "pending",
                });

                if (existing) {
                    // 🔁 RESEND
                    existing.message = message;
                    existing.sender = req.user.id;
                    existing.recipientType = recipientType;
                    existing.createdAt = new Date();
                    existing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    await existing.save();

                    results.successCount++;
                    continue;
                }

                // 5️⃣ Create new invite
                const invite = await Invitation.create({
                    institution: institutionId,
                    email: normalizedEmail,
                    fullName,
                    recipientType,
                    sender: req.user.id,
                    message,
                    type: "join",
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });

                // 🔔 SOCKET EMIT (REALTIME)
                global.io.emit("invitation:new", {
                    invitationId: invite._id,
                    email: invite.email,
                    recipientType: invite.recipientType,
                    institution: institutionId,
                    message: invite.message,
                    createdAt: invite.createdAt,
                });

                results.successCount++;
            } catch (err) {
                results.errors.push({
                    index: i,
                    email,
                    error: err.message,
                });
            }
        }

        // 6️⃣ Final response
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

