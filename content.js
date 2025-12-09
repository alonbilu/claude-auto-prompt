console.log("=== CONTENT SCRIPT LOADED ===");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("=== MESSAGE RECEIVED ===");
  console.log("Message action:", request.action);
  console.log("Message prompt:", request.prompt);
  
  if (request.action === "startAutomation") {
    console.log("✓ Starting automation");
    startAutomation(request.prompt);
    sendResponse({ status: "automation started" });
  }
});

async function startAutomation(prompt) {
  try {
    console.log("\n=== AUTOMATION START ===");
    console.log("Prompt to send:", prompt);
    
    // STEP 1: Wait a bit for page to settle
    console.log("\n[STEP 1] Waiting 3 seconds for page to load...");
    await delay(3000);
    console.log("[STEP 1] ✓ 3 seconds passed");
    
    // STEP 2: Find the input element (textarea or contenteditable div)
    console.log("\n[STEP 2] Looking for input element...");
    let textarea = document.querySelector('textarea');
    
    if (!textarea) {
      console.log("[STEP 2] No textarea found, looking for contenteditable div...");
      textarea = document.querySelector('[contenteditable="true"]');
    }
    
    if (!textarea) {
      console.error("[STEP 2] ❌ INPUT ELEMENT NOT FOUND!");
      return;
    }
    console.log("[STEP 2] ✓ Input element found");
    
    // STEP 3: Focus textarea
    console.log("\n[STEP 3] Focusing textarea...");
    textarea.focus();
    console.log("[STEP 3] ✓ Textarea focused");
    
    // STEP 4: Type text using Selection API and insertText command
    console.log("\n[STEP 4] Injecting text using Selection API...");
    
    // Focus the textarea
    textarea.focus();
    console.log("[STEP 4]   - Textarea focused");
    
    // Wait for focus to register
    await delay(200);
    
    // Try to insert text character by character using execCommand
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt[i];
      console.log(`[STEP 4]   - Inserting character ${i + 1}/${prompt.length}: "${char}"`);
      
      // Method 1: Try insertText command (for contenteditable)
      try {
        const success = document.execCommand('insertText', false, char);
        if (success) {
          console.log("[STEP 4]   - insertText command succeeded");
        } else {
          console.log("[STEP 4]   - insertText command returned false, trying alternative");
          // Fallback: set value and dispatch event
          textarea.value += char;
          const evt = new Event('input', { bubbles: true });
          Object.defineProperty(evt, 'target', { value: textarea });
          textarea.dispatchEvent(evt);
        }
      } catch (e) {
        console.log("[STEP 4]   - insertText failed:", e.message);
        // Fallback: direct value
        textarea.value += char;
        const evt = new Event('input', { bubbles: true });
        Object.defineProperty(evt, 'target', { value: textarea });
        textarea.dispatchEvent(evt);
      }
      
      // Wait between characters - typing at human speed
      await delay(150);
    }
    
    // Dispatch final change event
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(changeEvent, 'target', { value: textarea });
    textarea.dispatchEvent(changeEvent);
    
    // Re-focus to ensure React knows we're done
    textarea.focus();
    
    console.log("[STEP 4] ✓ Text insertion complete. Textarea value:", textarea.value);
    
    // STEP 4.5: Check and disable Extended thinking if enabled
    console.log("\n[STEP 4.5] Checking Extended thinking status...");
    
    const thinkingButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent.toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      return text.includes('thinking') || text.includes('extended') || 
             ariaLabel.includes('thinking') || ariaLabel.includes('extended');
    });
    
    console.log("[STEP 4.5] Found", thinkingButtons.length, "thinking-related buttons");
    
    // Look for any toggle or button that might indicate extended thinking is ON
    for (const btn of thinkingButtons) {
      const style = window.getComputedStyle(btn);
      const ariaPressed = btn.getAttribute('aria-pressed');
      const ariaChecked = btn.getAttribute('aria-checked');
      
      console.log("[STEP 4.5] Thinking button:", btn.textContent, "aria-pressed:", ariaPressed, "aria-checked:", ariaChecked);
      
      // If it's pressed/checked/active, click it to disable
      if (ariaPressed === 'true' || ariaChecked === 'true') {
        console.log("[STEP 4.5] ✓ Extended thinking is ENABLED, disabling it...");
        btn.click();
        console.log("[STEP 4.5] ✓ Extended thinking disabled");
        await delay(500);
        break;
      }
    }
    
    console.log("[STEP 4.5] ✓ Extended thinking check complete");
    await delay(500);
    
    const buttons = Array.from(document.querySelectorAll('button'));
    console.log("[STEP 5] Found", buttons.length, "total buttons");
    
    // The send button is ORANGE with background color around rgb(198, 97, 63)
    // Just look for the button with that specific orange color
    let sendButton = null;
    
    buttons.forEach((btn, idx) => {
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;
      console.log(`[STEP 5] Button ${idx}: ${bgColor}`);
      
      // Look for the orange button: rgb(198, 97, 63) or similar orange values
      if (bgColor.includes('rgb')) {
        // Parse rgb values
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          
          // Orange button characteristics:
          // R: around 190-210 (high red)
          // G: around 90-110 (low green)
          // B: around 55-75 (low blue)
          const isOrange = r >= 180 && r <= 220 && g >= 80 && g <= 120 && b >= 50 && b <= 80;
          
          if (isOrange && !sendButton) {
            console.log(`[STEP 5] ✓ Found ORANGE button at index ${idx}!`);
            sendButton = btn;
          }
        }
      }
    });
    
    if (sendButton) {
      console.log("[STEP 5] ✓ Clicking orange send button");
      sendButton.click();
      console.log("[STEP 5] ✓ Send button clicked");
    } else {
      console.log("[STEP 5] ❌ No orange button found, trying Enter key");
      textarea.focus();
      textarea.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13
      }));
    }
    
    // STEP 6: Wait for response
    console.log("\n[STEP 6] Waiting for response from Claude...");
    await waitForResponse();
    console.log("[STEP 6] ✓ Response received");
    
    // STEP 7: Wait 5 seconds then close
    console.log("\n[STEP 7] Waiting 5 seconds before closing tab...");
    await delay(5000);
    console.log("[STEP 7] ✓ 5 seconds passed");
    
    // STEP 8: Close the tab
    console.log("\n[STEP 8] Closing tab...");
    try {
      chrome.runtime.sendMessage({ action: "closeCurrentTab" });
      console.log("[STEP 8] ✓ Close message sent");
    } catch (e) {
      console.error("[STEP 8] Error sending close message:", e);
    }
    
    console.log("\n=== AUTOMATION COMPLETE ===\n");
    
  } catch (error) {
    console.error("=== AUTOMATION ERROR ===");
    console.error(error);
  }
}

async function waitForResponse() {
  return new Promise((resolve) => {
    const maxWait = 120000; // 2 minutes
    const startTime = Date.now();
    let checkCount = 0;
    
    const check = setInterval(() => {
      checkCount++;
      if (checkCount % 10 === 0) { // Log every 10 checks to avoid spam
        console.log(`[waitForResponse] Check #${checkCount}...`);
      }
      
      const messages = document.querySelectorAll('[class*="message"], [role="article"]');
      const isLoading = document.querySelector('[class*="loading"], [class*="spinner"], .animate-pulse');
      
      if (Date.now() - startTime > maxWait) {
        console.log(`[waitForResponse] Timeout after ${checkCount} checks`);
        clearInterval(check);
        resolve();
      }
      
      if (messages.length > 2 && !isLoading) {
        console.log(`[waitForResponse] Response detected after ${checkCount} checks`);
        clearInterval(check);
        resolve();
      }
    }, 500);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
