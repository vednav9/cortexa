import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FiArrowRight, FiCpu, FiZap, FiShield, FiUsers,
  FiBookOpen, FiMail, FiCheckCircle, FiAlertCircle, FiLoader, FiStar
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import GreenParticles from '../ui/GreenParticles';
import { contactAPI } from '../services/api';

// ─── Shared micro-components ────────────────────────────────────────────────

const Label = ({ children }) => (
  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-500 mb-4">
    {children}
  </p>
);

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

// ─── HOME ───────────────────────────────────────────────────────────────────

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        const pos = el.getBoundingClientRect().top + window.pageYOffset - 80;
        setTimeout(() => window.scrollTo({ top: pos, behavior: 'smooth' }), 300);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="bg-[#080808] text-white antialiased">
      <Hero />
      <About />
      <Features />
      <Reviews />
      <ContactUs />
    </div>
  );
};

// ─── HERO ────────────────────────────────────────────────────────────────────

const Hero = () => {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080808]"
    >
      <GreenParticles />

      {/* Aura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(52,211,153,0.09),transparent)]" />

      {/* Faint grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:72px_72px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-gray-400">
            AI-Powered Educational Platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-[3.25rem] font-extrabold leading-[1.08] tracking-tight sm:text-[4rem] md:text-[5rem] lg:text-[5.75rem]"
        >
          <span className="text-white">The smarter way</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
            to run education.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-gray-400"
        >
          Centralise institutional knowledge, power classrooms with AI, and give
          every student citation-backed answers — all from one platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            onClick={() => navigate('/signup')}
            className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-95"
          >
            Get Started Free
            <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => scrollTo('about')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-gray-300 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:text-white active:scale-95"
          >
            See How It Works
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-3 text-xs text-gray-600"
        >
          <div className="flex -space-x-2">
            {['SJ', 'MC', 'ER', 'AR'].map((init, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#080808] bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white"
              >
                {init}
              </div>
            ))}
          </div>
          <span>Trusted by <span className="font-medium text-gray-400">100+ institutions</span></span>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />
    </section>
  );
};

// ─── ABOUT ───────────────────────────────────────────────────────────────────

const About = () => {
  const stats = [
    { value: '3', label: 'User roles', sub: 'Student · Teacher · Admin' },
    { value: '100%', label: 'Citation-backed', sub: 'Every AI answer' },
    { value: '1', label: 'Unified platform', sub: 'All resources' },
    { value: '∞', label: 'Scalable', sub: 'Multi-tenant ready' },
  ];

  return (
    <section id="about" className="relative overflow-hidden bg-[#080808] py-28 md:py-36">
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(52,211,153,0.07)_1px,transparent_1px)] bg-[length:28px_28px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div {...fadeUp()} className="max-w-2xl">
          <Label>Discover Cortexa</Label>
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
            Why institutions
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              choose Cortexa.
            </span>
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-gray-400">
            Education is fragmented across dozens of tools. Cortexa unifies everything — from AI-powered Q&amp;A to real-time collaboration — into one secure, institutional platform.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {/* Problem */}
          <motion.div {...fadeUp(0.05)} className="group rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 md:p-10 transition-all duration-500 hover:border-red-500/20 hover:bg-red-500/[0.03]">
            <div className="mb-6 inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-red-400">The Problem</span>
            </div>
            <h3 className="mb-6 text-2xl font-bold text-white">Fragmented education</h3>
            <ul className="space-y-4">
              {[
                'Students juggle multiple disconnected platforms every day.',
                'Generic AI gives unverified answers with no academic backing.',
                'Institutions lose oversight and control of their learning data.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div {...fadeUp(0.1)} className="group rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 md:p-10 shadow-[0_0_60px_-12px_rgba(52,211,153,0.15)] transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_80px_-12px_rgba(52,211,153,0.25)]">
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Our Solution</span>
            </div>
            <h3 className="mb-6 text-2xl font-bold text-white">One unified AI platform</h3>
            <ul className="space-y-4">
              {[
                'A single dashboard for all courses, notes, and assignments.',
                'RAG-powered AI that only answers with verified academic citations.',
                'Fully isolated multi-tenant architecture — your data, your rules.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Stats strip */}
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp(0.06 * i)}
              className="bg-[#080808] px-8 py-8 text-center"
            >
              <p className="text-4xl font-extrabold text-emerald-400">{s.value}</p>
              <p className="mt-1.5 text-sm font-semibold text-white">{s.label}</p>
              <p className="mt-0.5 text-xs text-gray-600">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FEATURES ────────────────────────────────────────────────────────────────

const Features = () => {
  const features = [
    { icon: FiCpu, title: 'RAG Assistant', desc: 'Answers backed exclusively by uploaded teacher notes and institutional documents.' },
    { icon: FiZap, title: 'AI Content Tools', desc: 'Auto-generate MCQs, convert voice notes, and produce study material at scale.' },
    { icon: FiShield, title: 'Multi-Tenant Security', desc: 'Every institution gets a fully isolated environment with custom branding.' },
    { icon: FiUsers, title: 'Collaborative Learning', desc: 'A shared query desk and real-time note library for every course.' },
    { icon: FiBookOpen, title: 'Unified Dashboard', desc: 'All your courses, assignments, and resources—one clean interface.' },
    { icon: HiSparkles, title: 'Personalised AI', desc: "Adaptive feedback and recommendations based on each student's progress." },
  ];

  return (
    <section id="features" className="bg-[#080808] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div {...fadeUp()} className="mb-14 max-w-xl">
          <Label>Platform Features</Label>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
            Built for every role in your institution.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.06)}
              className="group flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04]"
            >
              <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1.5 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors duration-200">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

const Reviews = () => {
  const testimonials = [
    { name: 'Sarah Johnson', role: 'CS Student', avatar: 'SJ', color: 'from-emerald-500 to-green-600', review: "The AI assistant gives me instant answers with real citations from my professor's notes. It actually helps me learn instead of just giving me shortcuts." },
    { name: 'Prof. Michael Chen', role: 'Mathematics', avatar: 'MC', color: 'from-teal-500 to-emerald-600', review: "The MCQ generator alone saves me three hours a week. And the query desk means students still get help even when I'm offline." },
    { name: 'Dr. Emily Rodriguez', role: 'Dean of Students', avatar: 'ER', color: 'from-green-500 to-teal-600', review: 'We finally have complete visibility and control over our institutional data. Deploying Cortexa was the best decision we made this year.' },
  ];

  return (
    <section id="reviews" className="bg-[#080808] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeUp()} className="mb-14 text-center">
          <Label>Testimonials</Label>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
            Loved by educators worldwide.
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className="flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-7 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className="flex gap-0.5">
                {[...Array(t.rating ?? 5)].map((_, k) => (
                  <FiStar key={k} className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-gray-400">&ldquo;{t.review}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-xs font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CONTACT ─────────────────────────────────────────────────────────────────

const ContactUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'submitting', message: '' });
    try {
      const res = await contactAPI.submit(formData);
      if (res.data.success) {
        setStatus({ state: 'success', message: "Message sent! We'll be in touch within 24 hours." });
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setStatus({ state: 'idle', message: '' }), 10000);
      } else {
        setStatus({ state: 'error', message: res.data.message || 'Something went wrong.' });
      }
    } catch (err) {
      setStatus({ state: 'error', message: err.response?.data?.message || 'Failed to send. Please try again.' });
    }
  };

  const field = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-gray-700 outline-none ring-0 transition-all duration-200 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50';

  return (
    <section id="contact" className="relative overflow-hidden bg-[#080808] py-24 md:py-32">
      {/* Corner glows */}
      <div className="pointer-events-none absolute -left-64 -top-64 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-64 -right-64 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-3xl" />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">

          {/* Left — CTA copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8 lg:sticky lg:top-32"
          >
            <div>
              <Label>Contact</Label>
              <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-[3.25rem] leading-[1.1]">
                Let&apos;s build something
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  remarkable.
                </span>
              </h2>
              <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-gray-400">
                Whether you&apos;re ready to onboard your institution or just want to learn more, our team is happy to help.
              </p>
            </div>

            {/* Email row */}
            <a
              href="mailto:contact@cortexa.com"
              className="group flex w-fit items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-transform duration-300 group-hover:scale-105">
                <FiMail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Email us</p>
                <p className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">contact@cortexa.com</p>
              </div>
              <FiArrowRight className="ml-3 h-4 w-4 text-gray-700 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-400" />
            </a>

            {/* Stats */}
            <div className="flex gap-8">
              {[['< 24h', 'Response time'], ['100+', 'Institutions'], ['99%', 'Satisfaction']].map(([v, l], i) => (
                <div key={i}>
                  <p className="text-2xl font-extrabold text-emerald-400">{v}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] p-8 shadow-2xl shadow-black/60 backdrop-blur-xl md:p-10"
            >
              {/* Shimmer top-line */}
              <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="c-name" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                    <input
                      id="c-name" required
                      disabled={status.state === 'submitting'}
                      className={field} placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="c-email" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                    <input
                      id="c-email" type="email" required
                      disabled={status.state === 'submitting'}
                      className={field} placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="c-msg" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Message</label>
                  <textarea
                    id="c-msg" required rows={5}
                    disabled={status.state === 'submitting'}
                    className={`${field} resize-none`}
                    placeholder="Tell us about your institution or ask us anything…"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                {status.state === 'success' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <FiCheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <p className="text-sm text-emerald-300">{status.message}</p>
                  </motion.div>
                )}

                {status.state === 'error' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <FiAlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <p className="text-sm text-red-300">{status.message}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={status.state === 'submitting'}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  {status.state === 'submitting' ? (
                    <><FiLoader className="h-4 w-4 animate-spin" /><span>Sending…</span></>
                  ) : (
                    <><span>Send Message</span><FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;
