import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data processing state
  const [processingData, setProcessingData] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [availableData, setAvailableData] = useState([]);
  const [selectedDataIndex, setSelectedDataIndex] = useState(0);
  const [error, setError] = useState('');
  const [creatingIssues, setCreatingIssues] = useState(false);
  const [githubSettings, setGithubSettings] = useState(null);
  const [showIssueConfirmation, setShowIssueConfirmation] = useState(false);
  const [extractedIssues, setExtractedIssues] = useState([]);
  const [selectedIssues, setSelectedIssues] = useState({});

  useEffect(() => {
    fetchAvailableData();
    fetchGitHubSettings();
  }, []);

  const fetchAvailableData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/agents/available-data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableData(response.data.meetings || []);
      setError('');
    } catch (err) {
      setError('Failed to load available data');
      console.error(err);
    }
  };

  const fetchGitHubSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGithubSettings(response.data.settings.github);
    } catch (err) {
      console.error('Failed to load GitHub settings:', err);
    }
  };

  const handleProcessData = async () => {
    try {
      setProcessingData(true);
      setError('');
      const token = localStorage.getItem('token');

      console.log('Processing data from data1.json with index:', selectedDataIndex);

      const response = await axios.post(
        'http://localhost:5000/api/agents/process-data',
        { dataIndex: selectedDataIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Processing complete:', response.data);
      setProcessedData(response.data);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.error || 'Failed to process data');
    } finally {
      setProcessingData(false);
    }
  };

  const extractGitHubIssues = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-github-issues',
        { analysisText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.issues && response.data.issues.length > 0 
        ? response.data.issues 
        : null;
    } catch (err) {
      console.error('Error extracting GitHub issues:', err);
      return null;
    }
  };

  const handleCreateGitHubIssues = async () => {
    if (!githubSettings?.validated) {
      setError('GitHub is not configured. Please go to Settings to configure it.');
      return;
    }

    if (!processedData?.technical?.analysis) {
      setError('No technical analysis available');
      return;
    }

    try {
      setProcessingData(true);
      const issues = await extractGitHubIssues(processedData.technical.analysis);

      if (!issues || issues.length === 0) {
        setError('No GitHub issues found in technical analysis');
        setProcessingData(false);
        return;
      }

      // Show confirmation dialog with extracted issues
      setExtractedIssues(issues);
      const initialSelected = {};
      issues.forEach((_, idx) => {
        initialSelected[idx] = true;
      });
      setSelectedIssues(initialSelected);
      setShowIssueConfirmation(true);
    } catch (err) {
      setError('Failed to extract GitHub issues');
      console.error(err);
    } finally {
      setProcessingData(false);
    }
  };

  const handleToggleIssue = (index) => {
    setSelectedIssues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirmIssues = async () => {
    const issuesToCreate = extractedIssues.filter((_, idx) => selectedIssues[idx]);

    if (issuesToCreate.length === 0) {
      setError('Please select at least one issue to create');
      return;
    }

    setShowIssueConfirmation(false);
    setCreatingIssues(true);
    try {
      const token = localStorage.getItem('token');

      console.log('Creating GitHub issues with data:', { conversationId: `conv_data_${processedData.meetingId}`, issuesCount: issuesToCreate.length });

      // Call the backend to create GitHub issues using stored credentials
      const response = await axios.post(
        'http://localhost:5000/api/agents/create-github-issues',
        {
          conversationId: `conv_data_${processedData.meetingId}`,
          issues: issuesToCreate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('GitHub issue creation response:', response.data);

      setError('');
      const successCount = response.data.successCount || response.data.issues?.filter(i => i.success).length || 0;
      if (successCount > 0) {
        alert(`Successfully created ${successCount} GitHub issue(s)! \n\n${response.data.issues?.map(i => i.url || i.title).join('\n')}`);
      } else {
        setError('No issues were successfully created. Check your GitHub settings.');
      }
    } catch (err) {
      console.error('GitHub issue creation failed:', err);
      setError(`Failed to create GitHub issues: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreatingIssues(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Meeting Processor</h1>
            <p className="text-indigo-100 mt-1">Welcome, {user?.name}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/settings')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              ⚙️ Settings
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Data Processing Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Process Meeting Data</h2>
          <p className="text-gray-600 text-sm mb-6">Analyze meeting transcripts using dual-perspective AI agents (Technical + Business)</p>
          
          {availableData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No data available to process</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Meeting Data
                </label>
                <select
                  value={selectedDataIndex}
                  onChange={(e) => setSelectedDataIndex(parseInt(e.target.value))}
                  disabled={processingData}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                >
                  {availableData.map((data, idx) => (
                    <option key={idx} value={idx}>
                      {data.title} ({data.date})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleProcessData}
                disabled={processingData}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition text-lg"
              >
                {processingData ? 'Processing...' : '🚀 Process with AI'}
              </button>
            </div>
          )}
        </div>

        {/* Processed Data Display */}
        {processedData && (
          <div className="space-y-6">
            {/* Meeting Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{processedData.title}</h2>
              <p className="text-gray-600 text-sm">Processed at: {new Date(processedData.timestamp).toLocaleString()}</p>
            </div>

            {/* Technical Agent Output */}
            <div className="bg-blue-50 rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-blue-700 px-3 py-1 rounded-full text-sm">TECHNICAL</span>
                  Technical Analysis & Architecture
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-white p-4 rounded border border-blue-200 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {processedData.technical.analysis}
                </div>
              </div>
            </div>

            {/* Non-Technical Agent Output */}
            <div className="bg-green-50 rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 text-white p-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-green-700 px-3 py-1 rounded-full text-sm">BUSINESS</span>
                  Business & Strategic Analysis
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-white p-4 rounded border border-green-200 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {processedData.nonTechnical.analysis}
                </div>
              </div>
            </div>

            {/* GitHub Integration Section */}
            {githubSettings?.validated && (
              <div className="bg-orange-50 rounded-lg shadow overflow-hidden">
                <div className="bg-orange-600 text-white p-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="bg-orange-700 px-3 py-1 rounded-full text-sm">GITHUB</span>
                    Create GitHub Issues from Technical Data
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 text-sm">
                    Found potential GitHub issues in technical analysis. Click below to create issues in:
                  </p>
                  <p className="text-gray-800 font-semibold">
                    {githubSettings.owner}/{githubSettings.repo}
                  </p>

                  <button
                    onClick={handleCreateGitHubIssues}
                    disabled={creatingIssues}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    {creatingIssues ? 'Creating Issues...' : '📝 Create GitHub Issues'}
                  </button>
                </div>
              </div>
            )}

            {!githubSettings?.validated && (
              <div className="bg-yellow-50 rounded-lg shadow overflow-hidden">
                <div className="bg-yellow-600 text-white p-4">
                  <h3 className="text-xl font-bold">GitHub Not Configured</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">
                    Configure GitHub in Settings to enable automatic issue creation from technical analysis.
                  </p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={() => setProcessedData(null)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>

      {/* GitHub Issues Confirmation Modal */}
      {showIssueConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-orange-600 text-white p-6">
              <h2 className="text-2xl font-bold">Confirm GitHub Issues</h2>
              <p className="text-orange-100 mt-2">
                Review and select the issues you want to create in {githubSettings?.owner}/{githubSettings?.repo}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {extractedIssues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`issue-${index}`}
                      checked={selectedIssues[index] || false}
                      onChange={() => handleToggleIssue(index)}
                      className="mt-1 w-5 h-5 text-indigo-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor={`issue-${index}`} className="cursor-pointer">
                        <p className="font-semibold text-gray-800">{issue.title}</p>
                        <p className="text-gray-600 text-sm mt-1">{issue.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {issue.labels?.map((label, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {/* Selection Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-blue-900 font-semibold">
                  {Object.values(selectedIssues).filter(Boolean).length} of {extractedIssues.length} issues selected
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex gap-4 justify-end border-t">
              <button
                onClick={() => setShowIssueConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIssues}
                disabled={creatingIssues || Object.values(selectedIssues).every(v => !v)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {creatingIssues ? 'Creating...' : `Create ${Object.values(selectedIssues).filter(Boolean).length} Issues`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

