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

const Notifications = ({ realtimeInvites = [], clearUnread }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);


    /* ============================
    CLEAR UNREAD COUNT (ON OPEN)
 ============================ */
    useEffect(() => {
        clearUnread?.();
    }, []);

    /* ============================
       FETCH INVITATIONS
    ============================ */
    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const { data } = await invitationAPI.getAll("pending");

                const apiInvites = data?.invitations || [];
                const merged = [...realtimeInvites, ...apiInvites];

                const unique = Array.from(
                    new Map(merged.map((i) => [i._id, i])).values()
                );

                setInvitations(unique);
            } catch (err) {
                toast.error("Failed to load invitations");
            } finally {
                setInitialized(true); // ✅ IMPORTANT
            }
        };

        fetchInvitations();
    }, [realtimeInvites]);



    /* ============================
       ACTION HANDLERS
    ============================ */
    const handleAccept = async (id) => {
        try {
            await invitationAPI.accept(id);

            toast.success("Invitation accepted");

            // 🔔 notify dashboard to refresh institution
            window.dispatchEvent(new Event("institution-updated"));

            setInvitations((prev) => prev.filter((i) => i._id !== id));
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

    // if (loading) {
    //     return <LoadingPage message="Loading notifications..." />;
    // }

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* ============================
         INVITATIONS
      ============================ */}
            {/* INVITATIONS LIST */}
            {initialized && invitations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invitations.map((inv, index) => (
                        <motion.div
                            key={inv._id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white border border-gray-200/60 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-200/60 transition-all duration-300 pointer-events-auto relative overflow-hidden flex flex-col justify-between"
                        >
                            {/* Hover accent line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-200 group-hover:from-emerald-400 group-hover:to-emerald-500 opacity-80 group-hover:opacity-100 transition-all duration-500"></div>

                            <div>
                                {/* HEADER */}
                                <div className="flex items-start justify-between gap-4 mb-4 mt-1">
                                    <div className="flex flex-1 items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-lg shadow-sm">
                                            {inv.institution?.name?.slice(0, 2).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-gray-900 leading-tight truncate">
                                                {inv.institution?.name}
                                            </h4>
                                            <p className="text-[13px] text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
                                                <FiMail className="w-3.5 h-3.5" />
                                                Invited by {inv.sender?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg">
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* MESSAGE */}
                                {inv.message && (
                                    <p className="text-[13px] text-gray-600 mb-5 pl-2 border-l-2 border-emerald-200 bg-emerald-50/50 p-2.5 rounded-r-lg">
                                        “{inv.message}”
                                    </p>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 mt-auto border-t border-gray-100/80 pt-4">
                                <button
                                    onClick={() => handleAccept(inv._id)}
                                    className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200/60
                 rounded-xl text-[13px] font-semibold transition-all shadow-sm
                 relative z-10 pointer-events-auto flex justify-center items-center gap-2"
                                >
                                    <FiCheck className="w-4 h-4" />
                                    Accept
                                </button>

                                <button
                                    onClick={() => handleReject(inv._id)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200/80 
                 text-gray-600 rounded-xl text-[13px] font-semibold
                 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm
                 relative z-10 pointer-events-auto flex justify-center items-center gap-2"
                                >
                                    <FiX className="w-4 h-4" />
                                    Decline
                                </button>
                            </div>
                        </motion.div>

                    ))}
                </div>
            )}
            {/* EMPTY STATE */}
            {initialized && invitations.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-white border border-gray-200/60 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                >
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100/50">
                        <FiCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-gray-900 text-lg font-bold tracking-tight mb-1">
                        All Caught Up!
                    </h3>
                    <p className="text-[13px] text-gray-500 font-medium">
                        You have no new invitations at the moment.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default Notifications;
