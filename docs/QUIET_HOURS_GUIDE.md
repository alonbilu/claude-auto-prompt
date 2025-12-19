# 🌙 Quiet Hours Feature Guide

**Version**: 1.1.0  
**Release Date**: December 9, 2025

---

## What is Quiet Hours?

Quiet Hours lets you pause the Claude Auto-Prompt extension during specific times of the day—typically during nighttime—so it won't interrupt you or waste API calls when you don't need it.

**Key Feature**: When quiet hours end, the extension immediately sends a call (doesn't wait for the next scheduled time).

---

## Why Use Quiet Hours?

### Benefits

✅ **Avoid Nighttime Interruptions** - No unexpected Claude tabs opening at 3am  
✅ **Save API Calls** - Don't send prompts when you're sleeping  
✅ **Better Sleep** - No browser notifications or activity during rest  
✅ **Cost Efficiency** - Reduce unnecessary API usage  
✅ **Personalize Schedule** - Set it for any off-hours period  

### Use Cases

| Scenario | From | To | Benefit |
|----------|------|----|---------| 
| Night worker | 9 PM | 7 AM | Sleep protection |
| 9-5 worker | 6 PM | 9 AM | Off-work peace |
| Student | 11 PM | 6 AM | Study without interruption |
| Personal time | 8 PM | 8 AM | Full evening off |
| Meetings | 2 PM | 3 PM | Don't disturb during meetings |

---

## How to Set Up Quiet Hours

### Step 1: Open Extension Settings

1. Click the **Claude Auto-Prompt** icon in your toolbar
2. The popup appears with all settings

### Step 2: Enable Quiet Hours

In the popup, you'll see:
```
🌙 Quiet Hours (No runs during night):
☐ Enable quiet hours
```

Click the checkbox to enable.

### Step 3: Set Your Times

Two input boxes appear:

```
From: [22]  (Hour in 24-hour format, 0-23)
To:   [7]   (Hour in 24-hour format, 0-23)
```

**Enter hours in military time (24-hour format):**
- 0 = midnight
- 6 = 6am
- 12 = noon
- 22 = 10pm
- 23 = 11pm

### Step 4: Save Settings

Click **Save & Enable**

Your quiet hours are now saved! ✅

---

## Examples

### Example 1: Night Sleep (Most Common)

**Goal**: Sleep 10pm to 7am without interruptions

| Setting | Value |
|---------|-------|
| Enable | ✅ |
| From | 22 |
| To | 7 |

✅ Extension pauses 10:00 PM - 6:59 AM  
✅ Resumes at 7:00 AM

---

### Example 2: Early Bird

**Goal**: Everyone sleeps midnight to 5am

| Setting | Value |
|---------|-------|
| Enable | ✅ |
| From | 0 |
| To | 5 |

✅ Extension pauses midnight - 4:59 AM  
✅ Resumes at 5:00 AM

---

### Example 3: All Night Shift

**Goal**: Sleep 8am to 3pm (night shift worker)

| Setting | Value |
|---------|-------|
| Enable | ✅ |
| From | 8 |
| To | 15 |

✅ Extension pauses 8:00 AM - 2:59 PM  
✅ Resumes at 3:00 PM

---

### Example 4: Business Hours Only

**Goal**: Only run during work hours 9am-5pm

**Method**: Set quiet hours for outside work hours

| Setting | Value |
|---------|-------|
| Enable | ✅ |
| From | 17 |
| To | 9 |

✅ Extension pauses 5:00 PM - 8:59 AM (15 hours)  
✅ Resumes at 9:00 AM

---

## How It Works

### Normal Operation (No Quiet Hours)

```
Timer runs normally every 5 hours
Hour 0, 5, 10, 15, 20, etc.
```

### With Quiet Hours Enabled

```
Example: Quiet hours 22:00 - 7:00 (10pm - 7am)

Time    | Status        | Action
--------|---------------|------------------
6:00 AM | In quiet      | Skipped
7:00 AM | EXIT QUIET    | ✅ RUN IMMEDIATELY
8:00 AM | Active        | (Normal schedule resumes)
10:00 PM| ENTER QUIET   | Skipped for rest of cycle
```

---

## Important Details

### Midnight Boundary

Quiet hours that span midnight work correctly!

✅ `22` to `7` = 10pm today to 7am tomorrow (WORKS)  
✅ `0` to `6` = midnight to 6am (WORKS)  
❌ `7` to `22` = spans midnight backwards (invalid - use `22` to `7` instead)

### How to Handle Daytime Quiet Hours

If you need quiet hours during the day (e.g., 2pm-3pm for meetings):

**This DOESN'T work:**
```
From: 14 (2pm)
To: 15 (3pm)
```

**Instead, set the gap time as active:**
- Set quiet hours for the LARGE block (e.g., nighttime)
- Extension will skip during that time
- Use a separate calendar system if you need complex schedules

### Immediate Run Feature

When quiet hours END, the extension:
1. ✅ Immediately sends a call (doesn't wait for next interval)
2. ✅ Resumes normal 5-hour schedule

**Example:**
- Quiet hours: 22:00 - 7:00
- At 7:00 AM: Extension immediately sends prompt
- At 7:05 AM: Resets to normal schedule (next run at 12:05 PM if last run was 7:05)

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Reversed Hours

```
From: 7  (7am)
To: 22   (10pm)
```

This creates quiet hours for DAYTIME (7am-10pm), when you want nighttime!

**Fix:**
```
From: 22 (10pm)
To: 7    (7am)
```

### ❌ Mistake 2: Only Entering One Value

```
From: 22
To: [empty]
```

**Fix:** Always enter both times

### ❌ Mistake 3: Not Checking the Checkbox

The settings save but quiet hours don't activate!

**Fix:** Make sure checkbox is ✅ CHECKED

### ❌ Mistake 4: Forgetting 24-Hour Format

```
From: 10PM (Wrong! ❌)
To: 7AM   (Wrong! ❌)
```

**Fix:**
```
From: 22 (Correct! ✅)
To: 7    (Correct! ✅)
```

---

## Testing Quiet Hours

### Before You Sleep

Test your settings:

1. **Enable** quiet hours with your preferred times
2. **Click** "Test Now" button
3. Claude should open normally
4. **Check status**: Should show your quiet hours time range
5. **Disable** temporarily if needed to test normal operation

### Verify It's Working

After enabling quiet hours:

1. **Check the status** in the popup
2. It should show: `Active (Quiet: 22:00-7:00)` or similar
3. During quiet hours, timer still counts down but automation pauses
4. When quiet hours end, prompt runs immediately

---

## Troubleshooting

### Issue: Quiet Hours Not Working

**Solution 1:** Make sure checkbox is ✅ checked  
**Solution 2:** Click "Save & Enable" after making changes  
**Solution 3:** Reload extension in chrome://extensions/  

### Issue: Wrong Time Paused

**Solution 1:** Check if you're using 24-hour format  
**Solution 2:** Verify From < To (unless spanning midnight)  
**Solution 3:** Remember: If From=22 and To=7, it pauses 22:00-6:59 (ends at 7:00)  

### Issue: Immediate Run Didn't Happen

The extension still paused when quiet hours ended.

**Solution 1:** The alarm might not have triggered exactly at the hour  
**Solution 2:** Close and reopen the popup  
**Solution 3:** Manually click "Test Now" to run immediately  

### Issue: Settings Not Saving

**Solution 1:** Reload extension (chrome://extensions)  
**Solution 2:** Try resetting to default first  
**Solution 3:** Check browser console (F12) for errors  

---

## Best Practices

### 1. Use Round Hours

✅ Better: 22 to 7  
❌ Worse: 22:30 to 7:15 (system uses only hour)

### 2. Include Reasonable Margin

✅ Better: 22 (10pm) to 7 (7am) = 9 hours of sleep
❌ Worse: 23 (11pm) to 7 (7am) = only 8 hours

### 3. Adjust Seasonally

Winter: Might need earlier end time (6am)  
Summer: Might need later end time (8am)

### 4. Test After Changes

After changing quiet hours:
1. Check the status shows correct range
2. Note the next run time
3. Verify it respects quiet hours

---

## Advanced Usage

### Disable Without Changing Settings

Want to turn off quiet hours temporarily?

1. Uncheck the ✅ checkbox
2. Click "Save & Enable"
3. Normal schedule resumes
4. Re-check box to re-enable with same times

### Change Times Without Disabling

1. Just change the From/To values
2. Click "Save & Enable"
3. New times are active immediately

### Reset to Defaults

Click "Reset to Default" button:
- Prompt: `.`
- Model: `claude-3-5-haiku-20241022`
- Quiet Hours: Disabled

---

## FAQ

**Q: Will it run at 7:00:00 exactly?**  
A: It runs during the 7:00 hour (7:00-7:59), not at the exact minute.

**Q: Can I have multiple quiet hour periods?**  
A: Not yet—you can only set one From/To range per settings.

**Q: Does it adjust for daylight saving time?**  
A: No—it uses your system time. You'll need to manually adjust hours when DST changes.

**Q: What if the 5-hour interval falls during quiet hours?**  
A: It skips that run and continues normal schedule when quiet hours end.

**Q: Does it use up my API quota during quiet hours?**  
A: No—it doesn't call Claude at all during quiet hours.

---

## Support

**Questions about Quiet Hours?**

1. Check this guide  
2. See the README.md for more details
3. Review the Troubleshooting section above
4. Check browser console (F12) for error messages
5. Open a GitHub issue if you find a bug

---

## Version Info

- **Feature Added**: v1.1.0
- **Date**: December 9, 2025
- **Status**: ✅ Stable
- **Compatibility**: All browsers supporting Chrome Extensions (Manifest V3)

---

**Enjoy your uninterrupted sleep!** 🌙✨

Questions? Check the README.md or open a GitHub issue!
