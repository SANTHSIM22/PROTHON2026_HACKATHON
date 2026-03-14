import React, { useState, useEffect } from 'react';
import actifyLogo from '../assets/actify-logo.svg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Recordings = () => {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('personal');
  const [meetingNames, setMeetingNames] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [orgTranscript, setOrgTranscript] = useState(null);
  const [isTranscribingMeeting, setIsTranscribingMeeting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [transcribingIds, setTranscribingIds] = useState({});
  const [expandedTranscripts, setExpandedTranscripts] = useState({});

  const availableMeetings = ['Unassigned', 'Meeting One', 'Meeting Two', 'Meeting Three', 'Sales Sync', 'Standup'];

  const formatTimestamp = (ms) => {
    if (ms === undefined || ms === null || isNaN(ms)) return "00:00";
    const totalSeconds = Math.max(0, Math.floor(ms / 1000) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleTranscript = (id) => {
    setExpandedTranscripts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (viewMode === 'personal') {
      fetchRecordings();
    } else {
      fetchMeetingNames();
    }
  }, [viewMode]);

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(import.meta.env.VITE_API_URL + '/recordings/mine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recs = Array.isArray(response.data) ? response.data : response.data.data || [];
      setRecordings(recs);
      setLoading(false);

      if (Array.isArray(recs)) {
        recs.forEach(rec => {
          const needsDiarization = !rec.transcript || rec.transcript.length === 0 || !rec.transcript.some(t => t.speaker);
          if (needsDiarization) {
            handleTranscribeSilent(rec._id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setLoading(false);
    }
  };

  const handleTranscribeSilent = async (id) => {
    try {
      setTranscribingIds(prev => ({ ...prev, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/recordings/${id}/transcribe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordings(prev => prev.map(r => r._id === id ? { ...r, transcript: response.data.transcript } : r));
    } catch (error) {
      console.error('Error auto-diarizing recording:', error);
    } finally {
      setTranscribingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const fetchMeetingNames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/recordings/organization/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetingNames(response.data);
      if (response.data.length > 0) {
        setSelectedMeeting(response.data[0]);
        fetchOrgTranscript(response.data[0]);
      } else {
        setOrgTranscript(null);
      }
    } catch (error) {
      console.error('Error fetching meeting names:', error);
    }
  };

  const fetchOrgTranscript = async (meetingName) => {
    if (!meetingName) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/recordings/organization/meetings/${meetingName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrgTranscript(response.data);

      if (response.data.needsTranscription) {
        setIsTranscribingMeeting(true);
        await axios.post(`${API_URL}/recordings/organization/meetings/${meetingName}/transcribe`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const finalResponse = await axios.get(`${API_URL}/recordings/organization/meetings/${meetingName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrgTranscript(finalResponse.data);
        setIsTranscribingMeeting(false);
      }
    } catch (error) {
      console.error('Error fetching org transcript:', error);
      setIsTranscribingMeeting(false);
    }
  };

  const handleUpdateMeetingName = async (id, newName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/recordings/${id}/meeting`, { meetingName: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordings(recordings.map(rec => rec._id === id ? { ...rec, meetingName: newName } : rec));
    } catch (error) {
      console.error('Error updating meeting name:', error);
      alert('Failed to re-assign meeting.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/recordings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordings(recordings.filter(rec => rec._id !== id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      alert('Failed to delete recording.');
    }
  };

  const handleTranscribe = async (id) => {
    try {
      setTranscribingIds(prev => ({ ...prev, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/recordings/${id}/transcribe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordings(recordings.map(rec => rec._id === id ? { ...rec, transcript: response.data.transcript } : rec));
    } catch (error) {
      console.error('Error diarizing recording:', error);
      alert('Failed to run AI Diarization.');
    } finally {
      setTranscribingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExportStructuredData = async () => {
    if (!selectedMeeting) return;
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/recordings/organization/meetings/${selectedMeeting}/export`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully exported formatted transcript to data1.json!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export structured data.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F2] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#D4E0DA]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D97706] animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-[#B45309] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-[#3D5249] font-medium text-lg" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Loading recordings...</p>
          <p className="text-[#7A9489] text-sm mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Fetching your audio files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sticky Header */}
      <header className="bg-[#0C1A15] sticky top-0 z-40 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition-all duration-200 group active:scale-95"
            >
              <svg className="w-[18px] h-[18px] text-[#7A9489] group-hover:text-[#D97706] transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={actifyLogo} alt="ACTIFY" className="w-9 h-9 rounded-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#15803D] rounded-full ring-2 ring-[#0C1A15]"></div>
              </div>
              <div>
                <h1 className="text-white text-[17px] font-semibold tracking-wide" style={{ fontFamily: "'Audiowide', system-ui, sans-serif" }}>ACTIFY</h1>
                <p className="text-[#7A9489] text-[11px] tracking-wider uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Voice Recordings</p>
              </div>
            </div>
          </div>

          {user?.role === 'organization' && (
            <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'personal'
                    ? 'bg-gradient-to-r from-[#B45309] to-[#D97706] text-white shadow-lg shadow-[#D97706]/20'
                    : 'text-[#7A9489] hover:text-white hover:bg-white/[0.04]'
                }`}
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                My Recordings
              </button>
              <button
                onClick={() => setViewMode('organization')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'organization'
                    ? 'bg-gradient-to-r from-[#B45309] to-[#D97706] text-white shadow-lg shadow-[#D97706]/20'
                    : 'text-[#7A9489] hover:text-white hover:bg-white/[0.04]'
                }`}
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Organization View
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">

        {/* ───── Organization View ───── */}
        {viewMode === 'organization' ? (
          <div className="animate-[fadeIn_0.4s_ease]">
            {/* Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-[26px] font-bold text-[#0C1A15] tracking-tight" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                  Organization Transcripts
                </h2>
                <p className="text-[#7A9489] text-sm mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Combined transcripts from all team members
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleExportStructuredData}
                  disabled={!selectedMeeting || isExporting}
                  className="group px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-white rounded-xl hover:shadow-xl hover:shadow-[#D97706]/20 disabled:opacity-40 disabled:hover:shadow-none text-sm font-semibold transition-all duration-300 active:scale-[0.97] flex items-center gap-2"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 group-hover:translate-y-[-1px] transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export JSON
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 bg-white rounded-xl border border-[#D4E0DA] px-3 py-1.5 hover:border-[#D97706]/40 transition-colors duration-200">
                  <svg className="w-4 h-4 text-[#7A9489]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <select
                    className="bg-transparent text-sm font-medium text-[#0C1A15] outline-none cursor-pointer pr-2"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    value={selectedMeeting}
                    onChange={(e) => {
                      setSelectedMeeting(e.target.value);
                      fetchOrgTranscript(e.target.value);
                    }}
                  >
                    {meetingNames.length === 0 && <option value="">No Active Meetings</option>}
                    {meetingNames.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Org Content */}
            {!orgTranscript ? (
              <div className="bg-white p-16 rounded-2xl border border-[#D4E0DA] text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#F7FAF8] flex items-center justify-center mx-auto mb-5 border border-[#D4E0DA]">
                  <svg className="w-8 h-8 text-[#7A9489]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-[#3D5249] text-lg font-semibold" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>No meeting selected</p>
                <p className="text-[#7A9489] text-sm mt-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Select a meeting from the dropdown to view combined transcripts</p>
              </div>
            ) : isTranscribingMeeting ? (
              <div className="bg-white p-16 rounded-2xl border border-[#D4E0DA] text-center shadow-lg">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-[#D4E0DA]"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D97706] animate-spin"></div>
                  <div className="absolute inset-3 rounded-full border-3 border-transparent border-b-[#B45309] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
                  <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#D97706]/20 to-[#F59E0B]/10 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-[#0C1A15] mb-3" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>Synthesizing Audio Streams</h3>
                <p className="text-[#7A9489] max-w-md mx-auto leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Running deep AI transcription and synchronizing timestamps from all participants for <span className="text-[#D97706] font-semibold">{selectedMeeting}</span>
                </p>
                <div className="flex justify-center gap-1.5 mt-6">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#D97706] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Participants Strip */}
                <div className="px-6 py-4 border-b border-[#D4E0DA] bg-[#F7FAF8]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#0C1A15] mr-1" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>Participants</span>
                    <span className="w-px h-4 bg-[#D4E0DA] mx-1"></span>
                    {orgTranscript.participants.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-white text-[#3D5249] pl-1.5 pr-3 py-1 rounded-full border border-[#D4E0DA] text-xs font-medium hover:border-[#D97706]/40 transition-colors duration-200 cursor-default" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#D97706] to-[#F59E0B] flex items-center justify-center text-[10px] text-white font-bold" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {p.charAt(0).toUpperCase()}
                        </span>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Transcript Lines */}
                <div className="p-6 space-y-1 max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4E0DA transparent' }}>
                  {orgTranscript.transcript.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start group rounded-xl px-3 py-2.5 hover:bg-[#F7FAF8] transition-all duration-200 cursor-default">
                      <span className="text-[#8FA89F] text-[11px] w-14 shrink-0 pt-1 select-none text-right tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }} title={new Date(item.absoluteTime).toLocaleTimeString()}>
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-[#D97706] text-[13px]" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>{item.userName}</span>
                          {item.aiSpeakerLabel && (
                            <span className="text-[10px] bg-[#FEF3C7] px-2 py-0.5 rounded-md text-[#B45309] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {item.aiSpeakerLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[#3D5249] text-sm leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                  {orgTranscript.transcript.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[#7A9489]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>No transcribed text available for this meeting yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ───── Personal View ───── */
          <div className="animate-[fadeIn_0.4s_ease]">
            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-[#0C1A15] tracking-tight" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                Your Recordings
              </h2>
              <p className="text-[#7A9489] text-sm mt-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {recordings.length} recording{recordings.length !== 1 ? 's' : ''} total
              </p>
            </div>

            {recordings.length === 0 ? (
              <div className="bg-white p-16 rounded-2xl border border-[#D4E0DA] text-center shadow-sm">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#D97706]/10 to-[#F59E0B]/5 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                </div>
                <p className="text-[#0C1A15] text-xl font-bold" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>No recordings yet</p>
                <p className="text-[#7A9489] text-sm mt-2 max-w-sm mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Use the Chrome extension to record during your meetings and they'll appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recordings.map((rec, recIndex) => (
                  <div
                    key={rec._id}
                    className="group bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden hover:shadow-xl hover:shadow-[#0C1A15]/[0.04] hover:border-[#D97706]/30 transition-all duration-300"
                    style={{ animationDelay: `${recIndex * 60}ms` }}
                  >
                    {/* Active accent line */}
                    <div className="flex">
                      <div className="w-[3px] bg-[#D4E0DA] group-hover:bg-[#D97706] transition-colors duration-300 shrink-0 rounded-l-2xl"></div>

                      <div className="flex-1 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left: Info */}
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F7FAF8] to-[#E8F0EC] flex items-center justify-center border border-[#D4E0DA] group-hover:border-[#D97706]/30 group-hover:from-[#FEF3C7]/50 group-hover:to-[#FEF3C7]/20 transition-all duration-300 shrink-0">
                              <svg className="w-5 h-5 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                              </svg>
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-[15px] font-semibold text-[#0C1A15] truncate" style={{ fontFamily: "'Syne', system-ui, sans-serif" }}>
                                Recording — {new Date(rec.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </h3>
                              <div className="flex flex-wrap gap-2 items-center mt-2">
                                <select
                                  value={rec.meetingName || 'Unassigned'}
                                  onChange={(e) => handleUpdateMeetingName(rec._id, e.target.value)}
                                  className="text-xs bg-[#F7FAF8] border border-[#D4E0DA] rounded-lg text-[#3D5249] px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20 transition-all duration-200"
                                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                                >
                                  {availableMeetings.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                                <span className="text-[11px] text-[#8FA89F] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {new Date(rec.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {rec.transcript && rec.transcript.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#E8F0EC] text-[#15803D] px-2 py-0.5 rounded-md font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                                    <span className="w-1.5 h-1.5 bg-[#15803D] rounded-full"></span>
                                    Transcribed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <audio controls preload="metadata" className="w-full lg:w-56 h-9 outline-none rounded-lg" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                              <source src={`${API_URL}/recordings/stream/${rec._id}`} type="audio/mp3" />
                            </audio>

                            <div className="flex items-center gap-1 ml-1">
                              {transcribingIds[rec._id] ? (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FEF3C7]/60 border border-[#D97706]/20">
                                  <div className="w-4 h-4 border-2 border-[#D97706]/30 border-t-[#D97706] rounded-full animate-spin"></div>
                                  <span className="text-[11px] font-semibold text-[#B45309]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Processing</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleTranscribe(rec._id)}
                                  className="w-9 h-9 rounded-xl text-[#D97706] hover:bg-[#FEF3C7]/60 hover:scale-110 active:scale-95 flex items-center justify-center transition-all duration-200"
                                  title="Run Deep Transcription"
                                >
                                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                                  </svg>
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(rec._id)}
                                className="w-9 h-9 rounded-xl text-[#7A9489] hover:text-[#B91C1C] hover:bg-[#B91C1C]/8 hover:scale-110 active:scale-95 flex items-center justify-center transition-all duration-200"
                                title="Delete recording"
                              >
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Transcript Section */}
                        {rec.transcript && rec.transcript.length > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={() => toggleTranscript(rec._id)}
                              className="w-full flex items-center gap-2 text-sm font-semibold text-[#0C1A15] py-2.5 px-3 rounded-xl hover:bg-[#F7FAF8] transition-colors duration-200 group/btn"
                              style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                            >
                              <svg className={`w-4 h-4 text-[#D97706] transition-transform duration-200 ${expandedTranscripts[rec._id] ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <svg className="w-4 h-4 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              Transcript
                              <span className="text-[11px] font-medium text-[#7A9489] bg-[#F7FAF8] px-2 py-0.5 rounded-md ml-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {rec.transcript.length} segments
                              </span>
                            </button>

                            {expandedTranscripts[rec._id] && (
                              <div className="mt-2 bg-white rounded-xl border border-[#D4E0DA] overflow-hidden animate-[slideDown_0.25s_ease]">
                                {/* Transcript header bar */}
                                <div className="flex items-center justify-between px-4 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA]">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-semibold text-[#8FA89F] uppercase tracking-wider" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Time</span>
                                    <span className="w-px h-3 bg-[#D4E0DA]"></span>
                                    <span className="text-[10px] font-semibold text-[#8FA89F] uppercase tracking-wider" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Speaker</span>
                                    <span className="w-px h-3 bg-[#D4E0DA]"></span>
                                    <span className="text-[10px] font-semibold text-[#8FA89F] uppercase tracking-wider" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Content</span>
                                  </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto divide-y divide-[#D4E0DA]/50" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4E0DA transparent' }}>
                                  {rec.transcript.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 px-4 py-2.5 hover:bg-[#F7FAF8] transition-colors duration-150 group/line items-start">
                                      {/* Line Number */}
                                      <span className="text-[10px] text-[#8FA89F] w-5 shrink-0 pt-0.5 select-none text-right tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                        {idx + 1}
                                      </span>

                                      {/* Timestamp */}
                                      <span className="text-[11px] text-[#8FA89F] w-24 shrink-0 pt-0.5 select-none tabular-nums text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                        {formatTimestamp(item.timestamp)}
                                        {item.endTime ? <span className="text-[#D4E0DA]"> → </span> : ''}
                                        {item.endTime ? formatTimestamp(item.endTime) : ''}
                                      </span>

                                      {/* Cursor line */}
                                      <div className="w-px bg-[#D4E0DA] group-hover/line:bg-[#D97706] transition-colors duration-200 self-stretch shrink-0"></div>

                                      {/* Speaker + Text */}
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm leading-relaxed text-[#0C1A15] group-hover/line:text-[#0C1A15]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                                          {item.speaker && (
                                            <span className={`font-bold mr-2 ${
                                              item.speaker === 'A' ? 'text-[#D97706]' :
                                              item.speaker === 'B' ? 'text-[#15803D]' :
                                              item.speaker === 'C' ? 'text-[#B45309]' :
                                              'text-[#7A9489]'
                                            }`}>
                                              [{item.speaker}]
                                            </span>
                                          )}
                                          <span className="text-[#3D5249]" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px' }}>{item.text}</span>
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
        audio::-webkit-media-controls-panel {
          background: #F7FAF8;
          border-radius: 8px;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #D4E0DA;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #7A9489;
        }
      `}</style>
    </div>
  );
};

export default Recordings;