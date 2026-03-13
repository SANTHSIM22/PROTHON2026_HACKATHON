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
    <div className="min-h-screen bg-[#F0F4F2] text-[#3D5249] font-sans">
      <header className="bg-[#0C1A15] text-[#FFFFFF] shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-syne tracking-tight">Meeting.AI</h1>
            <p className="text-[#8FA89F] mt-1 text-sm">Dashboard — {user?.name}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/settings')}
              className="bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] font-semibold py-2 px-6 rounded-lg transition-all border border-[#FFFFFF]/10"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="bg-[#B91C1C]/10 hover:bg-[#B91C1C]/20 text-[#B91C1C] font-semibold py-2 px-6 rounded-lg transition-all border border-[#B91C1C]/20"
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
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D4E0DA] p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold font-syne text-[#0C1A15] mb-2">Process Meeting Data</h2>
          <p className="text-[#7A9489] text-sm mb-6">Analyze meeting transcripts using dual-perspective AI agents</p>

          {availableData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No data available to process</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#3D5249] mb-2 px-1">
                  Select Meeting Data
                </label>
                <select
                  value={selectedDataIndex}
                  onChange={(e) => setSelectedDataIndex(parseInt(e.target.value))}
                  disabled={processingData}
                  className="w-full px-4 py-3 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl text-[#0C1A15] font-medium focus:ring-2 focus:ring-[#B45309]/20 transition-all outline-none"
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
                className="w-full bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-[0_8px_25px_rgba(180,83,9,0.25)] disabled:opacity-50 text-[#FFFFFF] font-bold py-4 px-4 rounded-xl transition-all text-lg hover:scale-[1.01]"
              >
                {processingData ? 'Analysing Transcript...' : '🚀 Process with AI'}
              </button>
            </div>
          )}
        </div>

        {/* Processed Data Display */}
        {processedData && (
          <div className="space-y-6">
            {/* Meeting Header */}
            <div className="bg-[#FFFFFF] rounded-xl border border-[#D4E0DA] p-6 shadow-sm">
              <h2 className="text-2xl font-bold font-syne text-[#0C1A15] mb-2">{processedData.title}</h2>
              <p className="text-[#7A9489] text-xs font-mono uppercase tracking-wider">Processed: {new Date(processedData.timestamp).toLocaleDateString()}</p>
            </div>

            {/* Technical Agent Output */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D4E0DA] shadow-sm overflow-hidden">
              <div className="bg-[#B45309]/5 border-b border-[#D4E0DA] p-5">
                <h3 className="text-lg font-bold font-syne flex items-center gap-3 text-[#B45309]">
                  <span className="bg-[#FEF3C7] text-[#B45309] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">TECHNICAL</span>
                  Technical Analysis & Architecture
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-[#F7FAF8] p-6 rounded-xl border border-[#D4E0DA] max-h-[500px] overflow-y-auto whitespace-pre-wrap text-[14px] text-[#3D5249] leading-relaxed font-mono shadow-inner">
                  {processedData.technical.analysis}
                </div>
              </div>
            </div>

            {/* Non-Technical Agent Output */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D4E0DA] shadow-sm overflow-hidden">
              <div className="bg-[#3D5249]/5 border-b border-[#D4E0DA] p-5">
                <h3 className="text-lg font-bold font-syne flex items-center gap-3 text-[#3D5249]">
                  <span className="bg-[#E8F0EC] text-[#3D5249] px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">NON-TECH</span>
                  Business & Strategic Analysis
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-[#F7FAF8] p-6 rounded-xl border border-[#D4E0DA] max-h-[500px] overflow-y-auto whitespace-pre-wrap text-[14px] text-[#3D5249] leading-relaxed shadow-inner">
                  {processedData.nonTechnical.analysis}
                </div>
              </div>
            </div>

            {/* GitHub Integration Section */}
            {githubSettings?.validated && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#D97706]/30 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#B45309] to-[#D97706] text-[#FFFFFF] p-5">
                  <h3 className="text-lg font-bold font-syne flex items-center gap-3">
                    <span className="bg-[#FFFFFF]/20 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">GITHUB</span>
                    Generate Issue Pipeline
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[#3D5249] text-sm">
                    Automate task creation directly into your repository:
                  </p>
                  <p className="text-[#0C1A15] font-bold px-3 py-2 bg-[#F0F4F2] rounded-lg inline-block border border-[#D4E0DA]">
                    {githubSettings.owner}/{githubSettings.repo}
                  </p>

                  <button
                    onClick={handleCreateGitHubIssues}
                    disabled={creatingIssues}
                    className="w-full bg-[#0C1A15] hover:bg-[#1A2E26] disabled:opacity-50 text-[#FFFFFF] font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:scale-[1.01]"
                  >
                    {creatingIssues ? 'Syncing...' : '📝 Extract & Create Issues'}
                  </button>
                </div>
              </div>
            )}

            {!githubSettings?.validated && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#D4E0DA] shadow-sm overflow-hidden">
                <div className="bg-[#FEF3C7] text-[#B45309] p-5">
                  <h3 className="text-lg font-bold font-syne uppercase tracking-wider">GitHub Link Pending</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[#3D5249] text-sm">
                    Configure GitHub in Settings to enable automatic issue creation from technical analysis.
                  </p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="bg-[#B45309] hover:bg-[#D97706] text-[#FFFFFF] font-bold py-2.5 px-6 rounded-lg transition-all shadow-md"
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={() => setProcessedData(null)}
              className="w-full text-[#7A9489] hover:text-[#0C1A15] font-bold py-3 transition-colors"
            >
              Clear Analysis Data
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

