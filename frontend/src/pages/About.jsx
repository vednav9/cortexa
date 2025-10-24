import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiTarget, 
  FiUsers, 
  FiTrendingUp, 
  FiBookOpen,
  FiCpu,
  FiShield,
  FiZap,
  FiAward
} from 'react-icons/fi';

const About = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const problems = [
    {
      icon: FiBookOpen,
      title: "Fragmented Resources",
      description: "Students juggle multiple platforms for notes, assignments, and communication, leading to confusion and inefficiency."
    },
    {
      icon: FiUsers,
      title: "Lack of Personalization",
      description: "Generic content fails to address individual learning needs, leaving students without tailored guidance."
    },
    {
      icon: FiShield,
      title: "Privacy Concerns",
      description: "Institutions struggle with data security and lack control over their educational ecosystem."
    }
  ];

  const solutions = [
    {
      icon: FiCpu,
      title: "RAG-Powered AI Assistant",
      description: "Get citation-backed answers extracted directly from teacher notes with source transparency.",
      color: "from-gray-600 to-gray-800"
    },
    {
      icon: FiZap,
      title: "Automated Content Generation",
      description: "Generate MCQs, videos, and convert voice-to-text notes automatically with AI.",
      color: "from-gray-500 to-gray-700"
    },
    {
      icon: FiShield,
      title: "Multi-Tenant Architecture",
      description: "Complete institutional branding with isolated data and customizable features.",
      color: "from-gray-700 to-gray-900"
    },
    {
      icon: FiUsers,
      title: "Collaborative Learning",
      description: "Query desk and note-sharing between students and teachers in real-time.",
      color: "from-gray-600 to-gray-800"
    }
  ];

  const stats = [
    { number: "3", label: "User Roles", sublabel: "Student, Teacher, Admin" },
    { number: "100%", label: "Citation-Backed", sublabel: "Every AI answer" },
    { number: "1", label: "Unified Platform", sublabel: "All resources centralized" },
    { number: "∞", label: "Institutions", sublabel: "Multi-tenant ready" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
              About <span className="bg-gradient-to-r from-gray-300 via-white to-gray-400 bg-clip-text text-transparent">Cortexa</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              A unified AI-powered educational platform that centralizes institutional resources, eliminates fragmentation, and delivers personalized learning experiences for students, teachers, and administrators.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Problem We Solve</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modern education is fragmented, inefficient, and lacks personalization
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-6">
                  <problem.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
                <p className="text-gray-400 leading-relaxed">{problem.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Solution</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Cortexa unifies all educational resources into one intelligent platform
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <solution.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{solution.title}</h3>
                <p className="text-gray-400 leading-relaxed">{solution.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.sublabel}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-10 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mb-6">
                <FiTarget className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                To eliminate fragmentation in education by creating a unified, AI-powered platform that centralizes all institutional resources and delivers personalized learning experiences with complete data privacy and transparency.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-10 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mb-6">
                <FiTrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                To become the global standard for institutional education platforms, where every student receives personalized guidance, every teacher has intelligent tools, and every institution maintains complete control over their educational ecosystem.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Cortexa?</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built specifically for institutional education with privacy and personalization at its core
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { title: "Citation-Backed Answers", desc: "Every AI response includes exact source references" },
              { title: "Institutional Control", desc: "Complete customization and data ownership" },
              { title: "Role-Based Access", desc: "Tailored dashboards for students, teachers, and admins" },
              { title: "Query Desk", desc: "Students ask questions, teachers and AI respond" },
              { title: "Note Sharing", desc: "Seamless collaboration between faculty and students" },
              { title: "Privacy-First", desc: "Multi-tenant architecture with complete data isolation" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
