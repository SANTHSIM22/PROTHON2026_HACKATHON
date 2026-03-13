# MeetRec — Google Meet Audio Recorder

A Google Chrome Extension that records both your microphone and all other
participants' audio from a Google Meet session, merges them into a single
audio stream, and saves the output as an MP3 file.

## Features

- **Dual audio capture**: Records both your microphone and all participants
- **Background recording**: Continues recording even when the popup is closed
  or you switch tabs
- **MP3 output**: Automatically encodes and downloads as an MP3 file
- **Live status**: Shows elapsed time and recording state in real-time
- **Auto-stop**: Automatically stops recording when the Meet tab is closed
- **Persistent state**: Remembers recording state across popup open/close cycles

## Architecture

| Layer | File | Role |
|-------|------|------|
| Popup | `popup.jsx` → `popup.js` | React UI, sends commands to background |
| Background | `background.js` | Service worker, owns recording lifecycle |
| Content Script | `content.js` | Injected into Meet tab, captures microphone |
| Offscreen | `offscreen.js` | Runs MediaRecorder, encodes MP3, triggers download |

## Build Instructions

### Prerequisites

- Node.js 16+ and npm

### Setup

```bash
# Clone and enter the project directory
cd extension

# Install dependencies
npm install

# Generate placeholder icons
node create-icons.js

# Build the extension
npm run build