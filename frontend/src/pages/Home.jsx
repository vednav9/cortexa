import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FiArrowRight, FiMenu, FiX, FiCpu, FiZap, FiShield, FiUsers,
  FiBookOpen, FiStar, FiMail, FiPhone, FiMapPin
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';

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
      {/* Static gradient background - no animation */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-green-900/20 to-teal-900/20"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <span className="text-sm font-semibold text-emerald-300">
              AI-Powered Multi-Tenant Educational Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
            <span className="block text-white">Unify Education</span>
            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              with Cortexa
            </span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300">
            A comprehensive platform that centralizes institutional resources with AI-powered RAG assistants, citation-backed answers, and seamless collaboration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="px-8 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-emerald-400 to-green-500 shadow-xl hover:shadow-emerald-500/50 transition-shadow">
              <span className="flex items-center space-x-2">
                <span>Get Started</span>
                <FiArrowRight className="w-5 h-5" />
              </span>
            </button>

            <button
              onClick={() => scrollToSection('about')}
              className="px-8 py-4 rounded-xl font-semibold text-emerald-400 border-2 border-emerald-400/40 hover:bg-emerald-500/10 transition-colors"
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={() => scrollToSection('about')}
      >
        <div className="w-6 h-10 rounded-full border-2 border-emerald-400/50 flex justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
      className="relative overflow-hidden py-32 bg-gradient-to-b from-black via-gray-950 to-black"
    >
      {/* Static background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-green-500/30 rounded-full blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            About Cortexa
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Built to solve the fragmentation in modern education by unifying all institutional resources into one intelligent platform.
          </p>
        </motion.div>

        {/* Problem + Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="text-red-400 font-semibold">The Problem</span>
            </div>
            <h3 className="text-3xl font-bold text-white mt-4 mb-6">Educational Fragmentation</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex gap-3"><div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />Students juggle multiple platforms for notes, assignments, and communication.</li>
              <li className="flex gap-3"><div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />Generic content fails to address individual learning needs.</li>
              <li className="flex gap-3"><div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />Institutions lack control over their educational ecosystem and privacy.</li>
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <span className="text-emerald-400 font-semibold">Our Solution</span>
            </div>
            <h3 className="text-3xl font-bold text-white mt-4 mb-6">Unified AI Platform</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex gap-3"><div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />Centralized dashboard for all academic resources.</li>
              <li className="flex gap-3"><div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />AI-powered RAG assistant with citation-backed answers.</li>
              <li className="flex gap-3"><div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />Multi-tenant architecture with complete branding.</li>
            </ul>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "3", label: "User Roles", sublabel: "Student, Teacher, Admin" },
            { number: "100%", label: "Citation-Backed", sublabel: "Every AI answer" },
            { number: "1", label: "Unified Platform", sublabel: "All resources" },
            { number: "∞", label: "Institutions", sublabel: "Multi-tenant ready" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
              className="p-6 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                {item.number}
              </div>
              <div className="text-lg text-white mt-2">{item.label}</div>
              <div className="text-sm text-gray-500">{item.sublabel}</div>
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
    { icon: FiCpu, title: "RAG Assistant", description: "Citation-backed answers from teacher notes.", color: "from-emerald-400 to-green-500" },
    { icon: FiZap, title: "AI Content Generation", description: "Generate MCQs, videos, and convert voice notes.", color: "from-green-400 to-teal-500" },
    { icon: FiShield, title: "Multi-Tenant Security", description: "Branding + permissions for each institution.", color: "from-teal-400 to-emerald-500" },
    { icon: FiUsers, title: "Collaborative Learning", description: "Query desk + real-time note sharing.", color: "from-emerald-400 to-green-500" },
    { icon: FiBookOpen, title: "Unified Dashboard", description: "All courses & resources in one place.", color: "from-green-400 to-teal-500" },
    { icon: HiSparkles, title: "Personalized Learning", description: "Adaptive AI feedback per student.", color: "from-teal-400 to-emerald-500" }
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden py-32 bg-gradient-to-b from-black via-gray-950 to-black"
    >
      {/* Static background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to transform your educational institution.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6`}>
                <f.icon className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-gray-400">{f.description}</p>
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
    { name: "Sarah Johnson", role: "Computer Science Student", avatar: "SJ", rating: 5, review: "Cortexa has completely transformed how I study. The AI assistant provides answers with citations from professor notes.", color: "from-emerald-400 to-green-500" },
    { name: "Prof. Michael Chen", role: "Mathematics Teacher", avatar: "MC", rating: 5, review: "Query desk + AI help my students even when I'm offline. MCQ generator saves hours!", color: "from-green-400 to-teal-500" },
    { name: "Dr. Emily Rodriguez", role: "Dean of Students", avatar: "ER", rating: 5, review: "We get data control + powerful tools for our institution. Cortexa is a game changer.", color: "from-teal-400 to-emerald-500" }
  ];

  return (
    <section
      id="reviews"
      className="relative overflow-hidden py-32 bg-gradient-to-b from-black via-gray-950 to-black"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-500/30 rounded-full blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            What Users Say
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Trusted by students, teachers, and institutions worldwide.
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
            >
              <div className="flex space-x-1 mb-4">
                {[...Array(t.rating)].map((_, idx) => (
                  <FiStar key={idx} className="text-emerald-400 fill-emerald-400" size={18} />
                ))}
              </div>
              <p className="text-gray-300 mb-6">{t.review}</p>
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-lg text-white font-bold`}>
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

  const contactInfo = [
    { icon: FiMail, label: "Email", value: "contact@cortexa.com", link: "mailto:contact@cortexa.com" },
    { icon: FiPhone, label: "Phone", value: "+1 (555) 123-4567", link: "tel:+15551234567" },
    { icon: FiMapPin, label: "Address", value: "123 Education Street, Learning City", link: null }
  ];

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-32 bg-gradient-to-b from-black via-gray-950 to-black"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FORM */}
          <form className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="text-emerald-400 text-sm block mb-2">Name</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-white focus:border-emerald-400/60 focus:outline-none transition-colors"
                placeholder="Your name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="text-emerald-400 text-sm block mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-white focus:border-emerald-400/60 focus:outline-none transition-colors"
                placeholder="Your email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label className="text-emerald-400 text-sm block mb-2">Message</label>
              <textarea
                rows="5"
                className="w-full px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-white focus:border-emerald-400/60 focus:outline-none transition-colors resize-none"
                placeholder="Tell us about your institution..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              type="submit"
              className="w-full py-4 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-bold hover:shadow-lg hover:shadow-emerald-500/50 transition-shadow"
            >
              Send Message
            </motion.button>
          </form>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            {contactInfo.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + (i * 0.1) }}
                className="flex items-start gap-4 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white flex-shrink-0">
                  <c.icon className="text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{c.label}</h3>
                  {c.link ? (
                    <a href={c.link} className="text-gray-400 hover:text-emerald-400 transition-colors">{c.value}</a>
                  ) : (
                    <p className="text-gray-400">{c.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
