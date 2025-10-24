import React from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiTwitter, FiLinkedin, FiInstagram, FiYoutube, FiMail } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Footer = () => {
  const socials = [
    { icon: <FiInstagram />, link: '#', color: 'hover:text-green-400' },
    { icon: <FiYoutube />, link: '#', color: 'hover:text-teal-400' },
    { icon: <FiMail />, link: '#', color: 'hover:text-teal-400' },
    { icon: <FiLinkedin />, link: '#', color: 'hover:text-emerald-400' },
    { icon: <FiTwitter />, link: '#', color: 'hover:text-emerald-400' },
    { icon: <FiGithub />, link: '#', color: 'hover:text-emerald-400' },
  ];

  return (
    <footer className="bg-black border-t border-emerald-500/30 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center space-y-6">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
            <HiSparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Cortexa</span>
        </motion.div>

        {/* Social icons */}
        <div className="flex space-x-5">
          {socials.map((s, i) => (
            <motion.a
              key={i}
              href={s.link}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`text-gray-400 ${s.color} text-xl transition-all`}
            >
              {s.icon}
            </motion.a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Cortexa. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
