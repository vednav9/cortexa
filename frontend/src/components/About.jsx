import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

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

export default About;
