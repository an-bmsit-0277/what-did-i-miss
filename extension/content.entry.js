// Missed. — WhatsApp Web Content Script Entry Point
// Bundled with @missed/engine via `npm run build:extension` into extension/content.js
// 100% on-device heuristic catch-up companion. Zero external data transmission without user consent.

import { extractWhatsAppWebChatFromDom } from '@missed/engine';

console.log('[Missed.] Content script companion initialized on WhatsApp Web.');

let cachedExtraction = null;
let debounceTimer = null;
let observer = null;

/**
 * Extracts and updates the in-memory cache of the currently active WhatsApp Web conversation.
 */
function refreshCurrentChat() {
  try {
    const result = extractWhatsAppWebChatFromDom(document);
    if (result.success) {
      cachedExtraction = result;
    }
    return result;
  } catch (err) {
    console.error('[Missed.] DOM extraction error:', err);
    return {
      success: false,
      code: 'EXTRACTION_ERROR',
      error: `Failed to extract WhatsApp Web DOM: ${err.message}`,
      messages: [],
    };
  }
}

/**
 * Sets up a MutationObserver to monitor changes to the WhatsApp Web chat pane
 * (new messages, scroll backfill, chat switches) with a debounced refresh.
 */
function setupChatObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Locate the message pane or fallback to document body
  const targetNode =
    document.querySelector(
      '#main, [data-testid="conversation-panel-messages"], div[role="region"], div[role="application"]'
    ) || document.body;

  if (!targetNode) return;

  observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      refreshCurrentChat();
    }, 250);
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

// Initialize observer once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupChatObserver();
    refreshCurrentChat();
  });
} else {
  setupChatObserver();
  refreshCurrentChat();
}

/**
 * Highlights a message in the WhatsApp Web DOM when the user clicks 'Source' in the side panel.
 */
function highlightMessageInWhatsApp(snippet) {
  if (!snippet) return;
  const cleanSnippet = snippet.slice(0, 40).toLowerCase();

  const textNodes = document.querySelectorAll(
    '.selectable-text, [data-pre-plain-text], [data-testid="msg-container"]'
  );

  for (const node of textNodes) {
    if (node.textContent && node.textContent.toLowerCase().includes(cleanSnippet)) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Apply temporary visual highlight in solar ember
      const targetEl = node.closest('[data-testid="msg-container"]') || node;
      const originalOutline = targetEl.style.outline;
      const originalBg = targetEl.style.backgroundColor;
      const originalTransition = targetEl.style.transition;

      targetEl.style.transition = 'all 0.3s ease';
      targetEl.style.outline = '2px solid #ff521b';
      targetEl.style.backgroundColor = 'rgba(255, 82, 27, 0.12)';

      setTimeout(() => {
        targetEl.style.outline = originalOutline;
        targetEl.style.backgroundColor = originalBg;
        targetEl.style.transition = originalTransition;
      }, 2500);
      break;
    }
  }
}

// Listen for runtime messages from the extension side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === 'SCRAPE_WHATSAPP_CHAT') {
    // Re-verify observer attachment if user switched chats
    setupChatObserver();
    const result = refreshCurrentChat();
    sendResponse(result);
  } else if (request?.type === 'HIGHLIGHT_SOURCE_MESSAGE') {
    highlightMessageInWhatsApp(request.snippet);
    sendResponse({ success: true });
  }
  return true;
});

