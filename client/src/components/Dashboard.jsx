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
  
  // New GitHub features state
  const [createdIssueNumbers, setCreatedIssueNumbers] = useState([]);
  const [showAssignIssues, setShowAssignIssues] = useState(false);
  const [assignees, setAssignees] = useState({});
  const [assigningIssues, setAssigningIssues] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [showPRConfirmation, setShowPRConfirmation] = useState(false);
  const [extractedPRs, setExtractedPRs] = useState([]);
  const [selectedPRs, setSelectedPRs] = useState({});

  // Email features state
  const [contacts, setContacts] = useState([]);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [extractedEmails, setExtractedEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState({});
  const [sendingEmails, setSendingEmails] = useState(false);

  // Calendar features state
  const [showEventConfirmation, setShowEventConfirmation] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState({});
  const [schedulingEvents, setSchedulingEvents] = useState(false);

  // Trello State
  const [extractedCards, setExtractedCards] = useState([]);
  const [showTrelloConfirmation, setShowTrelloConfirmation] = useState(false);
  const [selectedCards, setSelectedCards] = useState({});
  const [creatingCards, setCreatingCards] = useState(false);

  // Notion State
  const [extractedSummary, setExtractedSummary] = useState('');
  const [showNotionConfirmation, setShowNotionConfirmation] = useState(false);
  const [creatingNotionPage, setCreatingNotionPage] = useState(false);

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
      if (response.data.settings.contacts) {
        setContacts(response.data.settings.contacts);
      }
    } catch (err) {
      console.error('Failed to load Settings details:', err);
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

  const extractGitHubPRs = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-github-pull-requests',
        { analysisText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.pullRequests && response.data.pullRequests.length > 0 
        ? response.data.pullRequests 
        : null;
    } catch (err) {
      console.error('Error extracting GitHub PRs:', err);
      return null;
    }
  };

  const extractEmailsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-emails',
        { dataIndex: idx },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.emails && response.data.emails.length > 0 
        ? response.data.emails 
        : null;
    } catch (err) {
      console.error('Error extracting Emails:', err);
      return null;
    }
  };

  const extractEventsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-events',
        { dataIndex: idx },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.events && response.data.events.length > 0 
        ? response.data.events 
        : null;
    } catch (err) {
      console.error('Error extracting Events:', err);
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

  const handleExtractTrelloCards = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-trello-cards',
        { dataIndex: selectedDataIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setExtractedCards(response.data.cards);
      
      const initialSelection = {};
      response.data.cards.forEach((_, idx) => {
        initialSelection[idx] = true; 
      });
      setSelectedCards(initialSelection);
      
      setShowTrelloConfirmation(true);
      setError('');
    } catch (err) {
      setError(`Failed to extract Trello Cards: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingData(false);
    }
  };

  const handleToggleCard = (index) => {
    setSelectedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirmCards = async () => {
    const cardsToCreate = extractedCards.filter((_, index) => selectedCards[index]);
    
    if (cardsToCreate.length === 0) return;

    setCreatingCards(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/create-trello-cards',
        { cards: cardsToCreate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.failureCount > 0) {
        const errorMsgs = response.data.results.filter(r => !r.success).map(r => r.error).join(', ');
        alert(`Created ${response.data.successCount} cards. Failed ${response.data.failureCount} cards. Errors: ${errorMsgs}`);
      } else {
        alert(response.data.note ? response.data.note : `Successfully created ${response.data.successCount} Trello card(s)!`);
      }
      setShowTrelloConfirmation(false);
    } catch (err) {
      setError(`Failed to create cards: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreatingCards(false);
    }
  };

  const handleExtractNotionSummary = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/extract-notion-summary',
        { dataIndex: selectedDataIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setExtractedSummary(response.data.summary);
      setShowNotionConfirmation(true);
      setError('');
    } catch (err) {
      setError(`Failed to extract Notion Summary: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingData(false);
    }
  };

  const handleConfirmNotionSummary = async () => {
    if (!extractedSummary) return;

    setCreatingNotionPage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/create-notion-page',
        { 
          summary: extractedSummary,
          title: `Meeting Summary - ${new Date().toLocaleDateString()}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.pageUrl) {
        alert(`Successfully generated Notion summary page! \n\n${response.data.pageUrl}`);
      } else {
        alert(response.data.note ? response.data.note : `Successfully generated Notion summary page!`);
      }
      setShowNotionConfirmation(false);
    } catch (err) {
      setError(`Failed to push to Notion: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreatingNotionPage(false);
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
        // Extract created issue numbers for further operations
        const issueNumbers = response.data.issues
          ?.filter(i => i.success && i.issueNumber)
          ?.map(i => i.issueNumber) || [];
        setCreatedIssueNumbers(issueNumbers);
        
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

  const handleAssignIssues = async () => {
    const selectedAssignments = Object.entries(assignees)
      .filter(([_, value]) => value && value.length > 0)
      .map(([issueNum, users]) => ({
        issueNumber: parseInt(issueNum),
        assignees: users.split(',').map(u => u.trim()).filter(Boolean),
      }));

    if (selectedAssignments.length === 0) {
      setError('Please assign at least one issue');
      return;
    }

    setAssigningIssues(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/assign-issues',
        { issueAssignments: selectedAssignments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Successfully assigned ${response.data.successCount} issue(s)`);
      setShowAssignIssues(false);
      setAssignees({});
    } catch (err) {
      setError(`Failed to assign issues: ${err.response?.data?.error || err.message}`);
    } finally {
      setAssigningIssues(false);
    }
  };

  const handleExtractAndCreatePRs = async () => {
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
      const prs = await extractGitHubPRs(processedData.technical.analysis);

      if (!prs || prs.length === 0) {
        setError('No GitHub pull requests found in technical analysis');
        setProcessingData(false);
        return;
      }

      setExtractedPRs(prs);
      const initialSelected = {};
      prs.forEach((_, idx) => {
        initialSelected[idx] = true;
      });
      setSelectedPRs(initialSelected);
      setShowPRConfirmation(true);
    } catch (err) {
      setError('Failed to extract GitHub Pull Requests');
      console.error(err);
    } finally {
      setProcessingData(false);
    }
  };

  const handleTogglePR = (index) => {
    setSelectedPRs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirmPRs = async () => {
    const prsToCreate = extractedPRs.filter((_, index) => selectedPRs[index]);
    
    if (prsToCreate.length === 0) return;

    setCreatingPR(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/create-pull-requests',
        { pullRequests: prsToCreate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.failureCount > 0) {
        const errorMsg = response.data.pullRequests.find(pr => !pr.success)?.error || 'Unknown error';
        alert(`Created ${response.data.successCount} PR(s). Failed to create ${response.data.failureCount} PR(s). Reason: ${errorMsg}\n\nNote: GitHub only allows ONE open pull request between the exact same two branches ('test' to 'main') at a time.`);
      } else {
        alert(`Successfully created ${response.data.successCount} pull request(s)`);
      }
      setShowPRConfirmation(false);
    } catch (err) {
      setError(`Failed to create pull requests: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreatingPR(false);
    }
  };

  const handleExtractAndSendEmails = async () => {
    try {
      setProcessingData(true);
      const emails = await extractEmailsAPI(selectedDataIndex);

      if (!emails || emails.length === 0) {
        setError('No Email Tasks found in the transcript');
        setProcessingData(false);
        return;
      }

      // Filter matched contacts
      const validEmails = emails.map(emailTask => {
        const contact = contacts.find(c => c.name.toLowerCase() === emailTask.name.toLowerCase());
        return {
          ...emailTask,
          emailAddress: contact ? contact.emailAddress : null,
          isValid: !!contact
        };
      });

      setExtractedEmails(validEmails);
      
      const initialSelected = {};
      validEmails.forEach((e, idx) => {
        initialSelected[idx] = e.isValid; // only auto-check if valid
      });
      setSelectedEmails(initialSelected);
      setShowEmailConfirmation(true);
    } catch (err) {
      setError('Failed to extract Emails');
      console.error(err);
    } finally {
      setProcessingData(false);
    }
  };

  const handleToggleEmail = (index) => {
    setSelectedEmails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirmEmails = async () => {
    const emailsToSend = extractedEmails.filter((_, index) => selectedEmails[index]);
    
    // Safety check ensuring we only send to configured addresses
    const invalidAttempts = emailsToSend.filter(e => !e.isValid);
    if (invalidAttempts.length > 0) {
      setError('One or more selected emails are missing a configured email address. Please update Contacts in Settings.');
      return;
    }

    if (emailsToSend.length === 0) return;

    setSendingEmails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/send-emails',
        { emailTasks: emailsToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentCount = response.data.successCount;
      const previewLinks = response.data.results
        .map(r => r.previewUrl)
        .filter(url => url)
        .join('\n');

      if (previewLinks) {
        alert(`Successfully sent ${sentCount} email(s)!\n\nView them here:\n${previewLinks}`);
      } else {
        alert(`Successfully sent ${sentCount} email(s) via SMTP!`);
      }
      setShowEmailConfirmation(false);
    } catch (err) {
      setError(`Failed to send emails: ${err.response?.data?.error || err.message}`);
    } finally {
      setSendingEmails(false);
    }
  };

  const handleExtractAndScheduleEvents = async () => {
    try {
      setProcessingData(true);
      const events = await extractEventsAPI(selectedDataIndex);

      if (!events || events.length === 0) {
        setError('No Calendar Events found in the transcript');
        setProcessingData(false);
        return;
      }

      setExtractedEvents(events);
      
      const initialSelected = {};
      events.forEach((_, idx) => {
        initialSelected[idx] = true;
      });
      setSelectedEvents(initialSelected);
      setShowEventConfirmation(true);
    } catch (err) {
      setError('Failed to extract Calendar Events');
      console.error(err);
    } finally {
      setProcessingData(false);
    }
  };

  const handleToggleEvent = (index) => {
    setSelectedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleConfirmEvents = async () => {
    const eventsToSchedule = extractedEvents.filter((_, index) => selectedEvents[index]);
    
    if (eventsToSchedule.length === 0) return;

    setSchedulingEvents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agents/create-calendar-events',
        { events: eventsToSchedule },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.failureCount > 0) {
        const errorMsgs = response.data.results.filter(r => !r.success).map(r => r.error).join(', ');
        alert(`Scheduled ${response.data.successCount} events. Failed ${response.data.failureCount} events. Errors: ${errorMsgs}`);
      } else {
        alert(response.data.note ? response.data.note : `Successfully scheduled ${response.data.successCount} event(s) to Calendar!`);
      }
      setShowEventConfirmation(false);
    } catch (err) {
      setError(`Failed to schedule events: ${err.response?.data?.error || err.message}`);
    } finally {
      setSchedulingEvents(false);
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
              <div className="p-6 space-y-4">
                <div className="bg-white p-4 rounded border border-green-200 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {processedData.nonTechnical.analysis}
                </div>
                
                {/* Extract Emails Section */}
                <div className="border-t border-green-200 pt-4">
                  <h4 className="font-semibold text-green-800 mb-2">Automated Communications</h4>
                  <p className="text-sm text-gray-600 mb-4">Extract email tasks mentioned in the transcript to send updates and approvals directly to stakeholders configured in your Settings.</p>
                  <button
                    onClick={handleExtractAndSendEmails}
                    disabled={processingData}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {processingData ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Scanning...
                      </>
                    ) : (
                      '📧 Extract & Send Emails'
                    )}
                  </button>
                </div>

                {/* Extract Calendar Section */}
                <div className="border-t border-green-200 pt-4">
                  <h4 className="font-semibold text-green-800 mb-2">Calendar & Scheduling</h4>
                  <p className="text-sm text-gray-600 mb-4">Extract events, holidays, and meetings from the transcript and schedule them on your Google Calendar.</p>
                  <button
                    onClick={handleExtractAndScheduleEvents}
                    disabled={processingData}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {processingData ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Scanning...
                      </>
                    ) : (
                      '📅 Extract & Schedule Events'
                    )}
                  </button>
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
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            )}

            {/* Non-Tech Extractor Block - Trello */}
            <div className="bg-sky-50 rounded-lg shadow overflow-hidden">
              <div className="bg-sky-600 text-white p-4">
                <h3 className="text-xl font-bold">Non-Technical Task Extraction (Trello)</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Analyze the transcript for tasks that should be put into Trello cards.
                </p>
                <button
                  onClick={handleExtractTrelloCards}
                  disabled={processingData}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {processingData ? 'Extracting...' : '📋 Extract Trello Cards'}
                </button>
              </div>
            </div>

            {/* Non-Tech Extractor Block - Notion Summaries */}
            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="bg-gray-900 text-white p-4">
                <h3 className="text-xl font-bold">Meeting Summary (Notion)</h3>
              </div>
              <div className="p-6 space-y-4 bg-gray-50">
                <p className="text-gray-700">
                  Analyze the transcript to generate a comprehensive markdown summary formatted for Notion.
                </p>
                <button
                  onClick={handleExtractNotionSummary}
                  disabled={processingData}
                  className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {processingData ? 'Extracting...' : '📓 Generate Notion Summary'}
                </button>
              </div>
            </div>

            {/* Assign Issues Section */}
            {githubSettings?.validated && createdIssueNumbers.length > 0 && (
              <div className="bg-purple-50 rounded-lg shadow overflow-hidden">
                <div className="bg-purple-600 text-white p-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="bg-purple-700 px-3 py-1 rounded-full text-sm">ASSIGN</span>
                    Assign Issues to Team Members
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 text-sm">
                    Assign created issues to your team members for better task distribution.
                  </p>
                  <button
                    onClick={() => setShowAssignIssues(!showAssignIssues)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {showAssignIssues ? '✓ Hide Assignments' : '👥 Assign Issues'}
                  </button>
                  
                  {showAssignIssues && (
                    <div className="border-t pt-4 space-y-3">
                      {createdIssueNumbers.map(issueNum => (
                        <div key={issueNum} className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Issue #{issueNum} - Assign to (comma separated GitHub usernames):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., john, sarah, mike"
                            value={assignees[issueNum] || ''}
                            onChange={(e) => setAssignees({...assignees, [issueNum]: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handleAssignIssues}
                        disabled={assigningIssues}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        {assigningIssues ? 'Assigning...' : 'Confirm Assignments'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extract Pull Requests Section */}
            {githubSettings?.validated && (
              <div className="bg-indigo-50 rounded-lg shadow overflow-hidden">
                <div className="bg-indigo-600 text-white p-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">PR</span>
                    Extract Pull Requests (test → main)
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 text-sm">
                    Extract Pull Requests from the technical analysis to create them automatically.
                  </p>
                  <button
                    onClick={handleExtractAndCreatePRs}
                    disabled={processingData}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {processingData ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Extracting PRs...
                      </>
                    ) : (
                      '🔀 Extract Pull Requests'
                    )}
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

      {/* GitHub PR Confirmation Modal */}
      {showPRConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold">Confirm Pull Requests</h2>
              <p className="text-indigo-100 mt-2">
                Review and select the pull requests you want to create in {githubSettings?.owner}/{githubSettings?.repo}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {extractedPRs.map((pr, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`pr-${index}`}
                      checked={selectedPRs[index] || false}
                      onChange={() => handleTogglePR(index)}
                      className="mt-1 w-5 h-5 text-indigo-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor={`pr-${index}`} className="cursor-pointer">
                        <p className="font-semibold text-gray-800">{pr.title}</p>
                        <p className="text-gray-600 text-sm mt-1">{pr.description}</p>
                        <p className="text-gray-500 text-xs mt-1">Branch: {pr.head} → {pr.base}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pr.labels?.map((label, idx) => (
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
                  {Object.values(selectedPRs).filter(Boolean).length} of {extractedPRs.length} PRs selected
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex gap-4 justify-end border-t">
              <button
                onClick={() => setShowPRConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPRs}
                disabled={creatingPR || Object.values(selectedPRs).every(v => !v)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {creatingPR ? 'Creating...' : `Create ${Object.values(selectedPRs).filter(Boolean).length} PRs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">Confirm Outbound Emails</h2>
              <p className="text-green-100 mt-2">
                Review the emails before sending. Unconfigured contacts cannot be selected.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {extractedEmails.map((email, index) => (
                <div key={index} className={`border rounded-lg p-4 transition ${email.isValid ? 'border-gray-200 hover:bg-green-50' : 'border-red-200 bg-red-50 opacity-75'}`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`email-${index}`}
                      checked={selectedEmails[index] || false}
                      onChange={() => handleToggleEmail(index)}
                      disabled={!email.isValid}
                      className="mt-1 w-5 h-5 text-green-600 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <label htmlFor={`email-${index}`} className={email.isValid ? "cursor-pointer" : "cursor-not-allowed"}>
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800">To: {email.name}</p>
                          {email.isValid ? (
                            <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded">{email.emailAddress}</span>
                          ) : (
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">Missing Email in Settings</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800 mt-2">Subject: {email.subject}</p>
                        <p className="text-gray-600 text-sm mt-1 border-l-2 border-gray-300 pl-3 italic">"{email.context}"</p>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {/* Selection Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-green-900 font-semibold">
                  {Object.values(selectedEmails).filter(Boolean).length} of {extractedEmails.filter(e => e.isValid).length} valid emails selected
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex gap-4 justify-end border-t">
              <button
                onClick={() => setShowEmailConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmails}
                disabled={sendingEmails || Object.values(selectedEmails).every(v => !v)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {sendingEmails ? 'Sending...' : `Send ${Object.values(selectedEmails).filter(Boolean).length} Emails`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Event Confirmation Modal */}
      {showEventConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold">Confirm Calendar Events</h2>
              <p className="text-blue-100 mt-2">
                Review the scheduled meetings, holidays, and milestones before adding them.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {extractedEvents.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 transition hover:bg-blue-50">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`event-${index}`}
                      checked={selectedEvents[index] || false}
                      onChange={() => handleToggleEvent(index)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor={`event-${index}`} className="cursor-pointer">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800">{event.summary}</p>
                          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {event.date} {event.isAllDay ? '(All Day)' : (event.startTime ? `@ ${event.startTime}` : '')}
                          </span>
                        </div>
                        <p className="font-medium text-gray-800 mt-2 truncate w-full">{event.description}</p>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-gray-600 text-sm mt-1 border-l-2 border-gray-300 pl-3 italic">
                            Attendees: {event.attendees.join(', ')}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-6 flex gap-4 justify-end border-t">
              <button
                onClick={() => setShowEventConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEvents}
                disabled={schedulingEvents || Object.values(selectedEvents).every(v => !v)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {schedulingEvents ? 'Scheduling...' : `Schedule ${Object.values(selectedEvents).filter(Boolean).length} Events`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trello Cards Confirmation Modal */}
      {showTrelloConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 flex flex-col">
            <div className="bg-sky-600 text-white p-6 shrink-0">
              <h2 className="text-2xl font-bold">Confirm Trello Cards</h2>
              <p className="text-sky-100 mt-2">
                Review these tasks before creating cards in your Trello board.
              </p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {extractedCards.map((card, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 transition hover:bg-sky-50">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`card-${index}`}
                      checked={selectedCards[index] || false}
                      onChange={() => handleToggleCard(index)}
                      className="mt-1 w-5 h-5 text-sky-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor={`card-${index}`} className="cursor-pointer">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800">{card.name}</p>
                        </div>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{card.desc}</p>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {extractedCards.length === 0 && (
                <p className="text-gray-500 italic">No tasks found in transcript suitable for Trello.</p>
              )}
            </div>

            <div className="bg-gray-50 p-6 flex gap-4 justify-end border-t shrink-0">
              <button
                onClick={() => setShowTrelloConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCards}
                disabled={creatingCards || extractedCards.filter((_, i) => selectedCards[i]).length === 0}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition"
              >
                {creatingCards ? 'Creating...' : 'Create Selected Cards'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notion Summary Confirmation Modal */}
      {showNotionConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="bg-gray-900 text-white p-6 shrink-0">
              <h2 className="text-2xl font-bold">Review Notion Summary</h2>
              <p className="text-gray-300 mt-2">
                This Markdown block will be pushed as a new page in your configured Notion Database.
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50">
              <div className="bg-white p-6 whitespace-pre-wrap font-mono text-sm border border-gray-200 shadow-inner rounded-sm">
                {extractedSummary || "No summary was generated."}
              </div>
            </div>

            <div className="bg-gray-100 p-6 flex gap-4 justify-end border-t shrink-0">
              <button
                onClick={() => setShowNotionConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNotionSummary}
                disabled={creatingNotionPage || !extractedSummary}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-semibold disabled:bg-gray-400 transition"
              >
                {creatingNotionPage ? 'Pushing to Notion...' : 'Push to Notion'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

