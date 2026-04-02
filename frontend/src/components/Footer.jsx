import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowRight, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const socials = [
    { icon: FiGithub, href: '#', label: 'GitHub' },
    { icon: FiTwitter, href: '#', label: 'Twitter' },
    { icon: FiLinkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#080808]">

      {/* ── Giant background wordmark ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden pb-4 select-none"
      >
        <span
          className="text-[clamp(5rem,20vw,18rem)] font-extrabold leading-none tracking-tighter text-white/10"
          style={{ letterSpacing: '-0.04em' }}
        >
          CORTEXA
        </span>
      </div>

      {/* Top shimmer */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">

        {/* ── Hero CTA band ── */}
        <div className="py-20 md:py-24 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
            Start today
          </p>
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Ready to modernise your institution?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-500">
            Join educators and students who rely on Cortexa every day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/signup')}
              className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-95"
            >
              Get Started Free
              <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="mailto:contact@cortexa.com"
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-7 py-3.5 text-sm font-semibold text-gray-400 transition-all duration-300 hover:border-white/20 hover:text-white"
            >
              <FiMail className="h-4 w-4" />
              Contact Us
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px w-full bg-white/[0.06]" />

        {/* ── Brand + socials bar ── */}
        <div className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-between">

          {/* Logo word */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <span className="h-8 w-8 rounded-lg overflow-hidden bg-white/10 border border-white/[0.08] flex items-center justify-center">
              <img src="/logo.png" alt="Cortexa logo" className="h-full w-full object-contain scale-125" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white/60 transition-colors duration-200 group-hover:text-white">
              Cortexa
            </span>
          </button>

          {/* Socials */}
          <div className="flex items-center gap-2">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.href}
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-gray-600 transition-all duration-200 hover:border-emerald-500/30 hover:text-emerald-400"
              >
                <s.icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          {/* Copyright + legal */}
          <div className="flex items-center gap-5 text-[11px] text-gray-700">
            <span>&copy; {year} Cortexa</span>
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
