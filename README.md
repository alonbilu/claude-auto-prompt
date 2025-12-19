# Claude Auto-Prompt

A Chrome extension that automatically opens Claude and sends a prompt every 5 hours. Perfect for keeping your conversation history fresh, with support for quiet hours to avoid nighttime interruptions.

## Features

✨ **Automatic Scheduling** - Runs automatically every 5 hours  
⚙️ **Configurable Prompt** - Set any prompt you want (default: ".")  
🤖 **Model Selection** - Choose which Claude model to use  
🧠 **Extended Thinking Control** - Automatically disables extended thinking before sending  
⏸️ **Quiet Hours** - Pause automation during nighttime or other periods  
⚡ **One-Click Testing** - Test the automation immediately with a button click  
📱 **Smart Detection** - Automatically closes the tab after receiving a response  
💾 **Persistent Settings** - Your prompt, model, and quiet hours are saved locally  

## Installation

### From Source

1. **Download** the latest release or clone this repository
2. **Unzip** the extension files
3. Go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked** and select the extension folder
6. The extension icon will appear in your toolbar

### Quick Start

1. Click the **Claude Auto-Prompt** extension icon
2. (Optional) Enter your custom prompt and model name
3. (Optional) Enable quiet hours and set your schedule
4. Click **Save & Enable** to activate
5. Status will show "Active" with next run time
6. Click **Test Now** to run immediately, or wait for the automatic 5-hour interval

## Configuration

### Popup Settings

**Prompt Field**
- What message to send to Claude
- Default: `.` (a single dot)
- Leave empty to use default

**Claude Model Field**
- Which Claude model to use (URL parameter)
- Default: `claude-3-5-haiku-20241022` (fast and economical)
- Examples:
  - `claude-3-5-haiku-20241022` - Fast, cheap (default)
  - `claude-3-5-sonnet-20241022` - Balanced capability/speed
  - `claude-opus-4-1-20250805` - Most capable, slower
  - Any valid Claude model ID

**Quiet Hours** ⭐ **NEW!**
- Enable quiet hours to pause automation during specific times (e.g., night time)
- Set "From" and "To" hours in 24-hour format
- Example: From 22, To 7 = Paused 10pm-7am
- When quiet hours end, the extension immediately sends a call
- Perfect for reducing night-time API calls and interruptions

**Quiet Hours** (NEW in v1.1.0!)
- **Enable**: Toggle with checkbox to pause automation during specific hours
- **From**: Start hour (0-23, military time)
- **To**: End hour (0-23, military time)
- **Examples**:
  - `22` to `7` = Pause 10pm to 7am (nighttime)
  - `0` to `6` = Pause midnight to 6am
  - `20` to `8` = Pause 8pm to 8am
- **Behavior**:
  - During quiet hours: Automation is paused
  - When quiet hours end: Automation runs immediately
  - Respects midnight boundary (e.g., 22 to 7 spans midnight)

### What Happens When It Runs

1. Opens a new tab with Claude
2. Injects your prompt into the text box
3. Disables Extended thinking (if enabled)
4. Sends the message automatically
5. Waits for Claude's response
6. Closes the tab automatically
7. Waits for next interval (or until quiet hours end if enabled)

## How It Works

### Architecture

- **background.js** - Service worker that manages alarms and tab automation
- **content.js** - Content script injected into Claude.ai that types the prompt
- **popup.js** - Handles UI interactions and settings management
- **popup.html** - Extension popup interface

### Key Technologies

- Chrome Extensions API (Manifest V3)
- Chrome Storage API (local persistence)
- Chrome Alarms API (scheduling)
- Chrome Tabs API (automation)
- Chrome Scripting API (DOM manipulation)

### Prompt Injection Method

The extension uses `document.execCommand('insertText')` to inject text into Claude's textarea, which works with React's controlled components by dispatching proper input events.

### Quiet Hours Logic

- Uses JavaScript `Date` object to check current local time
- Handles midnight boundary correctly (e.g., 22:00 to 07:00)
- When alarm fires during quiet hours, reschedules for end time
- When quiet hours end, automation runs immediately
- Runs every 5 hours during active (non-quiet) periods

## Troubleshooting

### Extension not opening Claude tab
- Check that you have the latest version
- Ensure the "storage" permission is granted
- Try clicking "Test Now" manually

### Prompt not appearing in textarea
- Wait a moment after the page loads
- Extended thinking button click might be interfering
- Check browser console for errors (F12)

### Settings not saving
- Reload the extension in `chrome://extensions/`
- Check that you have granted "Storage" permission
- Try resetting to default first

### Test button not working
- Ensure you're not blocking popups for claude.ai
- Check that storage permission is granted
- Try reloading the extension

### Quiet hours not working
- Make sure "Enable Quiet Hours" checkbox is checked
- Verify the time range is correct (24-hour format)
- Check that "From" and "To" hours are different
- Example: Don't use 7 to 7, use 22 to 8 (10pm to 8am)

## Files

```
claude-auto-prompt/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for scheduling
├── content.js              # Content script for DOM injection
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
├── README.md               # This file
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── .gitignore              # Git ignore rules
```

## Permissions Explained

| Permission | Used For |
|-----------|----------|
| `alarms` | Scheduling 5-hour interval runs |
| `tabs` | Opening new tabs and closing them |
| `scripting` | Injecting content scripts into Claude.ai |
| `activeTab` | Accessing the current active tab |
| `storage` | Saving your prompt, model, and quiet hours settings |
| `https://claude.ai/*` | Access to Claude website |

## Tips & Tricks

### For Light Monitoring
Use the default prompt: `.`
This sends a single character, keeping conversation history fresh with minimal token usage.

### For Regular Tasks
Use a prompt like:
- `summarize our conversation so far`
- `check for any errors in my last message`
- `what have we discussed?`

### For Quiet Hours
Common patterns:
- **Nighttime** (10pm-7am): `22` to `7`
- **Late Night** (11pm-8am): `23` to `8`
- **Sleeping** (midnight-7am): `0` to `7`
- **Focus Time** (2pm-5pm): `14` to `17`

### Choosing the Right Model

| Model | Speed | Cost | Use Case |
|-------|-------|------|----------|
| Haiku 4.5 | ⚡⚡⚡ | 💰 | Quick checks, monitoring |
| Sonnet 4.5 | ⚡⚡ | 💰💰 | Balanced tasks |
| Opus 4.1 | ⚡ | 💰💰💰 | Complex analysis |

### Check Extension Logs
Open DevTools console on any page and look for `[STEP X]` messages to debug automation.

## Known Limitations

- Cannot interact with multi-step Claude features
- Extended thinking is automatically disabled to avoid long delays
- Prompt must be plain text (no formatting)
- Requires Claude.ai to be accessible
- Quiet hours uses local browser time (no timezone conversion)

## Version History

### v1.1.0 (Latest) - December 9, 2025
- ✨ Added Quiet Hours feature
- ✨ Schedule-free periods for nighttime
- ✨ Immediate execution when quiet hours end
- 🔧 Improved scheduling logic
- 📚 Enhanced documentation

### v1.0.0 - December 9, 2025
- Initial release
- Automatic 5-hour scheduling
- Custom prompts and models
- Extended thinking auto-disable
- Settings persistence

## Future Enhancements

Potential improvements:
- [ ] Configurable interval (not just 5 hours)
- [ ] Multiple prompts on rotation
- [ ] Response logging/history
- [ ] Custom webhook notifications
- [ ] Timezone-aware scheduling
- [ ] Analytics dashboard

## License

MIT License - see LICENSE file for details

## Contributing

Found a bug? Have a feature idea? Feel free to open an issue or submit a pull request!

## Disclaimer

This extension is not affiliated with Anthropic or Claude. It's an unofficial automation tool for personal use. Use responsibly and check Anthropic's terms of service.

## Support

For issues, questions, or suggestions:
1. Check the Troubleshooting section above
2. Open a GitHub issue with:
   - What you were trying to do
   - What happened
   - Your settings (prompt, model, quiet hours)
   - Browser console errors (if any)

---

**Made with ❤️ for Claude users who love automation**

Version 1.1.0 • Last updated December 9, 2025
