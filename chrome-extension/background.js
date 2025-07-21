// 🎭 Pinocchio's Background Service Worker
// The puppet master behind the scenes, orchestrating the URL extraction magic

class BackgroundService {
    constructor() {
        this.initializeListeners();
        this.extractionSessions = new Map();
        console.log('🎭 Pinocchio\'s background service initialized!');
    }

    initializeListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('🎭 Extension installed:', details.reason);
            if (details.reason === 'install') {
                this.showWelcomeMessage();
            }
        });

        // Add listener for the extension icon click (for movable popup)
        chrome.action.onClicked.addListener((tab) => {
            this.createPopup(tab);
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('🎭 Background received message:', request);
            
            switch (request.action) {
                case 'extractUrls':
                    this.handleUrlExtraction(request, sender, sendResponse);
                    return true; // Keep message channel open for async response
                
                case 'getSessionInfo':
                    this.handleGetSessionInfo(request, sendResponse);
                    return false;
                
                case 'clearSession':
                    this.handleClearSession(request, sendResponse);
                    return false;
                
                default:
                    console.log('🎭 Unknown action:', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
                    return false;
            }
        });
    }

    createPopup(tab) {
        const width = 450;
        const height = 650;

        // Center the popup on the screen
        chrome.windows.get(tab.windowId, (window) => {
            const left = Math.round(window.left + (window.width - width) * 0.5);
            const top = Math.round(window.top + (window.height - height) * 0.5);

            chrome.windows.create({
                url: chrome.runtime.getURL("popup.html"),
                type: "popup",
                width: width,
                height: height,
                left: left,
                top: top
            });
        });
    }

    async handleUrlExtraction(request, sender, sendResponse) {
        try {
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                timestamp: Date.now(),
                status: 'extracting',
                urls: [],
                error: null
            };
            
            this.extractionSessions.set(sessionId, session);
            
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            // Check if we're on the right page
            if (!tab.url.includes('admanager.google.com')) {
                throw new Error('Please navigate to Google Ad Manager first');
            }

            // Execute content script to extract URLs
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: this.extractUrlsFromPage
            });

            if (results && results[0] && results[0].result) {
                const urls = results[0].result;
                session.urls = urls;
                session.status = 'completed';
                session.count = urls.length;
                
                console.log(`🎭 Extracted ${urls.length} URLs:`, urls);
                
                sendResponse({
                    success: true,
                    sessionId: sessionId,
                    urls: urls,
                    count: urls.length
                });
            } else {
                throw new Error('No URLs found on the page');
            }
            
        } catch (error) {
            console.error('🎭 Extraction error:', error);
            session.status = 'error';
            session.error = error.message;
            
            sendResponse({
                success: false,
                error: error.message,
                sessionId: sessionId
            });
        }
    }

    extractUrlsFromPage() {
        // This function runs in the context of the web page
        const urls = [];
        
        try {
            // Look for ad preview URLs in various formats
            const selectors = [
                'a[href*="preview"]',
                'a[href*="ad"]',
                '[data-url]',
                '[data-preview-url]',
                '.preview-url',
                '.ad-url'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const url = element.href || element.getAttribute('data-url') || element.getAttribute('data-preview-url');
                    if (url && url.includes('http') && !urls.includes(url)) {
                        urls.push(url);
                    }
                });
            });
            
            // Also look for URLs in text content
            const textContent = document.body.innerText;
            const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
            const matches = textContent.match(urlRegex);
            
            if (matches) {
                matches.forEach(url => {
                    if (url.includes('preview') || url.includes('ad') && !urls.includes(url)) {
                        urls.push(url);
                    }
                });
            }
            
        } catch (error) {
            console.error('🎭 Page extraction error:', error);
        }
        
        return urls;
    }

    handleGetSessionInfo(request, sendResponse) {
        const session = this.extractionSessions.get(request.sessionId);
        if (session) {
            sendResponse({
                success: true,
                session: session
            });
        } else {
            sendResponse({
                success: false,
                error: 'Session not found'
            });
        }
    }

    handleClearSession(request, sendResponse) {
        if (request.sessionId) {
            this.extractionSessions.delete(request.sessionId);
        } else {
            this.extractionSessions.clear();
        }
        
        sendResponse({
            success: true,
            message: 'Session cleared'
        });
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showWelcomeMessage() {
        console.log('🎭 Welcome to Pinocchio\'s Ad Manager URL Extractor!');
        console.log('🎭 Navigate to Google Ad Manager and click the extension icon to start extracting URLs.');
    }
}

// Initialize the background service
const backgroundService = new BackgroundService();
