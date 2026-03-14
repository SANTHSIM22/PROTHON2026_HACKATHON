// background.js

async function setupOffscreenDocument(path) {
  // Check if offscreen exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create document
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['USER_MEDIA'],
    justification: 'Recording user microphone during a meeting'
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    setupOffscreenDocument('offscreen.html').then(() => {
      chrome.runtime.sendMessage({
        type: 'RECORDING_COMMAND',
        command: 'start',
        token: message.token
      });
      sendResponse({ status: 'started' });
    });
    return true; // async
  }
  
  if (message.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage({
      type: 'RECORDING_COMMAND',
      command: 'stop'
    });
    sendResponse({ status: 'stopped' });
    return true; // async
  }
});