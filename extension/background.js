// Missed. — Extension Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('Missed. extension installed successfully.');
  // Configure side panel to open on action icon click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error('Error enabling sidePanel behavior:', error));
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === 'MISSED_SESSION_SYNC' && request.token) {
    chrome.storage.local.set({ missed_auth_token: request.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request?.type === 'OPEN_SIDEPANEL_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') }, (tab) => {
      sendResponse({ success: true, tabId: tab?.id });
    });
    return true;
  }
});

