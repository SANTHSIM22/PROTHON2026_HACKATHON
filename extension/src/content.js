/*
 * content.js — MeetRec Content Script
 *
 * Captures microphone on the Meet page (where permission works),
 * extracts raw PCM audio samples, and sends them to background.js
 * which forwards them to the offscreen document for merging.
 */

(function () {
  'use strict';

  if (window.__meetRecInjected) return;
  window.__meetRecInjected = true;

  let micStream = null;
  let micAudioContext = null;
  let scriptProcessor = null;
  let isCapturing = false;
  let detectedMicDeviceId = null;
  let detectedMicLabel = null;
  let port = null;

  /* ────────── Intercept getUserMedia to find Meet's mic ────────── */

  function interceptGetUserMedia() {
    if (window.__meetRecGumIntercepted) return;
    window.__meetRecGumIntercepted = true;

    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );

    navigator.mediaDevices.getUserMedia = async function (constraints) {
      const stream = await original(constraints);

      if (constraints && constraints.audio) {
        const tracks = stream.getAudioTracks();
        if (tracks.length > 0) {
          const settings = tracks[0].getSettings();
          detectedMicDeviceId = settings.deviceId || null;
          detectedMicLabel = tracks[0].label || null;
          console.log('[MeetRec] Meet mic:', detectedMicLabel, '→', detectedMicDeviceId);
        }
      }

      return stream;
    };

    console.log('[MeetRec] getUserMedia interceptor installed');
  }

  /* ────────── Start mic capture and PCM streaming ────────── */

  async function startMicCapture() {
    if (isCapturing) {
      console.log('[MeetRec] Already capturing mic');
      return { success: true };
    }

    try {
      console.log('[MeetRec] Starting mic capture...');

      // Build constraints
      const audioConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 44100,
        channelCount: 1,
      };

      if (detectedMicDeviceId) {
        audioConstraints.deviceId = { exact: detectedMicDeviceId };
        console.log('[MeetRec] Using Meet mic device:', detectedMicDeviceId);
      }

      // Capture mic
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      const track = micStream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('[MeetRec] ✅ Mic captured:', track.label);
      console.log('[MeetRec]   Sample rate:', settings.sampleRate);
      console.log('[MeetRec]   Channels:', settings.channelCount);

      // Create AudioContext to process mic audio
      const sampleRate = settings.sampleRate || 44100;
      micAudioContext = new AudioContext({ sampleRate: sampleRate });

      const source = micAudioContext.createMediaStreamSource(micStream);

      // Use ScriptProcessorNode to extract raw PCM samples
      // Buffer size 4096 gives ~93ms chunks at 44100Hz
      const bufferSize = 4096;
      scriptProcessor = micAudioContext.createScriptProcessor(bufferSize, 1, 1);

      let chunkCount = 0;

      scriptProcessor.onaudioprocess = function (event) {
        if (!isCapturing) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32Array to regular array for message passing
        // We need to copy the data because the buffer gets reused
        const pcmData = new Float32Array(inputData.length);
        pcmData.set(inputData);

        // Send PCM data to background script
        try {
          chrome.runtime.sendMessage({
            type: 'MIC_PCM_DATA',
            pcm: Array.from(pcmData),
            sampleRate: sampleRate,
          });

          chunkCount++;
          if (chunkCount % 50 === 0) {
            console.log('[MeetRec] Sent', chunkCount, 'mic chunks');
          }
        } catch (err) {
          // Extension might have been reloaded
          console.warn('[MeetRec] Failed to send PCM:', err.message);
          stopMicCapture();
        }

        // Pass through silence (we don't want to play the mic back)
        const outputData = event.outputBuffer.getChannelData(0);
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] = 0;
        }
      };

      // Connect: source → scriptProcessor → destination (required for processing)
      source.connect(scriptProcessor);
      scriptProcessor.connect(micAudioContext.destination);

      isCapturing = true;
      console.log('[MeetRec] ✅ Mic PCM streaming started (buffer:', bufferSize, 'rate:', sampleRate, ')');

      return {
        success: true,
        label: track.label,
        sampleRate: sampleRate,
        deviceId: settings.deviceId,
      };

    } catch (err) {
      console.error('[MeetRec] ❌ Mic capture failed:', err);
      stopMicCapture();
      return { success: false, error: err.message };
    }
  }

  /* ────────── Stop mic capture ────────── */

  function stopMicCapture() {
    isCapturing = false;

    if (scriptProcessor) {
      scriptProcessor.disconnect();
      scriptProcessor.onaudioprocess = null;
      scriptProcessor = null;
    }

    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }

    if (micAudioContext && micAudioContext.state !== 'closed') {
      micAudioContext.close().catch(() => {});
      micAudioContext = null;
    }

    console.log('[MeetRec] Mic capture stopped');
  }

  /* ────────── Message listener ────────── */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {

      case 'START_MIC_CAPTURE': {
        startMicCapture().then(sendResponse);
        return true;
      }

      case 'STOP_MICROPHONE': {
        stopMicCapture();
        sendResponse({ success: true });
        return true;
      }

      case 'GET_MIC_INFO': {
        sendResponse({
          deviceId: detectedMicDeviceId,
          label: detectedMicLabel,
          isCapturing: isCapturing,
        });
        return true;
      }

      case 'PING': {
        sendResponse({ alive: true, isCapturing: isCapturing });
        return true;
      }

      default:
        return false;
    }
  });

  /* ────────── Init ────────── */

  console.log('[MeetRec] Content script loaded');
  interceptGetUserMedia();

  // Re-start capture if we were recording before page refresh
  chrome.storage.local.get(['isRecording'], (state) => {
    if (state.isRecording) {
      console.log('[MeetRec] Was recording, restarting mic capture');
      startMicCapture();
    }
  });

})();