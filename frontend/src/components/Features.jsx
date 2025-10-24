import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiCpu, FiZap, FiShield, FiUsers, FiBookOpen } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

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

export default Features;
