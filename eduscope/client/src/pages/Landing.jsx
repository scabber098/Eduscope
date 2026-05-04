// === FILE: client/src/pages/Landing.jsx ===
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from 'framer-motion';
import Logo from '../components/Logo';
import { useCountUp } from '../hooks/useCountUp';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ScrollReveal({ children, delay = 0, className = '', direction = 'up' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const variants = {
    up: { hidden: { opacity: 0, y: 56 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
  };
  const v = variants[direction] || variants.up;
  return (
    <motion.div ref={ref} className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={v}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

function CountStat({ value, suffix, label, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const n = useCountUp(inView ? value : 0, { duration: 2000 });
  return (
    <div ref={ref} className="text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay }}>
        <div className="font-display text-5xl md:text-6xl font-bold gold-text mb-2">{n.toLocaleString()}{suffix}</div>
        <div className="text-xs uppercase tracking-[0.25em] font-mono" style={{ color: '#475569' }}>{label}</div>
      </motion.div>
    </div>
  );
}

function MagneticBtn({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22 });
  const sy = useSpring(y, { stiffness: 300, damping: 22 });
  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={handleMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.div>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '⚡', title: 'Instant Polls', desc: 'Launch multi-question sessions in seconds. Students join via a 6-character code — no accounts required.' },
  { icon: '📊', title: 'Live Analytics', desc: 'Watch answers stream in real time. Spot confusion patterns before they compound.' },
  { icon: '🛡', title: 'Anti-Cheat Guard', desc: 'Tab-switch detection with automated warnings and disqualification. Faculty see it live.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Gamify participation. Students earn points for correct answers and see where they stand.' },
  { icon: '📁', title: 'Session Reports', desc: 'Download detailed CSVs after every session. Filter by lecture, date, or student.' },
  { icon: '🎓', title: 'Works Everywhere', desc: 'Mobile-first design. Any browser, any device. Even works in incognito.' },
];

const STEPS = [
  { n: '01', title: 'Create a Session', desc: 'Faculty log in, pick a lecture, and launch a session. Questions take 30 seconds to configure.' },
  { n: '02', title: 'Students Join', desc: 'Share the 6-character code. Students enter from any browser — no signup, no friction.' },
  { n: '03', title: 'Run Live Polls', desc: 'Polls go live instantly. Faculty watch responses and participation metrics in real time.' },
  { n: '04', title: 'Review Results', desc: 'After the session, download reports and revisit per-question breakdowns.' },
];

const PLANS = [
  { name: 'Starter', price: 'Free', desc: 'For small classes', features: ['Up to 30 students', '5 sessions/month', 'Basic analytics', 'Session codes'] },
  { name: 'Pro', price: '$12', per: '/mo', desc: 'For serious educators', features: ['Unlimited students', 'Unlimited sessions', 'Advanced reports', 'Anti-cheat system', 'Priority support'], popular: true },
  { name: 'Institution', price: 'Custom', desc: 'For universities', features: ['All Pro features', 'SSO & LMS integration', 'Dedicated support', 'SLA guarantee', 'Custom branding'] },
];

const TESTIMONIALS = [
  { name: 'Dr. Priya Nair', role: 'Associate Professor, IIT Delhi', text: 'EduScope transformed my 200-seat lectures. I can instantly see which topics students struggle with.' },
  { name: 'Rahul Mehta', role: 'Student, BITS Pilani', text: 'Way better than raising hands. I feel like my responses actually matter now.' },
  { name: 'Prof. Sarah Chen', role: 'Dean of Instruction, Stanford', text: 'The anti-cheat system alone makes this worth it for online assessments.' },
];

const FOOTER_MENU = [
  {
    title: 'Product',
    links: [
      { text: 'Features', url: '#features' },
      { text: 'How it works', url: '#how' },
      { text: 'Pricing', url: '#pricing' },
      { text: 'Live Dashboard', url: '/auth' },
    ],
  },
  {
    title: 'For Faculty',
    links: [
      { text: 'Sign in', url: '/auth?role=faculty' },
      { text: 'Create Session', url: '/auth?role=faculty' },
      { text: 'Manage Lectures', url: '/faculty' },
      { text: 'Download Reports', url: '/faculty' },
    ],
  },
  {
    title: 'For Students',
    links: [
      { text: 'Join with Code', url: '/auth?role=student' },
      { text: 'My History', url: '/student' },
      { text: 'Leaderboard', url: '/student' },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About', url: '#' },
      { text: 'Blog', url: '#' },
      { text: 'Careers', url: '#' },
      { text: 'Contact', url: '#' },
    ],
  },
];

// ─── Footer Component ────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer
      className="relative z-10 border-t"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'rgba(6,8,16,0.88)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10">

        {/* Top grid: brand col + menu cols */}
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-6 mb-16">

          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <Logo size={36} animated={false} />
              <span className="font-display text-xl font-bold" style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                EduScope
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#94a3b8', maxWidth: '22ch' }}>
              Turning lectures into living conversations — one poll at a time.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: '𝕏', label: 'X', url: 'https://x.com' },
                { icon: 'in', label: 'LinkedIn', url: 'https://linkedin.com' },
                { icon: '▶', label: 'YouTube', url: 'https://youtube.com' },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94a3b8',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F0B429')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Menu columns */}
          {FOOTER_MENU.map((section, si) => (
            <div key={si}>
              <h3
                className="text-xs uppercase tracking-[0.2em] font-semibold mb-5"
                style={{ color: '#F0B429' }}
              >
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, li) => (
                  <li key={li}>
                    <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.18 }}>
                      {link.url.startsWith('#') ? (
                        <a
                          href={link.url}
                          className="text-sm transition-colors"
                          style={{ color: '#94a3b8', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#F0B429')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                        >
                          {link.text}
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className="text-sm transition-colors"
                          style={{ color: '#94a3b8', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#F0B429')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                        >
                          {link.text}
                        </Link>
                      )}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2rem' }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#64748b' }}>
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} EduScope. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {[['Privacy Policy', '#'], ['Terms of Service', '#'], ['Cookie Policy', '#']].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition-colors"
                style={{ color: '#64748b', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F0B429')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────

export default function Landing() {
  const [videoReady, setVideoReady] = useState(false);
  const [videoErr, setVideoErr] = useState(false);
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.play().catch(() => setVideoErr(true));
  }, []);

  return (
    <div className="relative min-h-screen" style={{ color: '#f1f5f9' }}>

      {/* ── Video bg ── */}
      <div className="fixed inset-0 z-0" style={{ background: '#060810' }} />
      {!videoErr && (
        <motion.video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoErr(true)}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className="fixed inset-0 w-full h-full z-[1]"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          src="/bg-hero.mp4"
        />
      )}

      {/* Overlay gradient — light enough for video to show through */}
      <div className="fixed inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(180deg,rgba(6,8,16,0.25) 0%,rgba(6,8,16,0.40) 40%,rgba(6,8,16,0.65) 75%,rgba(6,8,16,0.80) 100%)' }} />

      {/* Ambient orbs */}
      <div className="orb w-[800px] h-[800px] pointer-events-none z-[3]"
        style={{ position: 'fixed', top: '-220px', left: '-200px', background: '#F0B429' }} />
      <div className="orb w-[500px] h-[500px] pointer-events-none z-[3]"
        style={{ position: 'fixed', top: '55%', right: '-160px', background: '#6366f1', opacity: 0.08 }} />

      {/* ── Navbar ── */}
      <motion.header
        initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-6 md:px-12 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,8,16,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <Logo size={38} animated={false} />
          <span className="font-display text-2xl font-bold" style={{ letterSpacing: '-0.03em' }}>EduScope</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[['Features', '#features'], ['How it works', '#how'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href}
              className="relative group transition-colors hover:text-[#f1f5f9]"
              style={{ color: '#94a3b8' }}>
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#F0B429] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <MagneticBtn><Link to="/auth?role=student" className="btn-ghost !py-2 !px-4 text-sm hidden md:inline-flex">Join Session</Link></MagneticBtn>
          <MagneticBtn><Link to="/auth" className="btn-primary !py-2 !px-4 text-sm">Sign in →</Link></MagneticBtn>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative z-10 px-6 md:px-12 pt-20 md:pt-32 pb-40 max-w-7xl mx-auto">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>

            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] mb-8 px-4 py-2 rounded-full"
              style={{ color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)', background: 'rgba(240,180,41,0.06)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429] pulse-dot inline-block" />
              Live Classroom Intelligence
            </motion.span>

            <motion.h1
              className="font-display font-bold leading-[1.0] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', maxWidth: '16ch', color: '#f1f5f9' }}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              Every question,{' '}
              <motion.span className="gold-text italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.8 }}>
                every student,
              </motion.span>{' '}
              in real time.
            </motion.h1>

            <motion.p className="text-xl leading-relaxed mb-10 max-w-2xl" style={{ color: '#94a3b8' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8 }}>
              EduScope turns lectures into living conversations. Launch polls in a click,
              watch answers flow in, and spot struggles before anyone falls behind.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}>
              <MagneticBtn>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth?role=faculty" className="btn-primary text-base !px-8 !py-4">🎓 I'm Faculty →</Link>
                </motion.div>
              </MagneticBtn>
              <MagneticBtn>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth?role=student" className="btn-ghost text-base !px-8 !py-4">📚 Join with Code</Link>
                </motion.div>
              </MagneticBtn>
            </motion.div>

            <motion.div className="flex items-center gap-6 mt-12 flex-wrap"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}>
              <div className="flex -space-x-2">
                {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85 + i * 0.07, type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold"
                    style={{ color: '#060810', border: '2px solid #060810' }}>{l}</motion.div>
                ))}
              </div>
              <span className="text-sm" style={{ color: '#475569' }}>
                <strong style={{ color: '#f1f5f9' }}>1,200+</strong> students active across 30 campuses
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="badge badge-gold mb-4">Features</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-4">
              Built for <span className="gold-text italic">every lecture hall.</span>
            </h2>
            <p className="text-lg" style={{ color: '#64748b' }}>From 12-person seminars to 400-seat auditoriums.</p>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.07}>
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                className="glass p-7 h-full">
                <motion.div whileHover={{ scale: 1.18, rotate: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5"
                  style={{ background: 'rgba(240,180,41,0.1)' }}>
                  {f.icon}
                </motion.div>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: '#f1f5f9' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative z-10 px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="badge badge-gold mb-4">How it works</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold">From launch to <span className="gold-text italic">live</span> in 60s.</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.1}>
              <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="glass-card p-6 h-full relative overflow-hidden">
                <div className="font-mono text-6xl font-bold mb-4 gold-text opacity-25 leading-none select-none">{s.n}</div>
                <h3 className="font-display text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/3 -right-3 text-2xl" style={{ color: 'rgba(240,180,41,0.3)' }}>→</div>
                )}
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="glass p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(240,180,41,0.06) 0%, transparent 70%)' }} />
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">Trusted across campus</h2>
              <p style={{ color: '#64748b' }}>Numbers from active EduScope deployments.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <CountStat value={1200} suffix="+" label="Active students" delay={0} />
              <CountStat value={340} suffix="+" label="Lectures delivered" delay={0.15} />
              <CountStat value={98} suffix="%" label="Participation rate" delay={0.3} />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="badge badge-gold mb-4">Pricing</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">Simple, <span className="gold-text italic">transparent</span> pricing.</h2>
            <p style={{ color: '#64748b' }}>No surprise charges. Start free, scale when you grow.</p>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.1} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                className={`glass p-7 h-full flex flex-col ${plan.popular ? 'ring-1 ring-[rgba(240,180,41,0.4)]' : ''}`}
                style={plan.popular ? { boxShadow: '0 0 60px -20px rgba(240,180,41,0.3)' } : {}}>
                {plan.popular
                  ? <div className="badge badge-gold self-start mb-4">Most Popular</div>
                  : <div className="mb-4" style={{ height: '26px' }} /> /* spacer to align with badge height */
                }
                <div className="font-display text-xl font-bold mb-1" style={{ color: '#f1f5f9' }}>{plan.name}</div>
                <div className="text-sm mb-5" style={{ color: '#64748b' }}>{plan.desc}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-bold gold-text">{plan.price}</span>
                  {plan.per && <span className="text-sm" style={{ color: '#475569' }}>{plan.per}</span>}
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <motion.li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#94a3b8' }}
                      whileHover={{ x: 4, color: '#f1f5f9', transition: { duration: 0.18 } }}>
                      <span style={{ color: '#22c55e' }}>✓</span> {f}
                    </motion.li>
                  ))}
                </ul>
                <MagneticBtn>
                  <Link to="/auth" className="btn-primary text-center justify-center w-full">
                    Get started →
                  </Link>
                </MagneticBtn>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-5xl font-bold">Educators <span className="gold-text italic">love it.</span></h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.12}>
              <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }} className="glass-card p-7 h-full">
                <div className="text-3xl mb-4 gold-text font-display">❝</div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#94a3b8' }}>{t.text}</p>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{t.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: '#475569' }}>{t.role}</div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 md:px-12 py-28 max-w-4xl mx-auto text-center">
        <ScrollReveal direction="scale">
          <div className="glass p-12 md:p-16 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(240,180,41,0.07) 0%,rgba(99,102,241,0.04) 100%)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(240,180,41,0.09) 0%, transparent 60%)' }} />
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-5 relative z-10">
              Ready to <span className="gold-text italic">transform</span> your lectures?
            </h2>
            <p className="text-lg mb-10 relative z-10" style={{ color: '#64748b' }}>Set up in 30 seconds. No credit card required.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <MagneticBtn>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth?role=faculty" className="btn-primary text-lg !px-10 !py-4">🎓 Start as Faculty →</Link>
                </motion.div>
              </MagneticBtn>
              <MagneticBtn>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Link to="/auth?role=student" className="btn-ghost text-lg !px-10 !py-4">📚 Join as Student</Link>
                </motion.div>
              </MagneticBtn>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ── */}
      <SiteFooter />

    </div>
  );
}