# Installation & Setup Guide

## Step-by-Step Installation

### Prerequisites
- ✅ Google Chrome, Edge, Brave, or Opera browser
- ✅ Windows/Mac/Linux (any OS)
- ✅ This `chrome-extension` folder

---

## Method 1: Developer Mode Installation (Easiest)

### Step 1: Open Extensions Page
1. Open **Google Chrome** (or Edge/Brave/Opera)
2. Click the **three dots menu** (⋮) in top-right
3. Go to **Settings** (or More tools → Extensions)
4. Alternatively, type in address bar: `chrome://extensions/`

```
Chrome Menu → More Tools → Extensions
    OR
Type: chrome://extensions/
```

### Step 2: Enable Developer Mode
1. Look at the **top-right corner** of the extensions page
2. Find the **"Developer mode"** toggle
3. **Click it to turn ON** (toggle will be blue)

![Developer Mode should look like this]
```
┌─────────────────────────────────────┐
│ Developer mode              [Toggle] │
└─────────────────────────────────────┘
```

### Step 3: Load Unpacked Extension
1. After enabling Developer mode, three buttons appear:
   - "Load unpacked" ← Click this one
   - "Pack extension"
   - "Update"
2. Click **"Load unpacked"**

### Step 4: Select the Extension Folder
1. A file browser will open
2. Navigate to: `Prothon_hackathon → chrome-extension`
3. **Select the "chrome-extension" folder** (not a file, the whole folder!)
4. Click **"Select Folder"** (or "Open")

### Step 5: Verify Installation
✅ You should see:
- Extension appears in the list at chrome://extensions/
- Purple microphone icon (🎙️) appears in Chrome toolbar
- Shows "Audio Recorder Pro" with version "1.0.0"

---

## Method 2: Zip File Installation

### If Your Files Are in a ZIP

1. **Extract the ZIP file**
   - Windows: Right-click → Extract All
   - Mac: Double-click automatically extracts
   - Linux: `unzip filename.zip`

2. Find the extracted `chrome-extension` folder

3. Follow **Method 1** steps above starting from Step 1

---

## Method 3: From GitHub

If you're cloning from version control:

```bash
# Clone the repository
git clone <repo-url>

# Navigate to the extension folder
cd Prothon_hackathon/chrome-extension

# Then follow Method 1 for installation
```

---

## Enabling the Extension in Toolbar

The extension might not be immediately visible. To pin it:

1. Click the **Puzzle Piece icon** (🧩) in Chrome toolbar
   - Located in top-right, near your avatar

2. Look for **"Audio Recorder Pro"**

3. Click the **pin icon** (📌) next to it

4. Now 🎙️ should appear in your toolbar!

---

## First Time Setup

### 1. Request Camera/Microphone Permission
- When you click "Start Recording" for the first time
- Chrome will ask: "Audio Recorder Pro wants to access your camera and microphone"
- Click **"Allow"**

### 2. Test Your Microphone
- Navigate to: `chrome://settings/privacy/microphone`
- You should see "Audio Recorder Pro" in the list
- Make sure it's set to "Allow" (not "Deny")

### 3. Test with a Recording
1. Click the 🎙️ icon in toolbar
2. Select quality: "Medium" (good default)
3. Click "Start Recording"
4. Say something / make a sound
5. Click "Stop Recording"
6. Should see the recording in the list
7. Click "Download" to save

---

## Troubleshooting Installation

### Extension Icon Not Showing

**Problem:** Can't find the 🎙️ icon in toolbar

**Solution:**
1. Go to `chrome://extensions`
2. Find "Audio Recorder Pro"
3. Check if it's **enabled** (toggle is blue)
   - If toggle is gray, click it to enable
4. Find the puzzle piece (🧩) in toolbar
5. Pin "Audio Recorder Pro"

---

### Extension Won't Load

**Problem:** Error when clicking "Load unpacked"

**Possible Causes & Solutions:**

| Error | Solution |
|-------|----------|
| "Manifest parsing error" | Make sure `manifest.json` exists in selected folder |
| "Invalid manifest" | Delete all `.git`, `node_modules` folders, try again |
| "Permission denied" | Right-click folder → Properties → Uncheck "Read-only" |
| "Invalid extension" | Don't select a file, select the whole folder |

---

### Chrome Crashes After Adding Extension

**Problem:** Browser keeps crashing after installation

**Solution:**
1. Go to `chrome://extensions`
2. Find "Audio Recorder Pro"
3. Toggle **OFF** temporarily
4. Restart Chrome
5. Toggle **back ON**
6. If still crashing, uninstall and reinstall

---

## Uninstalling the Extension

### If You Want to Remove It:

1. Go to `chrome://extensions`
2. Find "Audio Recorder Pro"
3. Click **"Remove"** button
4. Confirm deletion
5. Extension is permanently removed

### To Update/Reinstall:
Just repeat the installation steps - Chrome will replace the old version

---

## System Permissions to Allow

When using the extension, you'll see permission prompts:

### Microphone Permission
```
"Audio Recorder Pro wants to access your microphone"
→ Click "Allow" (required for recording)
```

### Optional: Camera Permission
```
"Audio Recorder Pro wants to access your camera"
→ Click "Allow" (only if you want video + audio)
```

Don't worry - this extension does NOT record video, only uses camera permission to access audio devices.

---

## Permissions Explained

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| Microphone | Record your voice | ✅ Yes |
| Camera | Access audio hardware | ⚠️ Optional |
| Downloads | Save files | ✅ Yes |
| Storage | Remember recordings | ✅ Yes |
| Tab Access | See which page you're on | ✅ Yes |

---

## Browser Version Check

Make sure you're using a modern Chrome version:

1. Click **⋮ menu → Help → About Google Chrome**
2. Your version should be **80 or higher**
3. Older versions may not support all features

---

## After Installation: Next Steps

1. ✅ Click the 🎙️ icon in toolbar
2. ✅ Select "Medium" quality
3. ✅ Click "Start Recording"
4. ✅ Say something like "Testing 1, 2, 3"
5. ✅ Click "Stop Recording"
6. ✅ Click "Download" to save
7. ✅ Go to Downloads folder → Audio_Recordings
8. ✅ You should see your `recording_*.webm` file!

---

## Getting Help

If you're stuck at any step:

1. Check **QUICK_START.md** for fast walkthrough
2. See **README.md** for detailed information
3. Check **FEATURES.md** for technical details

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Windows 7+ / Mac 10.12+ / Ubuntu 16+ | Latest OS |
| RAM | 2 GB | 8 GB |
| Disk Space | 500 MB free | 10 GB free |
| Chrome Version | 80+ | Latest |
| Processor | Dual Core 1 GHz | Modern Multi-Core |

---

## Tips for Best Results

📌 **For Google Meet/Zoom:**
- Start recording BEFORE the call begins
- Make sure audio is working before recording
- Test your microphone volume in Chrome settings

📌 **For System Audio:**
- Close all other recording applications
- Make sure your system sound is on
- Some websites may have restrictions

📌 **For File Organization:**
- Files auto-save to: `Downloads/Audio_Recordings/`
- Create subfolders for different projects
- Use descriptive names when saving

---

## Advanced: Manual Installation

If you prefer not to use Developer Mode:

1. **Pack the extension:**
   - Go to `chrome://extensions`
   - Click "Pack extension"
   - Select the `chrome-extension` folder
   - Creates a `.crx` file

2. **Drag and drop:**
   - Disable Developer mode
   - Drag the `.crx` file into Chrome

---

**You're all set!** 🎉

Your audio recorder is ready to use. Start recording high-quality audio from any web source!

For questions, refer to README.md or QUICK_START.md

Happy recording! 🎙️
