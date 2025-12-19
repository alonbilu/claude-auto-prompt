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

/**
 * Find the editor element using multiple strategies
 * Claude.ai uses a ProseMirror-based contenteditable editor
 */
function findEditorElement() {
  // Strategy 1: Look for ProseMirror editor (most specific)
  let editor = document.querySelector('.ProseMirror[contenteditable="true"]');
  if (editor) {
    console.log("[findEditor] Found ProseMirror editor");
    return { element: editor, type: 'prosemirror' };
  }

  // Strategy 2: Look for contenteditable with data-placeholder (common pattern)
  editor = document.querySelector('[contenteditable="true"][data-placeholder]');
  if (editor) {
    console.log("[findEditor] Found contenteditable with placeholder");
    return { element: editor, type: 'contenteditable' };
  }

  // Strategy 3: Look for contenteditable inside a fieldset or form area
  editor = document.querySelector('fieldset [contenteditable="true"]');
  if (editor) {
    console.log("[findEditor] Found contenteditable in fieldset");
    return { element: editor, type: 'contenteditable' };
  }

  // Strategy 4: Look for contenteditable with specific parent structure
  const allContentEditable = document.querySelectorAll('[contenteditable="true"]');
  for (const el of allContentEditable) {
    // Skip tiny elements (likely not the main editor)
    const rect = el.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 30) {
      console.log("[findEditor] Found large contenteditable element");
      return { element: el, type: 'contenteditable' };
    }
  }

  // Strategy 5: Traditional textarea (fallback)
  editor = document.querySelector('textarea');
  if (editor) {
    console.log("[findEditor] Found textarea");
    return { element: editor, type: 'textarea' };
  }

  // Strategy 6: Any contenteditable as last resort
  editor = document.querySelector('[contenteditable="true"]');
  if (editor) {
    console.log("[findEditor] Found generic contenteditable");
    return { element: editor, type: 'contenteditable' };
  }

  return null;
}

/**
 * Click on an element to activate it (simulates user interaction)
 */
function clickElement(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Dispatch mousedown, mouseup, and click events
  const events = ['mousedown', 'mouseup', 'click'];
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    });
    element.dispatchEvent(event);
  });

  console.log("[clickElement] Clicked element at", x, y);
}

/**
 * Ensure an element has focus, with verification
 * Returns true if focus was successful
 */
function ensureFocus(element, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    element.focus();

    // Check if focus was successful
    if (document.activeElement === element) {
      console.log(`[ensureFocus] Focus successful on attempt ${attempt}`);
      return true;
    }

    // For contenteditable, activeElement might be a child or the element itself
    if (element.contains(document.activeElement) || document.activeElement.contains(element)) {
      console.log(`[ensureFocus] Focus within element on attempt ${attempt}`);
      return true;
    }

    console.log(`[ensureFocus] Focus attempt ${attempt} failed, activeElement:`, document.activeElement?.tagName);
  }

  return false;
}

/**
 * Insert text into a contenteditable element using various methods
 */
function insertTextIntoContentEditable(element, text) {
  // Ensure we have a selection in the element
  const selection = window.getSelection();
  const range = document.createRange();

  // If element is empty, we need to create a text node
  if (element.childNodes.length === 0) {
    element.appendChild(document.createTextNode(''));
  }

  // Set cursor at the end of the content
  const lastChild = element.lastChild || element;
  if (lastChild.nodeType === Node.TEXT_NODE) {
    range.setStart(lastChild, lastChild.length);
    range.setEnd(lastChild, lastChild.length);
  } else {
    range.selectNodeContents(element);
    range.collapse(false); // Collapse to end
  }

  selection.removeAllRanges();
  selection.addRange(range);

  // Method 1: Try insertText command
  const success = document.execCommand('insertText', false, text);
  if (success) {
    return true;
  }

  // Method 2: Use InputEvent (more modern approach)
  const inputEvent = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  });
  element.dispatchEvent(inputEvent);

  // Method 3: Direct text insertion as fallback
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  // Move cursor after inserted text
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);

  // Dispatch input event
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: false,
    inputType: 'insertText',
    data: text
  }));

  return true;
}

/**
 * Insert text into a textarea element
 */
function insertTextIntoTextarea(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;

  // Dispatch input event
  textarea.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: false,
    inputType: 'insertText',
    data: text
  }));

  return true;
}

async function startAutomation(prompt) {
  try {
    console.log("\n=== AUTOMATION START ===");
    console.log("Prompt to send:", prompt);

    // STEP 1: Wait for page to settle (increased from 3s to 4s for slower loads)
    console.log("\n[STEP 1] Waiting 4 seconds for page to load...");
    await delay(4000);
    console.log("[STEP 1] ✓ Wait complete");

    // STEP 2: Find the input element using multiple strategies
    console.log("\n[STEP 2] Looking for input element...");
    const editorInfo = findEditorElement();

    if (!editorInfo) {
      console.error("[STEP 2] ❌ INPUT ELEMENT NOT FOUND!");
      console.log("[STEP 2] Page HTML preview:", document.body.innerHTML.substring(0, 1000));
      return;
    }

    const { element: editor, type: editorType } = editorInfo;
    console.log(`[STEP 2] ✓ Found ${editorType} editor:`, editor);

    // STEP 3: Click to activate, then focus
    console.log("\n[STEP 3] Activating editor (click + focus)...");

    // First, click the element to activate it
    clickElement(editor);
    await delay(300);

    // Then focus
    if (!ensureFocus(editor)) {
      console.log("[STEP 3] Initial focus failed, trying click again...");
      clickElement(editor);
      await delay(200);
      editor.focus();
    }

    await delay(300);
    console.log("[STEP 3] ✓ Editor activated");

    // STEP 4: Inject text with focus maintenance
    console.log("\n[STEP 4] Injecting text...");

    // For short prompts, try inserting all at once first
    if (prompt.length <= 10) {
      console.log("[STEP 4] Short prompt - inserting all at once");

      // Ensure focus before insertion
      clickElement(editor);
      await delay(100);
      ensureFocus(editor);
      await delay(100);

      if (editorType === 'textarea') {
        insertTextIntoTextarea(editor, prompt);
      } else {
        insertTextIntoContentEditable(editor, prompt);
      }
    } else {
      // For longer prompts, insert character by character with focus maintenance
      console.log("[STEP 4] Longer prompt - inserting character by character");

      for (let i = 0; i < prompt.length; i++) {
        const char = prompt[i];

        // Re-focus before each character (this is the key fix!)
        if (i % 5 === 0) { // Re-click every 5 characters
          clickElement(editor);
          await delay(50);
        }
        ensureFocus(editor);

        if (editorType === 'textarea') {
          insertTextIntoTextarea(editor, char);
        } else {
          // For contenteditable, use execCommand with focus check
          const inserted = document.execCommand('insertText', false, char);
          if (!inserted) {
            console.log(`[STEP 4] execCommand failed for char ${i}, using fallback`);
            insertTextIntoContentEditable(editor, char);
          }
        }

        // Log progress
        if ((i + 1) % 10 === 0 || i === prompt.length - 1) {
          console.log(`[STEP 4] Progress: ${i + 1}/${prompt.length} characters`);
        }

        // Shorter delay between characters
        await delay(80);
      }
    }

    // Final focus and change event
    clickElement(editor);
    ensureFocus(editor);
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    // Verify text was inserted
    const insertedText = editorType === 'textarea' ? editor.value : editor.textContent;
    console.log("[STEP 4] ✓ Text injection complete. Content:", insertedText);

    if (!insertedText || insertedText.trim() === '') {
      console.error("[STEP 4] ❌ WARNING: Editor appears empty after injection!");
    }

    await delay(500);

    // STEP 4.5: Check and disable Extended thinking if enabled
    console.log("\n[STEP 4.5] Checking Extended thinking status...");

    const thinkingButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent.toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      return text.includes('thinking') || text.includes('extended') ||
             ariaLabel.includes('thinking') || ariaLabel.includes('extended');
    });

    console.log("[STEP 4.5] Found", thinkingButtons.length, "thinking-related buttons");

    for (const btn of thinkingButtons) {
      const ariaPressed = btn.getAttribute('aria-pressed');
      const ariaChecked = btn.getAttribute('aria-checked');

      console.log("[STEP 4.5] Thinking button:", btn.textContent, "aria-pressed:", ariaPressed, "aria-checked:", ariaChecked);

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

    // STEP 5: Find and click send button
    console.log("\n[STEP 5] Looking for send button...");

    const buttons = Array.from(document.querySelectorAll('button'));
    console.log("[STEP 5] Found", buttons.length, "total buttons");

    let sendButton = null;

    // Look for the orange send button by color
    for (const btn of buttons) {
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;

      if (bgColor.includes('rgb')) {
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);

          // Orange button: R ~190-220, G ~80-120, B ~50-80
          const isOrange = r >= 180 && r <= 220 && g >= 80 && g <= 120 && b >= 50 && b <= 80;

          if (isOrange) {
            console.log(`[STEP 5] ✓ Found ORANGE send button`);
            sendButton = btn;
            break;
          }
        }
      }
    }

    // Alternative: look for button with arrow icon or "send" text
    if (!sendButton) {
      sendButton = buttons.find(btn => {
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const text = btn.textContent.toLowerCase();
        return ariaLabel.includes('send') || text.includes('send') ||
               ariaLabel.includes('submit') || text.includes('submit');
      });
      if (sendButton) {
        console.log("[STEP 5] Found send button by aria-label/text");
      }
    }

    if (sendButton) {
      console.log("[STEP 5] ✓ Clicking send button");
      sendButton.click();
      console.log("[STEP 5] ✓ Send button clicked");
    } else {
      console.log("[STEP 5] ❌ No send button found, trying Enter key");
      ensureFocus(editor);

      // Try Ctrl+Enter or just Enter
      editor.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13
      }));
    }

    // STEP 6: Wait for response
    console.log("\n[STEP 6] Waiting for response from Claude...");
    await waitForResponse();
    console.log("[STEP 6] ✓ Response received");

    // STEP 7: Wait before closing
    console.log("\n[STEP 7] Waiting 5 seconds before closing tab...");
    await delay(5000);
    console.log("[STEP 7] ✓ Wait complete");

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
      if (checkCount % 10 === 0) {
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
