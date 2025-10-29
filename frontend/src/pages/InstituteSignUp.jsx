import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "react-icons/fi";
import { FaLongArrowAltRight } from "react-icons/fa";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
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

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form data as JSON
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      alert("Passwords do not match!");
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
        alert("Institution registered successfully!");
        navigate("/login");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      alert(
        error.response?.data?.message ||
        "Something went wrong during registration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-2xl"
      >
        {/* Card */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">

          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-3 mb-6">
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

          <h2 className="text-3xl font-bold text-white text-center mb-2">Register Your Institution</h2>
          <p className="text-gray-400 text-center mb-8">Join Cortexa as an educational institution</p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-emerald-500/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Steps */}
              {[1, 2, 3].map((step) => (
                <div key={step} className="relative z-10">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step < currentStep
                      ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-black'
                      : step === currentStep
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-black'
                        : 'bg-emerald-500/10 text-gray-400 border border-emerald-500/20'
                      }`}
                    animate={{ scale: step === currentStep ? 1.1 : 1 }}
                  >
                    {step < currentStep ? <FiCheck className="w-5 h-5" /> : step}
                  </motion.div>
                  <p className="text-xs text-gray-400 mt-2 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {step === 1 ? 'Main' : step === 2 ? 'Details' : 'Branding'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Main */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Full Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          placeholder="you@institution.edu"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={8}
                          className="w-full pl-10 pr-12 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                        >
                          {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Confirm Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          required
                          className={`w-full pl-10 pr-12 py-3 bg-emerald-500/5 border rounded-lg focus:outline-none text-white placeholder-gray-500 transition-all ${!passwordMatch
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                        >
                          {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                        {formData.confirmPassword && passwordMatch && (
                          <FiCheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                        )}
                      </div>
                      {!passwordMatch && formData.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Job Title */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Job Title</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                        <select
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white transition-all appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          {jobTitles.map((job) => (
                            <option key={job.value} value={job.value} className="bg-gray-900 text-white">
                              {job.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Phone Number</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Authorization Checkbox */}
                  <div className="flex items-start space-x-3 pt-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="authorized"
                      checked={formData.authorized}
                      onChange={(e) => setFormData({ ...formData, authorized: e.target.checked })}
                      required
                      className="mt-1 w-4 h-4 rounded border-emerald-500/30 bg-emerald-500/5 text-emerald-500 focus:ring-emerald-400 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="authorized" className="text-sm text-gray-300 leading-relaxed">
                      I confirm I am an authorized representative of this institution and have the authority to register it on Cortexa.
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Institution Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Institution Name */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Institution Name</label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="ABC University"
                          value={formData.institutionName}
                          onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Institution Type */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Institution Type</label>
                      <div className="relative">
                        <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                        <select
                          value={formData.institutionType}
                          onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white transition-all appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          {institutionTypes.map((type) => (
                            <option key={type} value={type.toLowerCase()} className="bg-gray-900 text-white">
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Institution Website</label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        placeholder="https://institution.edu"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Address Line 1</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="123 Education Street"
                        value={formData.address1}
                        onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">City</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">State/Province</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Country</label>
                      <input
                        type="text"
                        placeholder="India"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-400 mb-2">Postal Code</label>
                      <input
                        type="text"
                        placeholder="00000"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Short Description</label>
                    <textarea
                      placeholder="Brief description of your institution..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Branding */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Institution Logo</label>
                    <div className="relative">
                      <FiImage className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, logo: e.target.files[0] })}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Recommended: 500x500px, PNG or JPG</p>
                  </div>

                  {/* Custom URL */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Custom URL Slug</label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 border-r-0 rounded-l-lg text-gray-400 text-sm">
                        cortexa.com/
                      </span>
                      <input
                        type="text"
                        placeholder="your-institution"
                        value={formData.customURL}
                        onChange={(e) => setFormData({ ...formData, customURL: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        required
                        className="flex-1 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-r-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This will be your institution's unique URL</p>
                  </div>

                  {/* Primary Brand Color */}
                  <div>
                    <label className="block text-sm font-medium text-emerald-400 mb-2">Primary Brand Color</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                        className="w-16 h-12 rounded-lg border border-emerald-500/20 cursor-pointer bg-emerald-500/5"
                      />
                      <input
                        type="text"
                        value={formData.brandColor}
                        onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                        placeholder="#34d399"
                        className="flex-1 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all font-mono"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Choose a color that represents your institution's brand</p>
                  </div>

                  {/* Preview */}
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-emerald-400 mb-3 font-medium">Brand Preview</p>
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: formData.brandColor }}
                      >
                        {formData.institutionName ? formData.institutionName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{formData.institutionName || 'Your Institution'}</p>
                        <p className="text-gray-400 text-sm">cortexa.com/{formData.customURL || 'your-institution'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-emerald-500/20">
              <motion.button
                whileHover={{ scale: currentStep > 1 ? 1.02 : 1 }}
                whileTap={{ scale: currentStep > 1 ? 0.98 : 1 }}
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === 1
                  ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                  : 'border-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                  }`}
              >
                Back
              </motion.button>

              {currentStep < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold shadow-lg shadow-emerald-500/30 transition-all"
                >
                  Next: {currentStep === 1 ? 'Institution Details' : 'Branding'}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold shadow-lg shadow-emerald-500/30 transition-all"
                >
                  Submit Registration
                </motion.button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already registered?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InstituteSignUp;
