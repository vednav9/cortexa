import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiBook, 
  FiMessageSquare, 
  FiPhone,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'About', path: 'about', icon: FiHome },
    { name: 'Features', path: 'features', icon: FiBook },
    { name: 'Reviews', path: 'reviews', icon: FiMessageSquare },
    { name: 'Contact Us', path: 'contact', icon: FiPhone },
  ];

  // Scroll spy + navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['hero', ...navItems.map(item => item.path)];
      const scrollPosition = window.scrollY + 100;

      sections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    if (location.pathname === '/') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [location.pathname]);

  // Smart scroll that handles route changes
  const scrollToSection = (sectionId) => {
    // if not on home page, go to home and pass section info
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      setIsOpen(false);
      return;
    }

    // if already on home, scroll smoothly
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-black/95 backdrop-blur-xl border-b border-emerald-500/30 shadow-lg shadow-emerald-500/20' 
            : 'bg-gradient-to-r from-emerald-950/80 via-green-950/80 to-emerald-950/80 backdrop-blur-md border-b border-emerald-500/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection('hero')}
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
                    className={`flex items-center space-x-2 text-sm font-medium tracking-wide transition-colors duration-300 ${
                      activeSection === item.path 
                        ? 'text-emerald-400' 
                        : 'text-gray-300 hover:text-emerald-400'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.div>

                  {/* Active underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                    initial={false}
                    animate={{
                      scaleX: activeSection === item.path ? 1 : 0,
                      opacity: activeSection === item.path ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Glow for active item */}
                  {activeSection === item.path && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Right Section - Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 font-medium text-sm"
              >
                <FiLogIn className="w-4 h-4" />
                <span>Login</span>
              </motion.button>

              {/* Sign Up Button */}
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 0 30px rgba(52, 211, 153, 0.6)" 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black hover:from-emerald-500 hover:to-green-600 transition-all duration-300 font-semibold text-sm shadow-lg shadow-emerald-500/30"
              >
                <FiUserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </motion.button>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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
                    className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === item.path
                        ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-400'
                        : 'text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.button>
                ))}
                
                {/* Mobile Auth Buttons */}
                <div className="pt-4 border-t border-emerald-500/20 space-y-3">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    <FiLogIn className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/signup');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    <FiUserPlus className="w-5 h-5" />
                    <span className="font-medium">Sign Up</span>
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
