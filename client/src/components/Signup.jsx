import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technical',
    organizationEmail: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { level: 0, label: '', color: '#243028' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#DC2626' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#D97706' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#D97706' };
    if (score <= 4) return { level: 4, label: 'Strong', color: '#16A34A' };
    return { level: 5, label: 'Very Strong', color: '#16A34A' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.role) {
      setError('Please select a role.');
      return;
    }
    if (!formData.organizationEmail) {
      setError('Please provide organization email.');
      return;
    }

    setLoading(true);
    try {
      await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.role,
        formData.organizationEmail
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    backgroundColor: '#0C1210',
    borderColor: focused === field ? '#D97706' : '#243028',
    boxShadow: focused === field ? '0 0 0 3px rgba(217, 119, 6, 0.1), 0 0 20px rgba(217, 119, 6, 0.05)' : 'none',
  });

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-[#3D5249] font-sans overflow-hidden relative selection:bg-[#B45309]/20 flex">

      {/* Noise Texture Overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Background radial effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#B45309] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-[#D97706] rounded-full blur-[180px] opacity-[0.03] pointer-events-none" />

      {/* ════════════════════════════════════════════ */}
      {/* LEFT PANEL — Brand / Visual */}
      {/* ════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-between p-16 bg-[#0C1A15] text-white">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#B45309] rounded-full blur-[150px] opacity-[0.15] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#D97706] rounded-full blur-[120px] opacity-[0.1] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 flex items-center justify-center text-[#B45309] group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-[0.25em] text-white">MEETING.AI</span>
          </Link>
        </div>

        {/* Center — Pipeline Visual */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm space-y-8">
            <h2 className="text-4xl font-bold font-syne leading-tight text-[#F0F4F2]">
              Join the future of <br />
              <span className="text-[#B45309]">Productivity.</span>
            </h2>
            
            {/* Setup Flow Card */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B45309]/20 to-transparent blur-2xl"></div>
               <div className="space-y-6">
                {[
                  { label: 'Step 1: Create Account', status: 'current', desc: 'Secure your workspace' },
                  { label: 'Step 2: Link Platforms', status: 'pending', desc: 'Zoom, Teams, Google' },
                  { label: 'Step 3: AI Onboarding', status: 'pending', desc: 'Personalize your agent' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step.status === 'current' ? 'bg-[#B45309] border-[#B45309] text-white' : 'border-white/20 text-white/40'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${step.status === 'current' ? 'text-white' : 'text-white/40'}`}>{step.label}</div>
                      <div className="text-[11px] text-white/30">{step.desc}</div>
                    </div>
                  </div>
                ))}
               </div>
            </div>
          </div>
        </div>

        {/* Legal / Bottom */}
        <div className="relative z-10">
          <p className="text-[#556961] text-xs font-mono">
            &copy; {new Date().getFullYear()} MeetingAI Pipeline. All rights reserved.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Signup Form */}
      {/* ════════════════════════════════════════════ */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-8 bg-[#F0F4F2] overflow-y-auto">
        
        <div className="w-full max-w-[440px] space-y-10 py-12">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[#0C1A15] tracking-tight font-syne">Create Account</h1>
            <p className="text-[#7A9489] font-medium">Join 2,400+ teams automating their meetings.</p>
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-[shake_0.4s_ease-in-out]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
                placeholder="John Doe"
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'name' ? '#B45309' : '#D4E0DA' }}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                placeholder="name@company.com"
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'email' ? '#B45309' : '#D4E0DA' }}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                placeholder="Min 6 characters"
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'password' ? '#B45309' : '#D4E0DA' }}
                required
              />
              {formData.password && (
                <div className="flex items-center gap-2 pt-1 px-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-500"
                        style={{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#D4E0DA' }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => setFocused('')}
                placeholder="••••••••"
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'confirmPassword' ? '#B45309' : '#D4E0DA' }}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                onFocus={() => setFocused('role')}
                onBlur={() => setFocused('')}
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'role' ? '#B45309' : '#D4E0DA' }}
                required
              >
                <option value="technical">Technical User</option>
                <option value="non-technical">Non-Technical User</option>
              </select>
            </div>

            {/* Organization Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#3D5249] ml-1">Organization Email</label>
              <input
                type="email"
                name="organizationEmail"
                value={formData.organizationEmail}
                onChange={handleChange}
                onFocus={() => setFocused('organizationEmail')}
                onBlur={() => setFocused('')}
                placeholder="bob@gmail.com"
                className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                style={{ borderColor: focused === 'organizationEmail' ? '#B45309' : '#D4E0DA' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-[0_10px_25px_rgba(180,83,9,0.25)] text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group hover:scale-[1.01] mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-[#7A9489]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#B45309] font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default Signup;