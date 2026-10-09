// Missed. — WhatsApp Web Content Script
// Strictly runs in-browser on web.whatsapp.com. Zero external transmission.

console.log('[Missed.] Content script initialized on WhatsApp Web.');

/**
 * Extracts visible messages from the currently active WhatsApp Web conversation.
 */
function scrapeActiveWhatsAppChat() {
  // 1. Check for logged-out / QR code screen
  const isQrScreen = document.querySelector(
    'canvas[aria-label="Scan me!"], [data-ref], [data-testid="qrcode"], ._ak96'
  );
  if (isQrScreen) {
    return {
      success: false,
      code: 'NOT_LOGGED_IN',
      error: 'WhatsApp Web is not logged in. Please scan the QR code to log in first.',
    };
  }

  // 2. Check for active conversation header
  const header = document.querySelector('header');
  const chatTitleEl = header?.querySelector(
    'span[title], div[role="button"] span[dir="auto"], span[dir="auto"]'
  );
  const chatTitle =
    chatTitleEl?.getAttribute('title') || chatTitleEl?.textContent?.trim();

  if (!header || !chatTitle) {
    return {
      success: false,
      code: 'NO_ACTIVE_CHAT',
      error: 'No active chat open. Please click on a conversation in WhatsApp Web.',
    };
  }

  // 3. Extract messages from the active message stream
  const messages = [];
  let msgIndex = 0;

  // Strategy A: WhatsApp Web's official 'data-pre-plain-text' attribute
  // Format typically: "[10:15 am, 09/10/2026] Maya Lin: " or "[09:15, 09/10/2026] Maya Lin: "
  const prePlainNodes = document.querySelectorAll('[data-pre-plain-text]');

  if (prePlainNodes.length > 0) {
    prePlainNodes.forEach((node) => {
      const headerAttr = node.getAttribute('data-pre-plain-text') || '';
      const match = headerAttr.match(/^\[([^\]]+)\]\s*([^:]+):\s*$/);
      let timestamp = undefined;
      let sender = 'Unknown';

      if (match) {
        timestamp = match[1].trim();
        sender = match[2].trim();
      }

      // Extract inner text
      const textNode = node.querySelector('.selectable-text') || node;
      const text = textNode?.textContent?.trim();

      if (text) {
        const isOut = Boolean(node.closest('.message-out'));
        messages.push({
          id: `wa-${++msgIndex}`,
          sender: sender || (isOut ? 'You' : chatTitle),
          text,
          timestamp,
          raw: `${headerAttr} ${text}`,
          lineIndex: msgIndex - 1,
        });
      }
    });
  }

  // Strategy B: Fallback selector hierarchy if data-pre-plain-text is absent
  if (messages.length === 0) {
    const containers = document.querySelectorAll(
      '[data-testid="msg-container"], div.message-in, div.message-out, div[data-id]'
    );

    containers.forEach((container) => {
      const textEl = container.querySelector(
        '.selectable-text, span[dir="ltr"], span._ao3e'
      );
      const text = textEl?.textContent?.trim();
      if (!text) return;

      const isOut =
        container.classList.contains('message-out') ||
        Boolean(container.querySelector('[data-icon="msg-dblcheck"]'));
      const authorEl = container.querySelector('[data-testid="author"], ._ak8q');
      const sender = authorEl?.textContent?.trim() || (isOut ? 'You' : chatTitle);

      const timeEl = container.querySelector(
        '[data-testid="msg-meta"] span, span[dir="auto"]'
      );
      const timestamp = timeEl?.textContent?.trim();

      messages.push({
        id: `wa-${++msgIndex}`,
        sender,
        text,
        timestamp,
        raw: `${sender}: ${text}`,
        lineIndex: msgIndex - 1,
      });
    });
  }

  // 4. Check if any readable messages were found
  if (messages.length === 0) {
    return {
      success: false,
      code: 'NO_MESSAGES',
      error: `No readable text messages found in "${chatTitle}". Ensure the chat contains visible text messages.`,
      chatTitle,
    };
  }

  return {
    success: true,
    chatTitle,
    messages,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Highlights a message in the WhatsApp Web DOM when the user clicks 'Source' in the side panel.
 */
function highlightMessageInWhatsApp(snippet) {
  if (!snippet) return;
  const cleanSnippet = snippet.slice(0, 40).toLowerCase();

  const textNodes = document.querySelectorAll('.selectable-text, [data-pre-plain-text]');
  for (const node of textNodes) {
    if (node.textContent && node.textContent.toLowerCase().includes(cleanSnippet)) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Apply temporary visual highlight
      const originalOutline = node.style.outline;
      const originalBg = node.style.backgroundColor;
      node.style.outline = '3px solid #10b981';
      node.style.backgroundColor = '#ecfdf5';
      setTimeout(() => {
        node.style.outline = originalOutline;
        node.style.backgroundColor = originalBg;
      }, 2500);
      break;
    }
  }
}

// Listen for messages from the extension side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCRAPE_WHATSAPP_CHAT') {
    const result = scrapeActiveWhatsAppChat();
    sendResponse(result);
  } else if (request.type === 'HIGHLIGHT_SOURCE_MESSAGE') {
    highlightMessageInWhatsApp(request.snippet);
    sendResponse({ success: true });
  }
  return true;
});

