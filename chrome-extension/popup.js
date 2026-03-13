let mediaRecorder;
let audioChunks = [];
let micStream = null;
let tabStream = null;
let isRecording = false;
let isPaused = false;
let recordingStartTime;
let pausedDuration = 0;
let pauseStartTime = null;
let timerInterval;
let audioContext;
let analyser;
let animationId;
let recordings = [];
let micGainNode;
let tabGainNode;
let tabPlaybackGainNode;
let masterGainNode;
let isWarmedUp = false;

// DOM Elements
const recordBtn = document.getElementById('recordBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const timerDiv = document.getElementById('timer');
const recordingsList = document.getElementById('recordingsList');
const canvas = document.getElementById('canvas');
const canvasCtx = canvas.getContext('2d');
const captureMicCheckbox = document.getElementById('captureMic');
const captureTabCheckbox = document.getElementById('captureTab');
const micVolumeSlider = document.getElementById('micVolume');
const tabVolumeSlider = document.getElementById('tabVolume');
const micVolumeLabel = document.getElementById('micVolumeLabel');
const tabVolumeLabel = document.getElementById('tabVolumeLabel');

canvas.width = canvas.offsetWidth || 340;
canvas.height = canvas.offsetHeight || 80;

micVolumeSlider.addEventListener('input', () => {
    const val = micVolumeSlider.value;
    micVolumeLabel.textContent = val + '%';
    if (micGainNode) micGainNode.gain.value = val / 100;
});

tabVolumeSlider.addEventListener('input', () => {
    const val = tabVolumeSlider.value;
    tabVolumeLabel.textContent = val + '%';
    if (tabGainNode) tabGainNode.gain.value = val / 100;
    if (tabPlaybackGainNode) tabPlaybackGainNode.gain.value = val / 100;
});

async function loadRecordings() {
    try {
        const data = await chrome.storage.local.get(['recordingsMetadata']);
        const metadata = (data && data.recordingsMetadata) || [];
        recordings = metadata.map(r => ({ ...r, blob: null, url: null }));
        renderRecordingsList();
    } catch (error) {
        recordings = [];
        renderRecordingsList();
    }
}

async function saveRecordings() {
    try {
        const recordingsMetadata = recordings.map(r => ({
            id: r.id,
            timestamp: r.timestamp,
            duration: r.duration
        }));
        await chrome.storage.local.set({ recordingsMetadata });
    } catch (error) {
        console.error('Error saving recordings:', error);
    }
}

loadRecordings();

recordBtn.addEventListener('click', startRecording);
pauseBtn.addEventListener('click', togglePause);
stopBtn.addEventListener('click', stopRecording);

// ========== MIC NOISE FILTER CHAIN ==========
function createMicFilterChain(ctx, sourceNode) {
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 85;
    highPass.Q.value = 0.7;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 13000;
    lowPass.Q.value = 0.7;

    const notch50 = ctx.createBiquadFilter();
    notch50.type = 'notch';
    notch50.frequency.value = 50;
    notch50.Q.value = 30;

    const notch60 = ctx.createBiquadFilter();
    notch60.type = 'notch';
    notch60.frequency.value = 60;
    notch60.Q.value = 30;

    const notch100 = ctx.createBiquadFilter();
    notch100.type = 'notch';
    notch100.frequency.value = 100;
    notch100.Q.value = 20;

    const notch120 = ctx.createBiquadFilter();
    notch120.type = 'notch';
    notch120.frequency.value = 120;
    notch120.Q.value = 20;

    const presenceBoost = ctx.createBiquadFilter();
    presenceBoost.type = 'peaking';
    presenceBoost.frequency.value = 3000;
    presenceBoost.gain.value = 2;
    presenceBoost.Q.value = 1;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    sourceNode.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(notch50);
    notch50.connect(notch60);
    notch60.connect(notch100);
    notch100.connect(notch120);
    notch120.connect(presenceBoost);
    presenceBoost.connect(compressor);

    return compressor;
}

// ========== TAB FILTER CHAIN ==========
function createTabFilterChain(ctx, sourceNode) {
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 60;
    highPass.Q.value = 0.5;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 15000;
    lowPass.Q.value = 0.5;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 15;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    sourceNode.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(compressor);

    return compressor;
}

async function startRecording() {
    try {
        audioChunks = [];
        pausedDuration = 0;
        isWarmedUp = false;

        const captureMic = captureMicCheckbox.checked;
        const captureTab = captureTabCheckbox.checked;

        if (!captureMic && !captureTab) {
            statusDiv.textContent = '⚠️ Select at least one audio source';
            return;
        }

        statusDiv.textContent = '⏳ Preparing...';
        recordBtn.disabled = true;

        // ========== STEP 1: Get mic stream FIRST (let it stabilize) ==========
        if (captureMic) {
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 48000,
                        sampleSize: 24,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                });
                console.log('✅ Mic stream obtained');
            } catch (micError) {
                console.error('Mic error:', micError);
                if (!captureTab) {
                    throw new Error('Cannot access microphone: ' + micError.message);
                }
                micStream = null;
            }
        }

        // ========== STEP 2: Get tab stream ==========
        if (captureTab) {
            try {
                tabStream = await captureTabAudio();
                console.log('✅ Tab stream obtained');
            } catch (tabError) {
                console.error('Tab error:', tabError);
                if (!captureMic || !micStream) {
                    throw new Error('Cannot capture tab audio: ' + tabError.message);
                }
                tabStream = null;
            }
        }

        // Check we have at least one stream
        if (!micStream && !tabStream) {
            throw new Error('No audio source available');
        }

        // ========== STEP 3: Let mic hardware settle ==========
        statusDiv.textContent = '⏳ Warming up mic...';
        await new Promise(resolve => setTimeout(resolve, 500));

        // ========== STEP 4: Create audio context and routing ==========
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000,
            latencyHint: 'playback'
        });

        const recordingDestination = audioContext.createMediaStreamDestination();

        // Master gain for recording - starts at 1 (NOT muted)
        masterGainNode = audioContext.createGain();
        masterGainNode.gain.value = 1.0;
        masterGainNode.connect(recordingDestination);

        // Analyser for visualization
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        // ========== STEP 5: Connect mic ==========
        if (micStream) {
            const micSource = audioContext.createMediaStreamSource(micStream);
            const filteredMic = createMicFilterChain(audioContext, micSource);

            micGainNode = audioContext.createGain();
            micGainNode.gain.value = micVolumeSlider.value / 100;

            filteredMic.connect(micGainNode);
            micGainNode.connect(masterGainNode);
            micGainNode.connect(analyser);

            console.log('✅ Mic connected to recording');
        }

        // ========== STEP 6: Connect tab audio ==========
        if (tabStream) {
            const tabSource = audioContext.createMediaStreamSource(tabStream);
            const filteredTab = createTabFilterChain(audioContext, tabSource);

            tabGainNode = audioContext.createGain();
            tabGainNode.gain.value = tabVolumeSlider.value / 100;

            tabPlaybackGainNode = audioContext.createGain();
            tabPlaybackGainNode.gain.value = tabVolumeSlider.value / 100;

            // To recording
            filteredTab.connect(tabGainNode);
            tabGainNode.connect(masterGainNode);
            tabGainNode.connect(analyser);

            // To speakers so you HEAR the meeting
            filteredTab.connect(tabPlaybackGainNode);
            tabPlaybackGainNode.connect(audioContext.destination);

            console.log('✅ Tab audio connected to recording + speakers');
        }

        // ========== STEP 7: Let filters settle ==========
        await new Promise(resolve => setTimeout(resolve, 300));
        isWarmedUp = true;

        // ========== STEP 8: Start MediaRecorder ==========
        const mixedStream = recordingDestination.stream;
        const tracks = mixedStream.getAudioTracks();
        console.log('Audio tracks in mixed stream:', tracks.length);

        if (tracks.length === 0) {
            throw new Error('No audio tracks in mixed stream');
        }

        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

        const options = { audioBitsPerSecond: 320000 };
        if (mimeType) options.mimeType = mimeType;

        mediaRecorder = new MediaRecorder(mixedStream, options);

        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data && event.data.size > 0) {
                console.log('Chunk received:', event.data.size, 'bytes');
                audioChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener('stop', () => {
            console.log('MediaRecorder stopped, total chunks:', audioChunks.length);
            handleRecordingStop();
        });

        mediaRecorder.addEventListener('error', (event) => {
            console.error('MediaRecorder error:', event.error);
            statusDiv.textContent = '❌ Recording error';
            stopRecording();
        });

        // Start recording - collect data every 500ms
        mediaRecorder.start(500);
        console.log('✅ MediaRecorder started, state:', mediaRecorder.state);

        isRecording = true;
        isPaused = false;

        // Update UI
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        pauseBtn.disabled = false;
        captureMicCheckbox.disabled = true;
        captureTabCheckbox.disabled = true;

        let sourceText = [];
        if (micStream) sourceText.push('🎤 Mic');
        if (tabStream) sourceText.push('🔊 Tab');

        statusDiv.textContent = `🔴 Recording (${sourceText.join(' + ')})`;
        statusDiv.classList.add('recording');
        recordingStartTime = Date.now();

        startTimer();
        updateVisualization();

    } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = '❌ ' + error.message;
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        pauseBtn.disabled = true;
        captureMicCheckbox.disabled = false;
        captureTabCheckbox.disabled = false;
        cleanupStreams();
    }
}

function captureTabAudio() {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabCapture.capture(
                { audio: true, video: false },
                (stream) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!stream) {
                        reject(new Error('No audio stream from tab'));
                        return;
                    }
                    resolve(stream);
                }
            );
        } catch (e) {
            reject(e);
        }
    });
}

function togglePause() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    if (isPaused) {
        mediaRecorder.resume();
        isPaused = false;
        pausedDuration += Date.now() - pauseStartTime;
        pauseStartTime = null;
        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> Pause';
        statusDiv.textContent = '🔴 Recording...';
        statusDiv.classList.add('recording');
        updateVisualization();
    } else {
        mediaRecorder.pause();
        isPaused = true;
        pauseStartTime = Date.now();
        pauseBtn.innerHTML = '<span class="btn-icon">▶</span> Resume';
        statusDiv.textContent = '⏸️ Paused';
        statusDiv.classList.remove('recording');
        if (animationId) cancelAnimationFrame(animationId);
    }
}

async function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanupAll();
        return;
    }

    // Request final data before stopping
    try {
        mediaRecorder.requestData();
    } catch (e) {
        console.log('requestData not available');
    }

    // Small delay to collect final chunk
    await new Promise(resolve => setTimeout(resolve, 100));

    mediaRecorder.stop();
    isRecording = false;
    isPaused = false;

    // Don't cleanup streams until handleRecordingStop runs
    if (animationId) cancelAnimationFrame(animationId);
    clearInterval(timerInterval);

    recordBtn.disabled = false;
    stopBtn.disabled = true;
    pauseBtn.disabled = true;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> Pause';
    captureMicCheckbox.disabled = false;
    captureTabCheckbox.disabled = false;
    statusDiv.textContent = '⏳ Saving...';
    statusDiv.classList.remove('recording');
}

function cleanupAll() {
    cleanupStreams();
    if (animationId) cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
    recordBtn.disabled = false;
    stopBtn.disabled = true;
    pauseBtn.disabled = true;
    captureMicCheckbox.disabled = false;
    captureTabCheckbox.disabled = false;
    statusDiv.classList.remove('recording');
}

function cleanupStreams() {
    if (micStream) {
        micStream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) {}
        });
        micStream = null;
    }
    if (tabStream) {
        tabStream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) {}
        });
        tabStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (e) {}
    }
    micGainNode = null;
    tabGainNode = null;
    tabPlaybackGainNode = null;
    masterGainNode = null;
}

function handleRecordingStop() {
    console.log('handleRecordingStop called');
    console.log('Chunks count:', audioChunks.length);

    try {
        if (audioChunks.length === 0) {
            statusDiv.textContent = '⚠️ No audio was captured';
            cleanupStreams();
            return;
        }

        // Calculate total size
        let totalSize = 0;
        audioChunks.forEach(chunk => {
            totalSize += chunk.size;
        });
        console.log('Total audio data:', totalSize, 'bytes');

        if (totalSize < 100) {
            statusDiv.textContent = '⚠️ Recording too short or empty';
            cleanupStreams();
            return;
        }

        // Use ALL chunks - do NOT skip any
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        console.log('Final blob size:', audioBlob.size, 'type:', mimeType);

        const timestamp = new Date().toLocaleString();

        let totalSeconds = Math.floor((Date.now() - recordingStartTime - pausedDuration) / 1000);
        if (isPaused && pauseStartTime) {
            totalSeconds -= Math.floor((Date.now() - pauseStartTime) / 1000);
        }
        const duration = formatTime(Math.max(0, totalSeconds));

        const recording = {
            id: Date.now(),
            blob: audioBlob,
            timestamp,
            duration,
            url: URL.createObjectURL(audioBlob),
            size: formatFileSize(audioBlob.size)
        };

        recordings.unshift(recording);
        saveRecordings();
        renderRecordingsList();

        // Download the file
        downloadBlob(audioBlob, timestamp);

        statusDiv.textContent = `✅ Saved! (${recording.size}, ${duration})`;

        // Cleanup streams AFTER saving
        cleanupStreams();

    } catch (error) {
        console.error('Error in handleRecordingStop:', error);
        statusDiv.textContent = '❌ Error: ' + error.message;
        cleanupStreams();
    }
}

function downloadBlob(blob, timestamp) {
    try {
        const safeName = timestamp.replace(/[/:,\s]/g, '-');
        const filename = `recording_HQ_${safeName}.webm`;
        const url = URL.createObjectURL(blob);

        // Try chrome downloads API first
        if (chrome.downloads) {
            chrome.downloads.download({
                url: url,
                filename: `Audio_Recordings/${filename}`,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome download error:', chrome.runtime.lastError);
                    // Fallback to link download
                    fallbackDownload(url, filename);
                } else {
                    console.log('✅ Download started, ID:', downloadId);
                }
                setTimeout(() => {
                    try { URL.revokeObjectURL(url); } catch (e) {}
                }, 10000);
            });
        } else {
            fallbackDownload(url, filename);
        }
    } catch (error) {
        console.error('Download error:', error);
    }
}

function fallbackDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch (e) {}
    }, 10000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPaused) {
            let elapsed = Date.now() - recordingStartTime - pausedDuration;
            timerDiv.textContent = formatTime(Math.floor(elapsed / 1000));
        }
    }, 200);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateVisualization() {
    if (!analyser || !isRecording || isPaused) return;

    try {
        animationId = requestAnimationFrame(updateVisualization);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#f0f2ff';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 4;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            const intensity = dataArray[i] / 255;
            const r = Math.floor(102 + intensity * 153);
            const g = Math.floor(126 - intensity * 60);
            const b = Math.floor(234 - intensity * 100);

            canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

            x += barWidth;
            if (x > canvas.width) break;
        }
    } catch (error) {
        console.error('Viz error:', error);
    }
}

function renderRecordingsList() {
    try {
        recordingsList.innerHTML = '';

        if (!recordings || recordings.length === 0) {
            recordingsList.innerHTML = '<p class="empty-message">No recordings yet</p>';
            return;
        }

        recordings.forEach((recording, index) => {
            const item = document.createElement('div');
            item.className = 'recording-item';
            const hasBlob = recording.blob && recording.url;

            item.innerHTML = `
                <div class="recording-item-info">
                    <div class="recording-name">🎵 Recording ${recordings.length - index}</div>
                    <div class="recording-time">${recording.timestamp}</div>
                    <div class="recording-meta">Duration: ${recording.duration} ${recording.size ? '| ' + recording.size : ''}</div>
                </div>
                <div class="recording-actions">
                    ${hasBlob ? `
                        <button class="action-btn play-btn" data-id="${recording.id}">▶</button>
                        <button class="action-btn download-btn" data-id="${recording.id}">💾</button>
                    ` : `
                        <span class="expired-label">✓ Saved</span>
                    `}
                    <button class="action-btn delete-btn" data-id="${recording.id}">🗑️</button>
                </div>
            `;
            recordingsList.appendChild(item);
        });

        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', () => playRecording(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => downloadRecording(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteRecording(parseInt(btn.dataset.id)));
        });
    } catch (error) {
        console.error('Render error:', error);
    }
}

let currentAudio = null;

function playRecording(id) {
    const recording = recordings.find(r => r.id === id);
    if (recording && recording.url) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        currentAudio = new Audio(recording.url);
        currentAudio.play();
    }
}

function downloadRecording(id) {
    const recording = recordings.find(r => r.id === id);
    if (recording && recording.blob) {
        downloadBlob(recording.blob, recording.timestamp);
    }
}

function deleteRecording(id) {
    const index = recordings.findIndex(r => r.id === id);
    if (index > -1) {
        if (recordings[index].url) {
            try { URL.revokeObjectURL(recordings[index].url); } catch (e) {}
        }
        recordings.splice(index, 1);
        saveRecordings();
        renderRecordingsList();
    }
}