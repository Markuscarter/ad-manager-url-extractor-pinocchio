// content.js
console.log('🎭 Pinocchio\'s Content Script: Ready for page interaction.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceClick') {
    try {
      const element = document.querySelector(request.selector);
      if (element) {
        element.click();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Element not found' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    // Return true to indicate you wish to send a response asynchronously
    return true; 
  }
});
