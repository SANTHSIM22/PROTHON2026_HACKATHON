/*
 * content.js — MeetRec Content Script
 *
 * Injected into Google Meet tabs.
 * Detects which microphone Google Meet is using and
 * sends that device ID to the offscreen document.
 */

(function () {
  'use strict';

  let isActive = false;
  let mutationObserver = null;

  /* ─────────── Detect which mic Google Meet is using ─────────── */

  async function detectMeetMicDevice() {
    try {
      /*
       * METHOD 1: Check Google Meet's settings stored in localStorage
       * Meet stores selected devices in its own storage
       */

      // METHOD 2: Look at active MediaStream tracks on the page
      // Google Meet creates getUserMedia streams — we can find them
      // by intercepting or checking RTCPeerConnection

      // METHOD 3: Find the mic selector in Meet's UI and read its value
      // Look for the settings panel audio input dropdown

      // Most reliable: get all audio input devices and find which
      // one has the same label as what Meet shows in its UI

      const settingsButton = document.querySelector(
        '[data-tooltip="Settings"], [aria-label="Settings"]'
      );

      // Try to read from Meet's DOM - the audio input indicator
      const audioIndicators = document.querySelectorAll(
        '[data-device-id], [data-audio-device]'
      );

      let meetDeviceId = null;

      audioIndicators.forEach(el => {
        const id = el.getAttribute('data-device-id') ||
                   el.getAttribute('data-audio-device');
        if (id) {
          meetDeviceId = id;
          console.log('[MeetRec content] Found Meet device ID in DOM:', id);
        }
      });

      // Fallback: enumerate devices and send all info to offscreen
      // so it can try to match
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');

      console.log('[MeetRec content] Available microphones on Meet page:');
      mics.forEach((m, i) => {
        console.log(`  [${i}] "${m.label}" id=${m.deviceId.substring(0, 12)}...`);
      });

      // If Meet is actively using a mic, we can detect it by checking
      // which device currently has an active track
      // Unfortunately we can't access Meet's MediaStreams directly

      // Best approach: intercept getUserMedia to capture the device ID
      // that Meet requested. We set this up at page load.

      if (meetDeviceId) {
        return meetDeviceId;
      }

      // If we intercepted the device ID earlier (see below), use that
      if (window.__meetRecDetectedMicId) {
        console.log('[MeetRec content] Using intercepted mic ID:',
          window.__meetRecDetectedMicId);
        return window.__meetRecDetectedMicId;
      }

      return null;

    } catch (err) {
      console.warn('[MeetRec content] Mic detection error:', err);
      return null;
    }
  }

  /* ─────────── Intercept getUserMedia to detect Meet's mic ─────────── */

  function interceptGetUserMedia() {
    if (window.__meetRecIntercepted) return;
    window.__meetRecIntercepted = true;

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );

    navigator.mediaDevices.getUserMedia = async function (constraints) {
      console.log('[MeetRec content] getUserMedia called with:', constraints);

      const stream = await originalGetUserMedia(constraints);

      // Check if this is an audio capture (Meet getting mic)
      if (constraints && constraints.audio) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          const settings = track.getSettings();

          console.log('[MeetRec content] Meet audio track detected:');
          console.log('  Label:', track.label);
          console.log('  Device ID:', settings.deviceId);

          // Store the device ID so we can use it later
          window.__meetRecDetectedMicId = settings.deviceId;
          window.__meetRecDetectedMicLabel = track.label;

          // If we're already recording, send update to offscreen
          if (isActive) {
            chrome.runtime.sendMessage({
              type: 'CONTENT_MIC_DETECTED',
              deviceId: settings.deviceId,
              label: track.label,
            });
          }
        }
      }

      return stream;
    };

    console.log('[MeetRec content] getUserMedia interceptor installed');
  }

  /* ─────────── DOM Observer ─────────── */

  function startObservingDOM() {
    if (mutationObserver) return;

    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
            console.log('[MeetRec content] New media element:', node.tagName);
          }
          const children = node.querySelectorAll
            ? node.querySelectorAll('audio, video')
            : [];
          if (children.length > 0) {
            console.log('[MeetRec content] New media in subtree:', children.length);
          }
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopObservingDOM() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }

  /* ─────────── Message listener ─────────── */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {

      case 'CAPTURE_MICROPHONE': {
        (async () => {
          try {
            isActive = true;

            // Detect which mic Meet is using
            const meetMicId = await detectMeetMicDevice();

            // Send the device ID to background → offscreen
            chrome.runtime.sendMessage({
              type: 'CONTENT_MIC_DETECTED',
              deviceId: meetMicId,
              label: window.__meetRecDetectedMicLabel || null,
            });

            startObservingDOM();
            sendResponse({ success: true, micDeviceId: meetMicId });

          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      case 'STOP_MICROPHONE': {
        isActive = false;
        stopObservingDOM();
        sendResponse({ success: true });
        return true;
      }

      case 'PING': {
        sendResponse({ alive: true });
        return true;
      }

      default:
        return false;
    }
  });

  /* ─────────── Initialize ─────────── */

  console.log('[MeetRec content] Loaded on', window.location.href);

  // Install the getUserMedia interceptor IMMEDIATELY
  // so we catch Meet's mic selection from the start
  interceptGetUserMedia();

  // Check if we were recording before a page refresh
  chrome.storage.local.get(['isRecording'], (state) => {
    if (state.isRecording) {
      console.log('[MeetRec content] Was recording, re-activating');
      isActive = true;
      startObservingDOM();
    }
  });

})();