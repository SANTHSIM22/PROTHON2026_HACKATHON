document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('login-container');
  const userContainer = document.getElementById('user-container');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const recordBtn = document.getElementById('record-btn');
  const statusIndicator = document.getElementById('recording-status');
  const visualizer = document.getElementById('recording-visualizer');
  const errorMsg = document.getElementById('error-message');
  
  const userNameSpan = document.getElementById('user-name');
  const userRoleSpan = document.getElementById('user-role');

  // Use a config file or build system in production
  // For local: 'http://localhost:5000/api/auth'
  // For production: 'https://your-production-url.com/api/auth'
  const API_URL = 'https://prothon2026-hackathon.onrender.com/api/auth'; 

  // Check if user is already logged in
  chrome.storage.local.get(['token', 'user', 'isRecording'], (result) => {
    if (result.token && result.user) {
      showUserView(result.user);
      if (result.isRecording) {
        setRecordingUI(true, true);
      } else {
        checkMeetAndSetUI();
      }
    } else {
      showLoginView();
    }
  });

  function checkMeetAndSetUI() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      // Check if URL exists and if it's Google Meet
      const isMeet = activeTab && activeTab.url && activeTab.url.includes('meet.google.com');
      setRecordingUI(false, isMeet);
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button');
    
    errorMsg.textContent = '';
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save token and user details to extension storage
      chrome.storage.local.set({
        token: data.token,
        user: data.user
      }, () => {
        showUserView(data.user);
      });
      
    } catch (error) {
      errorMsg.textContent = error.message;
    } finally {
      submitBtn.textContent = 'Log in';
      submitBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isRecording'], (result) => {
      if (result.isRecording) {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
      }
      chrome.storage.local.remove(['token', 'user', 'isRecording'], () => {
        showLoginView();
      });
    });
  });

  recordBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isRecording', 'token'], (result) => {
      const isCurrentlyRecording = result.isRecording;
      
      if (!isCurrentlyRecording) {
        // Start recording
        chrome.runtime.sendMessage({
          type: 'START_RECORDING',
          token: result.token
        }, (response) => {
          chrome.storage.local.set({ isRecording: true });
          setRecordingUI(true, true);
        });
      } else {
        // Stop recording
        chrome.runtime.sendMessage({
          type: 'STOP_RECORDING'
        }, () => {
          chrome.storage.local.set({ isRecording: false });
          checkMeetAndSetUI();
          alert('Recording finished and saving!');
        });
      }
    });
  });

  function setRecordingUI(isRecording, isMeet = false) {
    if (isRecording) {
      recordBtn.textContent = 'Stop Recording';
      recordBtn.style.backgroundColor = '#dc2626';
      recordBtn.disabled = false;
      statusIndicator.textContent = 'Recording in progress... (Close popup safely)';
      statusIndicator.style.color = '#dc2626';
      visualizer.classList.remove('hidden');
    } else {
      visualizer.classList.add('hidden');
      if (isMeet) {
        recordBtn.textContent = 'Start Recording';
        recordBtn.style.backgroundColor = '#10b981';
        recordBtn.disabled = false;
        statusIndicator.textContent = 'Ready to record';
        statusIndicator.style.color = '#374151';
      } else {
        recordBtn.textContent = 'Recording Disabled';
        recordBtn.style.backgroundColor = '#9ca3af'; // Grey out out
        recordBtn.disabled = true;
        statusIndicator.textContent = 'Only available on Google Meet';
        statusIndicator.style.color = '#6b7280';
      }
    }
  }

  function showUserView(user) {
    loginContainer.classList.add('hidden');
    userContainer.classList.remove('hidden');
    userNameSpan.textContent = user.name;
    userRoleSpan.textContent = user.role || 'Member';
    
    // Optional: Make design adjustments based on whether they are technical or non-technical
    if (user.role === 'technical') {
      userRoleSpan.style.color = '#2563eb';
    } else {
      userRoleSpan.style.color = '#10b981';
    }
  }

  function showLoginView() {
    loginContainer.classList.remove('hidden');
    userContainer.classList.add('hidden');
    loginForm.reset();
  }
});