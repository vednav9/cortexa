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
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import GreenParticles from "../ui/GreenParticles";

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
    brandColor: "#10b981",
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

  // Validate current step before proceeding
  const validateStep = () => {
    setError("");

    if (currentStep === 1) {
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

  // Handle next step
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep !== 3) {
      return;
    }

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <GreenParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl z-10"
      >
        {/* Card Container */}
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-emerald-500/10 rounded-3xl p-8 shadow-2xl">

          {/* Logo & Title Section */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <HiSparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                Cortexa
              </span>
            </Link>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Register Your Institution
            </h2>
            <p className="text-gray-400 text-sm">
              Join Cortexa as an educational institution
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep >= step
                    ? "bg-gradient-to-r from-emerald-400 to-green-500 text-black shadow-lg"
                    : "bg-gray-800/50 text-gray-500 border border-gray-700"
                    }`}
                >
                  {currentStep > step ? <FiCheck className="w-5 h-5" /> : step}
                </div>
                {index < 2 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all ${currentStep > step ? "bg-emerald-400" : "bg-gray-700"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Label */}
          <p className="text-center text-gray-400 text-sm mb-6 font-medium">
            {currentStep === 1 ? 'Personal Information' : currentStep === 2 ? 'Institution Details' : 'Branding & Customization'}
          </p>

          {/* Error Display */}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1 - Personal Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Full Name */}
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

                  {/* Email */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        placeholder="admin@university.edu"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                  </div>

                  {/* Confirm Password */}
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
                        className={`w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder:text-gray-500 focus:outline-none transition-all ${formData.confirmPassword && !passwordMatch
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
                      {formData.confirmPassword && passwordMatch && (
                        <FiCheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Job Title & Phone in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        Job Title
                      </label>
                      <select
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.75rem center",
                          backgroundSize: "1.25rem",
                        }}
                      >
                        {jobTitles.map((job) => (
                          <option key={job.value} value={job.value} className="bg-gray-900">
                            {job.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="+1 234 567 8900"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Authorized Checkbox */}
                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      name="authorized"
                      checked={formData.authorized}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800/50 text-emerald-500 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Institution Name */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      placeholder="University of Example"
                      value={formData.institutionName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  {/* Institution Type & Website */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        Institution Type
                      </label>
                      <select
                        name="institutionType"
                        value={formData.institutionType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.75rem center",
                          backgroundSize: "1.25rem",
                        }}
                      >
                        {institutionTypes.map((type) => (
                          <option key={type} value={type} className="bg-gray-900">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        Website
                      </label>
                      <div className="relative">
                        <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="url"
                          name="website"
                          placeholder="https://university.edu"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Street Address
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        name="address1"
                        placeholder="123 Main Street"
                        value={formData.address1}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* City, State, Country, Postal Code in Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        placeholder="New York"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        placeholder="NY"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        placeholder="USA"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="10001"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Description (Optional)
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
                      <textarea
                        name="description"
                        placeholder="Brief description of your institution..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3 - Branding */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Custom URL */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Custom URL Slug
                    </label>
                    <div className="flex items-stretch">
                      <span className="inline-flex items-center px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 border-r-0 rounded-l-xl text-gray-400 text-sm">
                        cortexa.com/
                      </span>
                      <input
                        type="text"
                        name="customURL"
                        placeholder="your-institution"
                        value={formData.customURL}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-r-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Choose a unique URL for your institution</p>
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Brand Color
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        name="brandColor"
                        value={formData.brandColor}
                        onChange={handleChange}
                        className="w-16 h-14 rounded-xl cursor-pointer bg-gray-800/50 border border-gray-700/50"
                      />
                      <input
                        type="text"
                        value={formData.brandColor}
                        readOnly
                        className="flex-1 px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Placeholder */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      Institution Logo (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer bg-gray-800/20">
                      <FiImage className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">
                        Click to upload logo
                      </p>
                      <p className="text-gray-600 text-xs mt-1">(Coming soon)</p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-emerald-400 font-semibold mb-4 text-sm">
                      Preview
                    </h3>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: formData.brandColor }}
                      >
                        <HiSparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
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
            <div className="flex items-center justify-between pt-6 border-t border-gray-700/50">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 font-medium rounded-xl transition-all border border-gray-700 flex items-center gap-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
                >
                  <span>Next Step</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>{loading ? "Registering..." : "Complete Registration"}</span>
                  <FiCheck className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {/* Footer Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign In
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

export default InstituteSignUp;
