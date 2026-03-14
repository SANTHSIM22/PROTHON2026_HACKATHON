// offscreen.js
let mediaRecorder;
let audioChunks = [];
let userToken = "";

// Speech Recognition Variables
let recognition;
let transcriptData = [];
let recordingStartTime = 0;

async function startRecording(token) {
  userToken = token;
  audioChunks = []; // Reset chunks for a clean fresh recording
  transcriptData = [];
  recordingStartTime = Date.now();

  try {
    // Setup Native Chrome Free ML Transcription with Timestamps
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Changed to true so we detect when they START speaking
      
      let currentPhraseStartTime = null;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          
          // If we haven't marked a start time for this burst of speech, mark it now!
          if (currentPhraseStartTime === null) {
            currentPhraseStartTime = Date.now() - recordingStartTime;
          }

          if (event.results[i].isFinal) {
            // When isFinal is true, it means they stopped talking (silence)
            transcriptData.push({
               text: event.results[i][0].transcript.trim(),
               timestamp: currentPhraseStartTime,       // Absolute start time of the speech
               endTime: Date.now() - recordingStartTime // Absolute end time (they are now silent)
            });
            // Reset the start time so the next gap of silence is properly ignored
            currentPhraseStartTime = null;
          }
        }
      };

      // Restart automatically if Google suspends it during a long silence
      recognition.onend = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
           try { recognition.start(); } catch(e) {}
        }
      };

      recognition.start();
    }

    // High-quality constraints simulating top-tier audio extraction 
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,   // Allow absolute raw audio to hit the FFmpeg server processor
        noiseSuppression: false,   // FFmpeg will handle noise reduction 100x better
        autoGainControl: false,    // FFmpeg loudnorm will handle volume leveling accurately
        sampleRate: 48000,
        sampleSize: 16,
        channelCount: 2            
      } 
    });

    // High-fidelity webm/opus encoding for transmission
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 256000 
    };
    
    // Fallback if browser doesn't support the exact mime type configured above
    mediaRecorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
    
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      // Cleanly shutdown speech-to-text
      if (recognition) {
        recognition.onend = null; 
        try { recognition.stop(); } catch(e) {}
      }

      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: actualMimeType });
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.webm'); // Name doesn't affect type
      
      // Inject our exact timestamps and transcript JSON
      formData.append('transcriptData', JSON.stringify(transcriptData));
      
      // In production, change the hardcoded URL to your https://prod-url/api/... or inject from a config.
      const UPLOAD_URL = 'https://prothon2026-hackathon.onrender.com/api/recordings/upload';
      try {
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + userToken
          },
          body: formData
        });

        console.log('Recording uploaded.');
      } catch (err) {
        console.error('Failed to upload audio chunk', err);
      }
      
      // Stop all tracks and close the offscreen document
      stream.getTracks().forEach(track => track.stop());
      window.close(); // Clean up memory and remove offscreen document
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone', error);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    window.close();
  }
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'RECORDING_COMMAND') {
    if (message.command === 'start') {
      startRecording(message.token);
    } else if (message.command === 'stop') {
      stopRecording();
    }
  }
});