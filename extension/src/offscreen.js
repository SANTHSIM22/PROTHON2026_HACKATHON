/*
 * offscreen.js — MeetRec Offscreen Document
 *
 * Captures tab audio via tabCapture stream ID.
 * Receives mic PCM data from content script (via background).
 * Merges both into a single stream using AudioContext.
 * Records with MediaRecorder → encodes to MP3 → downloads.
 */

(function () {
  'use strict';

  let mediaRecorder = null;
  let recordedChunks = [];
  let audioContext = null;
  let tabStream = null;
  let destinationNode = null;
  let isRecording = false;

  // Mic PCM buffering
  let micBufferSource = null;
  let micGainNode = null;
  let micSampleRate = 44100;
  let micPcmQueue = [];
  let micProcessorInterval = null;
  let micScriptNode = null;

  /* ────────── Capture tab audio ────────── */

  async function captureTabAudio(tabStreamId) {
    console.log('[offscreen] Capturing tab audio...');

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

    const tracks = stream.getAudioTracks();
    console.log('[offscreen] ✅ Tab audio:', tracks.length, 'tracks');
    if (tracks[0]) {
      console.log('[offscreen]   Label:', tracks[0].label);
    }

    return stream;
  }

  /* ────────── Set up audio merger ────────── */

  function setupMerger(tabAudioStream) {
    audioContext = new AudioContext({ sampleRate: 44100 });
    destinationNode = audioContext.createMediaStreamDestination();

    // Connect tab audio
    if (tabAudioStream && tabAudioStream.getAudioTracks().length > 0) {
      const tabSource = audioContext.createMediaStreamSource(tabAudioStream);
      const tabGain = audioContext.createGain();
      tabGain.gain.value = 1.0;
      tabSource.connect(tabGain);
      tabGain.connect(destinationNode);
      console.log('[offscreen] ✅ Tab audio connected (gain: 1.0)');
    }

    // Set up mic PCM playback node
    // We use a ScriptProcessorNode that reads from our PCM queue
    const bufferSize = 4096;
    micScriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

    micGainNode = audioContext.createGain();
    micGainNode.gain.value = 2.5; // Boost mic significantly

    micScriptNode.onaudioprocess = function (event) {
      const output = event.outputBuffer.getChannelData(0);

      if (micPcmQueue.length > 0) {
        const chunk = micPcmQueue.shift();

        // Copy PCM data to output, handling size differences
        const copyLength = Math.min(chunk.length, output.length);
        for (let i = 0; i < copyLength; i++) {
          output[i] = chunk[i];
        }
        // Fill rest with silence
        for (let i = copyLength; i < output.length; i++) {
          output[i] = 0;
        }
      } else {
        // No mic data available, output silence
        for (let i = 0; i < output.length; i++) {
          output[i] = 0;
        }
      }
    };

    // Connect mic processor through gain to destination
    micScriptNode.connect(micGainNode);
    micGainNode.connect(destinationNode);

    console.log('[offscreen] ✅ Mic PCM processor connected (gain: 2.5)');
    console.log('[offscreen] ✅ Audio merger ready');

    return destinationNode.stream;
  }

  /* ────────── Receive mic PCM data ────────── */

  function receiveMicPCM(pcmArray, sampleRate) {
    if (!isRecording) return;

    // Convert array back to Float32Array
    const pcm = new Float32Array(pcmArray);

    // If sample rates differ, we need to resample
    if (sampleRate && sampleRate !== 44100) {
      const resampled = resample(pcm, sampleRate, 44100);
      micPcmQueue.push(resampled);
    } else {
      micPcmQueue.push(pcm);
    }

    // Prevent queue from growing too large (max ~5 seconds)
    while (micPcmQueue.length > 50) {
      micPcmQueue.shift();
    }
  }

  /* ────────── Simple linear resampling ────────── */

  function resample(input, fromRate, toRate) {
    if (fromRate === toRate) return input;

    const ratio = fromRate / toRate;
    const outputLength = Math.round(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
      const frac = srcIndex - srcIndexFloor;

      output[i] = input[srcIndexFloor] * (1 - frac) + input[srcIndexCeil] * frac;
    }

    return output;
  }

  /* ────────── Start MediaRecorder ────────── */

  function startMediaRecorder(stream) {
    recordedChunks = [];
    micPcmQueue = [];

    const tracks = stream.getAudioTracks();
    console.log('[offscreen] Recording stream:', tracks.length, 'tracks');

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

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
      console.log('[offscreen] MediaRecorder stopped');
      console.log('[offscreen] Chunks:', recordedChunks.length);

      const totalBytes = recordedChunks.reduce((s, c) => s + c.size, 0);
      console.log('[offscreen] Raw size:', (totalBytes / 1024).toFixed(1), 'KB');

      await encodeMp3AndDownload();
      cleanup();
    };

    mediaRecorder.onerror = (event) => {
      console.error('[offscreen] MediaRecorder error:', event.error);
      chrome.runtime.sendMessage({
        type: 'RECORDING_ERROR',
        error: event.error ? event.error.message : 'Recording error',
      });
    };

    mediaRecorder.start(1000);
    isRecording = true;
    console.log('[offscreen] ✅ Recording started');
    console.log('[offscreen] ✅ Waiting for mic PCM data from content script...');
  }

  /* ────────── MP3 encoding ────────── */

  async function encodeMp3AndDownload() {
    try {
      if (recordedChunks.length === 0) {
        chrome.runtime.sendMessage({
          type: 'RECORDING_ERROR',
          error: 'No audio data captured',
        });
        return;
      }

      const webmBlob = new Blob(recordedChunks, {
        type: recordedChunks[0].type || 'audio/webm',
      });

      console.log('[offscreen] WebM:', (webmBlob.size / 1024 / 1024).toFixed(2), 'MB');

      const arrayBuffer = await webmBlob.arrayBuffer();
      const decodeCtx = new AudioContext({ sampleRate: 44100 });

      let audioBuffer;
      try {
        audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.error('[offscreen] Decode failed, saving WebM:', err);
        downloadBlob(webmBlob, 'webm');
        decodeCtx.close();
        return;
      }

      decodeCtx.close();

      console.log('[offscreen] Decoded:',
        audioBuffer.duration.toFixed(2), 's,',
        audioBuffer.sampleRate, 'Hz,',
        audioBuffer.numberOfChannels, 'ch');

      const mp3Blob = encodeToMp3(audioBuffer);

      if (!mp3Blob) {
        downloadBlob(webmBlob, 'webm');
        return;
      }

      console.log('[offscreen] MP3:', (mp3Blob.size / 1024 / 1024).toFixed(2), 'MB');
      downloadBlob(mp3Blob, 'mp3');

    } catch (err) {
      console.error('[offscreen] Encode error:', err);
      chrome.runtime.sendMessage({
        type: 'RECORDING_ERROR',
        error: 'Encoding failed: ' + err.message,
      });
    }
  }

  function encodeToMp3(audioBuffer) {
    try {
      if (typeof lamejs === 'undefined') {
        console.error('[offscreen] lamejs not loaded');
        return null;
      }

      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const left = audioBuffer.getChannelData(0);
      const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

      const leftPCM = floatTo16BitPCM(left);
      const rightPCM = floatTo16BitPCM(right);

      const encoder = new lamejs.Mp3Encoder(
        channels >= 2 ? 2 : 1,
        sampleRate,
        128
      );

      const parts = [];
      const block = 1152;

      for (let i = 0; i < leftPCM.length; i += block) {
        const lb = leftPCM.subarray(i, Math.min(i + block, leftPCM.length));
        const rb = rightPCM.subarray(i, Math.min(i + block, rightPCM.length));

        const buf = channels >= 2
          ? encoder.encodeBuffer(lb, rb)
          : encoder.encodeBuffer(lb);

        if (buf.length > 0) parts.push(buf);
      }

      const flush = encoder.flush();
      if (flush.length > 0) parts.push(flush);

      const size = parts.reduce((s, p) => s + p.length, 0);
      const arr = new Uint8Array(size);
      let offset = 0;
      for (const p of parts) {
        arr.set(p, offset);
        offset += p.length;
      }

      return new Blob([arr], { type: 'audio/mp3' });

    } catch (err) {
      console.error('[offscreen] lamejs error:', err);
      return null;
    }
  }

  function floatTo16BitPCM(f32) {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return i16;
  }

  /* ────────── Download ────────── */

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
      console.log('[offscreen] ✅ Downloaded:', filename);
      chrome.runtime.sendMessage({ type: 'RECORDING_DOWNLOAD_COMPLETE' });
    }, 1500);
  }

  /* ────────── Cleanup ────────── */

  function cleanup() {
    isRecording = false;
    micPcmQueue = [];

    if (micScriptNode) {
      micScriptNode.disconnect();
      micScriptNode.onaudioprocess = null;
      micScriptNode = null;
    }
    if (micGainNode) {
      micGainNode.disconnect();
      micGainNode = null;
    }
    if (tabStream) {
      tabStream.getTracks().forEach(t => t.stop());
      tabStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    destinationNode = null;
    mediaRecorder = null;
    recordedChunks = [];
    console.log('[offscreen] Cleaned up');
  }

  /* ────────── Message handler ────────── */

  let micChunksReceived = 0;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {

      case 'OFFSCREEN_START_RECORDING': {
        (async () => {
          try {
            console.log('[offscreen] ═══════════════════════════');
            console.log('[offscreen] START RECORDING');
            console.log('[offscreen] ═══════════════════════════');

            // Capture tab audio
            const tab = await captureTabAudio(message.tabStreamId);

            // Set up merger (tab audio + mic PCM playback)
            const merged = setupMerger(tab);

            // Start recording the merged stream
            startMediaRecorder(merged);

            micChunksReceived = 0;

            sendResponse({ success: true });

          } catch (err) {
            console.error('[offscreen] Start failed:', err);
            chrome.runtime.sendMessage({
              type: 'RECORDING_ERROR',
              error: err.message,
            });
            sendResponse({ success: false, error: err.message });
          }
        })();
        return true;
      }

      case 'OFFSCREEN_STOP_RECORDING': {
        console.log('[offscreen] ═══════════════════════════');
        console.log('[offscreen] STOP RECORDING');
        console.log('[offscreen] Mic chunks received:', micChunksReceived);
        console.log('[offscreen] ═══════════════════════════');

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

      case 'OFFSCREEN_MIC_PCM': {
        // Receive mic PCM data forwarded from content script via background
        if (message.pcm && isRecording) {
          receiveMicPCM(message.pcm, message.sampleRate);
          micChunksReceived++;

          if (micChunksReceived === 1) {
            console.log('[offscreen] ✅ First mic PCM chunk received! Mic audio is flowing.');
          }
          if (micChunksReceived % 100 === 0) {
            console.log('[offscreen] Mic chunks received:', micChunksReceived,
              '| Queue:', micPcmQueue.length);
          }
        }
        return false;
      }

      case 'OFFSCREEN_MIC_INFO': {
        micSampleRate = message.sampleRate || 44100;
        console.log('[offscreen] Mic info:', message.label, '@', micSampleRate, 'Hz');
        return false;
      }

      case 'PING': {
        sendResponse({ alive: true, isRecording: isRecording });
        return true;
      }

      default:
        return false;
    }
  });

  console.log('[offscreen] ✅ Ready');
})();