import React, { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiArrowUp } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import api from "../services/api";
import { InstitutionContext } from "../context/InstitutionContext";
import { useAuth } from "../context/authcontext";
import InstitutionNavbar from "../components/institution/InstitutionNavbar";
import InstitutionMenu from "../components/institution/InstitutionMenu";

const getCachedInstitution = (slug) => {
    try {
        const raw = sessionStorage.getItem(`institution_${slug}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const setCachedInstitution = (slug, data) => {
    try {
        sessionStorage.setItem(`institution_${slug}`, JSON.stringify(data));
    } catch { }
};

export default function InstitutionLayout() {
    const { slug } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const cached = getCachedInstitution(slug);
    const [institution, setInstitution] = useState(cached);
    const [loading, setLoading] = useState(!cached);   // skip spinner if cached
    const [hasAccess, setHasAccess] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const fetchInstitution = async () => {
            try {
                const res = await api.get(`/institutions/slug/${slug}`);
                const inst = res.data.institution;

                // Cache for instant next visit
                setCachedInstitution(slug, inst);
                setInstitution(inst);

                if (user && user.institution) {
                    // Handle both ObjectId string and populated institution object
                    const userInstitutionId = typeof user.institution === 'string'
                        ? user.institution
                        : user.institution._id;

                    const userInstitutionSlug = typeof user.institution === 'object' && user.institution.slug
                        ? user.institution.slug
                        : null;

                    const currentInstitutionId = res.data.institution._id;
                    const currentSlug = res.data.institution.slug;

                    // Check by ID (most reliable) or slug
                    const hasAccessById = userInstitutionId === currentInstitutionId;
                    const hasAccessBySlug = userInstitutionSlug && userInstitutionSlug === currentSlug;
                    const hasAccessBySlugParam = slug && (userInstitutionSlug === slug);

                    const accessGranted = hasAccessById || hasAccessBySlug || hasAccessBySlugParam;

                    setHasAccess(accessGranted);
                } else {
                    setHasAccess(false);
                }
            } catch (err) {
                console.error("Institution fetch failed", err);
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchInstitution();
        }
    }, [slug, user]);

    // Handle scroll to show/hide scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Back to Cortexa Dashboard
    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                    >
                        <motion.div
                            animate={{ rotate: [0, -180, -360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <HiSparkles className="w-8 h-8 text-white" />
                        </motion.div>
                    </motion.div>
                    <p className="text-gray-600 font-semibold text-lg">Loading institution...</p>
                    <p className="text-gray-400 text-sm mt-1">Please wait</p>
                </div>
            </div>
        );
    }

    if (!institution) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Institution Not Found</h2>
                    <p className="text-gray-500 mb-6">The institution you're looking for doesn't exist.</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        Back to Dashboard
                    </motion.button>
                </div>
            </div>
        );
    }

    const brandColor = institution.branding?.primaryColor || '#10b981';

    return (
        <InstitutionContext.Provider value={{ institution }}>
            <div className="min-h-screen bg-gray-50">
                {/* Fixed Header Container */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-white">
                    {/* Institution Navbar */}
                    <InstitutionNavbar
                        institution={institution}
                        onBackToDashboard={handleBackToDashboard}
                        brandColor={brandColor}
                    />

                    {/* Institution Menu - Role-based horizontal menu */}
                    <InstitutionMenu
                        userRole={user?.role}
                        hasAccess={hasAccess}
                        brandColor={brandColor}
                    />
                </div>

                {/* Page Content - Add top padding to account for fixed header */}
                <div className="relative pt-[112px]">
                    <Outlet context={{ hasAccess, institution }} />
                </div>

                {/* Scroll to Top Button */}
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white z-[300] transition-all hover:shadow-2xl"
                            style={{
                                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                            }}
                            aria-label="Scroll to top"
                        >
                            <FiArrowUp className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </InstitutionContext.Provider>
    );
}
