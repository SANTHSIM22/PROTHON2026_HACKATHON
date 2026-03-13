import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

/* ─────────────────────── helpers ─────────────────────── */

function formatElapsed(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
}

function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/* ──────────────────── Waveform component ──────────────────── */

function WaveformBars() {
  return (
    <div className="waveform-container">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="waveform-bar" />
      ))}
    </div>
  );
}

/* ──────────────────── Mic Icon SVG ──────────────────── */

function MicIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ──────────────────── Stop Icon SVG ──────────────────── */

function StopIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

/* ──────────────────── Main App ──────────────────── */

function App() {
  const [status, setStatus]       = useState('loading'); // loading | idle | recording | stopping | error | not_meet | interrupted
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed]     = useState('00:00:00');
  const [meetTabId, setMeetTabId] = useState(null);
  const [error, setError]         = useState('');
  const intervalRef               = useRef(null);

  /* ── Fetch status from background ── */
  const fetchStatus = useCallback(async () => {
    try {
      const resp = await sendMessage({ type: 'GET_STATUS' });
      if (!resp) {
        setStatus('error');
        setError('Could not connect to extension background.');
        return;
      }

      if (resp.isRecording && resp.recordingStatus === 'recording') {
        setStatus('recording');
        setStartTime(resp.startTime);
        setMeetTabId(resp.meetTabId);
      } else if (resp.recordingStatus === 'stopping') {
        setStatus('stopping');
      } else if (resp.wasInterrupted) {
        setStatus('interrupted');
      } else {
        setStatus('idle');
        setStartTime(null);
        setMeetTabId(null);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Unknown error');
    }
  }, []);

  /* ── Poll status and update elapsed time ── */
  useEffect(() => {
    fetchStatus();

    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  /* ── Update elapsed time when recording ── */
  useEffect(() => {
    if (status === 'recording' && startTime) {
      const updateElapsed = () => {
        setElapsed(formatElapsed(Date.now() - startTime));
      };
      updateElapsed();
      const timer = setInterval(updateElapsed, 200);
      return () => clearInterval(timer);
    } else {
      setElapsed('00:00:00');
    }
  }, [status, startTime]);

  /* ── Start recording ── */
  const handleStart = async () => {
    setError('');
    setStatus('loading');

    try {
      const resp = await sendMessage({ type: 'START_RECORDING' });
      if (resp && resp.success) {
        setStatus('recording');
        setStartTime(resp.startTime);
        setMeetTabId(resp.meetTabId);
      } else {
        const errMsg = (resp && resp.error) || 'Failed to start recording';
        if (errMsg.includes('not a Google Meet tab') || errMsg.includes('No active Google Meet')) {
          setStatus('not_meet');
        } else {
          setStatus('error');
        }
        setError(errMsg);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to start recording');
    }
  };

  /* ── Stop recording ── */
  const handleStop = async () => {
    setStatus('stopping');
    try {
      await sendMessage({ type: 'STOP_RECORDING' });
      setStatus('idle');
      setStartTime(null);
      setMeetTabId(null);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Failed to stop recording');
    }
  };

  /* ── Dismiss interrupted state ── */
  const handleDismissInterrupted = async () => {
    await sendMessage({ type: 'CLEAR_INTERRUPTED' });
    setStatus('idle');
  };

  /* ────────────── RENDER ────────────── */

  // Container style shared by all screens
  const containerStyle = {
    width: '320px',
    minHeight: '400px',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
  };

  const cardStyle = {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '28px 20px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  };

  /* ── Loading State ── */
  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #334155',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            Connecting...
          </p>
        </div>
      </div>
    );
  }

  /* ── Interrupted State ── */
  if (status === 'interrupted') {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '4px' }}>⚠️</div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#fbbf24',
            textAlign: 'center',
          }}>
            Recording Interrupted
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '13px',
            textAlign: 'center',
            lineHeight: '1.5',
            marginTop: '4px',
          }}>
            A previous recording was interrupted unexpectedly
            (browser closed or crashed). The recording data was lost.
          </p>
          <button
            onClick={handleDismissInterrupted}
            style={{
              marginTop: '16px',
              padding: '10px 28px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  /* ── Not on Meet tab ── */
  if (status === 'not_meet') {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ color: '#6366f1', marginBottom: '4px' }}>
            <MicIcon size={40} color="#6366f1" />
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#f1f5f9',
            letterSpacing: '-0.5px',
          }}>
            MeetRec
          </h1>
          <div style={{
            background: '#fbbf2420',
            border: '1px solid #fbbf2440',
            borderRadius: '10px',
            padding: '14px 16px',
            marginTop: '12px',
            width: '100%',
          }}>
            <p style={{
              color: '#fbbf24',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '6px',
            }}>
              ⚠️ No Google Meet Tab Found
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              Please open and join a Google Meet call first,
              then click the MeetRec icon to start recording.
            </p>
          </div>
          <button
            onClick={() => { setStatus('idle'); setError(''); }}
            style={{
              marginTop: '14px',
              padding: '8px 24px',
              background: '#334155',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (status === 'error') {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ fontSize: '36px' }}>❌</div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#ef4444',
            textAlign: 'center',
          }}>
            Error
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '1.5',
            maxWidth: '260px',
            wordBreak: 'break-word',
          }}>
            {error || 'An unknown error occurred.'}
          </p>
          {error && error.toLowerCase().includes('microphone') && (
            <p style={{
              color: '#fbbf24',
              fontSize: '11px',
              textAlign: 'center',
              lineHeight: '1.4',
              marginTop: '6px',
            }}>
              Please allow microphone access in your browser settings
              and try again.
            </p>
          )}
          <button
            onClick={() => { setStatus('idle'); setError(''); }}
            style={{
              marginTop: '14px',
              padding: '8px 24px',
              background: '#334155',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Stopping State ── */
  if (status === 'stopping') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #334155',
            borderTopColor: '#ef4444',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            Stopping & saving recording...
          </p>
        </div>
      </div>
    );
  }

  /* ── Recording State ── */
  if (status === 'recording') {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          {/* Recording indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <span className="pulse-dot" />
            <span style={{
              color: '#ef4444',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Recording
            </span>
          </div>

          {/* Elapsed time */}
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#f1f5f9',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '1px',
            margin: '8px 0',
          }}>
            {elapsed}
          </div>

          {/* Waveform */}
          <WaveformBars />

          {/* Stop button */}
          <button
            className="stop-btn"
            onClick={handleStop}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px',
            }}
          >
            <StopIcon size={28} color="#fff" />
          </button>

          <p style={{
            color: '#64748b',
            fontSize: '11px',
            textAlign: 'center',
            marginTop: '12px',
            lineHeight: '1.4',
          }}>
            Recording continues if you close this popup
          </p>

          {meetTabId && (
            <p style={{
              color: '#475569',
              fontSize: '10px',
              marginTop: '4px',
            }}>
              Tab ID: {meetTabId}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Idle State (Default) ── */
  return (
    <div style={containerStyle} className="fade-in">
      <div style={cardStyle}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
        }}>
          <MicIcon size={28} color="#fff" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#f1f5f9',
          letterSpacing: '-0.5px',
        }}>
          MeetRec
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          Record your Google Meet
        </p>

        {/* Record button */}
        <button
          className="record-btn"
          onClick={handleStart}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#ef4444',
            border: '4px solid #1e293b',
            boxShadow: '0 0 0 3px #ef444440',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
          }}
        >
          <MicIcon size={30} color="#fff" />
        </button>

        {/* Info */}
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '10px 14px',
          marginTop: '12px',
          width: '100%',
        }}>
          <p style={{
            color: '#6366f1',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '4px',
          }}>
            🎙️ Both your voice and participants will be recorded
          </p>
          <p style={{
            color: '#475569',
            fontSize: '11px',
            textAlign: 'center',
          }}>
            Only works on meet.google.com tabs
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Mount ──────────────────── */
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);