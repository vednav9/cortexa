import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { name: "About", path: "about" },
    { name: "Features", path: "features" },
    { name: "Reviews", path: "reviews" },
    { name: "Contact", path: "contact" },
  ];

  // ✅ ALL HOOKS FIRST (NO EARLY RETURNS ABOVE THIS)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

      const scrollY = window.scrollY + 120;
      ["hero", ...navItems.map(i => i.path)].forEach(sectionId => {
        const sec = document.getElementById(sectionId);
        if (sec) {
          const top = sec.offsetTop;
          const bottom = top + sec.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ CONDITIONS ONLY AFTER HOOKS
  const isHomePage = location.pathname === "/";
  if (!isHomePage) return null;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const pos = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: pos, behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <motion.nav className="w-full bg-black backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">

        {/* Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <HiSparkles className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-green-400 bg-clip-text text-transparent">
            Cortexa
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => scrollToSection(item.path)}
              className={`text-sm font-medium ${activeSection === item.path
                ? "text-emerald-400"
                : "text-gray-300 hover:text-emerald-400"
                }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 text-sm rounded-lg text-emerald-400 border border-emerald-400/40"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="px-5 py-2 text-sm rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg bg-white/10 text-gray-200"
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-black/95 border-t border-white/10"
          >
            <div className="px-6 py-5 space-y-3">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => scrollToSection(item.path)}
                  className="block w-full text-left px-3 py-2 rounded-md text-gray-300 hover:text-emerald-400"
                >
                  {item.name}
                </button>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => { navigate("/login"); setIsOpen(false); }}
                  className="w-full px-4 py-3 rounded-lg text-emerald-400 border border-emerald-400/40"
                >
                  Login
                </button>

                <button
                  onClick={() => { navigate("/signup"); setIsOpen(false); }}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-black font-semibold"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
