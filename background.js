// Configuration
const INTERVAL_MINUTES = 5 * 60; // 5 hours in minutes
let promptText = "."; // Default prompt
let modelText = "claude-3-5-haiku-20241022"; // Default model
let quietHoursEnabled = false;
let quietStartHour = 22;
let quietEndHour = 7;
let tabId = null;

// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Claude Auto-Prompt extension installed");
  
  // Load saved prompt and model from storage
  try {
    chrome.storage.local.get(['prompt', 'model', 'quietHoursEnabled', 'quietStartHour', 'quietEndHour'], (result) => {
      try {
        if (result && typeof result === 'object') {
          if (result.prompt) {
            promptText = result.prompt;
          }
          if (result.model) {
            modelText = result.model;
          }
          if (result.quietHoursEnabled !== undefined) {
            quietHoursEnabled = result.quietHoursEnabled;
          }
          if (result.quietStartHour !== undefined) {
            quietStartHour = result.quietStartHour;
          }
          if (result.quietEndHour !== undefined) {
            quietEndHour = result.quietEndHour;
          }
        }
      } catch (e) {
        console.log("Could not load saved settings, using defaults");
      }
    });
  } catch (e) {
    console.log("Storage access error during init, using defaults");
  }
  
  // Create initial alarm
  createAlarm();
});

// Create or reset the alarm
function createAlarm() {
  chrome.alarms.clear("claudeAutoPrompt", () => {
    chrome.alarms.create("claudeAutoPrompt", { periodInMinutes: INTERVAL_MINUTES });
    console.log(`Alarm set to trigger every ${INTERVAL_MINUTES} minutes`);
  });
}

// Handle alarm trigger
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "claudeAutoPrompt") {
    if (isInQuietHours()) {
      console.log("Alarm triggered but in quiet hours - rescheduling");
      const endTime = getQuietHoursEndTime();
      const minutesUntilEnd = Math.ceil((endTime - new Date()) / 1000 / 60);
      console.log(`Quiet hours active until ${endTime.toLocaleTimeString()}. Will run in ${minutesUntilEnd} minutes.`);
      
      // Reschedule for end of quiet hours
      chrome.alarms.create("claudeAutoPrompt", { 
        when: endTime.getTime()
      });
    } else {
      console.log("Alarm triggered - opening Claude");
      openClaudeTab();
    }
  }
});

// Listen for storage changes (prompt and model updates from popup)
try {
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      try {
        if (typeof areaName === 'string' && areaName === 'local') {
          if (changes && typeof changes === 'object') {
            // Handle prompt changes
            if ('prompt' in changes) {
              const promptChange = changes.prompt;
              if (promptChange && typeof promptChange === 'object' && 'newValue' in promptChange) {
                const newValue = promptChange.newValue;
                if (typeof newValue === 'string') {
                  promptText = newValue;
                  console.log("Prompt updated to:", promptText);
                }
              }
            }
            
            // Handle model changes
            if ('model' in changes) {
              const modelChange = changes.model;
              if (modelChange && typeof modelChange === 'object' && 'newValue' in modelChange) {
                const newValue = modelChange.newValue;
                if (typeof newValue === 'string') {
                  modelText = newValue;
                  console.log("Model updated to:", modelText);
                }
              }
            }
            
            // Handle quiet hours enabled changes
            if ('quietHoursEnabled' in changes) {
              const change = changes.quietHoursEnabled;
              if (change && typeof change === 'object' && 'newValue' in change) {
                quietHoursEnabled = change.newValue;
                console.log("Quiet hours enabled:", quietHoursEnabled);
              }
            }
            
            // Handle quiet start hour changes
            if ('quietStartHour' in changes) {
              const change = changes.quietStartHour;
              if (change && typeof change === 'object' && 'newValue' in change) {
                quietStartHour = change.newValue;
                console.log("Quiet start hour:", quietStartHour);
              }
            }
            
            // Handle quiet end hour changes
            if ('quietEndHour' in changes) {
              const change = changes.quietEndHour;
              if (change && typeof change === 'object' && 'newValue' in change) {
                quietEndHour = change.newValue;
                console.log("Quiet end hour:", quietEndHour);
              }
            }
          }
        }
      } catch (innerError) {
        console.warn("Error in storage change handler:", innerError);
      }
    });
  }
} catch (e) {
  console.warn("Could not register storage listener:", e);
}

// Check if current time is within quiet hours
function isInQuietHours() {
  if (!quietHoursEnabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  
  // If start >= end (e.g., 22 to 7 is night time spanning midnight)
  if (quietStartHour >= quietEndHour) {
    // Range spanning midnight like 22 to 7 (10pm to 7am)
    return currentHour >= quietStartHour || currentHour < quietEndHour;
  } else {
    // Normal range like 9 to 17 (9am to 5pm)
    return currentHour >= quietStartHour && currentHour < quietEndHour;
  }
}

// Get the next time when quiet hours end
function getQuietHoursEndTime() {
  const now = new Date();
  const nextRun = new Date(now);
  
  nextRun.setHours(quietEndHour, 0, 0, 0);
  
  // If end time is in the past today, it's tomorrow
  if (nextRun < now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
}

// Open Claude in a new tab and set up the automation
function openClaudeTab() {
  const url = `https://claude.ai/new?incognito&model=${encodeURIComponent(modelText)}&incognito`;
  console.log("Opening Incognito Claude with URL:", url);
  
  chrome.tabs.create({ url: url }, (tab) => {
    tabId = tab.id;
    console.log("Tab opened with ID:", tabId);
    
    // Wait for the page to load, then start the automation
    waitForPageLoad(tabId);
  });
}

// Wait for the Claude page to load
function waitForPageLoad(id) {
  const checkInterval = setInterval(() => {
    chrome.tabs.get(id, (tab) => {
      if (chrome.runtime.lastError) {
        clearInterval(checkInterval);
        return;
      }
      
      // Check if the page has loaded
      if (tab.status === "complete") {
        clearInterval(checkInterval);
        console.log("Page loaded, injecting script");
        
        // Inject content script to interact with the page
        injectAndAutomate(id);
      }
    });
  }, 500);
  
  // Safety timeout - stop checking after 60 seconds
  setTimeout(() => clearInterval(checkInterval), 60000);
}

// Inject script and automate the interaction
function injectAndAutomate(id) {
  // First, inject the content script
  chrome.scripting.executeScript(
    {
      target: { tabId: id },
      files: ["content.js"]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Script injection error:", chrome.runtime.lastError);
        return;
      }
      
      // Send message to content script to start automation
      chrome.tabs.sendMessage(id, { action: "startAutomation", prompt: promptText }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Will retry message send...");
          // Retry after a delay
          setTimeout(() => {
            chrome.tabs.sendMessage(id, { action: "startAutomation", prompt: promptText });
          }, 2000);
        } else {
          console.log("Message sent to content script");
        }
      });
    }
  );
}

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request && typeof request === 'object' && request.action) {
      // Handle test/immediate run request from popup
      if (request.action === "runImmediately") {
        console.log("Running automation immediately with prompt:", request.prompt);
        promptText = request.prompt || ".";
        
        // Use model from request if provided, otherwise load from storage
        if (request.model) {
          modelText = request.model;
          console.log("Using model from request:", modelText);
          openClaudeTab();
        } else {
          // Load the latest model from storage for this immediate run
          try {
            chrome.storage.local.get(['model'], (result) => {
              if (result && result.model) {
                modelText = result.model;
              }
              console.log("Using model:", modelText);
              openClaudeTab();
            });
          } catch (e) {
            console.log("Could not load model, using current:", modelText);
            openClaudeTab();
          }
        }
        
        try {
          sendResponse({ status: "Test automation started" });
        } catch (e) {
          console.log("Response already sent");
        }
        return true;
      }
      
      // Handle close tab request from content script
      if (request.action === "closeTab" || request.action === "closeCurrentTab") {
        if (sender && typeof sender === 'object' && sender.tab && typeof sender.tab === 'object' && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id, () => {
            console.log("Tab closed successfully");
            try {
              sendResponse({ status: "tab closed" });
            } catch (e) {
              console.log("Response already sent");
            }
          });
          return true; // Keep the channel open for async response
        }
      }
    }
  } catch (e) {
    console.warn("Message listener error:", e);
  }
});

// No additional listeners needed - all handled above
