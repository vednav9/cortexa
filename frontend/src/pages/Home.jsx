import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FiArrowRight, FiCpu, FiZap, FiShield, FiUsers,
  FiBookOpen, FiStar, FiMail, FiPhone, FiMapPin
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import GreenParticles from '../ui/GreenParticles';
import { contactAPI } from '../services/api';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

// ===========================
// HOME WRAPPER
// ===========================
const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const pos = element.getBoundingClientRect().top + window.pageYOffset - offset;
        setTimeout(() => window.scrollTo({ top: pos, behavior: "smooth" }), 300);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="bg-black">
      <Hero />
      <About />
      <Features />
      <Reviews />
      <ContactUs />
    </div>
  );
};

// ===========================
// HERO SECTION
// ===========================
const Hero = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    const offset = 80;
    const pos = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: pos, behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-screen flex items-center justify-center bg-black"
    >
      <GreenParticles />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-sm font-medium text-emerald-300">
              AI-Powered Educational Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            <span className="block text-white mb-2">Unify Education</span>
            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              with Cortexa
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 leading-relaxed"
          >
            Centralize institutional resources with AI-powered RAG assistants, citation-backed answers, and seamless collaboration.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <button
              onClick={() => navigate('/signup')}
              className="group px-8 py-4 rounded-xl font-semibold text-black bg-gradient-to-r from-emerald-400 to-green-500 shadow-lg hover:shadow-emerald-500/50 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none transition-all active:scale-95"
              aria-label="Get Started with Cortexa"
            >
              <span className="flex items-center space-x-2">
                <span>Get Started</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => scrollToSection('about')}
              className="px-8 py-4 rounded-xl font-medium text-gray-300 border border-gray-700 hover:border-emerald-400/50 hover:text-emerald-400 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none transition-all active:scale-95"
              aria-label="Learn more about Cortexa"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer z-10 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"
        onClick={() => scrollToSection('about')}
        role="button"
        aria-label="Scroll to About Section"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') scrollToSection('about');
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-emerald-400/40 flex justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-emerald-400" />
        </div>
      </motion.div>
    </section>
  );
};

// ===========================
// ABOUT SECTION
// ===========================
const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="about"
      className="relative overflow-hidden py-24 md:py-32 bg-black"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950/50 to-black"></div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            About Cortexa
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Solving educational fragmentation by unifying institutional resources into one intelligent platform.
          </p>
        </motion.div>

        {/* Problem + Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 md:mb-20">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-red-500/10 hover:border-red-500/30 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-red-500/5 group"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6 group-hover:bg-red-500/20 transition-colors">
              <span className="text-red-400 font-medium text-sm">The Problem</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Educational Fragmentation</h3>
            <ul className="space-y-4 text-gray-400 leading-relaxed">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Students juggle multiple platforms for notes, assignments, and communication</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Generic content fails to address individual learning needs</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Institutions lack control over their educational ecosystem</span>
              </li>
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-emerald-500/5 group"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 group-hover:bg-emerald-500/20 transition-colors">
              <span className="text-emerald-400 font-medium text-sm">Our Solution</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Unified AI Platform</h3>
            <ul className="space-y-4 text-gray-400 leading-relaxed">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                <span>Centralized dashboard for all academic resources</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                <span>AI-powered RAG assistant with citation-backed answers</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                <span>Multi-tenant architecture with complete control</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: "3", label: "User Roles", sublabel: "Student · Teacher · Admin" },
            { number: "100%", label: "Citation-Backed", sublabel: "Every AI answer" },
            { number: "1", label: "Unified Platform", sublabel: "All resources" },
            { number: "∞", label: "Institutions", sublabel: "Multi-tenant ready" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
              className="p-6 text-center rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                {item.number}
              </div>
              <div className="text-base md:text-lg text-white font-medium mb-1">{item.label}</div>
              <div className="text-xs md:text-sm text-gray-500">{item.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===========================
// FEATURES SECTION
// ===========================
const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    { icon: FiCpu, title: "RAG Assistant", description: "Citation-backed answers from teacher notes and institutional resources.", color: "from-emerald-400 to-green-500" },
    { icon: FiZap, title: "AI Content Generation", description: "Generate MCQs, videos, and convert voice notes instantly.", color: "from-green-400 to-teal-500" },
    { icon: FiShield, title: "Multi-Tenant Security", description: "Complete branding and permissions for each institution.", color: "from-teal-400 to-emerald-500" },
    { icon: FiUsers, title: "Collaborative Learning", description: "Query desk and real-time note sharing for students.", color: "from-emerald-400 to-green-500" },
    { icon: FiBookOpen, title: "Unified Dashboard", description: "All courses and resources accessible in one place.", color: "from-green-400 to-teal-500" },
    { icon: HiSparkles, title: "Personalized Learning", description: "Adaptive AI feedback tailored to each student.", color: "from-teal-400 to-emerald-500" }
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-b from-black via-gray-950/50 to-black"
    >
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to transform your educational institution.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-8 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-gray-800 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                <f.icon className="text-white text-2xl" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===========================
// REVIEWS SECTION
// ===========================
const Reviews = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    { name: "Sarah Johnson", role: "Computer Science Student", avatar: "SJ", rating: 5, review: "Cortexa transformed how I study. The AI assistant provides instant answers with citations from professor notes.", color: "from-emerald-400 to-green-500" },
    { name: "Prof. Michael Chen", role: "Mathematics Teacher", avatar: "MC", rating: 5, review: "Query desk helps my students even when I'm offline. The MCQ generator saves me hours every week!", color: "from-green-400 to-teal-500" },
    { name: "Dr. Emily Rodriguez", role: "Dean of Students", avatar: "ER", rating: 5, review: "Complete data control with powerful tools for our institution. Cortexa is a true game changer.", color: "from-teal-400 to-emerald-500" }
  ];

  return (
    <section
      id="reviews"
      className="relative overflow-hidden py-24 md:py-32 bg-black"
    >
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            What Users Say
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Trusted by students, teachers, and institutions worldwide.
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="p-8 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-gray-800 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
            >
              <div className="flex space-x-1 mb-4">
                {[...Array(t.rating)].map((_, idx) => (
                  <FiStar key={idx} className="text-emerald-400 fill-emerald-400 w-4 h-4" />
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">{t.review}</p>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-base text-white font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold">{t.name}</div>
                  <div className="text-emerald-400 text-sm">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===========================
// CONTACT SECTION
// ===========================
const ContactUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle, submitting, success, error

  const contactInfo = [
    { icon: FiMail, label: "Email", value: "contact@cortexa.com", link: "mailto:contact@cortexa.com" },
    { icon: FiPhone, label: "Phone", value: "+1 (555) 123-4567", link: "tel:+15551234567" },
    { icon: FiMapPin, label: "Address", value: "123 Education Street, Learning City", link: null }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });

    try {
      const response = await contactAPI.submit(formData);
      if (response.data.success) {
        setStatus({ state: "success", message: "Your message has been sent successfully! We'll be in touch." });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus({ state: "error", message: response.data.message || "Something went wrong." });
      }
    } catch (error) {
      console.error("Submission error", error);
      setStatus({ state: "error", message: error.response?.data?.message || "Failed to send message. Please try again." });
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-b from-black via-gray-950/50 to-black"
    >
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FORM */}
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label htmlFor="contact-name" className="text-gray-300 text-sm font-medium mb-2 block">Name</label>
              <input
                id="contact-name"
                required
                disabled={status.state === "submitting"}
                className={`w-full px-4 py-3.5 rounded-xl bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all disabled:opacity-50 ${status.state === 'error' ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                placeholder="Your name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="text-gray-300 text-sm font-medium mb-2 block">Email</label>
              <input
                id="contact-email"
                type="email"
                required
                disabled={status.state === "submitting"}
                className={`w-full px-4 py-3.5 rounded-xl bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all disabled:opacity-50 ${status.state === 'error' ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="text-gray-300 text-sm font-medium mb-2 block">Message</label>
              <textarea
                id="contact-message"
                required
                rows="5"
                disabled={status.state === "submitting"}
                className={`w-full px-4 py-3.5 rounded-xl bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all resize-none disabled:opacity-50 ${status.state === 'error' ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                placeholder="Tell us about your institution..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            {status.state === 'success' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <FiCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-sm leading-relaxed">{status.message}</p>
              </motion.div>
            )}

            {status.state === 'error' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <FiAlertCircle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm leading-relaxed">{status.message}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={status.state === "submitting"}
              className="w-full flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold hover:shadow-lg hover:shadow-emerald-500/50 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {status.state === "submitting" ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                "Send Message"
              )}
            </button>
          </motion.form>

          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {contactInfo.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white flex-shrink-0">
                  <c.icon className="text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{c.label}</h3>
                  {c.link ? (
                    <a href={c.link} className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">{c.value}</a>
                  ) : (
                    <p className="text-gray-400 text-sm">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
