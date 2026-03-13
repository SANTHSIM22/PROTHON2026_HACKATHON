import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // GitHub settings
  const [githubToken, setGithubToken] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubValidated, setGithubValidated] = useState(false);
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // Preferences
  const [autoCreateIssues, setAutoCreateIssues] = useState(false);
  const [notifyOnCreation, setNotifyOnCreation] = useState(true);

  // Contacts
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Trello settings
  const [trelloApiKey, setTrelloApiKey] = useState('');
  const [trelloApiToken, setTrelloApiToken] = useState('');
  const [trelloListId, setTrelloListId] = useState('');

  // Notion settings
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');

  // Google Calendar
  const [calendarToken, setCalendarToken] = useState('');
  const [calendarId, setCalendarId] = useState('primary');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const settings = response.data.settings;
      if (settings.github.repositoryUrl) {
        setGithubUrl(settings.github.repositoryUrl);
        setGithubValidated(settings.github.validated);
        setGithubOwner(settings.github.owner);
        setGithubRepo(settings.github.repo);
        // Don't show actual token, but indicate it's set
        if (settings.github.token === '••••••••') {
          setGithubToken('••••••••');
        }
      }

      setAutoCreateIssues(settings.preferences.autoCreateGitHubIssues);
      setNotifyOnCreation(settings.preferences.notifyOnIssueCreation);
      setContacts(settings.contacts || []);

      if (settings.googleCalendar) {
        setCalendarId(settings.googleCalendar.calendarId || 'primary');
        if (settings.googleCalendar.accessToken === '••••••••') {
          setCalendarToken('••••••••');
        }
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

      setError('');
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGitHub = async () => {
    try {
      if (!githubToken || !githubUrl) {
        setError('Please provide both GitHub token and repository URL');
        return;
      }

      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/settings/github',
        {
          token: githubToken,
          repositoryUrl: githubUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGithubValidated(response.data.github.validated);
      setGithubOwner(response.data.github.owner);
      setGithubRepo(response.data.github.repo);
      setGithubToken('••••••••'); // Mask the token after saving
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save GitHub settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/settings/preferences',
        {
          autoCreateGitHubIssues: autoCreateIssues,
          notifyOnIssueCreation: notifyOnCreation,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Preferences saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrello = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/settings/trello',
        {
          apiKey: trelloApiKey === '••••••••' ? undefined : trelloApiKey,
          apiToken: trelloApiToken === '••••••••' ? undefined : trelloApiToken,
          listId: trelloListId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Trello settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save Trello settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotion = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/settings/notion',
        {
          apiKey: notionApiKey === '••••••••' ? undefined : notionApiKey,
          databaseId: notionDatabaseId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Notion settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save Notion settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearGitHub = async () => {
    if (!confirm('Are you sure you want to clear GitHub settings?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');

      await axios.delete('http://localhost:5000/api/settings/github', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGithubToken('');
      setGithubUrl('');
      setGithubValidated(false);
      setGithubOwner('');
      setGithubRepo('');
      setSuccess('GitHub settings cleared');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clear GitHub settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) {
      setError('Please provide both name and email');
      return;
    }
    setContacts(prev => [...prev, { name: newContactName.trim(), emailAddress: newContactEmail.trim() }]);
    setNewContactName('');
    setNewContactEmail('');
  };

  const handleRemoveContact = (indexToRemove) => {
    setContacts(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveContacts = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/settings/contacts',
        { contacts },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Contacts saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save contacts');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCalendar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/settings/google-calendar',
        { accessToken: calendarToken, calendarId: calendarId || 'primary' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.googleCalendar.accessToken === '••••••••') {
        setCalendarToken('••••••••');
      }
      setSuccess('Google Calendar settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save Google Calendar settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-indigo-100 mt-1">{user?.name}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            {success}
          </div>
        )}

        {/* GitHub Integration Settings */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">GitHub Integration</h2>
              <p className="text-gray-600 mt-1">Configure GitHub for automatic issue creation</p>
            </div>
            <div className="text-3xl">
              <span>🐙</span>
            </div>
          </div>

          {githubValidated && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
              <p className="text-green-800 font-semibold">✓ Connected</p>
              <p className="text-green-700 text-sm mt-1">
                {githubOwner}/{githubRepo}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Personal Access Token *
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                disabled={githubToken === '••••••••'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
              <p className="text-gray-600 text-xs mt-2">
                Create a token at:
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline ml-1"
                >
                  github.com/settings/tokens
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL *
              </label>
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-gray-600 text-xs mt-2">
                Example: https://github.com/yourname/your-repo
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveGitHub}
                disabled={saving || !githubToken || !githubUrl}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save & Validate'}
              </button>

              {githubValidated && (
                <button
                  onClick={handleClearGitHub}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {saving ? 'Clearing...' : 'Clear Settings'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Google Calendar Settings */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Google Calendar</h2>
              <p className="text-gray-600 mt-1">Configure credentials to schedule extracted events.</p>
            </div>
            <div className="text-3xl">
              <span>📅</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google OAuth / Service Account Access Token
              </label>
              <input
                type="password"
                placeholder="ya29.a0A..."
                value={calendarToken}
                onChange={(e) => setCalendarToken(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-gray-600 text-xs mt-2">
                Your temporary Google OAuth Token or generic proxy token.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calendar ID
              </label>
              <input
                type="text"
                placeholder="primary"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-gray-600 text-xs mt-2">
                Usually 'primary' for your default calendar, or a specific Calendar ID.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveCalendar}
                disabled={saving || !calendarToken}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Calendar Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Trello Integration Settings */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Trello Integration</h2>
              <p className="text-gray-600 mt-1">Configure Trello for automatic card creation</p>
            </div>
            <div className="text-3xl">
              <span>📋</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trello API Key *
              </label>
              <input
                type="text"
                placeholder="Enter Trello API Key"
                value={trelloApiKey}
                onChange={(e) => setTrelloApiKey(e.target.value)}
                disabled={trelloApiKey === '••••••••'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trello API Token *
              </label>
              <input
                type="password"
                placeholder="Enter Trello API Token"
                value={trelloApiToken}
                onChange={(e) => setTrelloApiToken(e.target.value)}
                disabled={trelloApiToken === '••••••••'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trello List ID *
              </label>
              <input
                type="text"
                placeholder="Enter the ID of the Trello List to add cards to"
                value={trelloListId}
                onChange={(e) => setTrelloListId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveTrello}
                disabled={saving || !trelloApiKey || !trelloApiToken || !trelloListId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Trello Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Notion Integration Settings */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Notion Integration</h2>
              <p className="text-gray-600 mt-1">Configure Notion to auto-generate meeting summaries</p>
            </div>
            <div className="text-3xl">
              <span>📓</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notion Internal Integration Token (API Key) *
              </label>
              <input
                type="password"
                placeholder="secret_xxxxxxxxxxxx"
                value={notionApiKey}
                onChange={(e) => setNotionApiKey(e.target.value)}
                disabled={notionApiKey === '••••••••'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notion Database ID *
              </label>
              <input
                type="text"
                placeholder="Enter Database ID"
                value={notionDatabaseId}
                onChange={(e) => setNotionDatabaseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveNotion}
                disabled={saving || !notionApiKey || !notionDatabaseId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Notion Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Contacts (Email Routing) */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Email Contacts</h2>
              <p className="text-gray-600 mt-1">Configure email routing by mapping names from transcripts</p>
            </div>
            <div className="text-3xl">
              <span>📧</span>
            </div>
          </div>

          <div className="space-y-4">
            {contacts.map((contact, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.emailAddress}</p>
                </div>
                <button
                  onClick={() => handleRemoveContact(idx)}
                  className="text-red-500 hover:text-red-700 font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="flex gap-4 mt-4">
              <input
                type="text"
                placeholder="Name (e.g., John)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddContact}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Add
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveContacts}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Contacts'}
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-Create GitHub Issues
                </label>
                <p className="text-gray-600 text-xs mt-1">
                  Automatically create GitHub issues from technical analysis
                </p>
              </div>
              <button
                onClick={() => setAutoCreateIssues(!autoCreateIssues)}
                disabled={!githubValidated}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  autoCreateIssues ? 'bg-indigo-600' : 'bg-gray-200'
                } ${!githubValidated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    autoCreateIssues ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notify on Issue Creation
                </label>
                <p className="text-gray-600 text-xs mt-1">
                  Receive notifications when GitHub issues are created
                </p>
              </div>
              <button
                onClick={() => setNotifyOnCreation(!notifyOnCreation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  notifyOnCreation ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    notifyOnCreation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
