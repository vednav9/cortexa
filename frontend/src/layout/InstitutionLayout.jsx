import React, { useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import api from "../services/api";
import { InstitutionContext } from "../context/InstitutionContext";
import InstitutionNavbar from "../components/institution/InstitutionNavbar";

export default function InstitutionLayout() {
    const { slug } = useParams();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitution = async () => {
            try {
                const res = await api.get(`/institutions/${slug}`);
                setInstitution(res.data.institution);
            } catch (err) {
                console.error("Institution fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitution();
    }, [slug]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading institution…</div>;
    }

    if (!institution) {
        return <div className="min-h-screen flex items-center justify-center">Institution not found</div>;
    }

    // This layout is only for public institution pages (courses, etc.)
    return (
        <InstitutionContext.Provider value={{ institution }}>
            <InstitutionNavbar institution={institution} institutionSlug={slug} />
            <Outlet />
        </InstitutionContext.Provider>
    );
}
