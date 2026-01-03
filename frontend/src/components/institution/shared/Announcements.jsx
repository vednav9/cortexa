import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiPlus, FiEdit2, FiTrash2, FiClock, FiUser, FiX } from "react-icons/fi";
import { BsPinAngle } from "react-icons/bs";
import { useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../../context/authcontext";
import { announcementAPI } from "../../../services/api";
import { InstitutionContext } from "../../../context/InstitutionContext";
import toast from "react-hot-toast";

export default function Announcements() {
    const { hasAccess } = useOutletContext();
    const { institution } = React.useContext(InstitutionContext);
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "general",
        priority: "normal",
        targetAudience: ["all"],
        isPinned: false
    });

    const canCreate = hasAccess && (user?.role === 'admin' || user?.role === 'teacher');

    useEffect(() => {
        fetchAnnouncements();
    }, [institution]);

    const fetchAnnouncements = async () => {
        if (!institution) return;
        
        try {
            setLoading(true);
            const { data } = await announcementAPI.getAll(institution._id);
            setAnnouncements(data.announcements || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        try {
            await announcementAPI.create({
                ...formData,
                institution: institution._id
            });
            
            toast.success('Announcement created successfully!');
            setShowCreateModal(false);
            setFormData({
                title: "",
                content: "",
                type: "general",
                priority: "normal",
                targetAudience: ["all"],
                isPinned: false
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            toast.error(error.response?.data?.message || 'Failed to create announcement');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        
        try {
            await announcementAPI.delete(id);
            toast.success('Announcement deleted');
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            normal: 'bg-blue-100 text-blue-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700'
        };
        return colors[priority] || colors.normal;
    };

    const getTypeIcon = (type) => {
        return <FiBell className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading announcements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8 mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                                <FiBell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                                <p className="text-gray-500 text-sm">Stay updated with latest news</p>
                            </div>
                        </div>
                        
                        {canCreate && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <FiPlus className="w-5 h-5" />
                                Create Announcement
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Announcements List */}
                {hasAccess ? (
                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg p-12 text-center"
                            >
                                <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No announcements yet</p>
                                <p className="text-gray-400 text-sm mt-2">Check back later for updates</p>
                            </motion.div>
                        ) : (
                            announcements.map((announcement, index) => (
                                <motion.div
                                    key={announcement._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {announcement.isPinned && (
                                                    <BsPinAngle className="w-4 h-4 text-emerald-500" />
                                                )}
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {announcement.title}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                                                    {announcement.priority}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mt-2 leading-relaxed">
                                                {announcement.content}
                                            </p>
                                        </div>
                                        
                                        {announcement.author._id === user._id && (
                                            <button
                                                onClick={() => handleDelete(announcement._id)}
                                                className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <FiUser className="w-4 h-4" />
                                            <span>{announcement.author.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiClock className="w-4 h-4" />
                                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl shadow-lg p-12 text-center"
                    >
                        <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">You need to be a member to view announcements</p>
                    </motion.div>
                )}

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowCreateModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Create Announcement</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <FiX className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Enter announcement title"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Content
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.content}
                                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Write your announcement..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Type
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="general">General</option>
                                                <option value="academic">Academic</option>
                                                <option value="event">Event</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="exam">Exam</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Priority
                                            </label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isPinned"
                                            checked={formData.isPinned}
                                            onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                                            className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                                        />
                                        <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">
                                            Pin this announcement to the top
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                        >
                                            Create
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
