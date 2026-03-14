import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
  const [createdIssueNumbers, setCreatedIssueNumbers] = useState([]);
  const [showAssignIssues, setShowAssignIssues] = useState(false);
  const [assignees, setAssignees] = useState({});
  const [assigningIssues, setAssigningIssues] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [showPRConfirmation, setShowPRConfirmation] = useState(false);
  const [extractedPRs, setExtractedPRs] = useState([]);
  const [selectedPRs, setSelectedPRs] = useState({});
  const [contacts, setContacts] = useState([]);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [extractedEmails, setExtractedEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState({});
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showEventConfirmation, setShowEventConfirmation] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState({});
  const [schedulingEvents, setSchedulingEvents] = useState(false);
  const [extractedCards, setExtractedCards] = useState([]);
  const [showTrelloConfirmation, setShowTrelloConfirmation] = useState(false);
  const [selectedCards, setSelectedCards] = useState({});
  const [creatingCards, setCreatingCards] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState('');
  const [showNotionConfirmation, setShowNotionConfirmation] = useState(false);
  const [creatingNotionPage, setCreatingNotionPage] = useState(false);
  const [activeTab, setActiveTab] = useState('technical');
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    fetchAvailableData();
    fetchGitHubSettings();
    
    // Set default tab based on user role
    if (user?.role === 'non-technical') {
      setActiveTab('nonTechnical');
    } else {
      setActiveTab('technical');
    }
  }, [user?.role]);

  useEffect(() => {
    if (processingData && !showIssueConfirmation && !showPRConfirmation && !showEmailConfirmation && !showEventConfirmation && !showTrelloConfirmation && !showNotionConfirmation) {
      const interval = setInterval(() => {
        setProcessingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    } else if (!processingData) {
      setProcessingStep(0);
    }
  }, [processingData, showIssueConfirmation, showPRConfirmation, showEmailConfirmation, showEventConfirmation, showTrelloConfirmation, showNotionConfirmation]);

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
    }
  };

  const fetchGitHubSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGithubSettings(response.data.settings.github);
      if (response.data.settings.contacts) setContacts(response.data.settings.contacts);
    } catch (err) {
      console.error('Failed to load Settings:', err);
    }
  };

  const handleProcessData = async () => {
    try {
      setProcessingData(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/process-data', { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setProcessedData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process data');
    } finally {
      setProcessingData(false);
    }
  };

  const extractGitHubIssues = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-github-issues', { analysisText }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.issues?.length > 0 ? response.data.issues : null;
    } catch { return null; }
  };

  const extractGitHubPRs = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-github-pull-requests', { analysisText }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.pullRequests?.length > 0 ? response.data.pullRequests : null;
    } catch { return null; }
  };

  const extractEmailsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-emails', { dataIndex: idx }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.emails?.length > 0 ? response.data.emails : null;
    } catch { return null; }
  };

  const extractEventsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-events', { dataIndex: idx }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.events?.length > 0 ? response.data.events : null;
    } catch { return null; }
  };

  const handleCreateGitHubIssues = async () => {
    if (!githubSettings?.validated) { setError('GitHub is not configured. Please go to Settings.'); return; }
    if (user?.role !== 'technical' && user?.role !== 'organization') { setError('Only technical users can create GitHub issues'); return; }
    if (!processedData?.technical?.analysis) { setError('No technical analysis available'); return; }
    try {
      setProcessingData(true);
      const issues = await extractGitHubIssues(processedData.technical.analysis);
      if (!issues?.length) { setError('No GitHub issues found'); setProcessingData(false); return; }
      setExtractedIssues(issues);
      const sel = {}; issues.forEach((_, i) => { sel[i] = true; }); setSelectedIssues(sel);
      setShowIssueConfirmation(true);
    } catch { setError('Failed to extract GitHub issues'); } finally { setProcessingData(false); }
  };

  const handleToggleIssue = (i) => setSelectedIssues(p => ({ ...p, [i]: !p[i] }));

  const handleConfirmIssues = async () => {
    const toCreate = extractedIssues.filter((_, i) => selectedIssues[i]);
    if (!toCreate.length) { setError('Select at least one issue'); return; }
    setShowIssueConfirmation(false); setCreatingIssues(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/create-github-issues', { conversationId: `conv_data_${processedData.meetingId}`, issues: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      const sc = response.data.successCount || response.data.issues?.filter(i => i.success).length || 0;
      if (sc > 0) {
        const nums = response.data.issues?.filter(i => i.success && i.issueNumber)?.map(i => i.issueNumber) || [];
        setCreatedIssueNumbers(nums);
        alert(`Created ${sc} issue(s)!\n\n${response.data.issues?.map(i => i.url || i.title).join('\n')}`);
      } else { setError('No issues created. Check GitHub settings.'); }
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingIssues(false); }
  };

  const handleAssignIssues = async () => {
    const assignments = Object.entries(assignees).filter(([, v]) => v?.length).map(([n, u]) => ({ issueNumber: parseInt(n), assignees: u.split(',').map(s => s.trim()).filter(Boolean) }));
    if (!assignments.length) { setError('Assign at least one issue'); return; }
    setAssigningIssues(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/assign-issues', { issueAssignments: assignments }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Assigned ${response.data.successCount} issue(s)`); setShowAssignIssues(false); setAssignees({});
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setAssigningIssues(false); }
  };

  const handleExtractAndCreatePRs = async () => {
    if (!githubSettings?.validated) { setError('GitHub not configured.'); return; }
    if (user?.role !== 'technical' && user?.role !== 'organization') { setError('Only technical users can create pull requests'); return; }
    if (!processedData?.technical?.analysis) { setError('No technical analysis'); return; }
    try {
      setProcessingData(true);
      const prs = await extractGitHubPRs(processedData.technical.analysis);
      if (!prs?.length) { setError('No PRs found'); setProcessingData(false); return; }
      setExtractedPRs(prs); const sel = {}; prs.forEach((_, i) => { sel[i] = true; }); setSelectedPRs(sel); setShowPRConfirmation(true);
    } catch { setError('Failed to extract PRs'); } finally { setProcessingData(false); }
  };

  const handleTogglePR = (i) => setSelectedPRs(p => ({ ...p, [i]: !p[i] }));

  const handleConfirmPRs = async () => {
    const toCreate = extractedPRs.filter((_, i) => selectedPRs[i]);
    if (!toCreate.length) return;
    setCreatingPR(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/create-pull-requests', { pullRequests: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) {
        const err = response.data.pullRequests.find(p => !p.success)?.error || 'Unknown';
        alert(`Created ${response.data.successCount}, failed ${response.data.failureCount}. ${err}`);
      } else { alert(`Created ${response.data.successCount} PR(s)`); }
      setShowPRConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingPR(false); }
  };

  const handleExtractAndSendEmails = async () => {
    try {
      setProcessingData(true);
      const emails = await extractEmailsAPI(selectedDataIndex);
      if (!emails?.length) { setError('No email tasks found'); setProcessingData(false); return; }
      const valid = emails.map(e => { const c = contacts.find(ct => ct.name.toLowerCase() === e.name.toLowerCase()); return { ...e, emailAddress: c?.emailAddress || null, isValid: !!c }; });
      setExtractedEmails(valid);
      const sel = {}; valid.forEach((e, i) => { sel[i] = e.isValid; }); setSelectedEmails(sel); setShowEmailConfirmation(true);
    } catch { setError('Failed to extract emails'); } finally { setProcessingData(false); }
  };

  const handleToggleEmail = (i) => setSelectedEmails(p => ({ ...p, [i]: !p[i] }));

  const handleConfirmEmails = async () => {
    const toSend = extractedEmails.filter((_, i) => selectedEmails[i]);
    if (toSend.some(e => !e.isValid)) { setError('Some selected emails missing address. Update Contacts.'); return; }
    if (!toSend.length) return;
    setSendingEmails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/send-emails', { emailTasks: toSend }, { headers: { Authorization: `Bearer ${token}` } });
      const links = response.data.results.map(r => r.previewUrl).filter(Boolean).join('\n');
      alert(links ? `Sent ${response.data.successCount} email(s)!\n\n${links}` : `Sent ${response.data.successCount} email(s)!`);
      setShowEmailConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setSendingEmails(false); }
  };

  const handleExtractAndScheduleEvents = async () => {
    try {
      setProcessingData(true);
      const events = await extractEventsAPI(selectedDataIndex);
      if (!events?.length) { setError('No calendar events found'); setProcessingData(false); return; }
      setExtractedEvents(events);
      const sel = {}; events.forEach((_, i) => { sel[i] = true; }); setSelectedEvents(sel); setShowEventConfirmation(true);
    } catch { setError('Failed to extract events'); } finally { setProcessingData(false); }
  };

  const handleToggleEvent = (i) => setSelectedEvents(p => ({ ...p, [i]: !p[i] }));

  const handleConfirmEvents = async () => {
    const toSchedule = extractedEvents.filter((_, i) => selectedEvents[i]);
    if (!toSchedule.length) return;
    setSchedulingEvents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/create-calendar-events', { events: toSchedule }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) {
        alert(`Scheduled ${response.data.successCount}, failed ${response.data.failureCount}.`);
      } else { alert(response.data.note || `Scheduled ${response.data.successCount} event(s)!`); }
      setShowEventConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setSchedulingEvents(false); }
  };

  const handleExtractTrelloCards = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-trello-cards', { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setExtractedCards(response.data.cards);
      const sel = {}; response.data.cards.forEach((_, i) => { sel[i] = true; }); setSelectedCards(sel); setShowTrelloConfirmation(true);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setProcessingData(false); }
  };

  const handleToggleCard = (i) => setSelectedCards(p => ({ ...p, [i]: !p[i] }));

  const handleConfirmCards = async () => {
    const toCreate = extractedCards.filter((_, i) => selectedCards[i]);
    if (!toCreate.length) return;
    setCreatingCards(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/create-trello-cards', { cards: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) {
        alert(`Created ${response.data.successCount}, failed ${response.data.failureCount}.`);
      } else { alert(response.data.note || `Created ${response.data.successCount} card(s)!`); }
      setShowTrelloConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingCards(false); }
  };

  const handleExtractNotionSummary = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/extract-notion-summary', { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setExtractedSummary(response.data.summary); setShowNotionConfirmation(true);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setProcessingData(false); }
  };

  const handleConfirmNotionSummary = async () => {
    if (!extractedSummary) return;
    setCreatingNotionPage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agents/create-notion-page', { summary: extractedSummary, title: `Meeting Summary - ${new Date().toLocaleDateString()}` }, { headers: { Authorization: `Bearer ${token}` } });
      alert(response.data.pageUrl ? `Notion page created!\n\n${response.data.pageUrl}` : (response.data.note || 'Notion page created!'));
      setShowNotionConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingNotionPage(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // All users can process any meeting - role only affects what they see in results
  const allowedCategories = user?.role === 'organization' ? ['technical', 'non-technical'] : (user?.role === 'technical' ? ['technical'] : ['non-technical']);

  const formatAnalysis = (text) => text ? text.split('\n').filter(l => l.trim()) : [];

  const pipelineSteps = [
    { label: 'Loading', icon: '📄' },
    { label: 'Technical Agent', icon: '⚙️' },
    { label: 'Business Agent', icon: '📊' },
    { label: 'Complete', icon: '✓' },
  ];

  // Integration cards config
  const integrations = [
    {
      id: 'github-issues',
      title: 'GitHub Issues',
      description: 'Extract actionable tasks and create issues automatically.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      color: '#D97706',
      bgColor: '#FEF3C7',
      action: handleCreateGitHubIssues,
      show: githubSettings?.validated,
      badge: githubSettings ? `${githubSettings.owner}/${githubSettings.repo}` : '',
      category: 'technical',
    },
    {
      id: 'github-prs',
      title: 'Pull Requests',
      description: 'Extract PRs from analysis (test → main).',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
        </svg>
      ),
      color: '#D97706',
      bgColor: '#FEF3C7',
      action: handleExtractAndCreatePRs,
      show: githubSettings?.validated,
      category: 'technical',
    },
    {
      id: 'github-assign',
      title: 'Assign Issues',
      description: 'Assign created issues to team members.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: '#D97706',
      bgColor: '#FEF3C7',
      action: () => setShowAssignIssues(!showAssignIssues),
      show: githubSettings?.validated && createdIssueNumbers.length > 0,
      category: 'technical',
    },
    {
      id: 'emails',
      title: 'Send Emails',
      description: 'Extract email tasks and send updates to stakeholders.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      color: '#15803D',
      bgColor: '#E8F0EC',
      action: handleExtractAndSendEmails,
      show: true,
      category: 'business',
    },
    {
      id: 'calendar',
      title: 'Schedule Events',
      description: 'Extract meetings and milestones for Google Calendar.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: '#B45309',
      bgColor: '#FEF3C7',
      action: handleExtractAndScheduleEvents,
      show: true,
      category: 'business',
    },
    {
      id: 'trello',
      title: 'Trello Cards',
      description: 'Create task cards from non-technical action items.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 0H3C1.34 0 0 1.34 0 3v18c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zM10.44 18.18c0 .9-.73 1.63-1.63 1.63H5.55c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v12.36zm9.63-5.45c0 .9-.73 1.63-1.63 1.63h-3.26c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v6.91z"/>
        </svg>
      ),
      color: '#3D5249',
      bgColor: '#E8F0EC',
      action: handleExtractTrelloCards,
      show: true,
      category: 'business',
    },
    {
      id: 'notion',
      title: 'Notion Summary',
      description: 'Generate a formatted meeting summary page.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.15c-.42-.326-.98-.7-2.055-.607L3.01 2.71c-.467.046-.56.28-.374.466l1.823 1.033zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.046-.746.326-.746.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.573-7.186v6.953l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.46 9.76c-.093-.42.14-1.026.793-1.073l3.453-.233 4.76 7.28v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.22-.187z"/>
        </svg>
      ),
      color: '#0C1A15',
      bgColor: '#F0F4F2',
      action: handleExtractNotionSummary,
      show: true,
      category: 'business',
    },
  ];

  const techIntegrations = integrations.filter(i => i.category === 'technical' && i.show && (user?.role === 'organization' || user?.role === 'technical'));
  const bizIntegrations = integrations.filter(i => i.category === 'business' && i.show && (user?.role === 'organization' || user?.role === 'non-technical'));

  const selectedIssueCount = Object.values(selectedIssues).filter(Boolean).length;
  const selectedPRCount = Object.values(selectedPRs).filter(Boolean).length;
  const selectedEmailCount = Object.values(selectedEmails).filter(Boolean).length;
  const selectedEventCount = Object.values(selectedEvents).filter(Boolean).length;
  const selectedCardCount = Object.values(selectedCards).filter(Boolean).length;

  // Reusable modal component
  const ConfirmationModal = ({ show, onClose, title, subtitle, headerColor, children, footer }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-[#0C1A15]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#D4E0DA]" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className={`px-6 py-5 border-b border-[#D4E0DA]`} style={{ backgroundColor: headerColor + '08' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0C1A15]">{title}</h2>
                {subtitle && <p className="text-[#8FA89F] text-xs font-mono mt-1">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#D4E0DA]/50 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-[#7A9489]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {children}
          </div>
          <div className="px-6 py-4 border-t border-[#D4E0DA] bg-[#F7FAF8] flex items-center justify-between">
            {footer}
          </div>
        </div>
      </div>
    );
  };

  const CheckboxItem = ({ checked, onChange, disabled, accentColor, children }) => (
    <div
      onClick={!disabled ? onChange : undefined}
      className={`rounded-xl border p-4 cursor-pointer transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        checked
          ? 'border-opacity-30 bg-opacity-5 shadow-sm'
          : 'border-[#D4E0DA] bg-white hover:bg-[#F7FAF8]'
      }`}
      style={checked ? { borderColor: accentColor + '4D', backgroundColor: accentColor + '08' } : {}}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={checked ? { backgroundColor: accentColor, borderColor: accentColor } : { borderColor: '#D4E0DA' }}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );

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
              <h1 className="text-white text-lg font-semibold tracking-tight">Meeting.AI</h1>
              <p className="text-[#8FA89F] text-xs mt-0.5">{user?.name} <span className="font-bold text-[#B45309]">({user?.role})</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {githubSettings?.validated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15803D]/10 border border-[#15803D]/20 mr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#15803D]"/>
                <span className="text-[#15803D] text-xs font-medium">GitHub Connected</span>
              </div>
            )}
            {user?.role === 'organization' && (
              <button onClick={() => navigate('/settings')} className="text-[#8FA89F] hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </button>
            )}
            <button onClick={handleLogout} className="text-[#B91C1C]/70 hover:text-[#B91C1C] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#B91C1C]/5 transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-[#B91C1C]/5 border border-[#B91C1C]/15 rounded-xl px-5 py-4">
            <div className="w-5 h-5 rounded-full bg-[#B91C1C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-[#B91C1C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <p className="text-[#B91C1C] text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-[#B91C1C]/40 hover:text-[#B91C1C] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Process Section */}
        <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden mb-8">
          <div className="px-8 pt-8 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B45309]/10 to-[#F59E0B]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#B45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#0C1A15] tracking-tight">Process Meeting</h2>
            </div>
            <p className="text-[#7A9489] text-sm ml-11">Analyze transcripts with dual-perspective AI agents</p>
          </div>

          {availableData.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F7FAF8] border border-[#D4E0DA] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#8FA89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                </svg>
              </div>
              <p className="text-[#7A9489] text-sm">No meeting data available</p>
            </div>
          ) : (
            <div className="px-8 pb-8 pt-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <select value={selectedDataIndex} onChange={(e) => setSelectedDataIndex(parseInt(e.target.value))} disabled={processingData}
                    className="w-full px-4 py-3.5 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl text-[#0C1A15] text-sm font-medium focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]/40 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50">
                    {availableData.map((data, idx) => (
                      <option key={idx} value={idx}>{data.title} — {data.date}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-[#8FA89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <button onClick={handleProcessData} disabled={processingData}
                  className="bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/20 disabled:opacity-50 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm whitespace-nowrap">
                  {processingData ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      Processing...
                    </span>
                  ) : 'Process with AI'}
                </button>
              </div>

              {/* Pipeline */}
              {processingData && !showIssueConfirmation && !showPRConfirmation && !showEmailConfirmation && !showEventConfirmation && !showTrelloConfirmation && !showNotionConfirmation && (
                <div className="mt-6 bg-[#F7FAF8] rounded-xl border border-[#D4E0DA] p-5">
                  <div className="flex items-center justify-between">
                    {pipelineSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                            idx < processingStep ? 'bg-[#15803D] text-white' : idx === processingStep ? 'bg-[#D97706] text-white animate-pulse' : 'bg-[#D4E0DA] text-[#8FA89F]'
                          }`}>
                            {idx < processingStep ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : <span>{step.icon}</span>}
                          </div>
                          <span className={`text-[11px] mt-2 font-medium ${idx <= processingStep ? 'text-[#0C1A15]' : 'text-[#8FA89F]'}`}>{step.label}</span>
                        </div>
                        {idx < pipelineSteps.length - 1 && (
                          <div className="flex-1 mx-3 mt-[-20px]">
                            <div className="h-0.5 rounded-full bg-[#D4E0DA] overflow-hidden">
                              <div className="h-full bg-[#D97706] rounded-full transition-all duration-700" style={{ width: idx < processingStep ? '100%' : '0%' }}/>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {processedData && (
          <div className="space-y-6">
            {/* Meeting Header */}
            <div className="bg-white rounded-xl border border-[#D4E0DA] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#15803D]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#15803D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0C1A15] tracking-tight">{processedData.title}</h2>
                  <p className="text-[#8FA89F] text-xs font-mono mt-0.5">
                    {new Date(processedData.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setProcessedData(null)} className="text-[#8FA89F] hover:text-[#B91C1C] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#B91C1C]/5 transition-all">
                Clear
              </button>
            </div>

            {/* Analysis Tabs */}
            <div className="bg-white rounded-2xl border border-[#D4E0DA] overflow-hidden">
              <div className="flex border-b border-[#D4E0DA]">
                <button onClick={() => setActiveTab('technical')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'technical' ? 'text-[#B45309] bg-[#B45309]/[0.03]' : 'text-[#7A9489] hover:text-[#3D5249] hover:bg-[#F7FAF8]'}`}>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${activeTab === 'technical' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F7FAF8] text-[#8FA89F]'}`}>TECH</span>
                    Technical Analysis
                  </div>
                  {activeTab === 'technical' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706]"/>}
                </button>
                <button onClick={() => setActiveTab('nonTechnical')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'nonTechnical' ? 'text-[#3D5249] bg-[#3D5249]/[0.03]' : 'text-[#7A9489] hover:text-[#3D5249] hover:bg-[#F7FAF8]'}`}>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${activeTab === 'nonTechnical' ? 'bg-[#E8F0EC] text-[#3D5249]' : 'bg-[#F7FAF8] text-[#8FA89F]'}`}>BIZ</span>
                    Business Analysis
                  </div>
                  {activeTab === 'nonTechnical' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D5249]"/>}
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'technical' && processedData.technical?.analysis && (
                  <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#F0F4F2] border-b border-[#D4E0DA]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#D97706]"/>
                        <span className="text-[11px] font-mono text-[#8FA89F] uppercase tracking-wider">Technical Agent Output</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#8FA89F]">{formatAnalysis(processedData.technical.analysis).length} lines</span>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto">
                      <div className="p-5">
                        {formatAnalysis(processedData.technical.analysis).map((line, idx) => (
                          <div key={idx} className="flex gap-4 group hover:bg-[#D97706]/[0.03] -mx-2 px-2 rounded">
                            <span className="text-[#8FA89F] text-xs font-mono w-6 text-right flex-shrink-0 pt-1 select-none">{idx + 1}</span>
                            <p className="text-[#0C1A15] text-[13.5px] leading-relaxed font-mono py-0.5 flex-1">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'nonTechnical' && processedData.nonTechnical?.analysis && (
                  <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#F0F4F2] border-b border-[#D4E0DA]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3D5249]"/>
                        <span className="text-[11px] font-mono text-[#8FA89F] uppercase tracking-wider">Business Agent Output</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#8FA89F]">{formatAnalysis(processedData.nonTechnical.analysis).length} lines</span>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto">
                      <div className="p-5">
                        {formatAnalysis(processedData.nonTechnical.analysis).map((line, idx) => (
                          <div key={idx} className="flex gap-4 group hover:bg-[#3D5249]/[0.03] -mx-2 px-2 rounded">
                            <span className="text-[#8FA89F] text-xs font-mono w-6 text-right flex-shrink-0 pt-1 select-none">{idx + 1}</span>
                            <p className="text-[#3D5249] text-[13.5px] leading-relaxed py-0.5 flex-1">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Integrations Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <h3 className="text-sm font-semibold text-[#0C1A15] uppercase tracking-wider">Integrations Pipeline</h3>
                <div className="flex-1 h-px bg-[#D4E0DA]"/>
              </div>

              {/* Technical Integrations */}
              {techIntegrations.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                    <span className="bg-[#FEF3C7] px-2 py-0.5 rounded-md">TECH</span>
                    Developer Tools
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {techIntegrations.map((integration) => (
                      <button
                        key={integration.id}
                        onClick={integration.action}
                        disabled={processingData || creatingIssues}
                        className="group bg-white rounded-xl border border-[#D4E0DA] p-5 text-left hover:border-[#D97706]/30 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: integration.bgColor, color: integration.color }}>
                            {integration.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0C1A15] group-hover:text-[#D97706] transition-colors">{integration.title}</p>
                            <p className="text-[#7A9489] text-xs mt-1 leading-relaxed">{integration.description}</p>
                            {integration.badge && (
                              <p className="text-[10px] font-mono text-[#8FA89F] mt-2 bg-[#F7FAF8] px-2 py-0.5 rounded inline-block">{integration.badge}</p>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-[#D4E0DA] group-hover:text-[#D97706] transition-colors flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Issues Inline */}
              {showAssignIssues && createdIssueNumbers.length > 0 && (
                <div className="bg-white rounded-xl border-l-2 border-[#D97706] border-r border-t border-b border-r-[#D4E0DA] border-t-[#D4E0DA] border-b-[#D4E0DA] p-6">
                  <h4 className="text-sm font-semibold text-[#0C1A15] mb-4">Assign Issues to Team Members</h4>
                  <div className="space-y-3">
                    {createdIssueNumbers.map(num => (
                      <div key={num} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#8FA89F] bg-[#F7FAF8] px-2 py-1 rounded border border-[#D4E0DA] w-16 text-center">#{num}</span>
                        <input
                          type="text" placeholder="GitHub usernames (comma separated)"
                          value={assignees[num] || ''} onChange={(e) => setAssignees({ ...assignees, [num]: e.target.value })}
                          className="flex-1 px-3 py-2 bg-[#F7FAF8] border border-[#D4E0DA] rounded-lg text-sm text-[#0C1A15] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]/40 outline-none"
                        />
                      </div>
                    ))}
                    <button onClick={handleAssignIssues} disabled={assigningIssues}
                      className="bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-white font-semibold py-2.5 px-6 rounded-lg text-sm disabled:opacity-40 transition-all">
                      {assigningIssues ? 'Assigning...' : 'Confirm Assignments'}
                    </button>
                  </div>
                </div>
              )}

              {/* GitHub Not Configured */}
              {!githubSettings?.validated && (
                <div className="bg-white rounded-xl border border-[#D4E0DA] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0C1A15]">GitHub not configured</p>
                      <p className="text-[#7A9489] text-xs">Connect your repository for issues, PRs, and assignments.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/settings')} className="text-[#D97706] hover:text-[#B45309] text-sm font-semibold transition-colors">
                    Configure →
                  </button>
                </div>
              )}

              {/* Business Integrations */}
              {bizIntegrations.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#3D5249] uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                    <span className="bg-[#E8F0EC] px-2 py-0.5 rounded-md">BIZ</span>
                    Business Tools
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {bizIntegrations.map((integration) => (
                      <button
                        key={integration.id}
                        onClick={integration.action}
                        disabled={processingData}
                        className="group bg-white rounded-xl border border-[#D4E0DA] p-5 text-left hover:border-[#3D5249]/30 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: integration.bgColor, color: integration.color }}>
                            {integration.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0C1A15] group-hover:text-[#3D5249] transition-colors">{integration.title}</p>
                            <p className="text-[#7A9489] text-xs mt-1 leading-relaxed">{integration.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!processedData && !processingData && availableData.length > 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#F7FAF8] border border-[#D4E0DA] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#8FA89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className="text-[#3D5249] font-medium mb-1">Ready to analyze</h3>
            <p className="text-[#8FA89F] text-sm">Select a meeting above and click Process to begin</p>
          </div>
        )}
      </main>

      {/* ===== MODALS ===== */}

      {/* GitHub Issues Modal */}
      <ConfirmationModal
        show={showIssueConfirmation}
        onClose={() => setShowIssueConfirmation(false)}
        title="Confirm GitHub Issues"
        subtitle={`${githubSettings?.owner}/${githubSettings?.repo}`}
        headerColor="#D97706"
        footer={
          <>
            <p className="text-[#7A9489] text-xs font-medium"><span className="text-[#0C1A15] font-semibold">{selectedIssueCount}</span> of {extractedIssues.length} selected</p>
            <div className="flex gap-2">
              <button onClick={() => setShowIssueConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmIssues} disabled={creatingIssues || selectedIssueCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {creatingIssues ? 'Creating...' : `Create ${selectedIssueCount} Issue${selectedIssueCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4 space-y-2">
          {extractedIssues.map((issue, index) => (
            <CheckboxItem key={index} checked={selectedIssues[index] || false} onChange={() => handleToggleIssue(index)} accentColor="#D97706">
              <p className="font-medium text-[#0C1A15] text-sm">{issue.title}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed line-clamp-2">{issue.description}</p>
              {issue.labels?.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {issue.labels.map((label, idx) => (
                    <span key={idx} className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-medium px-2 py-0.5 rounded-md border border-[#D97706]/10">{label}</span>
                  ))}
                </div>
              )}
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* PR Modal */}
      <ConfirmationModal
        show={showPRConfirmation}
        onClose={() => setShowPRConfirmation(false)}
        title="Confirm Pull Requests"
        subtitle={`${githubSettings?.owner}/${githubSettings?.repo}`}
        headerColor="#D97706"
        footer={
          <>
            <p className="text-[#7A9489] text-xs font-medium"><span className="text-[#0C1A15] font-semibold">{selectedPRCount}</span> of {extractedPRs.length} selected</p>
            <div className="flex gap-2">
              <button onClick={() => setShowPRConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmPRs} disabled={creatingPR || selectedPRCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {creatingPR ? 'Creating...' : `Create ${selectedPRCount} PR${selectedPRCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4 space-y-2">
          {extractedPRs.map((pr, index) => (
            <CheckboxItem key={index} checked={selectedPRs[index] || false} onChange={() => handleTogglePR(index)} accentColor="#D97706">
              <p className="font-medium text-[#0C1A15] text-sm">{pr.title}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed line-clamp-2">{pr.description}</p>
              <p className="text-[#8FA89F] text-[10px] font-mono mt-2 bg-[#F7FAF8] px-2 py-0.5 rounded inline-block border border-[#D4E0DA]">{pr.head} → {pr.base}</p>
              {pr.labels?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pr.labels.map((label, idx) => (
                    <span key={idx} className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-medium px-2 py-0.5 rounded-md border border-[#D97706]/10">{label}</span>
                  ))}
                </div>
              )}
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* Email Modal */}
      <ConfirmationModal
        show={showEmailConfirmation}
        onClose={() => setShowEmailConfirmation(false)}
        title="Confirm Outbound Emails"
        subtitle="Review emails before sending"
        headerColor="#15803D"
        footer={
          <>
            <p className="text-[#7A9489] text-xs font-medium"><span className="text-[#0C1A15] font-semibold">{selectedEmailCount}</span> of {extractedEmails.filter(e => e.isValid).length} valid emails selected</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEmailConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmEmails} disabled={sendingEmails || selectedEmailCount === 0}
                className="px-5 py-2.5 bg-[#15803D] hover:bg-[#166534] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {sendingEmails ? 'Sending...' : `Send ${selectedEmailCount} Email${selectedEmailCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4 space-y-2">
          {extractedEmails.map((email, index) => (
            <CheckboxItem key={index} checked={selectedEmails[index] || false} onChange={() => handleToggleEmail(index)} disabled={!email.isValid} accentColor="#15803D">
              <div className="flex justify-between items-start">
                <p className="font-medium text-[#0C1A15] text-sm">To: {email.name}</p>
                {email.isValid ? (
                  <span className="text-[10px] font-mono bg-[#E8F0EC] text-[#15803D] px-2 py-0.5 rounded-md border border-[#15803D]/10">{email.emailAddress}</span>
                ) : (
                  <span className="text-[10px] font-bold bg-[#B91C1C]/10 text-[#B91C1C] px-2 py-0.5 rounded-md">Missing in Settings</span>
                )}
              </div>
              <p className="font-medium text-[#3D5249] text-xs mt-2">Subject: {email.subject}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 border-l-2 border-[#D4E0DA] pl-3 italic leading-relaxed">"{email.context}"</p>
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* Calendar Modal */}
      <ConfirmationModal
        show={showEventConfirmation}
        onClose={() => setShowEventConfirmation(false)}
        title="Confirm Calendar Events"
        subtitle="Schedule meetings, holidays, and milestones"
        headerColor="#B45309"
        footer={
          <>
            <p className="text-[#7A9489] text-xs font-medium"><span className="text-[#0C1A15] font-semibold">{selectedEventCount}</span> of {extractedEvents.length} selected</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEventConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmEvents} disabled={schedulingEvents || selectedEventCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {schedulingEvents ? 'Scheduling...' : `Schedule ${selectedEventCount} Event${selectedEventCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4 space-y-2">
          {extractedEvents.map((event, index) => (
            <CheckboxItem key={index} checked={selectedEvents[index] || false} onChange={() => handleToggleEvent(index)} accentColor="#B45309">
              <div className="flex justify-between items-start">
                <p className="font-medium text-[#0C1A15] text-sm">{event.summary}</p>
                <span className="text-[10px] font-mono bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded-md border border-[#B45309]/10 whitespace-nowrap">
                  {event.date} {event.isAllDay ? '(All Day)' : event.startTime ? `@ ${event.startTime}` : ''}
                </span>
              </div>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed">{event.description}</p>
              {event.attendees?.length > 0 && (
                <p className="text-[#8FA89F] text-xs mt-2 border-l-2 border-[#D4E0DA] pl-3">Attendees: {event.attendees.join(', ')}</p>
              )}
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* Trello Modal */}
      <ConfirmationModal
        show={showTrelloConfirmation}
        onClose={() => setShowTrelloConfirmation(false)}
        title="Confirm Trello Cards"
        subtitle="Review tasks before creating cards"
        headerColor="#3D5249"
        footer={
          <>
            <p className="text-[#7A9489] text-xs font-medium"><span className="text-[#0C1A15] font-semibold">{selectedCardCount}</span> of {extractedCards.length} selected</p>
            <div className="flex gap-2">
              <button onClick={() => setShowTrelloConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmCards} disabled={creatingCards || selectedCardCount === 0}
                className="px-5 py-2.5 bg-[#3D5249] hover:bg-[#0C1A15] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {creatingCards ? 'Creating...' : `Create ${selectedCardCount} Card${selectedCardCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4 space-y-2">
          {extractedCards.map((card, index) => (
            <CheckboxItem key={index} checked={selectedCards[index] || false} onChange={() => handleToggleCard(index)} accentColor="#3D5249">
              <p className="font-medium text-[#0C1A15] text-sm">{card.name}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed whitespace-pre-wrap line-clamp-3">{card.desc}</p>
            </CheckboxItem>
          ))}
          {extractedCards.length === 0 && (
            <p className="text-[#8FA89F] text-sm text-center py-8 italic">No tasks found suitable for Trello.</p>
          )}
        </div>
      </ConfirmationModal>

      {/* Notion Modal */}
      <ConfirmationModal
        show={showNotionConfirmation}
        onClose={() => setShowNotionConfirmation(false)}
        title="Review Notion Summary"
        subtitle="This will be pushed as a new page in your Notion Database"
        headerColor="#0C1A15"
        footer={
          <>
            <div/>
            <div className="flex gap-2">
              <button onClick={() => setShowNotionConfirmation(false)} className="px-5 py-2.5 border border-[#D4E0DA] rounded-lg text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all">Cancel</button>
              <button onClick={handleConfirmNotionSummary} disabled={creatingNotionPage || !extractedSummary}
                className="px-5 py-2.5 bg-[#0C1A15] hover:bg-[#1A2E26] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all">
                {creatingNotionPage ? 'Pushing...' : 'Push to Notion'}
              </button>
            </div>
          </>
        }
      >
        <div className="p-4">
          <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#F0F4F2] border-b border-[#D4E0DA]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0C1A15]"/>
                <span className="text-[11px] font-mono text-[#8FA89F] uppercase tracking-wider">Markdown Preview</span>
              </div>
            </div>
            <div className="p-5 max-h-[400px] overflow-y-auto">
              <pre className="text-[#0C1A15] text-[13px] leading-relaxed font-mono whitespace-pre-wrap">{extractedSummary || 'No summary generated.'}</pre>
            </div>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default Dashboard;