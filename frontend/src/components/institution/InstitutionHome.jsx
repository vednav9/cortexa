// InstitutionHome.jsx – Premium Institution Portal Home
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers, FiBook, FiMail, FiPhone, FiGlobe, FiMapPin,
  FiCalendar, FiAward, FiExternalLink, FiArrowUpRight,
} from 'react-icons/fi';
import { InstitutionContext } from '../../context/InstitutionContext';

const ensureProtocol = (url) => {
  if (!url) return '#';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
    : '16, 185, 129';
};

// Lighten a hex color by mixing it with white
const lightenHex = (hex, amount = 0.85) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const mix = (c) => Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount);
  return `rgb(${mix(r[1])}, ${mix(r[2])}, ${mix(r[3])})`;
};

export default function InstitutionHome() {
  const { institution } = useContext(InstitutionContext);
  if (!institution) return null;

  const brandColor = institution.branding?.primaryColor || '#10b981';
  const rgb = hexToRgb(brandColor);
  const lightBg = lightenHex(brandColor, 0.94);

  const stats = [
    { icon: FiUsers, label: 'Students', value: institution.stats?.totalStudents ?? '—', suffix: '' },
    { icon: FiBook, label: 'Courses', value: institution.stats?.totalCourses ?? '—', suffix: '' },
    { icon: FiUsers, label: 'Faculty', value: institution.stats?.totalFaculty ?? '—', suffix: '' },
    { icon: FiAward, label: 'Active Semesters', value: institution.stats?.activeSemesters ?? '—', suffix: '' },
  ];

  const contactItems = [
    institution.contact?.email && { href: `mailto:${institution.contact.email}`, icon: FiMail, label: 'Email', value: institution.contact.email },
    institution.contact?.phone && { href: `tel:${institution.contact.phone}`, icon: FiPhone, label: 'Phone', value: institution.contact.phone },
    institution.contact?.website && { href: ensureProtocol(institution.contact.website), icon: FiGlobe, label: 'Website', value: institution.contact.website, external: true },
  ].filter(Boolean);

  return (
    <div style={{ backgroundColor: lightBg }} className="min-h-screen">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div className="relative overflow-hidden">

        {/* Background layer */}
        <div className="absolute inset-0">
          {institution.branding?.banner ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ backgroundImage: `url(${institution.branding.banner})`, filter: 'blur(2px)' }}
              />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <>
              {/* Solid brand gradient */}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(140deg, ${brandColor} 0%, rgba(${rgb},0.7) 60%, rgba(0,0,0,0.5) 100%)` }}
              />
              {/* Noise texture feel — subtle dot grid */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }}
              />
            </>
          )}

          {/* Soft light leak top-right */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-25"
            style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-28 md:pt-24 md:pb-36">
          <div className="flex flex-col lg:flex-row lg:items-end gap-10">

            {/* ─── Left: Identity ─── */}
            <div className="flex-1 space-y-6">

              {/* Type pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-md text-white/90 text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                  {institution.type || 'Educational Institution'}
                </span>
              </motion.div>

              {/* Logo + Name */}
              <div className="flex items-start gap-5">
                {institution.branding?.logo ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-[18px] border-2 border-white/30 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex-shrink-0"
                  >
                    <img src={institution.branding.logo} alt={institution.name} className="w-full h-full object-contain p-2" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
                    className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-[18px] border-2 border-white/30 bg-white/15 backdrop-blur-xl shadow-2xl flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="text-white text-3xl font-black leading-none">
                      {institution.name?.charAt(0).toUpperCase()}
                    </span>
                  </motion.div>
                )}

                <div className="flex-1 pt-1">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.15 }}
                    className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.15]"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}
                  >
                    {institution.name}
                  </motion.h1>
                  {institution.code && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/50 text-[12px] font-bold tracking-[0.2em] uppercase mt-1.5"
                    >
                      {institution.code}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Description */}
              {institution.description && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="text-white/70 text-[15px] leading-[1.7] max-w-xl font-light"
                >
                  {institution.description}
                </motion.p>
              )}
            </div>

            {/* ─── Right: Location card ─── */}
            {institution.address?.city && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="flex-shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3 self-start lg:self-end"
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <FiMapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-[14px] font-bold leading-snug">{institution.address.city}</p>
                  <p className="text-white/55 text-[11px] font-medium">{institution.address.state}, {institution.address.country}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          STATS — Float up from hero base
      ══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 -mt-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.1)] border border-white/80 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.14)] transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `rgba(${rgb}, 0.10)` }}
              >
                <stat.icon className="w-[18px] h-[18px]" style={{ color: brandColor }} />
              </div>
              <div>
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          ABOUT + CONTACT
      ══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 mt-8 pb-20">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-6"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Institution Info</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, rgba(${rgb},0.3), transparent)` }} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── About Card ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] border border-gray-100/80"
          >
            {/* Colored header strip */}
            <div
              className="h-[5px] w-full"
              style={{ background: `linear-gradient(90deg, ${brandColor}, rgba(${rgb},0.3))` }}
            />

            <div className="p-7">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${rgb}, 0.10)` }}
                >
                  <FiBook className="w-4 h-4" style={{ color: brandColor }} />
                </div>
                <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight">About the Institution</h2>
              </div>

              <div className="space-y-1 divide-y" style={{ '--tw-divide-opacity': 1 }}>
                {/* Type */}
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-[13px] text-gray-500 font-medium">Type</span>
                  <span
                    className="text-[12px] font-bold px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: `rgba(${rgb}, 0.10)`, color: brandColor }}
                  >
                    {institution.type || '—'}
                  </span>
                </div>

                {/* Code */}
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-[13px] text-gray-500 font-medium">Code</span>
                  <code className="text-[13px] font-bold text-gray-800 bg-gray-50 px-2.5 py-1 rounded-lg tracking-wider border border-gray-100">
                    {institution.code || '—'}
                  </code>
                </div>

                {/* Established */}
                {institution.established && (
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span className="text-[13px] font-medium">Established</span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">{institution.established}</span>
                  </div>
                )}

                {/* Address */}
                {institution.address && (
                  <div className="flex items-start gap-3 py-3.5">
                    <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: brandColor }} />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Address</p>
                      <p className="text-[13px] text-gray-700 leading-relaxed">
                        {[institution.address.street, institution.address.city, institution.address.state, institution.address.country]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Contact Card ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] border border-gray-100/80"
          >
            <div
              className="h-[5px] w-full"
              style={{ background: `linear-gradient(90deg, ${brandColor}, rgba(${rgb},0.3))` }}
            />

            <div className="p-7">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${rgb}, 0.10)` }}
                >
                  <FiMail className="w-4 h-4" style={{ color: brandColor }} />
                </div>
                <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Contact & Links</h2>
              </div>

              {contactItems.length > 0 ? (
                <div className="space-y-3">
                  {contactItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
                      style={{ borderColor: `rgba(${rgb}, 0.10)`, backgroundColor: `rgba(${rgb}, 0.04)` }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = `rgba(${rgb}, 0.10)`;
                        e.currentTarget.style.borderColor = `rgba(${rgb}, 0.25)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = `rgba(${rgb}, 0.04)`;
                        e.currentTarget.style.borderColor = `rgba(${rgb}, 0.10)`;
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: `rgba(${rgb}, 0.15)` }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: brandColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-0.5">{item.label}</p>
                        <p className="text-[13px] font-semibold text-gray-800 truncate group-hover:underline decoration-current underline-offset-2">
                          {item.value}
                        </p>
                      </div>
                      <FiArrowUpRight
                        className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `rgba(${rgb}, 0.08)` }}
                  >
                    <FiMail className="w-5 h-5" style={{ color: `rgba(${rgb}, 0.4)` }} />
                  </div>
                  <p className="text-[13px] text-gray-400 font-medium">No contact info available</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
