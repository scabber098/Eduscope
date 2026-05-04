import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UniversityAPI } from '../api/client';

const inputClass = 'input-field mt-1 w-full';
const labelClass = 'text-xs uppercase tracking-wider';
const labelStyle = { color: '#8B949E' };

function SelectField({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div>
      <label className={labelClass} style={labelStyle}>{label}</label>
      <select
        className={inputClass}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        disabled={disabled}
        style={{ background: '#161B22', color: value ? '#F0EAD6' : '#8B949E', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState(params.get('role') === 'faculty' ? 'faculty' : 'student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const [videoErr, setVideoErr] = useState(false);
  const videoRef = useRef(null);

  const { login, register, isAuthed, user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthed) nav(user.role === 'faculty' ? '/faculty' : '/student', { replace: true });
  }, [isAuthed, user, nav]);

  // If role=student param and mode should be register by default for new students
  useEffect(() => {
    if (params.get('role') === 'student') {
      setRole('student');
    }
  }, [params]);

  useEffect(() => {
    UniversityAPI.list().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    setDepartmentId('');
    setDepartments([]);
    if (!universityId) return;
    setLoadingDepts(true);
    UniversityAPI.departments(universityId)
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, [universityId]);

  useEffect(() => {
    setUniversityId('');
    setDepartmentId('');
    setDepartments([]);
    setUniversityName('');
  }, [role, mode]);

  // Auto-play background video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.play().catch(() => setVideoErr(true));
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    if (val && !/^[A-Za-z\s]+$/.test(val)) {
      setNameError('Name can only contain letters and spaces.');
    } else {
      setNameError('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (mode === 'register' && nameError) return;
    if (mode === 'register' && name && !/^[A-Za-z\s]+$/.test(name)) return;
    setSubmitting(true);
    try {
      let u;
      if (mode === 'login') {
        u = await login(email, password);
      } else {
        const payload = {
          name,
          email,
          password,
          role,
          ...(universityId && { universityId }),
          ...(departmentId && { departmentId }),
          ...(role === 'student' && cls && { class: cls }),
          ...(role === 'student' && section && { section }),
          ...(role === 'student' && universityName && { universityName }),
          ...(role === 'student' && registrationNumber && { registrationNumber }),
        };
        u = await register(payload);
      }
      toast.success(mode === 'login' ? 'Welcome back' : 'Account created');
      console.log(`[Auth] login success, role=${u.role}, redirecting to /${u.role}`);
      nav(u.role === 'faculty' ? '/faculty' : '/student', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const showUniversityFields = mode === 'register' && role === 'faculty';
  const showStudentFields = mode === 'register' && role === 'student';

  return (
    <div className="min-h-screen flex relative overflow-hidden">

      {/* ── Fixed Background Video ── */}
      <div className="absolute inset-0 z-0" style={{ background: '#060810' }} />
      {!videoErr && (
        <motion.video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoErr(true)}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full z-[1]"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          src="/bg-auth.mp4"
        />
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(6,8,16,0.75) 0%, rgba(6,8,16,0.60) 50%, rgba(6,8,16,0.80) 100%)' }} />

      {/* Ambient orbs */}
      <div className="orb w-[500px] h-[500px] -top-32 -left-32 z-[3]" style={{ background: '#F0B429' }} />
      <div className="orb w-[400px] h-[400px] bottom-0 right-0 z-[3]" style={{ background: '#E07B39' }} />

      {/* Left branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r z-10" style={{ borderColor: 'rgba(240,234,214,0.04)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="inline-flex items-center gap-3 w-fit">
            <Logo size={40} animated={false} /><span className="font-display text-2xl font-bold">EduScope</span>
          </Link>
          <div className="max-w-md">
            <h1 className="font-display text-5xl font-bold leading-tight mb-6">
              Turn every lecture into a <span className="gold-text italic">two-way conversation.</span>
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: '#8B949E' }}>
              {role === 'student'
                ? 'Sign in to join polls, track your marks, and see your ranking.'
                : 'Sign in to launch polls, track engagement, and see where your class stands.'}
            </p>
          </div>
          <div className="text-xs" style={{ color: '#4a5060' }}>
            <div className="uppercase tracking-widest">EduScope · Real-time classroom intelligence</div>
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8">

          <div className="lg:hidden mb-10 flex items-center justify-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <Logo size={40} animated /><span className="font-display text-2xl font-bold">EduScope</span>
            </Link>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(240,234,214,0.06)' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === m ? 'gold-gradient shadow-lg' : ''}`}
                style={mode === m ? { color: '#0A0D12' } : { color: '#8B949E' }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }} onSubmit={submit} className="space-y-5">

              <div>
                <h2 className="font-display text-3xl font-bold">{mode === 'login' ? 'Welcome back.' : 'Join EduScope.'}</h2>
                <p className="text-sm mt-1" style={{ color: '#8B949E' }}>{mode === 'login' ? 'Sign in to your dashboard.' : 'Create your account in seconds.'}</p>
              </div>

              {mode === 'register' && (
                <div>
                  <label className={labelClass} style={labelStyle}>Full name</label>
                  <input className={inputClass} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Jane Doe" required
                    style={nameError ? { borderColor: '#F85149' } : {}} />
                  {nameError && <p className="text-xs mt-1" style={{ color: '#F85149' }}>{nameError}</p>}
                </div>
              )}

              <div>
                <label className={labelClass} style={labelStyle}>Email</label>
                <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Password</label>
                <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
              </div>

              {/* Role picker — register only */}
              {mode === 'register' && (
                <div>
                  <label className={`${labelClass} block mb-2`} style={labelStyle}>I am a…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['student', 'faculty'].map(r => (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${role === r ? 'border-[#F0B429] text-[#F0B429]' : 'text-[#8B949E]'}`}
                        style={role === r ? { background: 'rgba(240,180,41,0.05)', borderColor: '#F0B429' } : { borderColor: 'rgba(240,234,214,0.08)' }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student class/section fields */}
              <AnimatePresence>
                {showStudentFields && (
                  <motion.div key="student-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="space-y-4 overflow-hidden">
                    <div>
                      <label className={labelClass} style={labelStyle}>University (optional)</label>
                      <input className={inputClass} value={universityName} onChange={e => setUniversityName(e.target.value)} placeholder="e.g. Punjab Technical University" />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Class (optional)</label>
                      <input className={inputClass} value={cls} onChange={e => setCls(e.target.value)} placeholder="e.g. B.Tech 3rd Year, Class 10" />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Registration Number (optional)</label>
                      <input className={inputClass} value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. REG2024001" />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Section (optional)</label>
                      <input className={inputClass} value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A, B, C" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* University + Department — faculty only */}
              <AnimatePresence>
                {showUniversityFields && (
                  <motion.div key="uni-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="space-y-4 overflow-hidden">
                    <SelectField
                      label="University"
                      value={universityId}
                      onChange={setUniversityId}
                      options={universities.map(u => ({ id: u.id, name: `${u.name} (${u.short_name})` }))}
                      placeholder="Select your university…"
                    />
                    <SelectField
                      label="Department"
                      value={departmentId}
                      onChange={setDepartmentId}
                      options={departments}
                      placeholder={universityId ? (loadingDepts ? 'Loading…' : 'Select department…') : 'Select university first'}
                      disabled={!universityId || loadingDepts}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={submitting}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                {submitting
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#0A0D12]/40 border-t-[#0A0D12] rounded-full" />
                  : <>{mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></>
                }
              </motion.button>

              <p className="text-center text-sm" style={{ color: '#8B949E' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-[#F0B429] hover:underline">
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
