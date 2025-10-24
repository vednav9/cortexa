import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

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

export default ContactUs;
