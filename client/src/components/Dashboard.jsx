import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { BarChart3, Check, CheckSquare, Cog, FileText, MinusSquare, Square, ChevronRight, Zap, ArrowRight, X, AlertTriangle, ExternalLink } from 'lucide-react';
import actifyLogo from '../assets/actify-logo.svg';
import { Loader } from './ui/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ═══════════════════════════════════════════════════
   COMPONENTS OUTSIDE DASHBOARD
   ═══════════════════════════════════════════════════ */

/* ───── Markdown Renderer ───── */
const MarkdownRenderer = ({ content, accentColor = '#D97706' }) => {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  const parseInline = (text) => {
    if (!text) return [text];
    const parts = [];
    let remaining = text;
    let pk = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      let firstMatch = null;
      let firstIndex = Infinity;

      [
        boldMatch && { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) },
        italicMatch && { type: 'italic', match: italicMatch, index: remaining.indexOf(italicMatch[0]) },
        codeMatch && { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) },
        linkMatch && { type: 'link', match: linkMatch, index: remaining.indexOf(linkMatch[0]) },
      ].filter(Boolean).forEach(m => {
        if (m.index < firstIndex) { firstMatch = m; firstIndex = m.index; }
      });

      if (!firstMatch) { parts.push(<span key={pk++}>{remaining}</span>); break; }
      if (firstIndex > 0) parts.push(<span key={pk++}>{remaining.slice(0, firstIndex)}</span>);

      switch (firstMatch.type) {
        case 'bold':
          parts.push(<strong key={pk++} className="font-semibold text-[#0C1A15]">{firstMatch.match[1]}</strong>);
          break;
        case 'italic':
          parts.push(<em key={pk++} className="italic text-[#3D5249]">{firstMatch.match[1]}</em>);
          break;
        case 'code':
          parts.push(
            <code key={pk++} className="bg-[#F0F4F2] text-[#B45309] px-1.5 py-0.5 rounded text-[12px] border border-[#D4E0DA]/50" style={{ fontFamily: 'var(--font-mono)' }}>
              {firstMatch.match[1]}
            </code>
          );
          break;
        case 'link':
          parts.push(
            <a key={pk++} href={firstMatch.match[2]} target="_blank" rel="noopener noreferrer"
              className="text-[#B45309] underline underline-offset-2 hover:text-[#D97706] transition-colors duration-200">
              {firstMatch.match[1]}
            </a>
          );
          break;
      }
      remaining = remaining.slice(firstIndex + firstMatch.match[0].length);
    }
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { i++; continue; }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      elements.push(
        <div key={key++} className="my-4 rounded-xl overflow-hidden border border-[#D4E0DA] shadow-sm">
          {lang && (
            <div className="px-4 py-2 bg-[#F0F4F2] border-b border-[#D4E0DA] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8FA89F]" style={{ fontFamily: 'var(--font-mono)' }}>{lang}</span>
            </div>
          )}
          <pre className="bg-[#0C1A15] p-4 overflow-x-auto">
            <code className="text-[13px] text-[#E8F0EC] leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={key++} className="my-6 border-[#D4E0DA]/60" />);
      i++; continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#{1,6})\s/)[1].length;
      const text = trimmed.replace(/^#{1,6}\s+/, '');
      const styles = {
        1: 'text-xl font-bold text-[#0C1A15] mt-7 mb-3 pb-2.5 border-b border-[#D4E0DA]',
        2: 'text-lg font-semibold text-[#0C1A15] mt-6 mb-2.5 pb-2 border-b border-[#D4E0DA]/50',
        3: 'text-[15px] font-semibold text-[#0C1A15] mt-5 mb-2',
        4: 'text-[14px] font-semibold text-[#3D5249] mt-4 mb-1.5',
        5: 'text-[13px] font-semibold text-[#3D5249] mt-3 mb-1',
        6: 'text-[12px] font-semibold text-[#7A9489] mt-3 mb-1 uppercase tracking-wider',
      };
      const Tag = `h${level}`;
      elements.push(
        <Tag key={key++} className={styles[level]} style={{ fontFamily: level <= 2 ? 'var(--font-syne)' : 'var(--font-sans)' }}>
          {level <= 3 && <span className="inline-block w-1 h-4 rounded-full mr-2.5 align-middle" style={{ backgroundColor: accentColor }} />}
          {parseInline(text)}
        </Tag>
      );
      i++; continue;
    }

    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const checked = /\[[xX]\]/.test(trimmed);
      const text = trimmed.replace(/^\s*[-*]\s+\[[ xX]\]\s+/, '');
      elements.push(
        <div key={key++} className="flex items-start gap-2.5 py-1.5 pl-1">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-200 ${checked ? 'border-[#15803D] bg-[#15803D]' : 'border-[#D4E0DA]'}`}>
            {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </div>
          <span className={`text-[13px] leading-relaxed ${checked ? 'text-[#8FA89F] line-through' : 'text-[#3D5249]'}`}>
            {parseInline(text)}
          </span>
        </div>
      );
      i++; continue;
    }

    if (/^[-*•]\s/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*•]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-2.5 space-y-2 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[#3D5249] leading-relaxed">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+[.)]\s/, ''));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-2.5 space-y-2 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[#3D5249] leading-relaxed">
              <span className="text-[11px] font-bold mt-0.5 w-5 text-right flex-shrink-0" style={{ color: accentColor, fontFamily: 'var(--font-mono)' }}>{idx + 1}.</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={key++} className="my-4 border-l-[3px] pl-4 py-2.5 bg-[#F7FAF8] rounded-r-xl" style={{ borderColor: accentColor + '50' }}>
          {quoteLines.map((ql, idx) => (
            <p key={idx} className="text-[13px] text-[#7A9489] italic leading-relaxed">{parseInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row) => row.split('|').filter(Boolean).map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        const isSep = (r) => /^\|[\s\-:|]+\|$/.test(r);
        const bodyStart = isSep(tableLines[1]) ? 2 : 1;
        const bodyRows = tableLines.slice(bodyStart).map(parseRow);

        elements.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-xl border border-[#D4E0DA] shadow-sm">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#F0F4F2]">
                  {headers.map((h, hi) => (
                    <th key={hi} className="text-left px-4 py-3 text-[#0C1A15] font-semibold border-b border-[#D4E0DA] text-[11px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-sans)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className={`transition-colors duration-150 hover:bg-[#F0F4F2]/50 ${ri % 2 === 0 ? 'bg-white' : 'bg-[#F7FAF8]'}`}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-[#3D5249] border-b border-[#D4E0DA]/30">{parseInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    elements.push(
      <p key={key++} className="text-[13px] text-[#3D5249] leading-relaxed my-2">{parseInline(trimmed)}</p>
    );
    i++;
  }

  return <div className="markdown-content">{elements}</div>;
};

/* ───── Confirmation Modal ───── */
const ConfirmationModal = ({ show, onClose, title, subtitle, headerColor, children, footer }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-[#0C1A15]/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#D4E0DA]/60 flex flex-col transform transition-all duration-300 ease-out scale-100"
        style={{ maxHeight: 'calc(100vh - 80px)', boxShadow: '0 25px 60px -12px rgba(12, 26, 21, 0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#D4E0DA]/60 flex-shrink-0" style={{ backgroundColor: headerColor + '06' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full transition-colors duration-300" style={{ backgroundColor: headerColor }} />
              <div>
                <h2 className="text-lg font-semibold text-[#0C1A15]" style={{ fontFamily: 'var(--font-syne)' }}>{title}</h2>
                {subtitle && <p className="text-[#8FA89F] text-xs mt-1" style={{ fontFamily: 'var(--font-mono)' }}>{subtitle}</p>}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-[#D4E0DA]/40 flex items-center justify-center transition-all duration-200 group hover:rotate-90">
              <X className="w-4 h-4 text-[#7A9489] group-hover:text-[#3D5249] transition-colors duration-200" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
        <div className="px-6 py-4 border-t border-[#D4E0DA]/60 bg-[#F7FAF8] flex items-center justify-between flex-shrink-0">{footer}</div>
      </div>
    </div>
  );
};

/* ───── Checkbox Item ───── */
const CheckboxItem = ({ checked, onChange, disabled, accentColor, children }) => (
  <div
    onClick={!disabled ? onChange : undefined}
    className={`rounded-xl border p-4 transition-all duration-200 ease-out ${disabled ? 'opacity-35 cursor-not-allowed grayscale' : 'cursor-pointer active:scale-[0.99]'} ${
      checked
        ? 'shadow-sm hover:shadow-md'
        : 'border-[#D4E0DA] bg-white hover:bg-[#F7FAF8] hover:border-[#8FA89F]/30 hover:shadow-sm'
    }`}
    style={checked ? {
      borderColor: accentColor + '25',
      backgroundColor: accentColor + '04',
      borderLeftWidth: '3px',
      borderLeftColor: accentColor,
    } : {}}
  >
    <div className="flex items-start gap-3">
      <div
        className="w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
        style={checked
          ? { backgroundColor: accentColor, borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}15` }
          : { borderColor: '#D4E0DA' }
        }
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  </div>
);

/* ───── Select All Bar ───── */
const SelectAllBar = ({ totalCount, selectedCount, onSelectAll, onDeselectAll, accentColor, disabledCount = 0 }) => {
  const selectableCount = totalCount - disabledCount;
  const allSelected = selectableCount > 0 && selectedCount >= selectableCount;
  const someSelected = selectedCount > 0 && selectedCount < selectableCount;

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-[#D4E0DA]/50 px-5 py-3 flex items-center justify-between">
      <button onClick={allSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-2.5 text-sm font-medium transition-all duration-200 hover:opacity-70 active:scale-95"
        style={{ color: accentColor }}>
        {allSelected
          ? <CheckSquare className="w-[18px] h-[18px]" />
          : someSelected
            ? <MinusSquare className="w-[18px] h-[18px]" />
            : <Square className="w-[18px] h-[18px] text-[#D4E0DA]" />
        }
        <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
      </button>
      <span className="text-xs text-[#8FA89F]" style={{ fontFamily: 'var(--font-mono)' }}>
        <span className="font-semibold text-[#0C1A15]">{selectedCount}</span>
        <span className="mx-1">/</span>
        <span>{selectableCount}</span>
      </span>
    </div>
  );
};


/* ═══════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════ */
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
  const [viewMode, setViewMode] = useState('formatted');

  useEffect(() => {
    if (user) {
      console.log('User loaded, fetching data:', user);
      fetchAvailableData();
      fetchGitHubSettings();
      if (user?.role === 'non-technical') setActiveTab('nonTechnical');
      else setActiveTab('technical');
    }
  }, [user]);

  useEffect(() => {
    if (processingData && !showIssueConfirmation && !showPRConfirmation && !showEmailConfirmation && !showEventConfirmation && !showTrelloConfirmation && !showNotionConfirmation) {
      const interval = setInterval(() => setProcessingStep(p => (p < 3 ? p + 1 : p)), 1500);
      return () => clearInterval(interval);
    } else if (!processingData) setProcessingStep(0);
  }, [processingData, showIssueConfirmation, showPRConfirmation, showEmailConfirmation, showEventConfirmation, showTrelloConfirmation, showNotionConfirmation]);

  const fetchAvailableData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching available data with token:', token ? 'present' : 'missing');
      const response = await axios.get(`${API_URL}/agents/available-data`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Available data response:', response.data);
      setAvailableData(response.data.meetings || []);
      setError('');
    } catch (error) {
      console.error('Failed to load available data:', error);
      setError('Failed to load available data: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchGitHubSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const gh = response.data.settings?.github;
      setGithubSettings(gh || null);
      if (response.data.settings?.contacts) setContacts(response.data.settings.contacts);
    } catch (err) {
      console.error('Failed to load Settings:', err);
      setGithubSettings(null);
    }
  };

  const isGithubConfigured = useMemo(() => {
    if (!githubSettings) return false;
    return !!(githubSettings.validated || (githubSettings.owner && githubSettings.repo && githubSettings.token));
  }, [githubSettings]);

  const handleProcessData = async () => {
    try {
      setProcessingData(true); setError('');
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/process-data`, { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setProcessedData(response.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to process data'); } finally { setProcessingData(false); }
  };

  const extractGitHubIssues = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-github-issues`, { analysisText }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.issues?.length > 0 ? response.data.issues : null;
    } catch { return null; }
  };

  const extractGitHubPRs = async (analysisText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-github-pull-requests`, { analysisText }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.pullRequests?.length > 0 ? response.data.pullRequests : null;
    } catch { return null; }
  };

  const extractEmailsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-emails`, { dataIndex: idx }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.emails?.length > 0 ? response.data.emails : null;
    } catch { return null; }
  };

  const extractEventsAPI = async (idx) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-events`, { dataIndex: idx }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.events?.length > 0 ? response.data.events : null;
    } catch { return null; }
  };

  const makeSelectAll = useCallback((items, setter, filterFn = () => true) => {
    const sel = {};
    items.forEach((item, i) => { sel[i] = filterFn(item); });
    setter(sel);
  }, []);

  const makeDeselectAll = useCallback((items, setter) => {
    const sel = {};
    items.forEach((_, i) => { sel[i] = false; });
    setter(sel);
  }, []);

  const handleCreateGitHubIssues = async () => {
    if (!isGithubConfigured) { setError('GitHub is not configured. Please go to Settings.'); return; }
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

  const handleToggleIssue = useCallback((i) => setSelectedIssues(p => ({ ...p, [i]: !p[i] })), []);

  const handleConfirmIssues = async () => {
    const toCreate = extractedIssues.filter((_, i) => selectedIssues[i]);
    if (!toCreate.length) { setError('Select at least one issue'); return; }
    setShowIssueConfirmation(false); setCreatingIssues(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/create-github-issues`, { conversationId: `conv_data_${processedData.meetingId}`, issues: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      const sc = response.data.successCount || response.data.issues?.filter(i => i.success).length || 0;
      if (sc > 0) {
        const nums = response.data.issues?.filter(i => i.success && i.issueNumber)?.map(i => i.issueNumber) || [];
        setCreatedIssueNumbers(nums);
        alert(`Created ${sc} issue(s)!\n\n${response.data.issues?.map(i => i.url || i.title).join('\n')}`);
      } else setError('No issues created. Check GitHub settings.');
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingIssues(false); }
  };

  const handleAssignIssues = async () => {
    const assignments = Object.entries(assignees).filter(([, v]) => v?.length).map(([n, u]) => ({ issueNumber: parseInt(n), assignees: u.split(',').map(s => s.trim()).filter(Boolean) }));
    if (!assignments.length) { setError('Assign at least one issue'); return; }
    setAssigningIssues(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/assign-issues`, { issueAssignments: assignments }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Assigned ${response.data.successCount} issue(s)`); setShowAssignIssues(false); setAssignees({});
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setAssigningIssues(false); }
  };

  const handleExtractAndCreatePRs = async () => {
    if (!isGithubConfigured) { setError('GitHub not configured.'); return; }
    if (user?.role !== 'technical' && user?.role !== 'organization') { setError('Only technical users can create pull requests'); return; }
    if (!processedData?.technical?.analysis) { setError('No technical analysis'); return; }
    try {
      setProcessingData(true);
      const prs = await extractGitHubPRs(processedData.technical.analysis);
      if (!prs?.length) { setError('No PRs found'); setProcessingData(false); return; }
      setExtractedPRs(prs); const sel = {}; prs.forEach((_, i) => { sel[i] = true; }); setSelectedPRs(sel); setShowPRConfirmation(true);
    } catch { setError('Failed to extract PRs'); } finally { setProcessingData(false); }
  };

  const handleTogglePR = useCallback((i) => setSelectedPRs(p => ({ ...p, [i]: !p[i] })), []);

  const handleConfirmPRs = async () => {
    const toCreate = extractedPRs.filter((_, i) => selectedPRs[i]);
    if (!toCreate.length) return;
    setCreatingPR(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/create-pull-requests`, { pullRequests: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) {
        const err = response.data.pullRequests.find(p => !p.success)?.error || 'Unknown';
        alert(`Created ${response.data.successCount}, failed ${response.data.failureCount}. ${err}`);
      } else alert(`Created ${response.data.successCount} PR(s)`);
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

  const handleToggleEmail = useCallback((i) => setSelectedEmails(p => ({ ...p, [i]: !p[i] })), []);

  const handleConfirmEmails = async () => {
    const toSend = extractedEmails.filter((_, i) => selectedEmails[i]);
    if (toSend.some(e => !e.isValid)) { setError('Some selected emails missing address. Update Contacts.'); return; }
    if (!toSend.length) return;
    setSendingEmails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/send-emails`, { emailTasks: toSend }, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleToggleEvent = useCallback((i) => setSelectedEvents(p => ({ ...p, [i]: !p[i] })), []);

  const handleConfirmEvents = async () => {
    const toSchedule = extractedEvents.filter((_, i) => selectedEvents[i]);
    if (!toSchedule.length) return;
    setSchedulingEvents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/create-calendar-events`, { events: toSchedule }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) alert(`Scheduled ${response.data.successCount}, failed ${response.data.failureCount}.`);
      else alert(response.data.note || `Scheduled ${response.data.successCount} event(s)!`);
      setShowEventConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setSchedulingEvents(false); }
  };

  const handleExtractTrelloCards = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-trello-cards`, { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setExtractedCards(response.data.cards);
      const sel = {}; response.data.cards.forEach((_, i) => { sel[i] = true; }); setSelectedCards(sel); setShowTrelloConfirmation(true);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setProcessingData(false); }
  };

  const handleToggleCard = useCallback((i) => setSelectedCards(p => ({ ...p, [i]: !p[i] })), []);

  const handleConfirmCards = async () => {
    const toCreate = extractedCards.filter((_, i) => selectedCards[i]);
    if (!toCreate.length) return;
    setCreatingCards(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/create-trello-cards`, { cards: toCreate }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.failureCount > 0) alert(`Created ${response.data.successCount}, failed ${response.data.failureCount}.`);
      else alert(response.data.note || `Created ${response.data.successCount} card(s)!`);
      setShowTrelloConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingCards(false); }
  };

  const handleExtractNotionSummary = async () => {
    try {
      setProcessingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/extract-notion-summary`, { dataIndex: selectedDataIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setExtractedSummary(response.data.summary || '');
      setShowNotionConfirmation(true);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setProcessingData(false); }
  };

  const handleConfirmNotionSummary = async () => {
    if (!extractedSummary) return;
    setCreatingNotionPage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/agents/create-notion-page`, { summary: extractedSummary, title: `Meeting Summary - ${new Date().toLocaleDateString()}` }, { headers: { Authorization: `Bearer ${token}` } });
      alert(response.data.pageUrl ? `Notion page created!\n\n${response.data.pageUrl}` : (response.data.note || 'Notion page created!'));
      setShowNotionConfirmation(false);
    } catch (err) { setError(`Failed: ${err.response?.data?.error || err.message}`); } finally { setCreatingNotionPage(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const cleanedSummary = useMemo(() => {
    const raw = (extractedSummary || '').replace(/\r\n/g, '\n').trim();
    if (!raw) return '';
    return raw.replace(/^```(?:md|markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }, [extractedSummary]);

  const formatAnalysis = (text) => text ? text.split('\n') : [];

  const pipelineSteps = [
    { label: 'Loading', Icon: FileText },
    { label: 'Technical Agent', Icon: Cog },
    { label: 'Business Agent', Icon: BarChart3 },
    { label: 'Complete', Icon: Check },
  ];

  const integrations = [
    { id: 'github-issues', title: 'GitHub Issues', description: 'Extract actionable tasks and create issues automatically.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
      color: '#D97706', bgColor: '#FEF3C7', action: handleCreateGitHubIssues, show: isGithubConfigured,
      badge: githubSettings ? `${githubSettings.owner}/${githubSettings.repo}` : '', category: 'technical' },
    { id: 'github-prs', title: 'Pull Requests', description: 'Extract PRs from analysis (test → main).',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>,
      color: '#D97706', bgColor: '#FEF3C7', action: handleExtractAndCreatePRs, show: isGithubConfigured, category: 'technical' },
    { id: 'github-assign', title: 'Assign Issues', description: 'Assign created issues to team members.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      color: '#D97706', bgColor: '#FEF3C7', action: () => setShowAssignIssues(!showAssignIssues),
      show: isGithubConfigured && createdIssueNumbers.length > 0, category: 'technical' },
    { id: 'emails', title: 'Send Emails', description: 'Extract email tasks and send updates.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      color: '#15803D', bgColor: '#E8F0EC', action: handleExtractAndSendEmails, show: true, category: 'business' },
    { id: 'calendar', title: 'Schedule Events', description: 'Extract meetings and milestones for Google Calendar.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      color: '#B45309', bgColor: '#FEF3C7', action: handleExtractAndScheduleEvents, show: true, category: 'business' },
    { id: 'trello', title: 'Trello Cards', description: 'Create task cards from action items.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 0H3C1.34 0 0 1.34 0 3v18c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zM10.44 18.18c0 .9-.73 1.63-1.63 1.63H5.55c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v12.36zm9.63-5.45c0 .9-.73 1.63-1.63 1.63h-3.26c-.9 0-1.63-.73-1.63-1.63V5.82c0-.9.73-1.63 1.63-1.63h3.26c.9 0 1.63.73 1.63 1.63v6.91z"/></svg>,
      color: '#3D5249', bgColor: '#E8F0EC', action: handleExtractTrelloCards, show: true, category: 'business' },
    { id: 'notion', title: 'Notion Summary', description: 'Generate a formatted meeting summary page.',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.15c-.42-.326-.98-.7-2.055-.607L3.01 2.71c-.467.046-.56.28-.374.466l1.823 1.033zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.046-.746.326-.746.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.573-7.186v6.953l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.46 9.76c-.093-.42.14-1.026.793-1.073l3.453-.233 4.76 7.28v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.22-.187z"/></svg>,
      color: '#0C1A15', bgColor: '#F0F4F2', action: handleExtractNotionSummary, show: true, category: 'business' },
  ];

  const techIntegrations = integrations.filter(i => i.category === 'technical' && i.show && (user?.role === 'organization' || user?.role === 'technical'));
  const bizIntegrations = integrations.filter(i => i.category === 'business' && i.show && (user?.role === 'organization' || user?.role === 'non-technical'));

  const selectedIssueCount = Object.values(selectedIssues).filter(Boolean).length;
  const selectedPRCount = Object.values(selectedPRs).filter(Boolean).length;
  const selectedEmailCount = Object.values(selectedEmails).filter(Boolean).length;
  const selectedEventCount = Object.values(selectedEvents).filter(Boolean).length;
  const selectedCardCount = Object.values(selectedCards).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F0F4F2]" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ═══ Header ═══ */}
      <header className="bg-[#0C1A15] sticky top-0 z-30 border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <img src={actifyLogo} alt="ACTIFY" className="w-9 h-9 rounded-xl shadow-lg shadow-black/20" />
            <div>
              <h1 className="text-white text-[17px] tracking-wider leading-none" style={{ fontFamily: 'var(--font-brand)' }}>ACTIFY</h1>
              <p className="text-[#8FA89F] text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {user?.name}
                <span className="ml-1.5 text-[#B45309] font-semibold">· {user?.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isGithubConfigured && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15803D]/10 border border-[#15803D]/15 mr-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse" />
                <span className="text-[#15803D] text-[11px] font-medium">GitHub</span>
              </div>
            )}

            <button onClick={() => navigate('/recordings')}
              className="text-[#8FA89F] hover:text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              Recordings
            </button>

            {user?.role === 'organization' && (
              <button onClick={() => navigate('/settings')}
                className="text-[#8FA89F] hover:text-white text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200 flex items-center gap-1.5">
                <Cog className="w-4 h-4" />
                Settings
              </button>
            )}

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button onClick={handleLogout}
              className="text-[#B91C1C]/60 hover:text-[#B91C1C] text-[13px] font-medium px-3.5 py-2 rounded-lg hover:bg-[#B91C1C]/[0.06] transition-all duration-200">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">

        {/* ═══ Stats Banner ═══ */}
        <div className="mb-8 bg-white rounded-2xl border border-[#D4E0DA]/80 px-6 py-5 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#D4E0DA]/60">
              <p className="text-[#8FA89F] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Role</p>
              <p className="text-[#0C1A15] font-semibold text-sm capitalize" style={{ fontFamily: 'var(--font-sans)' }}>{user?.role || 'member'}</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#D4E0DA]/60 flex items-center justify-between">
              <div>
                <p className="text-[#8FA89F] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Meetings</p>
                <p className="text-[#0C1A15] font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{availableData.length}</p>
              </div>
              <button onClick={fetchAvailableData} className="ml-2 p-1 hover:bg-[#D4E0DA]/40 rounded text-[#8FA89F] hover:text-[#3D5249]" title="Refresh meetings list">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/></svg>
              </button>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[#0C1A15] font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>Process once, ship everywhere</p>
            <p className="text-[#7A9489] text-xs mt-0.5">Generate action-ready outputs for code, ops, and stakeholders.</p>
          </div>
        </div>

        {/* ═══ Error Banner ═══ */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-[#B91C1C]/[0.04] border border-[#B91C1C]/10 rounded-xl px-5 py-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-lg bg-[#B91C1C]/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
            </div>
            <p className="text-[#B91C1C] text-sm font-medium flex-1 pt-1">{error}</p>
            <button onClick={() => setError('')}
              className="text-[#B91C1C]/30 hover:text-[#B91C1C] transition-colors duration-200 p-1 rounded-lg hover:bg-[#B91C1C]/5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══ Process Section ═══ */}
        <div className="bg-white rounded-2xl border border-[#D4E0DA]/80 overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="px-8 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B45309]/10 to-[#F59E0B]/10 flex items-center justify-center border border-[#D97706]/10">
                <Zap className="w-5 h-5 text-[#B45309]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0C1A15] tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>Process Meeting</h2>
                <p className="text-[#7A9489] text-[13px] mt-0.5">Analyze transcripts with dual-perspective AI agents</p>
              </div>
            </div>
          </div>

          {availableData.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F7FAF8] border border-[#D4E0DA] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#8FA89F]" />
              </div>
              <p className="text-[#7A9489] text-sm font-medium">No meeting data available</p>
              <p className="text-[#8FA89F] text-xs mt-1">Record a meeting to get started</p>
            </div>
          ) : (
            <div className="px-8 pb-8 pt-3">
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <select value={selectedDataIndex} onChange={(e) => setSelectedDataIndex(parseInt(e.target.value))} disabled={processingData}
                    className="w-full px-4 py-3.5 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl text-[#0C1A15] text-sm font-medium focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]/40 focus:bg-white transition-all duration-200 outline-none appearance-none cursor-pointer disabled:opacity-50 hover:border-[#8FA89F]/50"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                    {availableData.map((data, idx) => (
                      <option key={idx} value={idx}>{data.title} — {data.date}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8FA89F] group-hover:text-[#3D5249] transition-colors duration-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <button onClick={handleProcessData} disabled={processingData}
                  className="bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/25 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2">
                  {processingData ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Process with AI
                    </>
                  )}
                </button>
              </div>

              {/* ── Pipeline ── */}
              {processingData && !showIssueConfirmation && !showPRConfirmation && !showEmailConfirmation && !showEventConfirmation && !showTrelloConfirmation && !showNotionConfirmation && (
                <div className="mt-6 bg-[#F7FAF8] rounded-xl border border-[#D4E0DA]/60 p-6">
                  <div className="flex items-center justify-between">
                    {pipelineSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-500 ease-out ${
                            idx < processingStep
                              ? 'bg-[#15803D] text-white shadow-md shadow-[#15803D]/20'
                              : idx === processingStep
                                ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/20 animate-pulse'
                                : 'bg-[#D4E0DA]/50 text-[#8FA89F]'
                          }`}>
                            {idx < processingStep ? (
                              <Check className="w-4 h-4" strokeWidth={3} />
                            ) : <step.Icon className="w-4 h-4" />}
                          </div>
                          <span className={`text-[11px] mt-2.5 font-medium transition-colors duration-300 ${idx <= processingStep ? 'text-[#0C1A15]' : 'text-[#8FA89F]'}`}>
                            {step.label}
                          </span>
                        </div>
                        {idx < pipelineSteps.length - 1 && (
                          <div className="flex-1 mx-4 mt-[-22px]">
                            <div className="h-[2px] rounded-full bg-[#D4E0DA]/50 overflow-hidden">
                              <div className="h-full bg-[#D97706] rounded-full transition-all duration-700 ease-out"
                                style={{ width: idx < processingStep ? '100%' : '0%' }} />
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

        {/* ═══ Results ═══ */}
        {processedData && (
          <div className="space-y-6">
            {/* Meeting Header */}
            <div className="bg-white rounded-xl border border-[#D4E0DA]/80 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#15803D]/10 flex items-center justify-center border border-[#15803D]/10">
                  <Check className="w-5 h-5 text-[#15803D]" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0C1A15] tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>{processedData.title}</h2>
                  <p className="text-[#8FA89F] text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(processedData.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex items-center bg-[#F7FAF8] border border-[#D4E0DA]/60 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('formatted')}
                    className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                      viewMode === 'formatted' ? 'bg-white text-[#0C1A15] shadow-sm border border-[#D4E0DA]/40' : 'text-[#8FA89F] hover:text-[#3D5249]'
                    }`}>
                    Formatted
                  </button>
                  <button onClick={() => setViewMode('raw')}
                    className={`px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                      viewMode === 'raw' ? 'bg-white text-[#0C1A15] shadow-sm border border-[#D4E0DA]/40' : 'text-[#8FA89F] hover:text-[#3D5249]'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}>
                    Raw
                  </button>
                </div>
                <button onClick={() => setProcessedData(null)}
                  className="text-[#8FA89F] hover:text-[#B91C1C] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#B91C1C]/5 transition-all duration-200 ml-1">
                  Clear
                </button>
              </div>
            </div>

            {/* Analysis Tabs */}
            <div className="bg-white rounded-2xl border border-[#D4E0DA]/80 overflow-hidden shadow-sm">
              <div className="flex border-b border-[#D4E0DA]/60">
                <button onClick={() => setActiveTab('technical')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
                    activeTab === 'technical'
                      ? 'text-[#B45309] bg-[#B45309]/[0.02]'
                      : 'text-[#7A9489] hover:text-[#3D5249] hover:bg-[#F7FAF8]/60'
                  }`}>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-md transition-all duration-200 ${
                      activeTab === 'technical' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F7FAF8] text-[#8FA89F]'
                    }`}>TECH</span>
                    Technical Analysis
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full transition-all duration-300 ${
                    activeTab === 'technical' ? 'bg-[#D97706] opacity-100' : 'bg-transparent opacity-0'
                  }`} />
                </button>
                <button onClick={() => setActiveTab('nonTechnical')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
                    activeTab === 'nonTechnical'
                      ? 'text-[#3D5249] bg-[#3D5249]/[0.02]'
                      : 'text-[#7A9489] hover:text-[#3D5249] hover:bg-[#F7FAF8]/60'
                  }`}>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-md transition-all duration-200 ${
                      activeTab === 'nonTechnical' ? 'bg-[#E8F0EC] text-[#3D5249]' : 'bg-[#F7FAF8] text-[#8FA89F]'
                    }`}>BIZ</span>
                    Business Analysis
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full transition-all duration-300 ${
                    activeTab === 'nonTechnical' ? 'bg-[#3D5249] opacity-100' : 'bg-transparent opacity-0'
                  }`} />
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'technical' && processedData.technical?.analysis && (
                  <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA]/60 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-[#F0F4F2] border-b border-[#D4E0DA]/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                        <span className="text-[11px] text-[#8FA89F] uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                          Technical Agent Output
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[560px] overflow-y-auto">
                      <div className="p-6">
                        {viewMode === 'formatted' ? (
                          <MarkdownRenderer content={processedData.technical.analysis} accentColor="#D97706" />
                        ) : (
                          formatAnalysis(processedData.technical.analysis).map((line, idx) => (
                            <div key={idx} className="flex gap-4 group hover:bg-[#D97706]/[0.03] -mx-3 px-3 rounded-lg transition-colors duration-150">
                              <span className="text-[#8FA89F] text-[11px] w-7 text-right flex-shrink-0 pt-1 select-none" style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</span>
                              <p className="text-[#0C1A15] text-[13px] leading-relaxed py-0.5 flex-1" style={{ fontFamily: 'var(--font-mono)' }}>{line || '\u00A0'}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'nonTechnical' && processedData.nonTechnical?.analysis && (
                  <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA]/60 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-[#F0F4F2] border-b border-[#D4E0DA]/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#3D5249]" />
                        <span className="text-[11px] text-[#8FA89F] uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                          Business Agent Output
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[560px] overflow-y-auto">
                      <div className="p-6">
                        {viewMode === 'formatted' ? (
                          <MarkdownRenderer content={processedData.nonTechnical.analysis} accentColor="#3D5249" />
                        ) : (
                          formatAnalysis(processedData.nonTechnical.analysis).map((line, idx) => (
                            <div key={idx} className="flex gap-4 group hover:bg-[#3D5249]/[0.03] -mx-3 px-3 rounded-lg transition-colors duration-150">
                              <span className="text-[#8FA89F] text-[11px] w-7 text-right flex-shrink-0 pt-1 select-none" style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</span>
                              <p className="text-[#3D5249] text-[13px] leading-relaxed py-0.5 flex-1" style={{ fontFamily: 'var(--font-mono)' }}>{line || '\u00A0'}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'technical' && !processedData.technical?.analysis && (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-[#F7FAF8] border border-[#D4E0DA] flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-5 h-5 text-[#8FA89F]" />
                    </div>
                    <p className="text-[#8FA89F] text-sm">No technical analysis available</p>
                  </div>
                )}
                {activeTab === 'nonTechnical' && !processedData.nonTechnical?.analysis && (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-[#F7FAF8] border border-[#D4E0DA] flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-5 h-5 text-[#8FA89F]" />
                    </div>
                    <p className="text-[#8FA89F] text-sm">No business analysis available</p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Integrations ═══ */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 px-1">
                <h3 className="text-[13px] font-bold text-[#0C1A15] uppercase tracking-wider" style={{ fontFamily: 'var(--font-syne)' }}>
                  Integrations Pipeline
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4E0DA] to-transparent" />
              </div>

              {techIntegrations.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-[0.15em] mb-3 px-1 flex items-center gap-2">
                    <span className="bg-[#FEF3C7] px-2.5 py-0.5 rounded-md border border-[#D97706]/10">TECH</span>
                    Developer Tools
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {techIntegrations.map((integration) => (
                      <button key={integration.id} onClick={integration.action} disabled={processingData || creatingIssues}
                        className="group bg-white rounded-xl border border-[#D4E0DA]/80 p-5 text-left hover:border-[#D97706]/30 hover:shadow-lg hover:shadow-[#D97706]/[0.06] hover:translate-y-[-2px] active:translate-y-0 transition-all duration-250 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: integration.bgColor, color: integration.color }}>
                            {integration.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0C1A15] group-hover:text-[#D97706] transition-colors duration-200"
                              style={{ fontFamily: 'var(--font-sans)' }}>
                              {integration.title}
                            </p>
                            <p className="text-[#7A9489] text-xs mt-1 leading-relaxed">{integration.description}</p>
                            {integration.badge && (
                              <p className="text-[10px] text-[#8FA89F] mt-2.5 bg-[#F7FAF8] px-2.5 py-0.5 rounded-md inline-block border border-[#D4E0DA]/60"
                                style={{ fontFamily: 'var(--font-mono)' }}>
                                {integration.badge}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#D4E0DA] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showAssignIssues && createdIssueNumbers.length > 0 && (
                <div className="bg-white rounded-xl border-l-[3px] border-l-[#D97706] border border-[#D4E0DA]/80 p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-[#0C1A15] mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Assign Issues to Team Members</h4>
                  <div className="space-y-3">
                    {createdIssueNumbers.map(num => (
                      <div key={num} className="flex items-center gap-3">
                        <span className="text-xs text-[#8FA89F] bg-[#F7FAF8] px-2.5 py-1.5 rounded-lg border border-[#D4E0DA]/60 w-16 text-center"
                          style={{ fontFamily: 'var(--font-mono)' }}>
                          #{num}
                        </span>
                        <input type="text" placeholder="GitHub usernames (comma separated)"
                          value={assignees[num] || ''} onChange={(e) => setAssignees({ ...assignees, [num]: e.target.value })}
                          className="flex-1 px-4 py-2.5 bg-[#F7FAF8] border border-[#D4E0DA] rounded-xl text-sm text-[#0C1A15] focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706]/40 focus:bg-white outline-none transition-all duration-200"
                          style={{ fontFamily: 'var(--font-sans)' }} />
                      </div>
                    ))}
                    <button onClick={handleAssignIssues} disabled={assigningIssues}
                      className="bg-gradient-to-r from-[#B45309] to-[#F59E0B] text-white font-semibold py-2.5 px-6 rounded-xl text-sm disabled:opacity-40 transition-all duration-200 hover:shadow-lg hover:shadow-[#B45309]/20 hover:translate-y-[-1px] active:translate-y-0">
                      {assigningIssues ? 'Assigning…' : 'Confirm Assignments'}
                    </button>
                  </div>
                </div>
              )}

              {!isGithubConfigured && (
                <div className="bg-white rounded-xl border border-[#D4E0DA]/80 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center border border-[#D97706]/10">
                      <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0C1A15]">GitHub not configured</p>
                      <p className="text-[#7A9489] text-xs mt-0.5">Connect your repository for issues, PRs, and assignments.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/settings')}
                    className="text-[#D97706] hover:text-[#B45309] text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 hover:gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#FEF3C7]/50">
                    Configure <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {bizIntegrations.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#3D5249] uppercase tracking-[0.15em] mb-3 px-1 flex items-center gap-2">
                    <span className="bg-[#E8F0EC] px-2.5 py-0.5 rounded-md border border-[#3D5249]/10">BIZ</span>
                    Business Tools
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {bizIntegrations.map((integration) => (
                      <button key={integration.id} onClick={integration.action} disabled={processingData}
                        className="group bg-white rounded-xl border border-[#D4E0DA]/80 p-5 text-left hover:border-[#3D5249]/25 hover:shadow-lg hover:shadow-[#3D5249]/[0.05] hover:translate-y-[-2px] active:translate-y-0 transition-all duration-250 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0">
                        <div className="flex flex-col gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: integration.bgColor, color: integration.color }}>
                            {integration.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0C1A15] group-hover:text-[#3D5249] transition-colors duration-200"
                              style={{ fontFamily: 'var(--font-sans)' }}>
                              {integration.title}
                            </p>
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

        {/* ═══ Empty State ═══ */}
        {!processedData && !processingData && availableData.length > 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#D4E0DA] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Zap className="w-7 h-7 text-[#8FA89F]" />
            </div>
            <h3 className="text-[#3D5249] font-semibold text-base mb-1.5" style={{ fontFamily: 'var(--font-syne)' }}>Ready to analyze</h3>
            <p className="text-[#8FA89F] text-sm">Select a meeting above and click <span className="text-[#B45309] font-medium">Process with AI</span> to begin</p>
          </div>
        )}
      </main>

      {/* ═══════ MODALS ═══════ */}

      {/* GitHub Issues */}
      <ConfirmationModal show={showIssueConfirmation} onClose={() => setShowIssueConfirmation(false)}
        title="Confirm GitHub Issues" subtitle={githubSettings ? `${githubSettings.owner}/${githubSettings.repo}` : ''} headerColor="#D97706"
        footer={<>
          <p className="text-[#7A9489] text-xs font-medium">
            <span className="text-[#0C1A15] font-semibold">{selectedIssueCount}</span> of {extractedIssues.length} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowIssueConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmIssues} disabled={creatingIssues || selectedIssueCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200">
              {creatingIssues ? 'Creating…' : `Create ${selectedIssueCount} Issue${selectedIssueCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}>
        <SelectAllBar totalCount={extractedIssues.length} selectedCount={selectedIssueCount}
          onSelectAll={() => makeSelectAll(extractedIssues, setSelectedIssues)} onDeselectAll={() => makeDeselectAll(extractedIssues, setSelectedIssues)} accentColor="#D97706" />
        <div className="p-4 space-y-2.5">
          {extractedIssues.map((issue, index) => (
            <CheckboxItem key={index} checked={selectedIssues[index] || false} onChange={() => handleToggleIssue(index)} accentColor="#D97706">
              <p className="font-medium text-[#0C1A15] text-sm">{issue.title}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed line-clamp-2">{issue.description}</p>
              {issue.labels?.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {issue.labels.map((label, idx) => (
                    <span key={idx} className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#D97706]/10">{label}</span>
                  ))}
                </div>
              )}
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* PR Modal */}
      <ConfirmationModal show={showPRConfirmation} onClose={() => setShowPRConfirmation(false)}
        title="Confirm Pull Requests" subtitle={githubSettings ? `${githubSettings.owner}/${githubSettings.repo}` : ''} headerColor="#D97706"
        footer={<>
          <p className="text-[#7A9489] text-xs font-medium">
            <span className="text-[#0C1A15] font-semibold">{selectedPRCount}</span> of {extractedPRs.length} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowPRConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmPRs} disabled={creatingPR || selectedPRCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200">
              {creatingPR ? 'Creating…' : `Create ${selectedPRCount} PR${selectedPRCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}>
        <SelectAllBar totalCount={extractedPRs.length} selectedCount={selectedPRCount}
          onSelectAll={() => makeSelectAll(extractedPRs, setSelectedPRs)} onDeselectAll={() => makeDeselectAll(extractedPRs, setSelectedPRs)} accentColor="#D97706" />
        <div className="p-4 space-y-2.5">
          {extractedPRs.map((pr, index) => (
            <CheckboxItem key={index} checked={selectedPRs[index] || false} onChange={() => handleTogglePR(index)} accentColor="#D97706">
              <p className="font-medium text-[#0C1A15] text-sm">{pr.title}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed line-clamp-2">{pr.description}</p>
              <p className="text-[#8FA89F] text-[10px] mt-2.5 bg-[#F7FAF8] px-2.5 py-1 rounded-lg inline-block border border-[#D4E0DA]/60"
                style={{ fontFamily: 'var(--font-mono)' }}>
                {pr.head} → {pr.base}
              </p>
              {pr.labels?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pr.labels.map((label, idx) => (
                    <span key={idx} className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#D97706]/10">{label}</span>
                  ))}
                </div>
              )}
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* Email Modal */}
      <ConfirmationModal show={showEmailConfirmation} onClose={() => setShowEmailConfirmation(false)}
        title="Confirm Outbound Emails" subtitle="Review emails before sending" headerColor="#15803D"
        footer={<>
          <p className="text-[#7A9489] text-xs font-medium">
            <span className="text-[#0C1A15] font-semibold">{selectedEmailCount}</span> of {extractedEmails.filter(e => e.isValid).length} valid selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowEmailConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmEmails} disabled={sendingEmails || selectedEmailCount === 0}
              className="px-5 py-2.5 bg-[#15803D] hover:bg-[#166534] hover:shadow-lg hover:shadow-[#15803D]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200">
              {sendingEmails ? 'Sending…' : `Send ${selectedEmailCount} Email${selectedEmailCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}>
        <SelectAllBar totalCount={extractedEmails.length} selectedCount={selectedEmailCount}
          disabledCount={extractedEmails.filter(e => !e.isValid).length}
          onSelectAll={() => makeSelectAll(extractedEmails, setSelectedEmails, e => e.isValid)} onDeselectAll={() => makeDeselectAll(extractedEmails, setSelectedEmails)} accentColor="#15803D" />
        <div className="p-4 space-y-2.5">
          {extractedEmails.map((email, index) => (
            <CheckboxItem key={index} checked={selectedEmails[index] || false} onChange={() => handleToggleEmail(index)} disabled={!email.isValid} accentColor="#15803D">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium text-[#0C1A15] text-sm">To: {email.name}</p>
                {email.isValid ? (
                  <span className="text-[10px] bg-[#E8F0EC] text-[#15803D] px-2.5 py-0.5 rounded-md border border-[#15803D]/10 flex-shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}>
                    {email.emailAddress}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-[#B91C1C]/10 text-[#B91C1C] px-2.5 py-0.5 rounded-md flex-shrink-0">
                    Missing in Settings
                  </span>
                )}
              </div>
              <p className="font-medium text-[#3D5249] text-xs mt-2">Subject: {email.subject}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 border-l-2 border-[#D4E0DA] pl-3 italic leading-relaxed">"{email.context}"</p>
            </CheckboxItem>
          ))}
        </div>
      </ConfirmationModal>

      {/* Calendar Modal */}
      <ConfirmationModal show={showEventConfirmation} onClose={() => setShowEventConfirmation(false)}
        title="Confirm Calendar Events" subtitle="Schedule meetings and milestones" headerColor="#B45309"
        footer={<>
          <p className="text-[#7A9489] text-xs font-medium">
            <span className="text-[#0C1A15] font-semibold">{selectedEventCount}</span> of {extractedEvents.length} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowEventConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmEvents} disabled={schedulingEvents || selectedEventCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#B45309] to-[#F59E0B] hover:shadow-lg hover:shadow-[#B45309]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200">
              {schedulingEvents ? 'Scheduling…' : `Schedule ${selectedEventCount} Event${selectedEventCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}>
        <SelectAllBar totalCount={extractedEvents.length} selectedCount={selectedEventCount}
          onSelectAll={() => makeSelectAll(extractedEvents, setSelectedEvents)} onDeselectAll={() => makeDeselectAll(extractedEvents, setSelectedEvents)} accentColor="#B45309" />
        <div className="p-4 space-y-2.5">
          {extractedEvents.map((event, index) => (
            <CheckboxItem key={index} checked={selectedEvents[index] || false} onChange={() => handleToggleEvent(index)} accentColor="#B45309">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium text-[#0C1A15] text-sm">{event.summary}</p>
                <span className="text-[10px] bg-[#FEF3C7] text-[#B45309] px-2.5 py-0.5 rounded-md border border-[#B45309]/10 whitespace-nowrap flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)' }}>
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
      <ConfirmationModal show={showTrelloConfirmation} onClose={() => setShowTrelloConfirmation(false)}
        title="Confirm Trello Cards" subtitle="Review tasks before creating" headerColor="#3D5249"
        footer={<>
          <p className="text-[#7A9489] text-xs font-medium">
            <span className="text-[#0C1A15] font-semibold">{selectedCardCount}</span> of {extractedCards.length} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowTrelloConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmCards} disabled={creatingCards || selectedCardCount === 0}
              className="px-5 py-2.5 bg-[#3D5249] hover:bg-[#0C1A15] hover:shadow-lg hover:shadow-[#3D5249]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200">
              {creatingCards ? 'Creating…' : `Create ${selectedCardCount} Card${selectedCardCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>}>
        {extractedCards.length > 0 && (
          <SelectAllBar totalCount={extractedCards.length} selectedCount={selectedCardCount}
            onSelectAll={() => makeSelectAll(extractedCards, setSelectedCards)} onDeselectAll={() => makeDeselectAll(extractedCards, setSelectedCards)} accentColor="#3D5249" />
        )}
        <div className="p-4 space-y-2.5">
          {extractedCards.map((card, index) => (
            <CheckboxItem key={index} checked={selectedCards[index] || false} onChange={() => handleToggleCard(index)} accentColor="#3D5249">
              <p className="font-medium text-[#0C1A15] text-sm">{card.name}</p>
              <p className="text-[#7A9489] text-xs mt-1.5 leading-relaxed whitespace-pre-wrap line-clamp-3">{card.desc}</p>
            </CheckboxItem>
          ))}
          {extractedCards.length === 0 && (
            <div className="text-center py-10">
              <p className="text-[#8FA89F] text-sm italic">No tasks found suitable for Trello.</p>
            </div>
          )}
        </div>
      </ConfirmationModal>

      {/* Notion Modal */}
      <ConfirmationModal show={showNotionConfirmation} onClose={() => setShowNotionConfirmation(false)}
        title="Review Notion Summary" subtitle="Will be pushed as a new page in your Notion Database" headerColor="#0C1A15"
        footer={<>
          <div />
          <div className="flex gap-2">
            <button onClick={() => setShowNotionConfirmation(false)}
              className="px-5 py-2.5 border border-[#D4E0DA] rounded-xl text-[#3D5249] text-sm font-medium hover:bg-[#F0F4F2] transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirmNotionSummary} disabled={creatingNotionPage || !extractedSummary}
              className="px-5 py-2.5 bg-[#0C1A15] hover:bg-[#1A2E26] hover:shadow-lg hover:shadow-[#0C1A15]/20 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2">
              {creatingNotionPage ? 'Pushing…' : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Push to Notion
                </>
              )}
            </button>
          </div>
        </>}>
        <div className="p-5">
          <div className="bg-[#F7FAF8] rounded-xl border border-[#D4E0DA]/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#F0F4F2] border-b border-[#D4E0DA]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#0C1A15]" />
                <span className="text-[11px] text-[#8FA89F] uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                  Summary Preview
                </span>
              </div>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {cleanedSummary ? (
                <MarkdownRenderer content={cleanedSummary} accentColor="#0C1A15" />
              ) : (
                <p className="text-[#8FA89F] text-sm italic text-center py-8">No summary generated.</p>
              )}
            </div>
          </div>
        </div>
      </ConfirmationModal>

      {/* Loader */}
      <Loader
        isLoading={
          processingData ||
          creatingIssues ||
          creatingPR ||
          sendingEmails ||
          schedulingEvents ||
          creatingCards ||
          creatingNotionPage
        }
        message="Processing your request..."
      />
    </div>
  );
};

export default Dashboard;