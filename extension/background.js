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

