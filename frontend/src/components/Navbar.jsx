import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiLogIn, FiUserPlus } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate=useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { name: "Home", path: "hero" },
    { name: "About", path: "about" },
    { name: "Features", path: "features" },
    { name: "Reviews", path: "reviews" },
    { name: "Contact Us", path: "contact" },
  ];

  // Scroll spy and navbar background change
  useEffect(() => {
    const handleScroll = () => {
      // Change navbar background on scroll
      setScrolled(window.scrollY > 50);

      // Scroll spy logic
      const sections = navItems.map((item) =>
        document.getElementById(item.path)
      );
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(navItems[index].path);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl border-b border-emerald-500/30 shadow-lg shadow-emerald-500/20"
            : "bg-gradient-to-r from-emerald-950/80 via-green-950/80 to-emerald-950/80 backdrop-blur-md border-b border-emerald-500/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection("hero")}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50"
              >
                <HiSparkles className="w-7 h-7 text-white" />
              </motion.div>

              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Cortexa
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(item.path)}
                  className="group relative px-4 py-2"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
                      activeSection === item.path
                        ? "text-emerald-400"
                        : "text-gray-300 hover:text-emerald-400"
                    }`}
                  >
                    {item.name}
                  </motion.div>

                  {/* Active indicator - glowing underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    initial={false}
                    animate={{
                      scaleX: activeSection === item.path ? 1 : 0,
                      opacity: activeSection === item.path ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Glow effect for active item */}
                  {activeSection === item.path && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right Section - Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-lg text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 font-medium text-sm"
                onClick={() => navigate('/login')}
              >
                Login
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(52, 211, 153, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black hover:from-emerald-500 hover:to-green-600 transition-all duration-300 font-semibold text-sm shadow-lg shadow-emerald-500/30"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              {isOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-black/98 border-t border-emerald-500/20"
            >
              <div className="px-4 py-6 space-y-1">
                {navItems.map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => scrollToSection(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeSection === item.path
                        ? "bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400"
                        : "text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                  </motion.button>
                ))}

                <div className="pt-4 border-t border-emerald-500/20 space-y-3">
                  <button className="w-full px-4 py-3 rounded-lg text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all font-medium">
                    Login
                  </button>

                  <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black hover:from-emerald-500 hover:to-green-600 transition-all font-semibold">
                    Sign Up
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="h-20" />
    </>
  );
};

export default Navbar;
