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

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow p-8">
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
