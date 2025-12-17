import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authcontext";

import StudentDashboard from "../components/dashboard/StudentDashboard";
import TeacherDashboard from "../components/dashboard/TeacherDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import RedirectingPage from "./RedirectingPage";

const Dashboard = () => {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  // ✅ SAFE REDIRECT (useEffect only)
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  // ⏳ Loading or redirecting
  if (loading || !user) {
    return <RedirectingPage message="Loading your dashboard…" />;
  }

  // 🚪 LOGOUT HANDLER
  const handleLogout = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/${user.role}/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null); // clear auth context
      navigate("/login", { replace: true });
    }
  };

  // 🎯 ROLE-BASED DASHBOARD
  const renderDashboard = () => {
    switch (user.role) {
      case "student":
        return <StudentDashboard onLogout={handleLogout} />;
      case "teacher":
        return <TeacherDashboard onLogout={handleLogout} />;
      case "admin":
        return <AdminDashboard onLogout={handleLogout} />;
      default:
        return <StudentDashboard onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional global logout button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
