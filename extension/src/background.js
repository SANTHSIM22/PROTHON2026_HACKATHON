/*
 * background.js — MeetRec Service Worker
 *
 * Coordinates between content script (mic PCM) and offscreen (tab + recording).
 * Forwards mic PCM chunks from content script to offscreen document.
 */

const DEFAULT_STATE = {
  isRecording: false,
  meetTabId: null,
  startTime: null,
  recordingStatus: 'idle',
  wasInterrupted: false,
};

async function getState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['isRecording', 'meetTabId', 'startTime', 'recordingStatus', 'wasInterrupted'],
      (result) => resolve({ ...DEFAULT_STATE, ...result })
    );
  });
}

async function setState(patch) {
  return new Promise((resolve) => {
    chrome.storage.local.set(patch, resolve);
  });
}

async function resetState() {
  await setState({ ...DEFAULT_STATE });
}

/* ────────── Offscreen document ────────── */

let offscreenCreating = null;

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')],
  });

  if (contexts.length > 0) return;

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK'],
    justification: 'Recording Google Meet audio with MediaRecorder',
  });

  await offscreenCreating;
  offscreenCreating = null;
}

async function closeOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')],
  });

  if (contexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

/* ────────── Tab capture ────────── */

async function getTabMediaStreamId(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(streamId);
      }
    });
  });
}

/* ────────── Find Meet tab ────────── */

async function findMeetTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab found'));
        return;
      }
      const tab = tabs[0];
      if (tab.url && tab.url.startsWith('https://meet.google.com/')) {
        resolve(tab);
      } else {
        reject(new Error('Active tab is not a Google Meet tab'));
      }
    });
  });
}

/* ────────── Inject content script ────────── */

async function ensureContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (response && response.alive) {
      console.log('[bg] Content script already running');
      return true;
    }
  } catch (e) {
    // Not loaded yet
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    });

    await new Promise(r => setTimeout(r, 1000));

    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (response && response.alive) {
      console.log('[bg] Content script injected and running');
      return true;
    }
  } catch (err) {
    console.error('[bg] Content script injection failed:', err.message);
  }

  return false;
}

/* ────────── Start recording ────────── */

async function startRecording(sendResponse) {
  try {
    const state = await getState();
    if (state.isRecording) {
      sendResponse({ success: false, error: 'Already recording' });
      return;
    }

    // Step 1: Find Meet tab
    let meetTab;
    try {
      meetTab = await findMeetTab();
    } catch (err) {
      sendResponse({ success: false, error: err.message });
      return;
    }

    const tabId = meetTab.id;
    console.log('[bg] Meet tab:', tabId);

    // Step 2: Inject content script
    const contentReady = await ensureContentScript(tabId);
    if (!contentReady) {
      console.warn('[bg] Content script not available');
    }

    // Step 3: Create offscreen document FIRST
    await ensureOffscreenDocument();
    await new Promise(r => setTimeout(r, 500));

    // Step 4: Get tab capture stream ID
    let tabStreamId;
    try {
      tabStreamId = await getTabMediaStreamId(tabId);
      console.log('[bg] Tab stream ID obtained');
    } catch (err) {
      sendResponse({ success: false, error: 'Tab capture failed: ' + err.message });
      return;
    }

    // Step 5: Tell offscreen to start recording tab audio
    chrome.runtime.sendMessage({
      type: 'OFFSCREEN_START_RECORDING',
      tabStreamId: tabStreamId,
    });

    await new Promise(r => setTimeout(r, 500));

    // Step 6: Tell content script to start capturing mic and streaming PCM
    if (contentReady) {
      try {
        const micResult = await chrome.tabs.sendMessage(tabId, {
          type: 'START_MIC_CAPTURE',
        });
        console.log('[bg] Mic capture result:', micResult);

        if (micResult && micResult.success) {
          // Tell offscreen what sample rate the mic is using
          chrome.runtime.sendMessage({
            type: 'OFFSCREEN_MIC_INFO',
            sampleRate: micResult.sampleRate || 44100,
            label: micResult.label,
          });
          console.log('[bg] ✅ Mic capture started, sample rate:', micResult.sampleRate);
        } else {
          console.warn('[bg] Mic capture failed:', micResult?.error);
        }
      } catch (err) {
        console.warn('[bg] Mic capture request failed:', err.message);
      }
    }

    const startTime = Date.now();

    await setState({
      isRecording: true,
      meetTabId: tabId,
      startTime: startTime,
      recordingStatus: 'recording',
      wasInterrupted: false,
    });

    console.log('[bg] ✅ Recording started');

    sendResponse({
      success: true,
      startTime: startTime,
      meetTabId: tabId,
    });

  } catch (err) {
    console.error('[bg] startRecording error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/* ────────── Stop recording ────────── */

async function stopRecording(sendResponse) {
  try {
    const state = await getState();
    if (!state.isRecording && state.recordingStatus !== 'recording') {
      if (sendResponse) sendResponse({ success: true });
      return;
    }

    console.log('[bg] Stopping recording...');
    await setState({ recordingStatus: 'stopping' });

    // Stop content script mic
    if (state.meetTabId) {
      try {
        await chrome.tabs.sendMessage(state.meetTabId, { type: 'STOP_MICROPHONE' });
      } catch (e) {
        console.warn('[bg] Could not stop content script mic');
      }
    }

    // Stop offscreen recording
    try {
      chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_RECORDING' });
    } catch (e) {
      console.warn('[bg] Could not stop offscreen');
    }

    // Wait for encoding
    setTimeout(async () => {
      await resetState();
      setTimeout(async () => {
        try { await closeOffscreenDocument(); } catch (e) {}
      }, 10000);
    }, 2000);

    if (sendResponse) sendResponse({ success: true });

  } catch (err) {
    console.error('[bg] stop error:', err);
    await resetState();
    if (sendResponse) sendResponse({ success: false, error: err.message });
  }
}

/* ────────── Message handler ────────── */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  switch (message.type) {

    case 'GET_STATUS':
      getState().then(sendResponse);
      return true;

    case 'START_RECORDING':
      startRecording(sendResponse);
      return true;

    case 'STOP_RECORDING':
      stopRecording(sendResponse);
      return true;

    case 'CLEAR_INTERRUPTED':
      setState({ wasInterrupted: false }).then(() => sendResponse({ success: true }));
      return true;

    case 'MIC_PCM_DATA':
      // Forward mic PCM data from content script to offscreen
      // This is the critical path — mic audio flows through here
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_MIC_PCM',
        pcm: message.pcm,
        sampleRate: message.sampleRate,
      });
      return false;

    case 'RECORDING_DOWNLOAD_COMPLETE':
      console.log('[bg] ✅ Download complete');
      resetState().then(() => {
        setTimeout(() => closeOffscreenDocument().catch(() => {}), 2000);
      });
      return false;

    case 'RECORDING_ERROR':
      console.error('[bg] Recording error:', message.error);
      resetState();
      return false;

    default:
      return false;
  }
});

/* ────────── Tab events ────────── */

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();
  if (state.isRecording && state.meetTabId === tabId) {
    console.log('[bg] Meet tab closed');
    await stopRecording(null);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return;
  const state = await getState();
  if (state.isRecording && state.meetTabId === tabId) {
    if (!changeInfo.url.startsWith('https://meet.google.com/')) {
      console.log('[bg] Left Meet');
      await stopRecording(null);
    }
  }
});

/* ────────── Startup ────────── */

chrome.runtime.onStartup.addListener(async () => {
  const state = await getState();
  if (state.isRecording) {
    await setState({ ...DEFAULT_STATE, wasInterrupted: true });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  if (state.isRecording) {
    await setState({ ...DEFAULT_STATE, wasInterrupted: true });
  }
});