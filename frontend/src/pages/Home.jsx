import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useInView } from 'framer-motion';
import { FiArrowRight, FiCheck, FiCpu, FiZap, FiShield, FiUsers, FiBookOpen, FiStar, FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';


const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        setTimeout(() => {
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }, 300);
      }
      // clear state so it doesn't repeat
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

const Hero = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-green-900/30 to-teal-900/30"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-0 -right-4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border-2 border-emerald-400/40 bg-emerald-500/10 backdrop-blur-sm shadow-lg shadow-emerald-500/20"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <span className="text-sm font-semibold text-emerald-300">AI-Powered Multi-Tenant Educational Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            <motion.span 
              className="block text-white"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(52, 211, 153, 0)",
                  "0 0 40px rgba(52, 211, 153, 0.3)",
                  "0 0 20px rgba(52, 211, 153, 0)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Unify Education
            </motion.span>
            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
              with Cortexa
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed"
          >
            A comprehensive platform that centralizes institutional resources with AI-powered RAG assistants, citation-backed answers, and seamless collaboration for students, teachers, and administrators.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-emerald-400 to-green-500 overflow-hidden transition-all duration-300 shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70"
            >
              <span className="flex items-center space-x-2">
                <span>Get Started</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('about')}
              className="px-8 py-4 rounded-xl font-semibold text-emerald-400 border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all duration-300"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400 pt-8"
          >
            {['Institutional dashboard', 'Free for educators', 'Privacy-first architecture'].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="flex items-center space-x-2"
              >
                <FiCheck className="w-5 h-5 text-emerald-400" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-emerald-400/50 flex items-start justify-center p-2 cursor-pointer"
          onClick={() => scrollToSection('about')}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="about" className="py-32 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-500/30 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-green-500/30 rounded-full filter blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              backgroundImage: "linear-gradient(90deg, #34d399, #10b981, #34d399)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            About Cortexa
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Built to solve the fragmentation in modern education by unifying all institutional resources into one intelligent platform
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20"
        >
          {/* Problem */}
          <motion.div variants={fadeInUp} className="space-y-6 p-8 rounded-2xl bg-gradient-to-br from-red-500/5 to-red-600/10 border border-red-500/20">
            <div className="inline-block px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="text-red-400 font-semibold">The Problem</span>
            </div>
            <h3 className="text-3xl font-bold text-white">Educational Fragmentation</h3>
            <ul className="space-y-4">
              {[
                "Students juggle multiple platforms for notes, assignments, and communication",
                "Generic content fails to address individual learning needs",
                "Institutions lack control over their educational ecosystem and data privacy"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-400">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div variants={fadeInUp} className="space-y-6 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-green-600/10 border border-emerald-500/20">
            <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <span className="text-emerald-400 font-semibold">Our Solution</span>
            </div>
            <h3 className="text-3xl font-bold text-white">Unified AI Platform</h3>
            <ul className="space-y-4">
              {[
                "Centralized dashboard for all academic activities and resources",
                "AI-powered RAG assistant with citation-backed answers from teacher notes",
                "Multi-tenant architecture with complete institutional branding and data isolation"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-400">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: "3", label: "User Roles", sublabel: "Student, Teacher, Admin" },
            { number: "100%", label: "Citation-Backed", sublabel: "Every AI answer" },
            { number: "1", label: "Unified Platform", sublabel: "All resources" },
            { number: "∞", label: "Institutions", sublabel: "Multi-tenant ready" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ scale: 1.05, borderColor: "rgba(52, 211, 153, 0.6)" }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 transition-all duration-300"
            >
              <motion.div 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2"
                animate={{ 
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.number}
              </motion.div>
              <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-sm text-gray-500">{stat.sublabel}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: FiCpu,
      title: "RAG Assistant",
      description: "Citation-backed answers extracted directly from teacher notes with complete source transparency",
      color: "from-emerald-400 to-green-500"
    },
    {
      icon: FiZap,
      title: "AI Content Generation",
      description: "Automatically generate MCQs, educational videos, and convert voice-to-text notes",
      color: "from-green-400 to-teal-500"
    },
    {
      icon: FiShield,
      title: "Multi-Tenant Security",
      description: "Complete institutional branding with isolated data and customizable features per institution",
      color: "from-teal-400 to-emerald-500"
    },
    {
      icon: FiUsers,
      title: "Collaborative Learning",
      description: "Query desk and note-sharing between students and teachers in real-time",
      color: "from-emerald-400 to-green-500"
    },
    {
      icon: FiBookOpen,
      title: "Unified Dashboard",
      description: "Access all courses, materials, assignments, and resources from one central location",
      color: "from-green-400 to-teal-500"
    },
    {
      icon: HiSparkles,
      title: "Personalized Learning",
      description: "AI-powered recommendations and adaptive content based on individual student progress",
      color: "from-teal-400 to-emerald-500"
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
        ease: "easeOut"
      }
    })
  };

  return (
    <section id="features" className="py-32 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(52, 211, 153, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(52, 211, 153, 0.15) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={isInView ? { 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            } : {}}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              backgroundImage: "linear-gradient(90deg, #34d399, #10b981, #14b8a6, #10b981, #34d399)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Powerful Features
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to transform your educational institution
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 60px rgba(52, 211, 153, 0.3)"
              }}
              className="group p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-500"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 0 30px rgba(52, 211, 153, 0.6)"
                }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                {feature.description}
              </p>
              
              {/* Animated corner accent */}
              <motion.div
                className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Reviews = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      avatar: "SJ",
      rating: 5,
      review: "Cortexa has completely transformed how I study. The AI assistant provides answers with exact citations from my professor's notes. It's like having a personalized tutor available 24/7!",
      color: "from-emerald-400 to-green-500"
    },
    {
      name: "Prof. Michael Chen",
      role: "Mathematics Teacher",
      avatar: "MC",
      rating: 5,
      review: "The query desk feature has revolutionized how I interact with my students. I can answer questions efficiently and the AI helps students when I'm not available. The MCQ generator saves me hours!",
      color: "from-green-400 to-teal-500"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Dean of Students",
      avatar: "ER",
      rating: 5,
      review: "As an administrator, having complete control over our institution's data while providing cutting-edge AI tools to our students and faculty is invaluable. Cortexa delivers on both fronts.",
      color: "from-teal-400 to-emerald-500"
    }
  ];

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: i * 0.2,
        ease: "easeOut"
      }
    })
  };

  return (
    <section id="reviews" className="py-32 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-500/30 rounded-full filter blur-3xl"></div>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={isInView ? { 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            } : {}}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              backgroundImage: "linear-gradient(90deg, #34d399, #10b981, #34d399)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            What Users Say
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Trusted by students, teachers, and institutions worldwide
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={scaleIn}
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 60px rgba(52, 211, 153, 0.4)"
              }}
              className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.2 + i * 0.1 }}
                  >
                    <FiStar className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                  </motion.div>
                ))}
              </div>
              
              {/* Review */}
              <p className="text-gray-300 mb-6 leading-relaxed">{testimonial.review}</p>
              
              {/* Author */}
              <div className="flex items-center space-x-4">
                <motion.div 
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                  whileHover={{ scale: 1.1, rotateY: 5 }}
                  transition={{ duration: 0.6 }}
                >
                  {testimonial.avatar}
                </motion.div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-emerald-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
        ease: "easeOut"
      }
    })
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: "Email",
      info: "contact@cortexa.com",
      link: "mailto:contact@cortexa.com"
    },
    {
      icon: FiPhone,
      title: "Phone",
      info: "+1 (555) 123-4567",
      link: "tel:+15551234567"
    },
    {
      icon: FiMapPin,
      title: "Address",
      info: "123 Education Street, Learning City, ED 12345",
      link: null
    }
  ];

  const socialLinks = [
    { icon: FiGithub, link: "#", color: "hover:text-emerald-400" },
    { icon: FiTwitter, link: "#", color: "hover:text-green-400" },
    { icon: FiLinkedin, link: "#", color: "hover:text-teal-400" }
  ];

  return (
    <section id="contact" className="py-32 bg-gradient-to-b from-black via-gray-950 to-black relative overflow-hidden">
      {/* Animated background */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.2) 0%, transparent 70%)",
            "radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.2) 0%, transparent 70%)",
            "radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.2) 0%, transparent 70%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6"
            animate={isInView ? { 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            } : {}}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              backgroundImage: "linear-gradient(90deg, #34d399, #10b981, #34d399)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Get in Touch
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            custom={0}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            className="space-y-6"
          >
            {['name', 'email'].map((field, index) => (
              <motion.div
                key={field}
                custom={index + 1}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeInUp}
              >
                <label className="block text-sm font-medium text-emerald-400 mb-2 capitalize">
                  {field}
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "rgba(52, 211, 153, 0.6)" }}
                  type={field === 'email' ? 'email' : 'text'}
                  className="w-full px-4 py-3 rounded-lg bg-emerald-500/5 border-2 border-emerald-500/20 focus:border-emerald-500/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300"
                  placeholder={`Your ${field}`}
                  value={formData[field]}
                  onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                />
              </motion.div>
            ))}
            
            <motion.div
              custom={3}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
            >
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Message
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.02, borderColor: "rgba(52, 211, 153, 0.6)" }}
                rows="6"
                className="w-full px-4 py-3 rounded-lg bg-emerald-500/5 border-2 border-emerald-500/20 focus:border-emerald-500/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300 resize-none"
                placeholder="Tell us about your institution..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></motion.textarea>
            </motion.div>
            
            <motion.button
              custom={4}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 40px rgba(52, 211, 153, 0.6)"
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-8 py-4 rounded-lg font-bold text-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 shadow-lg shadow-emerald-500/30 transition-all duration-300"
            >
              Send Message
            </motion.button>
          </motion.div>

          {/* Contact Info */}
          <div className="space-y-8">
            {contactInfo.map((contact, index) => (
              <motion.div
                key={index}
                custom={index + 5}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeInUp}
                whileHover={{ 
                  x: 10,
                  borderColor: "rgba(52, 211, 153, 0.6)"
                }}
                className="flex items-start space-x-4 p-6 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/10 border border-emerald-500/20 transition-all duration-300"
              >
                <motion.div 
                  className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                  whileHover={{
                    scale: 1.1,
                    boxShadow: "0 0 30px rgba(52, 211, 153, 0.6)"
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <contact.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">{contact.title}</h3>
                  {contact.link ? (
                    <a href={contact.link} className="text-gray-400 hover:text-emerald-400 transition-colors">
                      {contact.info}
                    </a>
                  ) : (
                    <p className="text-gray-400">{contact.info}</p>
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
