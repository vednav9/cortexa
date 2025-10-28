import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "student",
  });
  const navigate = useNavigate();

  // ✅ Auto-login if already authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/student/login",
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        // Save session
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center space-x-3 mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50"
            >
              <HiSparkles className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Cortexa
            </span>
          </Link>

          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Sign in to continue your learning journey
          </p>

          {error && (
            <p className="text-red-400 bg-red-900/20 rounded-md p-2 text-center mb-3">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full pl-10 pr-12 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* User Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                I am a
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.userType}
                  onChange={(e) =>
                    setFormData({ ...formData, userType: e.target.value })
                  }
                  required
                  className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white appearance-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)",
              }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
              {loading ? "Signing In..." : "Sign In"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
