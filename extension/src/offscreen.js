/*
 * offscreen.js — MeetRec Offscreen Document
 *
 * Handles:
 *  - Tab audio capture via stream ID
 *  - Microphone capture (matching Google Meet's selected device)
 *  - Merging both streams
 *  - MediaRecorder + MP3 encoding via lamejs
 *  - Download trigger
 */

(function () {
  'use strict';

  let mediaRecorder = null;
  let recordedChunks = [];
  let audioContext = null;
  let tabStream = null;
  let micStream = null;
  let destinationNode = null;
  let isRecording = false;
  let micDeviceId = null;

  /* ─────────────── Enumerate audio devices ─────────────── */

  async function findAllMicrophones() {
    try {
      // We need to call getUserMedia first to get permission
      // then enumerate to see device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');

      console.log('[MeetRec offscreen] Available microphones:');
      mics.forEach((m, i) => {
        console.log(`  [${i}] ${m.label} (${m.deviceId})`);
      });

      return mics;
    } catch (err) {
      console.error('[MeetRec offscreen] Cannot enumerate devices:', err);
      return [];
    }
  }

  /* ─────────────── Capture tab audio ─────────────── */

  async function captureTabAudio(tabStreamId) {
    try {
      console.log('[MeetRec offscreen] Capturing tab audio...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: tabStreamId,
          },
        },
        video: false,
      });

      tabStream = stream;
      console.log('[MeetRec offscreen] Tab audio captured:',
        stream.getAudioTracks().length, 'tracks');
      return stream;

    } catch (err) {
      console.error('[MeetRec offscreen] Tab capture failed:', err);
      throw err;
    }
  }

  /* ─────────────── Capture microphone ─────────────── */

  async function captureMicrophone(preferredDeviceId) {
    try {
      console.log('[MeetRec offscreen] Capturing microphone...');

      const audioConstraints = {
        // CRITICAL: disable echo cancellation and noise suppression
        // because Google Meet is already applying these
        // Having two layers of processing destroys the audio
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        // If we know which device Meet is using, use that exact one
      };

      if (preferredDeviceId && preferredDeviceId !== 'default') {
        audioConstraints.deviceId = { exact: preferredDeviceId };
        console.log('[MeetRec offscreen] Using specific mic device:', preferredDeviceId);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      micStream = stream;

      // Log which device we actually got
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('[MeetRec offscreen] Microphone captured:');
      console.log('  Label:', track.label);
      console.log('  Device ID:', settings.deviceId);
      console.log('  Sample Rate:', settings.sampleRate);
      console.log('  Channel Count:', settings.channelCount);

      return stream;

    } catch (err) {
      console.warn('[MeetRec offscreen] Mic capture failed:', err.message);
      return null;
    }
  }

  /* ─────────── Try to detect which mic Google Meet uses ─────────── */

  async function detectMeetMicrophone() {
    /*
     * Strategy: Google Meet stores the selected audio device in localStorage
     * on the meet.google.com domain. We can't access that from here, but
     * the content script can read it and send it to us.
     *
     * Fallback: try each available microphone and use whichever one
     * is currently active (has audio signal).
     *
     * Simplest reliable approach: enumerate all mics and prefer
     * the one that is NOT the default communications device,
     * because users often select a specific headset in Meet.
     */

    const mics = await findAllMicrophones();

    if (mics.length === 0) {
      console.warn('[MeetRec offscreen] No microphones found');
      return null;
    }

    if (mics.length === 1) {
      console.log('[MeetRec offscreen] Only one mic available, using it');
      return mics[0].deviceId;
    }

    // If we received a specific device ID from content script, use that
    if (micDeviceId) {
      console.log('[MeetRec offscreen] Using device ID from content script:', micDeviceId);
      return micDeviceId;
    }

    // Fallback: use default
    console.log('[MeetRec offscreen] Multiple mics found, using default');
    return null;
  }

  /* ─────────────── Merge streams ─────────────── */

  function mergeStreams(tab, mic) {
    audioContext = new AudioContext({ sampleRate: 44100 });
    destinationNode = audioContext.createMediaStreamDestination();

    if (tab && tab.getAudioTracks().length > 0) {
      try {
        const tabSource = audioContext.createMediaStreamSource(tab);

        // Add gain control for tab audio
        const tabGain = audioContext.createGain();
        tabGain.gain.value = 1.0;
        tabSource.connect(tabGain);
        tabGain.connect(destinationNode);

        console.log('[MeetRec offscreen] Tab audio connected (gain: 1.0)');
      } catch (err) {
        console.error('[MeetRec offscreen] Failed to connect tab audio:', err);
      }
    }

    if (mic && mic.getAudioTracks().length > 0) {
      try {
        const micSource = audioContext.createMediaStreamSource(mic);

        // BOOST microphone volume since tab capture tends to be louder
        const micGain = audioContext.createGain();
        micGain.gain.value = 1.5; // Boost mic by 50%
        micSource.connect(micGain);
        micGain.connect(destinationNode);

        console.log('[MeetRec offscreen] Microphone connected (gain: 1.5 boosted)');
      } catch (err) {
        console.error('[MeetRec offscreen] Failed to connect mic audio:', err);
      }
    }

    return destinationNode.stream;
  }

  /* ─────────────── Start MediaRecorder ─────────────── */

  function startMediaRecorder(stream) {
    recordedChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

    console.log('[MeetRec offscreen] MediaRecorder MIME:', mimeType);

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('[MeetRec offscreen] MediaRecorder stopped, chunks:', recordedChunks.length);
      await encodeMp3AndDownload();
      cleanup();
    };

    mediaRecorder.onerror = (event) => {
      console.error('[MeetRec offscreen] MediaRecorder error:', event.error);
      chrome.runtime.sendMessage({
        type: 'RECORDING_ERROR',
        error: event.error ? event.error.message : 'MediaRecorder error',
      });
    };

    mediaRecorder.start(1000);
    isRecording = true;
    console.log('[MeetRec offscreen] Recording started');
  }

  /* ─────────────── MP3 encoding ─────────────── */

  async function encodeMp3AndDownload() {
    try {
      if (recordedChunks.length === 0) {
        console.warn('[MeetRec offscreen] No audio chunks to encode');
        chrome.runtime.sendMessage({
          type: 'RECORDING_ERROR',
          error: 'No audio data was captured',
        });
        return;
      }

      const webmBlob = new Blob(recordedChunks, {
        type: recordedChunks[0].type || 'audio/webm',
      });
      console.log('[MeetRec offscreen] WebM size:', (webmBlob.size / 1024).toFixed(1), 'KB');

      const arrayBuffer = await webmBlob.arrayBuffer();
      const decodeContext = new AudioContext({ sampleRate: 44100 });

      let audioBuffer;
      try {
        audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);
      } catch (decodeErr) {
        console.error('[MeetRec offscreen] Decode failed, downloading as webm:', decodeErr);
        downloadBlob(webmBlob, 'webm');
        decodeContext.close();
        return;
      }

      decodeContext.close();

      console.log('[MeetRec offscreen] Decoded:', {
        duration: audioBuffer.duration.toFixed(2) + 's',
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
      });

      const mp3Blob = encodeToMp3(audioBuffer);

      if (!mp3Blob) {
        console.warn('[MeetRec offscreen] MP3 encode failed, downloading webm');
        downloadBlob(webmBlob, 'webm');
        return;
      }

      console.log('[MeetRec offscreen] MP3 size:', (mp3Blob.size / 1024).toFixed(1), 'KB');
      downloadBlob(mp3Blob, 'mp3');

    } catch (err) {
      console.error('[MeetRec offscreen] Encode error:', err);
      chrome.runtime.sendMessage({
        type: 'RECORDING_ERROR',
        error: 'MP3 encoding failed: ' + (err.message || 'Unknown'),
      });
    }
  }

  function encodeToMp3(audioBuffer) {
    try {
      if (typeof lamejs === 'undefined') {
        console.error('[MeetRec offscreen] lamejs not loaded!');
        return null;
      }

      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const kbps = 128;

      const left = audioBuffer.getChannelData(0);
      const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

      const leftPCM = floatTo16BitPCM(left);
      const rightPCM = floatTo16BitPCM(right);

      const encoder = new lamejs.Mp3Encoder(
        channels >= 2 ? 2 : 1,
        sampleRate,
        kbps
      );

      const mp3Parts = [];
      const blockSize = 1152;
      const total = leftPCM.length;

      for (let i = 0; i < total; i += blockSize) {
        const leftBlock = leftPCM.subarray(i, Math.min(i + blockSize, total));
        const rightBlock = rightPCM.subarray(i, Math.min(i + blockSize, total));

        let buf;
        if (channels >= 2) {
          buf = encoder.encodeBuffer(leftBlock, rightBlock);
        } else {
          buf = encoder.encodeBuffer(leftBlock);
        }

        if (buf.length > 0) {
          mp3Parts.push(buf);
        }
      }

      const flush = encoder.flush();
      if (flush.length > 0) {
        mp3Parts.push(flush);
      }

      const totalSize = mp3Parts.reduce((sum, p) => sum + p.length, 0);
      const mp3Array = new Uint8Array(totalSize);
      let offset = 0;
      for (const part of mp3Parts) {
        mp3Array.set(part, offset);
        offset += part.length;
      }

      return new Blob([mp3Array], { type: 'audio/mp3' });

    } catch (err) {
      console.error('[MeetRec offscreen] lamejs error:', err);
      return null;
    }
  }

  function floatTo16BitPCM(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  /* ─────────────── Download ─────────────── */

  function downloadBlob(blob, ext) {
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('-');

    const filename = `meet-recording-${ts}.${ext}`;
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('[MeetRec offscreen] Downloaded:', filename);
      chrome.runtime.sendMessage({ type: 'RECORDING_DOWNLOAD_COMPLETE' });
    }, 1000);
  }

  /* ─────────────── Cleanup ─────────────── */

  function cleanup() {
    if (tabStream) {
      tabStream.getTracks().forEach(t => t.stop());
      tabStream = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    destinationNode = null;
    isRecording = false;
    mediaRecorder = null;
    recordedChunks = [];
  }

  /* ─────────────── Message listener ─────────────── */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {

      case 'OFFSCREEN_START_RECORDING': {
        (async () => {
          try {
            console.log('[MeetRec offscreen] === STARTING RECORDING ===');

            // If content script told us which mic Meet is using
            if (message.micDeviceId) {
              micDeviceId = message.micDeviceId;
              console.log('[MeetRec offscreen] Meet mic device:', micDeviceId);
            }

            // Step 1: Capture tab audio
            const tab = await captureTabAudio(message.tabStreamId);

            // Step 2: Detect and capture the right microphone
            const preferredMic = await detectMeetMicrophone();
            const mic = await captureMicrophone(preferredMic);

            if (!mic) {
              console.warn('[MeetRec offscreen] No mic captured — recording tab audio only');
            }

            // Step 3: Merge
            const merged = mergeStreams(tab, mic);

            // Step 4: Record
            startMediaRecorder(merged);

            sendResponse({ success: true });

          } catch (err) {
            console.error('[MeetRec offscreen] Start failed:', err);
            chrome.runtime.sendMessage({
              type: 'RECORDING_ERROR',
              error: err.message || 'Failed to start recording',
            });
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      case 'OFFSCREEN_STOP_RECORDING': {
        console.log('[MeetRec offscreen] === STOPPING RECORDING ===');

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        } else if (recordedChunks.length > 0) {
          encodeMp3AndDownload().then(() => cleanup());
        } else {
          cleanup();
        }

        sendResponse({ success: true });
        return true;
      }

      case 'OFFSCREEN_SET_MIC_DEVICE': {
        // Content script detected which mic Meet is using
        micDeviceId = message.deviceId;
        console.log('[MeetRec offscreen] Mic device updated:', micDeviceId);

        // If already recording, try to add this mic
        if (isRecording && !micStream && audioContext && destinationNode) {
          captureMicrophone(micDeviceId).then(mic => {
            if (mic) {
              const source = audioContext.createMediaStreamSource(mic);
              const gain = audioContext.createGain();
              gain.gain.value = 1.5;
              source.connect(gain);
              gain.connect(destinationNode);
              console.log('[MeetRec offscreen] Late mic connected');
            }
          });
        }

        sendResponse({ success: true });
        return true;
      }

      case 'OFFSCREEN_CAPTURE_MIC_FALLBACK': {
        (async () => {
          const preferred = await detectMeetMicrophone();
          const mic = await captureMicrophone(preferred);
          if (mic && audioContext && destinationNode) {
            const source = audioContext.createMediaStreamSource(mic);
            const gain = audioContext.createGain();
            gain.gain.value = 1.5;
            source.connect(gain);
            gain.connect(destinationNode);
          }
        })();
        return false;
      }

      case 'PING': {
        sendResponse({ alive: true, isRecording });
        return true;
      }

      default:
        return false;
    }
  });

  console.log('[MeetRec offscreen] Ready');
})();