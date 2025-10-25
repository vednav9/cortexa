import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    userType: 'student' 
  });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your login logic here
    console.log('Login Data:', formData);
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
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-3 mb-8">
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

          <h2 className="text-3xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-center mb-8">Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-gray-500 transition-all"
                />
              </div>
            </div>

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

            {/* User Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">I am a</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="student" className="bg-gray-900 text-white">Student</option>
                  <option value="teacher" className="bg-gray-900 text-white">Teacher</option>
                </select>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 0 30px rgba(52, 211, 153, 0.5)" 
              }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
              Sign In
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-emerald-500/5 to-green-500/10 text-gray-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="w-full py-3 border-2 border-emerald-500/30 text-emerald-400 font-semibold rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
            >
              Create New Account
            </motion.button>
          </Link>
        </div>

        {/* Additional Info */}
        <p className="text-center text-gray-500 text-sm mt-6">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
