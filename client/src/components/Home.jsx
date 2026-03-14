import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BentoDemo } from './ui/bento-demo';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const testimonials = [
    { text: "MeetingAI saved our team 15 hours a week in manual documentation.", author: "Sarah J.", role: "Product Manager" },
    { text: "The accuracy of the action items is mind-blowing. It's like having another engineer in the room.", author: "David C.", role: "Tech Lead" },
    { text: "We finally have visibility into decisions made across all our remote synchronous meetings.", author: "Elena R.", role: "Director of Ops" },
    { text: "The Trello integration means nothing falls through the cracks anymore.", author: "Mark T.", role: "Scrum Master" },
    { text: "MeetingAI extracted insights I didn't even realize we discussed.", author: "Chloe S.", role: "Marketing Head" },
    { text: "It's completely replaced our need for a dedicated project coordinator.", author: "Alex B.", role: "Startup Founder" }
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-[#3D5249] font-sans overflow-hidden relative selection:bg-[#B45309]/20">
      
      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      ></div>

      {/* Background radial effects */}
      <div className="fixed top-[-30%] left-[-15%] w-[60%] h-[60%] bg-[#B45309] rounded-full blur-[200px] opacity-[0.05] pointer-events-none"></div>
      <div className="fixed top-[30%] right-[-15%] w-[45%] h-[45%] bg-[#D97706] rounded-full blur-[180px] opacity-[0.03] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[30%] w-[40%] h-[40%] bg-[#92400E] rounded-full blur-[160px] opacity-[0.04] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-[#D4E0DA] bg-[#F0F4F2]/80 backdrop-blur-2xl backdrop-saturate-150 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 relative flex items-center justify-center text-[#B45309] group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-500 ease-out">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-[0.2em] text-[#0C1A15] mt-0.5 group-hover:text-[#B45309] transition-all duration-500">MEETING.AI</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-[#7A9489] hover:text-[#0C1A15] px-4 py-2 rounded-lg hover:bg-[#D4E0DA]/30 transition-all duration-300"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="group px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-[0_8px_25px_rgba(180,83,9,0.25)] text-[#FFFFFF] text-sm font-semibold transition-all duration-500 hover:scale-[1.03] flex items-center gap-2"
            >
              Get Started
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-500">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-36">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Column */}
          <div className="space-y-8 relative z-20">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#D4E0DA] hover:border-[#B45309]/30 hover:bg-[#F7FAF8] transition-all duration-500 cursor-default group/pill backdrop-blur-sm shadow-sm">
              <span className="text-[#B45309] group-hover/pill:scale-110 transition-transform duration-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 2L13.2 8.8L20 10L13.2 11.2L12 18L10.8 11.2L4 10L10.8 8.8L12 2Z" />
                  <path d="M5 16L5.6 19.4L9 20L5.6 20.6L5 24L4.4 20.6L1 20L4.4 19.4L5 16Z" opacity="0.5"/>
                </svg>
              </span>
              <span className="text-[11px] font-semibold text-[#7A9489] tracking-[0.15em] uppercase">
                Autonomous Meeting Intelligence
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl lg:text-[4.2rem] font-bold leading-[1.08] tracking-[-0.02em]">
              <span className="block text-[#0C1A15] pb-2">Your Meetings</span>
              <span className="block text-[#7A9489] pb-2">Hide Insights.</span>
              <span className="block text-[#0C1A15] pb-2">
                We Extract{' '}
                <span className="relative inline-block group/all cursor-default">
                  <span className="text-[#B45309] group-hover/all:text-[#D97706] transition-colors duration-500">All</span>
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[#B45309] to-transparent scale-x-0 group-hover/all:scale-x-100 transition-transform duration-500 origin-left"></span>
                </span>
              </span>
              <span className="block text-[#B45309] hover:text-[#D97706] transition-colors duration-500 cursor-default">of Them.</span>
            </h1>

            {/* Paragraph */}
            <p className="text-[#3D5249] text-lg lg:text-xl max-w-lg leading-[1.7] font-light">
              MeetingAI deploys an autonomous multi-agent AI that thinks like a Product Manager — transcribing, analyzing, and assigning action items without human guidance.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-[#FFFFFF] font-semibold transition-all duration-500 hover:scale-[1.03] hover:-translate-y-0.5 flex items-center gap-2.5 shadow-[0_10px_30px_rgba(180,83,9,0.2)] hover:shadow-[0_15px_40px_rgba(180,83,9,0.3)]"
              >
                <span>Start Free Trial</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-500">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="group px-8 py-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F7FAF8] border border-[#D4E0DA] text-[#3D5249] hover:text-[#0C1A15] font-semibold transition-all duration-500 hover:-translate-y-0.5 shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                Watch Demo
              </button>
            </div>
            
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="relative w-full max-w-lg mx-auto lg:ml-auto select-none mt-10 lg:mt-0 lg:pl-10 group/mockup">
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D97706]/15 to-[#B45309]/5 blur-[80px] transform scale-90 z-0 rounded-full group-hover/mockup:scale-100 group-hover/mockup:opacity-90 transition-all duration-1000 ease-out"></div>

            {/* Dashboard Container */}
            <div className="relative z-10 bg-[#FFFFFF]/90 backdrop-blur-2xl border border-[#D4E0DA] rounded-2xl p-6 shadow-2xl overflow-visible transition-all duration-700 ease-out group-hover/mockup:-translate-y-1.5 group-hover/mockup:shadow-[0_25px_60px_rgba(0,0,0,0.08)] group-hover/mockup:border-[#B45309]/20">
              
              {/* Floating Pill - Top Left */}
              <div className="absolute -top-4 -left-4 bg-[#FFFFFF] border border-[#D97706]/30 text-xs text-[#0C1A15] font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl z-20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(217,119,6,0.1)] hover:border-[#D97706]/60">
                <div className="text-[#D97706]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <span>Action Item Found</span>
              </div>

              {/* Mockup Top Header */}
              <div className="flex justify-between items-start mb-8 pt-2">
                <div>
                  <div className="text-[10px] text-[#7A9489] font-bold tracking-[0.2em] uppercase mb-1.5">
                    MEETINGAI AGENT
                  </div>
                  <div className="text-lg font-semibold text-[#0C1A15]">Live Analysis Pipeline</div>
                </div>
                <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></div>
                  <span className="text-[11px] font-medium text-[#16A34A]">Live</span>
                </div>
              </div>

              {/* Scan Block */}
              <div className="bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl p-5 mb-4 space-y-4 hover:border-[#B45309]/20 transition-all duration-500 group/scan shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8FA89F] font-mono tracking-[0.15em] uppercase text-[11px]">Processing Transcript</span>
                  <span className="bg-[#D97706]/10 text-[#B45309] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#D97706]/20">IN PROGRESS</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-mono mt-2">
                  <div className="text-[#F59E0B]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <span className="text-[#0C1A15] font-semibold">project-sync-Q3.mp4</span>
                  <div className="flex items-center gap-1 text-[#D97706] bg-[#D97706]/10 px-2 py-0.5 rounded font-semibold text-[11px] ml-auto">
                     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    2 Critical
                  </div>
                </div>
                <div>
                  <div className="h-1 w-full bg-[#D4E0DA] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B] w-[85%] shadow-[0_0_8px_rgba(217,119,6,0.3)] rounded-full transition-all duration-1000"></div>
                  </div>
                  <div className="text-[10px] text-[#8FA89F] mt-2 font-medium">85% transcribed</div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex gap-3 mb-4">
                {[
                  { value: '4', label: 'Action Items', color: '#B45309', borderColor: 'border-l-[#B45309]', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></> },
                  { value: '2', label: 'Decisions', color: '#15803D', borderColor: '', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></> },
                  { value: '5', label: 'Participants', color: '#3D5249', borderColor: '', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></> }
                ].map((stat, i) => (
                  <div key={i} className={`flex-1 bg-[#FFFFFF] border border-[#D4E0DA] ${i === 0 ? 'border-l-2 border-l-[#B45309]' : ''} rounded-xl p-4 text-center hover:bg-[#F7FAF8] hover:-translate-y-1 transition-all duration-500 group/stat cursor-default shadow-sm hover:shadow-md`}>
                    <div className="flex justify-center mb-1.5" style={{ color: stat.color }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold group-hover/stat:scale-110 transition-transform duration-500">{stat.value}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                          {stat.icon}
                        </svg>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#7A9489] font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Terminal Block */}
              <div className="bg-[#FFFFFF] border border-[#D4E0DA] rounded-xl p-4 mb-4 font-mono text-xs space-y-2.5 hover:border-[#B45309]/20 transition-all duration-500 shadow-inner">
                <div className="flex items-start gap-2 text-[#7A9489] hover:text-[#0C1A15] transition-colors duration-300 group/line">
                  <span className="text-[#8FA89F] shrink-0 text-[11px]">[10:45]</span>
                  <span className="text-[#15803D] shrink-0 font-semibold flex items-center gap-1 text-[11px]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-45 opacity-70">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    SPEAKER
                  </span>
                  <span className="opacity-90 text-[11px]">"I'll fix the db schema tomorrow."</span>
                </div>
                <div className="flex items-start gap-2 text-[#7A9489] hover:text-[#0C1A15] transition-colors duration-300 group/line">
                  <span className="text-[#8FA89F] shrink-0 text-[11px]">[10:46]</span>
                  <span className="text-[#B45309] shrink-0 font-semibold flex items-center gap-1 text-[11px]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-45 opacity-70">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    AGENT
                  </span>
                  <span className="opacity-90 text-[11px]">Generating issue: Update DB schema...</span>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="flex justify-between items-end pt-1">
                <div className="flex items-center gap-3 bg-[#FFFFFF] border border-[#D4E0DA] px-4 py-3 rounded-xl hover:border-[#B45309]/30 transition-all duration-500 shadow-sm">
                  <div className="bg-gradient-to-br from-[#B45309] to-[#F59E0B] text-[#FFFFFF] p-2 rounded-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[#7A9489]">Tasks Exported</div>
                    <div className="text-[#0C1A15] font-bold text-sm">4 → Trello</div>
                  </div>
                </div>
                             <div className="text-right">
                  <div className="text-[10px] text-[#7A9489] font-semibold tracking-[0.15em] uppercase mb-1">Clarity Score</div>
                  <div className="text-[#0C1A15] font-bold flex items-baseline gap-1 justify-end">
                    <span className="text-3xl text-[#B45309]">9.2</span>
                    <span className="text-sm text-[#8FA89F]">/ 10</span>
                  </div>
                </div>
              </div>
 
              {/* Floating bottom pill */}
              <div className="absolute -bottom-4 right-4 bg-[#FFFFFF] border border-[#D4E0DA] text-[10px] text-[#3D5249] font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-xl z-20 hover:scale-105 hover:border-[#B45309]/30 transition-all duration-500 cursor-default">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#B45309]">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span>Live Sync Active</span>
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4E0DA] to-transparent"></div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-28 w-full bg-[#FFFFFF]/30 border-y border-[#D4E0DA]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-start mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#D4E0DA] mb-6 shadow-sm">
              <span className="text-[11px] font-semibold text-[#7A9489] tracking-[0.15em] uppercase">Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[#0C1A15] leading-[1.1] max-w-2xl">
              Built for Fast-Moving Teams
              <br />
              <span className="text-[#7A9489]">That Need Control.</span>
            </h2>
          </div>

          <BentoDemo />
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4E0DA] to-transparent"></div>
      </div>

      {/* Testimonials Carousel Section */}
      <div className="relative z-10 py-28 bg-[#FFFFFF]/30 border-y border-[#D4E0DA]/50">
        <div className="max-w-7xl mx-auto px-6 mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#D4E0DA] mb-6 shadow-sm">
            <span className="text-[11px] font-semibold text-[#7A9489] tracking-[0.15em] uppercase">Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#0C1A15]">Trusted by Forward-Thinking Teams</h2>
          <p className="text-[#3D5249] mt-4 max-w-xl mx-auto text-lg leading-relaxed">
            See how we're transforming meeting intelligence across the industry.
          </p>
        </div>
        
        {/* Carousel Container */}
        <div className="flex overflow-hidden relative w-full group">
          {/* Gradient Masks */}
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#F0F4F2] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#F0F4F2] to-transparent z-10 pointer-events-none"></div>
          
          {/* Animated Track */}
          <div className="flex w-max animate-[scroll_45s_linear_infinite] group-hover:[animation-play-state:paused] gap-5 px-6">
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div key={idx} className="w-[360px] shrink-0 bg-[#FFFFFF] border border-[#D4E0DA] p-7 rounded-2xl hover:border-[#B45309]/30 hover:shadow-lg transition-all duration-500 group/card cursor-default backdrop-blur-sm">
                <div className="mb-5 text-[#B45309]/30 group-hover/card:text-[#B45309]/60 transition-colors duration-500">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-[#3D5249] mb-7 leading-relaxed text-[15px] group-hover/card:text-[#0C1A15] transition-colors duration-500">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0F4F2] flex items-center justify-center text-[#B45309] text-xs font-bold border border-[#D4E0DA]">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0C1A15] text-sm">{testimonial.author}</div>
                    <div className="text-[11px] text-[#7A9489] font-mono">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>      
      {/* Bottom CTA Section */}
<div className="relative z-10 py-32">
  {/* Grid Background - FULL WIDTH */}
  <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none" 
    style={{ 
      backgroundImage: `radial-gradient(#0C1A15 1px, transparent 1px)`, 
      backgroundSize: '24px 24px' 
    }}
  ></div>
  <div className="absolute inset-0 bg-gradient-to-t from-[#B45309]/5 to-transparent blur-[120px] z-0 pointer-events-none rounded-full transform scale-75"></div>

  {/* Content constrained */}
  <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
    <div className="bg-[#FFFFFF] border border-[#D4E0DA] p-14 md:p-20 rounded-3xl shadow-2xl overflow-hidden group/cta backdrop-blur-sm">

      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F59E0B]/40 to-transparent group-hover/cta:via-[#F59E0B]/70 transition-all duration-700"></div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l border-t border-[#D4E0DA] rounded-tl-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-r border-t border-[#D4E0DA] rounded-tr-3xl pointer-events-none"></div>

      <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-6 text-[#0C1A15] leading-[1.15]">
        Stop taking notes.
        <br />
        <span className="text-[#7A9489]">Start taking action.</span>
      </h2>
      <p className="text-lg text-[#3D5249] mb-12 max-w-xl mx-auto leading-relaxed">
        Join thousands of professionals who have automated their meeting intelligence.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          onClick={() => navigate(user ? '/dashboard' : '/signup')}
          className="w-full sm:w-auto group px-10 py-4 rounded-xl bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-[#FFFFFF] font-bold text-lg transition-all duration-500 hover:scale-[1.03] hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(180,83,9,0.2)] hover:shadow-[0_15px_50px_rgba(180,83,9,0.3)] flex items-center justify-center gap-2"
        >
          Get Started for Free
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-500">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#FFFFFF] border border-[#D4E0DA] hover:bg-[#F7FAF8] hover:text-[#0C1A15] hover:border-[#B45309]/30 text-[#3D5249] font-bold text-lg transition-all duration-500 shadow-sm"
        >
          Contact Sales
        </button>
      </div>
    </div>
  </div>
</div>
      {/* Footer */}
      <div className="relative z-10 border-t border-[#D4E0DA]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[#7A9489]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="15"></line>
              <line x1="15" y1="9" x2="9" y2="15"></line>
            </svg>
            <span className="text-xs font-medium tracking-widest uppercase">Meeting.AI</span>
          </div>
          <div className="text-[11px] text-[#8FA89F] font-medium">
            © {new Date().getFullYear()} MeetingAI. All rights reserved.
          </div>
        </div>
      </div>

      {/* Keyframes for carousel scroll */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Home;