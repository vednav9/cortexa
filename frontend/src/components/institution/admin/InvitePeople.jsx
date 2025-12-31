import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiUserPlus, FiMail, FiUsers, FiCheckCircle } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import { invitationAPI } from "../../../services/api";
import { InstitutionContext } from "../../../context/InstitutionContext";
import toast from "react-hot-toast";

export default function InvitePeople() {
    const { hasAccess } = useOutletContext();
    const { institution } = React.useContext(InstitutionContext);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        recipientType: "Student",
        type: "join",
        message: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const canInvite = hasAccess && user?.role === 'admin';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!canInvite) {
            toast.error('Only admins can send invitations');
            return;
        }

        setLoading(true);
        setSuccess(false);

        try {
            await invitationAPI.create({
                ...formData,
                institution: institution._id
            });

            toast.success('Invitation sent successfully!');
            setSuccess(true);
            setFormData({
                email: "",
                recipientType: "Student",
                type: "join",
                message: ""
            });

            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <FiUserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invite People</h1>
                            <p className="text-gray-500 text-sm">Add new members to your institution</p>
                        </div>
                    </div>

                    {canInvite ? (
                        <div className="space-y-6">
                            {/* Success Message */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3"
                                >
                                    <FiCheckCircle className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="text-green-800 font-semibold">Invitation sent!</p>
                                        <p className="text-green-600 text-sm">The recipient will receive an email notification.</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Invitation Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FiMail className="inline w-4 h-4 mr-2" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="recipient@example.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Enter the email address of the person you want to invite
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FiUsers className="inline w-4 h-4 mr-2" />
                                        Role
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData({...formData, recipientType: "Student"})}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                formData.recipientType === "Student"
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="font-semibold">Student</div>
                                            <div className="text-xs text-gray-500 mt-1">Learner access</div>
                                        </motion.button>

                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormData({...formData, recipientType: "Teacher"})}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                formData.recipientType === "Teacher"
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="font-semibold">Teacher</div>
                                            <div className="text-xs text-gray-500 mt-1">Educator access</div>
                                        </motion.button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Invitation Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="join">Join Institution</option>
                                        <option value="collaborate">Collaboration</option>
                                        <option value="teach">Teaching Opportunity</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Personal Message (Optional)
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder="Add a personal message to your invitation..."
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                                        loading
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-xl"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending Invitation...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiUserPlus className="w-5 h-5" />
                                            Send Invitation
                                        </span>
                                    )}
                                </motion.button>
                            </form>

                            {/* Info Box */}
                            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-900 mb-2">📧 How invitations work</h3>
                                <ul className="space-y-2 text-sm text-blue-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>Recipients receive an email with an invitation link</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>They can accept or decline the invitation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>Invitations expire after 30 days</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>You can track invitation status from the dashboard</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FiUserPlus className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg">Only admins can invite people</p>
                            <p className="text-gray-400 text-sm mt-2">Contact your institution administrator for help</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
