const promptInput = document.getElementById('promptInput');
const modelInput = document.getElementById('modelInput');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const testBtn = document.getElementById('testBtn');
const statusText = document.getElementById('statusText');
const statusBox = document.getElementById('status');
const timerDisplay = document.getElementById('timerDisplay');
const quietHoursEnabled = document.getElementById('quietHoursEnabled');
const quietHoursContainer = document.getElementById('quietHoursContainer');
const quietStartHour = document.getElementById('quietStartHour');
const quietEndHour = document.getElementById('quietEndHour');

let timerInterval = null;

// Load saved settings when popup opens
function loadSavedSettings() {
  try {
    chrome.storage.local.get(['prompt', 'model', 'quietHoursEnabled', 'quietStartHour', 'quietEndHour'], (result) => {
      if (result && result.prompt) {
        promptInput.value = result.prompt;
      }
      if (result && result.model) {
        modelInput.value = result.model;
      }
      if (result && result.quietHoursEnabled) {
        quietHoursEnabled.checked = true;
        quietHoursContainer.style.display = 'block';
      }
      if (result && result.quietStartHour !== undefined) {
        quietStartHour.value = result.quietStartHour;
      }
      if (result && result.quietEndHour !== undefined) {
        quietEndHour.value = result.quietEndHour;
      }
    });
  } catch (e) {
    console.log("Could not load settings on open (this is OK)");
  }
}

// Load on startup
loadSavedSettings();

// Toggle quiet hours container visibility
quietHoursEnabled.addEventListener('change', () => {
  if (quietHoursEnabled.checked) {
    quietHoursContainer.style.display = 'block';
  } else {
    quietHoursContainer.style.display = 'none';
  }
});

// Update timer and status
function updateStatus() {
  try {
    if (!chrome || !chrome.alarms) {
      statusBox.classList.add('inactive');
      statusText.textContent = 'Initializing...';
      timerDisplay.textContent = 'Loading...';
      return;
    }
    
    chrome.alarms.get('claudeAutoPrompt', (alarm) => {
      try {
        if (alarm) {
          const nextRunTime = new Date(alarm.scheduledTime);
          const now = new Date();
          const timeUntil = Math.round((nextRunTime - now) / 1000 / 60);
          
          // Check if quiet hours are enabled
          chrome.storage.local.get(['quietHoursEnabled', 'quietStartHour', 'quietEndHour'], (result) => {
            let statusMsg = 'Active';
            
            if (result && result.quietHoursEnabled) {
              const currentHour = new Date().getHours();
              const startHour = parseInt(result.quietStartHour) || 22;
              const endHour = parseInt(result.quietEndHour) || 7;
              
              // Check if we're in quiet hours
              const inQuietHours = startHour < endHour 
                ? currentHour >= startHour || currentHour < endHour
                : currentHour >= startHour || currentHour < endHour;
              
              if (inQuietHours) {
                statusMsg = `Active (Quiet: ${startHour}:00-${endHour}:00)`;
              }
            }
            
            statusBox.classList.remove('inactive');
            statusText.textContent = statusMsg;
            
            // Update timer display
            if (timeUntil > 0) {
              const hours = Math.floor(timeUntil / 60);
              const minutes = timeUntil % 60;
              if (hours > 0) {
                timerDisplay.textContent = `Next run in ${hours}h ${minutes}m`;
              } else {
                timerDisplay.textContent = `Next run in ${minutes}m`;
              }
            } else {
              timerDisplay.textContent = 'Running soon...';
            }
          });
        } else {
          statusBox.classList.add('inactive');
          statusText.textContent = 'Waiting for first run...';
          timerDisplay.textContent = 'Click Save & Enable to start';
        }
      } catch (e) {
        console.log("Error updating status");
      }
    });
  } catch (e) {
    console.log("Alarm check error");
  }
}

// Initial status check
updateStatus();

// Update status every second
timerInterval = setInterval(updateStatus, 1000);

// Save button
saveBtn.addEventListener('click', () => {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      alert('Chrome storage not available. Please try again.');
      return;
    }
    
    const prompt = promptInput.value || ".";
    const model = modelInput.value || "claude-3-5-haiku-20241022";
    const quietEnabled = quietHoursEnabled.checked;
    const quietStart = parseInt(quietStartHour.value) || 22;
    const quietEnd = parseInt(quietEndHour.value) || 7;
    
    chrome.storage.local.set({ 
      prompt, 
      model, 
      quietHoursEnabled: quietEnabled,
      quietStartHour: quietStart,
      quietEndHour: quietEnd
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        alert('Error saving settings. Please try again.');
        return;
      }
      
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Saved!';
      saveBtn.style.background = '#4caf50';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
      }, 2000);
    });
  } catch (e) {
    console.error("Error saving:", e);
    alert('Error saving settings. Please try again.');
  }
});

// Reset button
resetBtn.addEventListener('click', () => {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      alert('Chrome storage not available. Please try again.');
      return;
    }
    
    promptInput.value = ".";
    modelInput.value = "claude-3-5-haiku-20241022";
    quietHoursEnabled.checked = false;
    quietHoursContainer.style.display = 'none';
    quietStartHour.value = "22";
    quietEndHour.value = "7";
    
    chrome.storage.local.set({ 
      prompt: ".", 
      model: "claude-3-5-haiku-20241022",
      quietHoursEnabled: false,
      quietStartHour: 22,
      quietEndHour: 7
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        alert('Error resetting settings. Please try again.');
        return;
      }
      
      const originalText = resetBtn.textContent;
      resetBtn.textContent = '✓ Reset!';
      resetBtn.style.background = '#66bb6a';
      
      setTimeout(() => {
        resetBtn.textContent = originalText;
        resetBtn.style.background = '';
      }, 2000);
    });
  } catch (e) {
    console.error("Error resetting:", e);
    alert('Error resetting settings. Please try again.');
  }
});

// Test button - run immediately
testBtn.addEventListener('click', () => {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      alert('Chrome runtime not available. Please try again.');
      return;
    }
    
    const originalText = testBtn.textContent;
    testBtn.textContent = '⏳ Testing...';
    testBtn.disabled = true;
    testBtn.style.background = '#FF9800';
    
    chrome.runtime.sendMessage(
      { 
        action: "runImmediately", 
        prompt: promptInput.value || ".", 
        model: modelInput.value || "claude-3-5-haiku-20241022" 
      },
      (response) => {
        console.log("Response:", response);
        setTimeout(() => {
          testBtn.textContent = originalText;
          testBtn.disabled = false;
          testBtn.style.background = '';
        }, 2000);
      }
    );
  } catch (e) {
    console.error("Error running test:", e);
    const originalText = testBtn.textContent;
    testBtn.textContent = originalText;
    testBtn.disabled = false;
    testBtn.style.background = '';
    alert('Error running test. Please try again.');
  }
});

// Cleanup on popup close
window.addEventListener('beforeunload', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
