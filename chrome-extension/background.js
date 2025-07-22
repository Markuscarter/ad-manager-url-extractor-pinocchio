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
            } else if (request.action === 'forceClick') {
                this.handleForceClick(request.selector, sendResponse);
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
                target: { tabId: tab.id, allFrames: true },
                function: extractUrlsFromPage
            });

            // Combine results from all frames and remove duplicates
            const allUrls = results.flatMap(frameResult => frameResult.result || []);
            const uniqueUrls = [...new Set(allUrls)];

            sendResponse({ success: true, urls: uniqueUrls });

        } catch (error) {
            console.error("Extraction error:", error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleForceClick(selector, sendResponse) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error("No active tab found.");
            }

            chrome.tabs.sendMessage(tab.id, { action: 'forceClick', selector: selector }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    sendResponse(response);
                }
            });
        } catch (error) {
            console.error("Force click error:", error);
            sendResponse({ success: false, error: error.message });
        }
    }
}

function extractUrlsFromPage() {
    const urls = new Set();

    function findLinks(rootNode) {
        // Find all anchor tags in the current root
        const anchors = rootNode.querySelectorAll('a[href]');
        for (const anchor of anchors) {
            if (anchor.href && anchor.href.includes('admanager.google.com')) {
                urls.add(anchor.href);
            }
        }

        // Recursively search for shadow roots
        const elements = rootNode.querySelectorAll('*');
        for (const element of elements) {
            if (element.shadowRoot) {
                findLinks(element.shadowRoot);
            }
        }
    }

    findLinks(document);
    return Array.from(urls);
}

// Initialize the background service
const backgroundService = new BackgroundService();
