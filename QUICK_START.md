# Claude Auto-Prompt Chrome Extension - Quick Start

## What This Does

Opens a new Claude tab automatically every **5 hours**, sends a prompt (default: "."), and closes the tab after Claude responds. Runs completely in the background.

## Installation (5 minutes)

### 1. Get the Files
All files are in: `/home/claude/`
- manifest.json
- background.js
- content.js
- popup.html
- popup.js

### 2. Create Extension Folder
On your Windows machine:
1. Create a folder: `C:\chrome-extensions\claude-auto-prompt`
2. Copy all 5 files listed above into this folder

### 3. Load into Chrome
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select your `claude-auto-prompt` folder
6. ✅ Extension is now installed!

### 4. Configure
1. Click extension icon in toolbar
2. Enter your prompt (or leave as ".")
3. Click **Save & Enable**
4. Done!

## Usage

- **Automatic**: Runs every 5 hours, no action needed
- **Popup shows**: When next run will occur
- **Console logs**: Right-click extension → Inspect → Console

## Files Explained

| File | Purpose |
|------|---------|
| manifest.json | Extension config & permissions |
| background.js | Runs the 5-hour alarm, opens tabs |
| content.js | Interacts with Claude UI |
| popup.html/js | Settings panel for prompt |

## Customization

### Change 5-hour interval
Edit line 3 of `background.js`:
```javascript
const INTERVAL_MINUTES = 5 * 60; // Change 5 to your desired hours
```

### Change model
Edit `content.js` function `selectHaikuModel()` to target different model

### Change default prompt
The default is "." (single period) - great for keep-alive pings

## Troubleshooting

**Tab doesn't open?**
- Must be logged into claude.ai
- Check chrome console (Inspect) for errors

**Claude UI changed?**
- Claude.ai updates may break CSS selectors
- Check console for "selector not found" messages
- May need to update selectors in `content.js`

**Extension stops running?**
- Reload from `chrome://extensions/`
- Check that Developer mode is still enabled

## Architecture

```
Every 5 hours:
  ├─ background.js triggers alarm
  ├─ Opens https://claude.ai/new in new tab
  ├─ Injects content.js script
  ├─ content.js selects Haiku 4.5 model
  ├─ content.js sends your prompt
  ├─ content.js waits for response
  └─ content.js closes tab after 5 seconds
```

## Notes

- Requires being logged into claude.ai
- Chrome must stay open (or use background mode)
- Uses minimal CPU/memory (only active every 5 hours)
- No external dependencies needed
- Works offline after first load

---

Questions? Check the browser console (right-click extension → Inspect) for detailed logs.
