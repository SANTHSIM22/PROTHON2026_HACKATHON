import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Glow Effects within the Dark Section */}
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

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight font-syne text-[#F0F4F2]">
              Elevate Your <br />
              <span className="text-[#B45309]">Intelligence.</span>
            </h2>
            <p className="text-[#8FA89F] text-lg max-w-md leading-relaxed">
              Experience the world's most advanced autonomous meeting agent. Extract value from every second of conversation.
            </p>
          </div>

          {/* Feature Badge */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#B45309]/20 rounded-xl flex items-center justify-center text-[#B45309]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-[#F0F4F2]">Multi-Agent Processing</div>
                <div className="text-[11px] text-[#8FA89F] uppercase tracking-widest mt-1">Simultaneous Analysis</div>
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
      {/* RIGHT PANEL — Login Form */}
      {/* ════════════════════════════════════════════ */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-8 bg-[#F0F4F2]">
        
        <div className="w-full max-w-[440px] space-y-10">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[#0C1A15] tracking-tight font-syne">Organization / User Sign In</h1>
            <p className="text-[#7A9489] font-medium">Enter your credentials to access your dashboard.</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#3D5249] ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3.5 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                    style={{ borderColor: focused === 'email' ? '#B45309' : '#D4E0DA' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[13px] font-bold text-[#3D5249]">Password</label>
                  <button type="button" className="text-[12px] font-bold text-[#B45309] hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#D4E0DA] rounded-xl px-4 py-3.5 text-[#0C1A15] placeholder-[#8FA89F] focus:outline-none transition-all duration-300 text-sm focus:ring-4 focus:ring-[#B45309]/5"
                    style={{ borderColor: focused === 'password' ? '#B45309' : '#D4E0DA' }}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-[0_10px_25px_rgba(180,83,9,0.25)] text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group hover:scale-[1.01]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D4E0DA]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F0F4F2] px-4 text-[#7A9489] font-bold tracking-widest">Social Gateway</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-white border border-[#D4E0DA] py-3 rounded-xl text-sm font-bold text-[#3D5249] hover:bg-[#F7FAF8] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border border-[#D4E0DA] py-3 rounded-xl text-sm font-bold text-[#3D5249] hover:bg-[#F7FAF8] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="text-center text-sm font-medium text-[#7A9489]">
            New to MeetingAI?{' '}
            <Link to="/signup" className="text-[#B45309] font-bold hover:underline">Create an account</Link>
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

export default Login;