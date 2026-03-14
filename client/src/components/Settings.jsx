import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('github');

  const [githubToken, setGithubToken] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubValidated, setGithubValidated] = useState(false);
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [autoCreateIssues, setAutoCreateIssues] = useState(false);
  const [notifyOnCreation, setNotifyOnCreation] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [trelloApiKey, setTrelloApiKey] = useState('');
  const [trelloApiToken, setTrelloApiToken] = useState('');
  const [trelloListId, setTrelloListId] = useState('');
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [calendarToken, setCalendarToken] = useState('');
  const [calendarClientId, setCalendarClientId] = useState('');
  const [calendarClientSecret, setCalendarClientSecret] = useState('');
  const [calendarRefreshToken, setCalendarRefreshToken] = useState('');
  const [calendarId, setCalendarId] = useState('primary');

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } });
      const settings = response.data.settings;
      if (settings.github.repositoryUrl) {
        setGithubUrl(settings.github.repositoryUrl);
        setGithubValidated(settings.github.validated);
        setGithubOwner(settings.github.owner);
        setGithubRepo(settings.github.repo);
        if (settings.github.token === '••••••••') setGithubToken('••••••••');
      }
      setAutoCreateIssues(settings.preferences.autoCreateGitHubIssues);
      setNotifyOnCreation(settings.preferences.notifyOnIssueCreation);
      setContacts(settings.contacts || []);
      if (settings.googleCalendar) {
        setCalendarId(settings.googleCalendar.calendarId || 'primary');
        if (settings.googleCalendar.accessToken === '••••••••') setCalendarToken('••••••••');
        if (settings.googleCalendar.clientId === '••••••••') setCalendarClientId('••••••••');
        if (settings.googleCalendar.clientSecret === '••••••••') setCalendarClientSecret('••••••••');
        if (settings.googleCalendar.refreshToken === '••••••••') setCalendarRefreshToken('••••••••');
      }
      if (settings.trello) {
        setTrelloListId(settings.trello.listId || '');
        if (settings.trello.apiKey === '••••••••') setTrelloApiKey('••••••••');
        if (settings.trello.apiToken === '••••••••') setTrelloApiToken('••••••••');
      }
      if (settings.notion) {
        setNotionDatabaseId(settings.notion.databaseId || '');
        if (settings.notion.apiKey === '••••••••') setNotionApiKey('••••••••');
      }
    } catch { setError('Failed to load settings'); } finally { setLoading(false); }
  };

  const handleSaveGitHub = async () => {
    if (!githubToken || !githubUrl) { setError('Please provide both GitHub token and repository URL'); return; }
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/settings/github`, { token: githubToken, repositoryUrl: githubUrl }, { headers: { Authorization: `Bearer ${token}` } });
      setGithubValidated(response.data.github.validated);
      setGithubOwner(response.data.github.owner);
      setGithubRepo(response.data.github.repo);
      setGithubToken('••••••••');
      setSuccess(response.data.message);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save GitHub settings'); } finally { setSaving(false); }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/settings/preferences`, { autoCreateGitHubIssues: autoCreateIssues, notifyOnIssueCreation: notifyOnCreation }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Preferences saved successfully');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save preferences'); } finally { setSaving(false); }
  };

  const handleSaveTrello = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/settings/trello`, { apiKey: trelloApiKey === '••••••••' ? undefined : trelloApiKey, apiToken: trelloApiToken === '••••••••' ? undefined : trelloApiToken, listId: trelloListId }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Trello settings saved successfully');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save Trello settings'); } finally { setSaving(false); }
  };

  const handleSaveNotion = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/settings/notion`, { apiKey: notionApiKey === '••••••••' ? undefined : notionApiKey, databaseId: notionDatabaseId }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Notion settings saved successfully');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save Notion settings'); } finally { setSaving(false); }
  };

  const handleClearGitHub = async () => {
    if (!confirm('Are you sure you want to clear GitHub settings?')) return;
    try {
      setSaving(true); setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/settings/github`, { headers: { Authorization: `Bearer ${token}` } });
      setGithubToken(''); setGithubUrl(''); setGithubValidated(false); setGithubOwner(''); setGithubRepo('');
      setSuccess('GitHub settings cleared');
    } catch (err) { setError(err.response?.data?.error || 'Failed to clear GitHub settings'); } finally { setSaving(false); }
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) { setError('Please provide both name and email'); return; }
    setContacts(prev => [...prev, { name: newContactName.trim(), emailAddress: newContactEmail.trim() }]);
    setNewContactName(''); setNewContactEmail('');
  };

  const handleRemoveContact = (i) => setContacts(prev => prev.filter((_, idx) => idx !== i));

  const handleSaveContacts = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/settings/contacts`, { contacts }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Contacts saved successfully');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save contacts'); } finally { setSaving(false); }
  };

  const handleSaveCalendar = async () => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/settings/google-calendar`, { 
        accessToken: calendarToken === '••••••••' ? undefined : calendarToken, 
        clientId: calendarClientId === '••••••••' ? undefined : calendarClientId, 
        clientSecret: calendarClientSecret === '••••••••' ? undefined : calendarClientSecret, 
        refreshToken: calendarRefreshToken === '••••••••' ? undefined : calendarRefreshToken, 
        calendarId: calendarId || 'primary' 
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.googleCalendar.accessToken === '••••••••') setCalendarToken('••••••••');
      if (response.data.googleCalendar.clientId === '••••••••') setCalendarClientId('••••••••');
      if (response.data.googleCalendar.clientSecret === '••••••••') setCalendarClientSecret('••••••••');
      if (response.data.googleCalendar.refreshToken === '••••••••') setCalendarRefreshToken('••••••••');
      setSuccess('Google Calendar settings saved successfully');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save Google Calendar settings'); } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const sections = [
    {
      id: 'github', label: 'GitHub',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
      status: githubValidated ? 'connected' : null,
    },
    {
      id: 'calendar', label: 'Calendar',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      status: calendarToken && calendarToken !== '' ? 'configured' : null,
    },
    {
      id: 'trello', label: 'Trello',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 0H3C1.34 0 0 1.34 0 3v18c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zM10.44 18.18c0 .9-.73 1.63-1.63 1.63H5.55c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v12.36zm9.63-5.45c0 .9-.73 1.63-1.63 1.63h-3.26c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v6.91z"/></svg>,
      status: trelloApiKey && trelloApiKey !== '' ? 'configured' : null,
    },
    {
      id: 'notion', label: 'Notion',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.15c-.42-.326-.98-.7-2.055-.607L3.01 2.71c-.467.046-.56.28-.374.466l1.823 1.033zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.046-.746.326-.746.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.573-7.186v6.953l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.46 9.76c-.093-.42.14-1.026.793-1.073l3.453-.233 4.76 7.28v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.22-.187z"/></svg>,
      status: notionApiKey && notionApiKey !== '' ? 'configured' : null,
    },
    {
      id: 'contacts', label: 'Contacts',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      status: contacts.length > 0 ? `${contacts.length}` : null,
    },
    {
      id: 'preferences', label: 'Preferences',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      status: null,
    },
  ];

  const InputField = ({ label, hint, linkText, linkHref, children }) => (
    <div>
      <label className="block text-[13px] font-semibold text-[#3D5249] mb-2">{label}</label>
      {children}
      {(hint || linkHref) && (
        <p className="text-[#8FA89F] text-[11px] mt-1.5">
          {hint}
          {linkHref && <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-[#B45309] hover:underline ml-1">{linkText}</a>}
        </p>
      )}
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl text-[#0C1A15] text-sm font-medium focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]/40 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#8FA89F]";

  const SaveButton = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled || saving}
      className="bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/20 disabled:opacity-40 disabled:hover:shadow-none text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm">
      {saving ? (
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          Saving...
        </span>
      ) : children}
    </button>
  );

  const DangerButton = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled || saving}
      className="text-[#B91C1C] hover:text-white hover:bg-[#B91C1C] border border-[#B91C1C]/20 hover:border-[#B91C1C] font-medium px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-40">
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          <p className="text-[#7A9489] text-sm font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F2]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bg-[#0C1A15] sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#B45309] to-[#F59E0B] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg font-semibold tracking-tight">Settings</h1>
              <p className="text-[#8FA89F] text-xs mt-0.5">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/dashboard')} className="text-[#8FA89F] hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Dashboard
            </button>
            <button onClick={handleLogout} className="text-[#B91C1C]/70 hover:text-[#B91C1C] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#B91C1C]/5 transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-[#B91C1C]/5 border border-[#B91C1C]/15 rounded-xl px-5 py-4 animate-in">
            <div className="w-5 h-5 rounded-full bg-[#B91C1C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-[#B91C1C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <p className="text-[#B91C1C] text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-[#B91C1C]/40 hover:text-[#B91C1C]"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-start gap-3 bg-[#15803D]/5 border border-[#15803D]/15 rounded-xl px-5 py-4 animate-in">
            <div className="w-5 h-5 rounded-full bg-[#15803D]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-[#15803D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-[#15803D] text-sm font-medium flex-1">{success}</p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      activeSection === section.id
                        ? 'bg-white border border-[#D4E0DA] text-[#0C1A15] shadow-sm'
                        : 'text-[#7A9489] hover:text-[#3D5249] hover:bg-white/50'
                    }`}
                    style={activeSection === section.id ? { borderLeft: '2px solid #D97706' } : {}}
                  >
                    <span className={activeSection === section.id ? 'text-[#D97706]' : ''}>{section.icon}</span>
                    <span className="flex-1">{section.label}</span>
                    {section.status && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        section.status === 'connected' ? 'bg-[#15803D]/10 text-[#15803D]' :
                        section.status === 'configured' ? 'bg-[#D97706]/10 text-[#D97706]' :
                        'bg-[#F7FAF8] text-[#8FA89F]'
                      }`}>
                        {section.status === 'connected' ? '✓' : section.status === 'configured' ? '✓' : section.status}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">

            {/* GitHub */}
            {activeSection === 'github' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#0C1A15] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">GitHub Integration</h2>
                      <p className="text-[#7A9489] text-sm">Connect your repository for issues and pull requests</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8 pt-4 space-y-5">
                  {githubValidated && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#15803D]/5 border border-[#15803D]/15 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-[#15803D]"/>
                      <div>
                        <p className="text-[#15803D] text-sm font-semibold">Connected</p>
                        <p className="text-[#15803D]/70 text-xs font-mono">{githubOwner}/{githubRepo}</p>
                      </div>
                    </div>
                  )}

                  <InputField label="Personal Access Token" hint="Create a token at" linkText="github.com/settings/tokens" linkHref="https://github.com/settings/tokens">
                    <input type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} disabled={githubToken === '••••••••'} className={inputClass}/>
                    {githubToken === '••••••••' && (
                      <button onClick={() => setGithubToken('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change token</button>
                    )}
                  </InputField>

                  <InputField label="Repository URL" hint="Example: https://github.com/yourname/your-repo">
                    <input type="text" placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={inputClass}/>
                  </InputField>

                  <div className="flex gap-3 pt-2">
                    <SaveButton onClick={handleSaveGitHub} disabled={!githubToken || !githubUrl}>Save & Validate</SaveButton>
                    {githubValidated && <DangerButton onClick={handleClearGitHub}>Clear Settings</DangerButton>}
                  </div>
                </div>
              </div>
            )}

            {/* Google Calendar */}
            {activeSection === 'calendar' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#B45309]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#B45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Google Calendar</h2>
                      <p className="text-[#7A9489] text-sm">Schedule extracted events automatically</p>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4 space-y-5">
                  <InputField label="Client ID" hint="Your Google Cloud OAuth Client ID.">
                    <input type="text" placeholder="Enter Client ID" value={calendarClientId} onChange={(e) => setCalendarClientId(e.target.value)} disabled={calendarClientId === '••••••••'} className={inputClass}/>
                    {calendarClientId === '••••••••' && (
                      <button onClick={() => setCalendarClientId('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change Client ID</button>
                    )}
                  </InputField>
                  <InputField label="Client Secret" hint="Your Google Cloud OAuth Client Secret.">
                    <input type="password" placeholder="Enter Client Secret" value={calendarClientSecret} onChange={(e) => setCalendarClientSecret(e.target.value)} disabled={calendarClientSecret === '••••••••'} className={inputClass}/>
                    {calendarClientSecret === '••••••••' && (
                      <button onClick={() => setCalendarClientSecret('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change Client Secret</button>
                    )}
                  </InputField>
                  <InputField label="Refresh Token" hint="The persistent Refresh Token from OAuth Playground.">
                    <input type="password" placeholder="1//04bI..." value={calendarRefreshToken} onChange={(e) => setCalendarRefreshToken(e.target.value)} disabled={calendarRefreshToken === '••••••••'} className={inputClass}/>
                    {calendarRefreshToken === '••••••••' && (
                      <button onClick={() => setCalendarRefreshToken('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change Refresh Token</button>
                    )}
                  </InputField>
                  <InputField label="Calendar ID" hint="Usually 'primary' for your default calendar.">
                    <input type="text" placeholder="primary" value={calendarId} onChange={(e) => setCalendarId(e.target.value)} className={inputClass}/>
                  </InputField>
                  <div className="pt-2">
                    <SaveButton onClick={handleSaveCalendar} disabled={!calendarClientId || !calendarClientSecret || !calendarRefreshToken}>Save Calendar Settings</SaveButton>
                  </div>
                </div>
              </div>
            )}

            {/* Trello */}
            {activeSection === 'trello' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#3D5249]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#3D5249]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 0H3C1.34 0 0 1.34 0 3v18c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zM10.44 18.18c0 .9-.73 1.63-1.63 1.63H5.55c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v12.36zm9.63-5.45c0 .9-.73 1.63-1.63 1.63h-3.26c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v6.91z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Trello Integration</h2>
                      <p className="text-[#7A9489] text-sm">Create task cards from meeting action items</p>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4 space-y-5">
                  <InputField label="API Key">
                    <input type="text" placeholder="Enter Trello API Key" value={trelloApiKey} onChange={(e) => setTrelloApiKey(e.target.value)} disabled={trelloApiKey === '••••••••'} className={inputClass}/>
                    {trelloApiKey === '••••••••' && <button onClick={() => setTrelloApiKey('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change key</button>}
                  </InputField>
                  <InputField label="API Token">
                    <input type="password" placeholder="Enter Trello API Token" value={trelloApiToken} onChange={(e) => setTrelloApiToken(e.target.value)} disabled={trelloApiToken === '••••••••'} className={inputClass}/>
                    {trelloApiToken === '••••••••' && <button onClick={() => setTrelloApiToken('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change token</button>}
                  </InputField>
                  <InputField label="List ID" hint="The ID of the Trello list to add cards to.">
                    <input type="text" placeholder="Enter Trello List ID" value={trelloListId} onChange={(e) => setTrelloListId(e.target.value)} className={inputClass}/>
                  </InputField>
                  <div className="pt-2">
                    <SaveButton onClick={handleSaveTrello} disabled={!trelloApiKey || !trelloApiToken || !trelloListId}>Save Trello Settings</SaveButton>
                  </div>
                </div>
              </div>
            )}

            {/* Notion */}
            {activeSection === 'notion' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#0C1A15]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#0C1A15]" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.15c-.42-.326-.98-.7-2.055-.607L3.01 2.71c-.467.046-.56.28-.374.466l1.823 1.033zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.046-.746.326-.746.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.573-7.186v6.953l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.46 9.76c-.093-.42.14-1.026.793-1.073l3.453-.233 4.76 7.28v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.22-.187z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Notion Integration</h2>
                      <p className="text-[#7A9489] text-sm">Generate formatted meeting summary pages</p>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4 space-y-5">
                  <InputField label="Integration Token" hint="Create an internal integration at notion.so/my-integrations">
                    <input type="password" placeholder="secret_xxxxxxxxxxxx" value={notionApiKey} onChange={(e) => setNotionApiKey(e.target.value)} disabled={notionApiKey === '••••••••'} className={inputClass}/>
                    {notionApiKey === '••••••••' && <button onClick={() => setNotionApiKey('')} className="text-[#D97706] text-xs font-medium mt-1 hover:underline">Change token</button>}
                  </InputField>
                  <InputField label="Database ID" hint="The ID of the Notion database to create pages in.">
                    <input type="text" placeholder="Enter Database ID" value={notionDatabaseId} onChange={(e) => setNotionDatabaseId(e.target.value)} className={inputClass}/>
                  </InputField>
                  <div className="pt-2">
                    <SaveButton onClick={handleSaveNotion} disabled={!notionApiKey || !notionDatabaseId}>Save Notion Settings</SaveButton>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts */}
            {activeSection === 'contacts' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#15803D]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#15803D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Email Contacts</h2>
                      <p className="text-[#7A9489] text-sm">Map names from transcripts to email addresses</p>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4 space-y-4">
                  {/* Contact List */}
                  {contacts.length > 0 ? (
                    <div className="space-y-2">
                      {contacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E8F0EC] flex items-center justify-center">
                              <span className="text-[#3D5249] text-xs font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-[#0C1A15] text-sm font-medium">{contact.name}</p>
                              <p className="text-[#8FA89F] text-xs font-mono">{contact.emailAddress}</p>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveContact(idx)} className="text-[#B91C1C]/0 group-hover:text-[#B91C1C]/60 hover:!text-[#B91C1C] transition-all text-xs font-medium">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#F7FAF8] rounded-xl border border-[#D4E0DA]">
                      <p className="text-[#8FA89F] text-sm">No contacts configured yet</p>
                    </div>
                  )}

                  {/* Add Contact */}
                  <div className="flex gap-3 items-end">
                    <div className="w-1/3">
                      <label className="block text-[11px] font-semibold text-[#7A9489] mb-1.5 uppercase tracking-wider">Name</label>
                      <input type="text" placeholder="e.g. John" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className={inputClass}/>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-[#7A9489] mb-1.5 uppercase tracking-wider">Email</label>
                      <input type="email" placeholder="john@example.com" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className={inputClass}/>
                    </div>
                    <button onClick={handleAddContact}
                      className="bg-[#15803D] hover:bg-[#166534] text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm whitespace-nowrap">
                      Add
                    </button>
                  </div>

                  <div className="pt-2">
                    <SaveButton onClick={handleSaveContacts}>Save Contacts</SaveButton>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences */}
            {activeSection === 'preferences' && (
              <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
                <div className="px-8 pt-8 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Preferences</h2>
                      <p className="text-[#7A9489] text-sm">Configure automation behavior</p>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 pt-4 space-y-3">
                  {/* Toggle: Auto-create */}
                  <div className="flex items-center justify-between px-5 py-4 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl">
                    <div>
                      <p className="text-[#0C1A15] text-sm font-medium">Auto-Create GitHub Issues</p>
                      <p className="text-[#8FA89F] text-xs mt-0.5">Automatically create issues from technical analysis</p>
                    </div>
                    <button
                      onClick={() => setAutoCreateIssues(!autoCreateIssues)}
                      disabled={!githubValidated}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoCreateIssues ? 'bg-[#D97706]' : 'bg-[#D4E0DA]'} ${!githubValidated ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${autoCreateIssues ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>

                  {/* Toggle: Notify */}
                  <div className="flex items-center justify-between px-5 py-4 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl">
                    <div>
                      <p className="text-[#0C1A15] text-sm font-medium">Notify on Issue Creation</p>
                      <p className="text-[#8FA89F] text-xs mt-0.5">Receive notifications when issues are created</p>
                    </div>
                    <button
                      onClick={() => setNotifyOnCreation(!notifyOnCreation)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${notifyOnCreation ? 'bg-[#D97706]' : 'bg-[#D4E0DA]'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${notifyOnCreation ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>

                  <div className="pt-2">
                    <SaveButton onClick={handleSavePreferences}>Save Preferences</SaveButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;