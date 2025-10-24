import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

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

export default Reviews;
