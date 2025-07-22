// 🎭 Pinocchio's Background Service Worker

class BackgroundService {
    constructor() {
        this.initializeListeners();
        console.log('🎭 Pinocchio\'s background service initialized!');
    }

    initializeListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractUrls') {
                this.handleUrlExtraction(sendResponse);
                return true; // Keep message channel open for async response
            }
        });
    }

    async handleUrlExtraction(sendResponse) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error("No active tab found.");
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractUrlsFromPage
            });

            sendResponse({ success: true, urls: results[0].result });

        } catch (error) {
            console.error("Extraction error:", error);
            sendResponse({ success: false, error: error.message });
        }
    }
}

function extractUrlsFromPage() {
    const urls = new Set();
    const anchors = document.querySelectorAll('a[href]');

    for (const anchor of anchors) {
        if (anchor.href && anchor.href.includes('admanager.google.com')) {
            urls.add(anchor.href);
        }
    }
    return Array.from(urls);
}

// Initialize the background service
const backgroundService = new BackgroundService();
