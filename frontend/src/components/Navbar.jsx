import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiUser, FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const navItems = [
    { name: "About", path: "about" },
    { name: "Features", path: "features" },
    { name: "Reviews", path: "reviews" },
    { name: "Contact", path: "contact" },
  ];

  // ── scroll tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const y = window.scrollY + 120;
      ["hero", ...navItems.map(i => i.path)].forEach(id => {
        const el = document.getElementById(id);
        if (el && y >= el.offsetTop && y < el.offsetTop + el.offsetHeight) {
          setActiveSection(id);
        }
      });
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── close profile menu on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── only visible on home page ─────────────────────────────────────────────
  const isHomePage = location.pathname === "/";
  if (!isHomePage) return null;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const pos = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: pos, behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("auth");
    navigate("/login", { replace: true });
    setProfileMenuOpen(false);
  };

  return (
    <motion.nav
      className={`fixed left-0 right-0 top-0 z-[9999] w-full transition-all duration-300 ${scrolled
        ? "border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl"
        : "border-b border-transparent bg-transparent"
        }`}
    >
      <div className="relative mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6">

        {/* ── Logo ── */}
        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2.5 focus:outline-none"
        >
          <img
            src="/logo.png"
            alt="Cortexa logo"
            className="h-11 w-11 object-contain scale-150 transition-transform duration-300 group-hover:scale-[1.6]"
          />
          <span className="text-base font-extrabold tracking-tight text-white transition-colors group-hover:text-emerald-300">
            Cortexa
          </span>
        </button>

        {/* ── Desktop nav links ── */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => scrollToSection(item.path)}
              className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${activeSection === item.path
                ? "text-white"
                : "text-gray-500 hover:text-gray-200"
                }`}
            >
              {item.name}
              {activeSection === item.path && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-1 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-emerald-400"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Desktop right actions ── */}
        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              {/* Trigger */}
              <button
                onClick={() => setProfileMenuOpen(v => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.07]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-black">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-xs font-semibold leading-tight text-white">{user?.name || "User"}</p>
                  <p className="text-[10px] capitalize text-gray-500">{user?.role || "Member"}</p>
                </div>
                <motion.div animate={{ rotate: profileMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <FiChevronDown className="h-3.5 w-3.5 text-gray-500" />
                </motion.div>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] shadow-2xl shadow-black/60"
                  >
                    {/* Header */}
                    <div className="border-b border-white/[0.06] px-4 py-4">
                      <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-emerald-400">
                        {user?.role || "Member"}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5">
                      {[
                        { icon: HiSparkles, label: "Dashboard", action: () => { navigate("/dashboard"); setProfileMenuOpen(false); } },
                        { icon: FiUser, label: "My Profile", action: () => { setProfileMenuOpen(false); } },
                        { icon: FiSettings, label: "Settings", action: () => { setProfileMenuOpen(false); } },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={item.action}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-all duration-150 hover:bg-white/[0.05] hover:text-white"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/[0.06] p-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-all duration-150 hover:bg-red-500/[0.08] hover:text-red-300"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-colors duration-200 hover:text-white"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-400 active:scale-95"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400 transition-colors hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl md:hidden"
          >
            <div className="px-6 pb-6 pt-4 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => scrollToSection(item.path)}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${activeSection === item.path
                    ? "bg-white/[0.05] text-white"
                    : "text-gray-500 hover:text-gray-200"
                    }`}
                >
                  {item.name}
                </button>
              ))}

              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                {user ? (
                  <>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-400">
                        {user?.role || "Member"}
                      </span>
                    </div>
                    <button
                      onClick={() => { navigate("/dashboard"); setIsOpen(false); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
                    >
                      <HiSparkles className="h-4 w-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/[0.12]"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { navigate("/login"); setIsOpen(false); }}
                      className="w-full rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:text-white"
                    >
                      Log in
                    </button>
                    <button
                      onClick={() => { navigate("/signup"); setIsOpen(false); }}
                      className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
