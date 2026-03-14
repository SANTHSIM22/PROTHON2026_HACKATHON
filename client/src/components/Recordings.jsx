import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const Recordings = () => {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'organization'
  const [meetingNames, setMeetingNames] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [orgTranscript, setOrgTranscript] = useState(null);
  const [isTranscribingMeeting, setIsTranscribingMeeting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [transcribingIds, setTranscribingIds] = useState({});

  // Predefined meetings for demo
  const availableMeetings = ['Unassigned', 'Meeting One', 'Meeting Two', 'Meeting Three', 'Sales Sync', 'Standup'];

  // Helper to format ms to MM:SS
  const formatTimestamp = (ms) => {
    if (ms === undefined || ms === null || isNaN(ms)) return "00:00";
    const totalSeconds = Math.max(0, Math.floor(ms / 1000) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
      const response = await axios.get('/api/recordings/mine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recs = response.data;
      setRecordings(recs);
      setLoading(false);

      // Automatically transcribe newly fetched recordings if they haven't been deep transcribed
      recs.forEach(rec => {
        const needsDiarization = !rec.transcript || rec.transcript.length === 0 || !rec.transcript.some(t => t.speaker);
        if (needsDiarization) {
          handleTranscribeSilent(rec._id);
        }
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setLoading(false);
    }
  };

  const handleTranscribeSilent = async (id) => {
    try {
      setTranscribingIds(prev => ({ ...prev, [id]: true }));
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/recordings/${id}/transcribe`, {}, {
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
      const response = await axios.get('/api/recordings/organization/meetings', {
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
      const response = await axios.get(`/api/recordings/organization/meetings/${meetingName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrgTranscript(response.data);
      
      // Auto-transcribe if needed!
      if (response.data.needsTranscription) {
        setIsTranscribingMeeting(true);
        await axios.post(`/api/recordings/organization/meetings/${meetingName}/transcribe`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Re-fetch now that transcription is complete
        const finalResponse = await axios.get(`/api/recordings/organization/meetings/${meetingName}`, {
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
      await axios.put(`/api/recordings/${id}/meeting`, { meetingName: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordings(recordings.map(rec => rec._id === id ? { ...rec, meetingName: newName } : rec));
    } catch (error) {
      console.error('Error updating meeting name:', error);
      alert('Failed to re-assign meeting.');
    }
  };

  const handleDelete = async (id) => {
    // Optional: add a pure browser confirm dialog to prevent accidental clicks
    if (!window.confirm("Are you sure you want to delete this recording?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/recordings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Remove from UI immediately after successful deletion
      setRecordings(recordings.filter(rec => rec._id !== id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      alert('Failed to delete recording.');
    }
  };

  const handleTranscribe = async (id) => {
    try {
      const token = localStorage.getItem('token');
      // Set UI to loading state for this specific transcription task if desired
      alert('Starting Deep Diarization on Backend. This takes a moment...');
      const response = await axios.post(`/api/recordings/${id}/transcribe`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Update local state with the new diarized transcript array
      setRecordings(recordings.map(rec => rec._id === id ? { ...rec, transcript: response.data.transcript } : rec));
      alert('Diarization finished!');
    } catch (error) {
      console.error('Error diarizing recording:', error);
      alert('Failed to run AI Diarization. Add ASSEMBLYAI_API_KEY to your backend .env file first.');
    }
  };

  const handleExportStructuredData = async () => {
    if (!selectedMeeting) return;
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/recordings/organization/meetings/${selectedMeeting}/export`, {}, {
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
    return <div className="p-8 text-center">Loading recordings...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F4F2]">
      {/* Header */}
      <header className="bg-[#1C2C26] border-b border-[#2A3F36] sticky top-0 z-40">
        <div className="max-w-300 mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="text-[#8FA89F] hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg font-semibold tracking-tight">Meeting.AI</h1>
              <p className="text-[#8FA89F] text-xs mt-0.5">My Voice Recordings</p>
            </div>
          </div>
          
          {user?.role === 'organization' && (
            <div className="flex bg-[#2A3F36] p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('personal')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'personal' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#8FA89F] hover:text-white'}`}
              >
                My Recordings
              </button>
              <button 
                onClick={() => setViewMode('organization')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'organization' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#8FA89F] hover:text-white'}`}
              >
                Organization View
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-300 mx-auto px-6 py-8">
        
        {viewMode === 'organization' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1C2C26]">Organization Transcripts</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleExportStructuredData}
                  disabled={!selectedMeeting || isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors mr-2"
                >
                  {isExporting ? 'Exporting...' : 'Export to data1.json'}
                </button>
                <label className="text-sm font-medium text-[#4B5563]">Select Meeting:</label>
                <select 
                  className="bg-white border border-[#D4E0DA] rounded-lg px-4 py-2 text-sm font-medium text-[#1C2C26] outline-none focus:ring-2 focus:ring-[#10B981]/50"
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

            {!orgTranscript ? (
              <div className="bg-white p-8 rounded-2xl border border-[#D4E0DA] text-center">
                <p className="text-[#4B5563] text-lg font-medium">No meeting selected or no recordings found.</p>
              </div>
            ) : isTranscribingMeeting ? (
              <div className="bg-white p-12 rounded-2xl border border-[#D4E0DA] text-center shadow-lg shadow-[#10B981]/5">
                 <div className="w-16 h-16 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto mb-6"></div>
                 <h3 className="text-xl font-bold text-[#1C2C26] mb-2">Synthesizing Participant Audios</h3>
                 <p className="text-[#6B7280]">Running deep AI transcription and synchronizing timestamps from all members for {selectedMeeting}... This may take a few moments.</p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-[#D4E0DA] shadow-sm">
                <div className="mb-6 flex flex-wrap gap-2 text-sm">
                  <span className="font-semibold text-[#1C2C26] mr-2">Participants:</span>
                  {orgTranscript.participants.map((p, idx) => (
                    <span key={idx} className="bg-[#F0F4F2] text-[#4B5563] px-3 py-1 rounded-full">{p}</span>
                  ))}
                </div>

                <div className="space-y-4">
                  {orgTranscript.transcript.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group items-start">
                      <span className="text-[#8FA89F] font-mono text-xs w-24 shrink-0 pt-1 select-none text-right" title={new Date(item.absoluteTime).toLocaleTimeString()}>
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <div className="bg-[#F9FAFB] rounded-xl p-3 flex-1 border border-[#F0F4F2] group-hover:border-[#D4E0DA] transition-colors">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-[#10B981] text-sm">{item.userName}</span>
                           {item.aiSpeakerLabel && (
                             <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-gray-400">
                               Device: {item.aiSpeakerLabel}
                             </span>
                           )}
                         </div>
                         <p className="text-[#4B5563] text-sm leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                  {orgTranscript.transcript.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No transcribed text available for this meeting yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#1C2C26] mb-6">Your Recent Recordings</h2>
            {recordings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#D4E0DA] text-center">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <p className="text-[#4B5563] text-lg font-medium">No recordings found</p>
            <p className="text-[#6B7280] text-sm mt-1">Use the Chrome extension to record during your meetings!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recordings.map((rec) => (
              <div key={rec._id} className="bg-white p-5 rounded-2xl border border-[#D4E0DA] flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F0F4F2] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#8FA89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#1C2C26]">
                        Recording - {new Date(rec.createdAt).toLocaleDateString()}
                      </h3>
                    <div className="flex gap-2 items-center mt-1">
                      <select 
                        value={rec.meetingName || 'Unassigned'}
                        onChange={(e) => handleUpdateMeetingName(rec._id, e.target.value)}
                        className="text-xs bg-[#F0F4F2] border border-[#D4E0DA] rounded text-[#4B5563] px-1 py-0.5 outline-none cursor-pointer"
                      >
                        {availableMeetings.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <p className="text-xs text-[#6B7280]">
                        {new Date(rec.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex items-center gap-4">
                    <audio controls preload="metadata" className="w-full md:w-75 outline-none">
                      <source src={`/api/recordings/stream/${rec._id}`} type="audio/mp3" />
                      Your browser does not support the audio element.
                    </audio>
                    {transcribingIds[rec._id] ? (
                      <div className="p-2 flex items-center gap-2 text-blue-500 shrink-0">
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-medium">Processing...</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleTranscribe(rec._id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors shrink-0"
                        title="Run Deep Transcription (Separate Voices)"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(rec._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                      title="Delete recording"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Transcript Section */}
                {rec.transcript && rec.transcript.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#F0F4F2]">
                    <h4 className="text-sm font-semibold text-[#1C2C26] mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Transcript
                    </h4>
                    <div className="bg-[#F0F4F2]/50 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 text-sm text-[#4B5563]">
                      {rec.transcript.map((item, idx) => (
                        <div key={idx} className="flex gap-4 group">
                          <span className="text-[#8FA89F] font-mono text-xs w-24 shrink-0 pt-0.5 select-none text-right">
                            {formatTimestamp(item.timestamp)}
                            {item.endTime ? ` - ${formatTimestamp(item.endTime)}` : ''}
                          </span>
                          <span className="leading-relaxed group-hover:text-[#1C2C26] transition-colors flex gap-2">
                             {item.speaker && (
                                <span className={`font-bold ${item.speaker === 'A' ? 'text-blue-600' : item.speaker === 'B' ? 'text-green-600' : 'text-purple-600'}`}>
                                  [{item.speaker}]
                                </span>
                             )}
                             {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default Recordings;