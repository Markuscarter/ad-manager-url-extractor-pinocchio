// 🎭 Pinocchio's Content Script - The Puppet Master's Strings
// This script runs in the context of the Ad Manager page

console.log('🎭 Pinocchio\'s URL Extractor: Content script loaded!');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎭 Received message:', request);
  
  if (request.action === 'extractUrls') {
    console.log('🎭 Extracting URLs from Ad Review Center...');
    
    // Inject our script into the page context
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => {
      // Send message to the injected script
      window.postMessage({
        type: 'PINOCCHIO_EXTRACT_URLS',
        action: 'extract'
      }, '*');
    };
    (document.head || document.documentElement).appendChild(script);
    
    // Listen for response from injected script
    const messageListener = (event) => {
      if (event.data.type === 'PINOCCHIO_URLS_EXTRACTED') {
        console.log('🎭 URLs extracted:', event.data.urls);
        sendResponse({
          success: true,
          urls: event.data.urls,
          count: event.data.urls.length
        });
        window.removeEventListener('message', messageListener);
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Set a timeout in case the extraction takes too long
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      sendResponse({
        success: false,
        error: 'Extraction timeout - no URLs found'
      });
    }, 10000);
    
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'checkPage') {
    // Check if we're on the Ad Review Center page
    const isAdReviewCenter = window.location.href.includes('admanager.google.com') && 
                           (window.location.href.includes('review') || 
                            document.title.includes('Ad Review'));
    
    sendResponse({
      isAdReviewCenter: isAdReviewCenter,
      currentUrl: window.location.href,
      pageTitle: document.title
    });
  }
  
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
    return true; // Keep message channel open for async response
  }
});

// Notify that content script is ready
console.log('�� Pinocchio\'s content script is ready to extract URLs!');
