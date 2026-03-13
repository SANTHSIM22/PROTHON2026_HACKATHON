console.log('Audio Recorder Pro service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Audio Recorder Pro installed successfully');
});

// Handle tab audio capture requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTabCapture') {
        chrome.tabCapture.capture(
            {
                audio: true,
                video: false
            },
            (stream) => {
                if (chrome.runtime.lastError) {
                    console.error('Tab capture error:', chrome.runtime.lastError.message);
                    sendResponse({
                        success: false,
                        error: chrome.runtime.lastError.message
                    });
                    return;
                }

                if (!stream) {
                    sendResponse({
                        success: false,
                        error: 'No stream returned from tab capture'
                    });
                    return;
                }

                // We cannot send MediaStream through message passing
                // Instead we use a different approach - store stream ID
                const streamId = stream.id;

                // Store the stream globally so popup can access via getStreamById
                if (!globalThis.capturedStreams) {
                    globalThis.capturedStreams = {};
                }
                globalThis.capturedStreams[streamId] = stream;

                sendResponse({
                    success: true,
                    streamId: streamId
                });
            }
        );
        return true; // Keep message channel open for async response
    }

    if (request.action === 'stopTabCapture') {
        if (globalThis.capturedStreams) {
            Object.values(globalThis.capturedStreams).forEach(stream => {
                stream.getTracks().forEach(track => track.stop());
            });
            globalThis.capturedStreams = {};
        }
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'getCapturedStream') {
        const stream = globalThis.capturedStreams?.[request.streamId];
        if (stream && stream.active) {
            sendResponse({ success: true, active: true });
        } else {
            sendResponse({ success: false, active: false });
        }
        return true;
    }
});