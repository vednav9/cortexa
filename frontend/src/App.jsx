import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import InstituteSignUp from "./pages/InstituteSignUp";
import NotFound from "./pages/NotFound";

// Dashboard
import CortexaDashboard from "./components/dashboard/CortexaDashboard";

// Layout
import Navbar from "./components/Navbar";

// Auth
import { AuthProvider, useAuth } from "./context/authcontext";

/* ===========================
   Protected Route (OLD STYLE)
=========================== */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ===========================
   App
=========================== */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black flex flex-col">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/institute-signup" element={<InstituteSignUp />} />

              {/* Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CortexaDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
