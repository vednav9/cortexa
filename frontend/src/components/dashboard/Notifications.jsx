import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    FiBell,
    FiMail,
    FiClock,
    FiCheck,
    FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { invitationAPI } from "../../services/api";
import { LoadingPage } from "../common/LoadingSpinner";

const Notifications = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ============================
       FETCH INVITATIONS
    ============================ */
    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const { data } = await invitationAPI.getAll("pending");
                setInvitations(data?.invitations || []);
            } catch (err) {
                toast.error("Failed to load invitations");
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, []);

    /* ============================
       ACTION HANDLERS
    ============================ */
    const handleAccept = async (id) => {
        try {
            await invitationAPI.accept(id);
            setInvitations((prev) => prev.filter((i) => i._id !== id));
            toast.success("Invitation accepted");
        } catch {
            toast.error("Failed to accept invitation");
        }
    };

    const handleReject = async (id) => {
        try {
            await invitationAPI.reject(id);
            setInvitations((prev) => prev.filter((i) => i._id !== id));
            toast.success("Invitation rejected");
        } catch {
            toast.error("Failed to reject invitation");
        }
    };

    if (loading) {
        return <LoadingPage message="Loading notifications..." />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* ============================
         HERO HEADER
      ============================ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiBell className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-sm opacity-90">
                            Invitations, updates & announcements
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================
         INVITATIONS
      ============================ */}
            {invitations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invitations.map((inv, index) => (
                        <motion.div
                            key={inv._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border-2 border-emerald-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all"
                        >
                            {/* HEADER */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                    {inv.institution?.name?.slice(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-bold text-gray-900 truncate">
                                        {inv.institution?.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 flex items-center gap-1 truncate">
                                        <FiMail className="w-4 h-4" />
                                        {inv.sender?.email}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <FiClock className="w-4 h-4" />
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* MESSAGE */}
                            {inv.message && (
                                <p className="text-sm text-gray-600 mb-4 italic">
                                    “{inv.message}”
                                </p>
                            )}

                            {/* ACTIONS */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAccept(inv._id)}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                >
                                    <FiCheck /> Accept
                                </button>

                                <button
                                    onClick={() => handleReject(inv._id)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 flex items-center justify-center gap-2 transition-all"
                                >
                                    <FiX /> Decline
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* ============================
                   EMPTY STATE
                ============================ */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border-2 border-gray-100 p-16 text-center"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiBell className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                        All Caught Up!
                    </h3>
                    <p className="text-sm text-gray-500">
                        You have no new invitations at the moment
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default Notifications;
