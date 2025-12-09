import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiCheck,
  FiImage,
} from "react-icons/fi";
import { FaLongArrowAltRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

// Job titles options
const jobTitles = [
  { value: "", label: "Select Job Title" },
  { value: "principal", label: "Principal" },
  { value: "dean", label: "Dean" },
  { value: "director", label: "Director" },
  { value: "administrator", label: "Administrator" },
  { value: "registrar", label: "Registrar" },
  { value: "other", label: "Other" },
];

// Institution types
const institutionTypes = [
  "Select Type",
  "University",
  "College",
  "School",
  "Training Center",
  "Academy",
  "Institute",
  "Other",
];

const InstituteSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    phone: "",
    authorized: true,
    institutionName: "",
    institutionType: "",
    website: "",
    address1: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    description: "",
    customURL: "",
    brandColor: "#1e3a8a",
  });

  // Check if passwords match
  const passwordMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword !== "";

  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    setFormData({ ...formData, confirmPassword: e.target.value });
  };

  // ✅ Validate current step before proceeding
  const validateStep = () => {
    setError("");
    
    if (currentStep === 1) {
      // Validate Step 1 fields
      if (!formData.fullName.trim()) {
        setError("Full name is required");
        return false;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        return false;
      }
      if (!formData.password) {
        setError("Password is required");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
      if (!formData.confirmPassword) {
        setError("Please confirm your password");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (!formData.jobTitle) {
        setError("Job title is required");
        return false;
      }
      if (!formData.phone.trim()) {
        setError("Phone number is required");
        return false;
      }
    } else if (currentStep === 2) {
      // Validate Step 2 fields
      if (!formData.institutionName.trim()) {
        setError("Institution name is required");
        return false;
      }
      if (!formData.institutionType || formData.institutionType === "Select Type") {
        setError("Institution type is required");
        return false;
      }
      if (!formData.address1.trim()) {
        setError("Address is required");
        return false;
      }
      if (!formData.city.trim()) {
        setError("City is required");
        return false;
      }
      if (!formData.state.trim()) {
        setError("State is required");
        return false;
      }
      if (!formData.country.trim()) {
        setError("Country is required");
        return false;
      }
    }
    
    return true;
  };

  // ✅ Handle next step (NOT submission)
  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        setError("");
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  // ✅ Submit form ONLY on step 3
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check we're on step 3
    if (currentStep !== 3) {
      console.log("⚠️ Not on final step, preventing submission");
      return;
    }

    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      
      console.log("📤 Submitting registration data:", {
        email: formData.email,
        fullName: formData.fullName,
        institutionName: formData.institutionName,
      });

      const response = await axios.post(
        "http://localhost:5000/api/admin/register",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201 || response.status === 200) {
        alert("Institution registered successfully! Please login with your credentials.");
        navigate("/login");
      }
    } catch (error) {
      console.error("❌ Signup failed:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       "Something went wrong during registration.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 relative">
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
        className="relative w-full max-w-2xl"
      >
        <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center space-x-3 mb-6"
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

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Join Cortexa as an educational institution
          </h2>

          {/* Progress Indicator - ✅ FIXED: Use currentStep instead of step */}
          <div className="flex items-center justify-center mb-6 space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-emerald-400 to-green-500 text-black"
                      : "bg-emerald-500/10 text-gray-500 border border-emerald-500/20"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      currentStep > step ? "bg-emerald-400" : "bg-emerald-500/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-center mb-6 text-sm">
            {/* ✅ FIXED: Use currentStep instead of step */}
            {currentStep === 1 ? 'Main Info' : currentStep === 2 ? 'Institution Details' : 'Branding'}
          </p>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* ✅ Form with proper step handling */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1 - Main Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        placeholder="admin@university.edu"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                        className="w-full pl-10 pr-12 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                      {formData.confirmPassword && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                          {passwordMatch ? (
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="text-red-500 text-xs">✗</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Job Title *
                    </label>
                    <select
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                    >
                      {jobTitles.map((job) => (
                        <option key={job.value} value={job.value} className="bg-gray-900">
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Authorized Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="authorized"
                      checked={formData.authorized}
                      onChange={handleChange}
                      className="w-5 h-5 bg-emerald-500/5 border-emerald-500/20 rounded focus:ring-emerald-400"
                    />
                    <label className="text-sm text-gray-300">
                      I am authorized to register this institution
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 2 - Institution Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Institution Name */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      placeholder="University of Example"
                      value={formData.institutionName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                    />
                  </div>

                  {/* Institution Type */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Institution Type *
                    </label>
                    <select
                      name="institutionType"
                      value={formData.institutionType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                    >
                      {institutionTypes.map((type) => (
                        <option key={type} value={type} className="bg-gray-900">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        name="website"
                        placeholder="https://university.edu"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Address *
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="address1"
                        placeholder="123 Main Street"
                        value={formData.address1}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* City, State, Country in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        placeholder="New York"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        placeholder="NY"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        name="country"
                        placeholder="USA"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="10001"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        name="description"
                        placeholder="Brief description of your institution..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 text-white resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3 - Branding */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Custom URL */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Custom URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 border-r-0 rounded-l-lg text-gray-400">
                        cortexa.com/
                      </span>
                      <input
                        type="text"
                        name="customURL"
                        placeholder="your-institution"
                        value={formData.customURL}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-r-lg focus:outline-none focus:border-emerald-400 text-white"
                      />
                    </div>
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Brand Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        name="brandColor"
                        value={formData.brandColor}
                        onChange={handleChange}
                        className="w-16 h-12 rounded-lg cursor-pointer bg-emerald-500/5 border border-emerald-500/20"
                      />
                      <input
                        type="text"
                        value={formData.brandColor}
                        readOnly
                        className="flex-1 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">
                      Institution Logo
                    </label>
                    <div className="border-2 border-dashed border-emerald-500/20 rounded-lg p-6 text-center hover:border-emerald-400/50 transition-colors cursor-pointer">
                      <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        Click to upload logo (coming soon)
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                    <h3 className="text-emerald-400 font-semibold mb-2">
                      Preview
                    </h3>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: formData.brandColor }}
                      />
                      <div>
                        <p className="text-white font-semibold">
                          {formData.institutionName || "Your Institution"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          cortexa.com/{formData.customURL || "your-url"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-emerald-500/20">
              {currentStep > 1 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg transition-all border border-emerald-500/20"
                >
                  Back
                </motion.button>
              )}

              {currentStep < 3 ? (
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center space-x-2"
                >
                  <span>Next</span>
                  <FaLongArrowAltRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>{loading ? "Registering..." : "Complete Registration"}</span>
                  <FiCheck className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InstituteSignUp;
