import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../context/authcontext";
import RedirectingPage from "./RedirectingPage";
import GreenParticles from "../ui/GreenParticles";

const Login = () => {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "student",
  });

  // ✅ AUTO-REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // ✅ HANDLE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const apiEndpoint = `${API_BASE_URL}/${formData.userType}/login`;

      const res = await axios.post(
        apiEndpoint,
        {
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        setUser(res.data.user);

        setRedirecting(true);
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ SHOW REDIRECTING UX
  if (redirecting) {
    return <RedirectingPage message="Welcome back! Preparing your dashboard…" />;
  }

  // ✅ SHOW LOADING UX
  if (loading) {
    return <RedirectingPage message="Checking your session…" />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Use your GreenParticles component */}
      <GreenParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Card Container */}
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-emerald-500/10 rounded-3xl p-8 shadow-2xl">

          {/* Logo & Title Section */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-6 group">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <img src="/logo.png" alt="Cortexa logo" className="w-full h-full object-contain scale-125" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                Cortexa
              </span>
            </Link>

            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Sign in to continue to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* User Type Selector */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-3 block">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["student", "teacher", "admin"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: type })}
                    className={`py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all ${formData.userType === type
                      ? "bg-gradient-to-r from-emerald-400 to-green-500 text-black shadow-lg"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700/50"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Email/Username Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Email / Username
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com or username"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  placeholder="Enter your password"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
            >
              <span>{submitting ? "Signing In..." : "Sign In"}</span>
              {!submitting && (
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/40 text-gray-500">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Protected by enterprise-grade security
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
