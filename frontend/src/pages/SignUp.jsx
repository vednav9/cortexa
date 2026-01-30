import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import GreenParticles from "../ui/GreenParticles";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "student",
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Confirm password live check
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    setPasswordMatch(value === formData.password || value === "");
  };

  // ✅ Submit form with JWT session cookie
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      toast.error("Passwords do not match!");
      return;
    }

    setPasswordMatch(true);
    setLoading(true);

    try {
      let apiUrl = "";
      if (formData.userType === "student") {
        apiUrl = "http://localhost:5000/api/student/register";
      } else if (formData.userType === "teacher") {
        apiUrl = "http://localhost:5000/api/teacher/register";
      } else {
        toast.error("Please select a valid user type.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        apiUrl,
        {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.userType,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Account created successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast.error(response.data.message || "Signup failed. Try again.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />

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
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <HiSparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                Cortexa
              </span>
            </Link>

            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 text-sm">Join Cortexa and start your learning journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* User Type Selector */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-3 block">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["student", "teacher"].map((type) => (
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

            {/* Full Name Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            {/* Username Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9_]{3,20}"
                  title="Username must be 3-20 characters (letters, numbers, underscore only)"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                3-20 characters (letters, numbers, underscore)
              </p>
            </div>
            {/* Email Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
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
              <p className="text-xs text-gray-500 mt-1.5">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder:text-gray-500 focus:outline-none transition-all ${!passwordMatch
                    ? "bg-red-500/5 border border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "bg-gray-800/50 border border-gray-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
                {formData.confirmPassword && passwordMatch && formData.confirmPassword.length >= 8 && (
                  <FiCheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                )}
              </div>
              {!passwordMatch && formData.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-gray-800/50 text-emerald-500 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              {!loading && (
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

          {/* Footer Links */}
          <div className="space-y-3 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>

            <p className="text-gray-400 text-sm">
              Registering as an institution?{" "}
              <Link
                to="/institute-signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                Click here
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Protected by enterprise-grade security
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
