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
            } else if (request.action === 'targetedClick') {
                this.handleTargetedClick(request.text, sendResponse);
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
                function: extractAllLinks
            });

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

    async handleTargetedClick(text, sendResponse) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error("No active tab found.");
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                function: findAndClickElement,
                args: [text]
            });

            const success = results.some(frameResult => frameResult.result);
            if (success) {
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: "Could not find a clickable element containing that text." });
            }

        } catch (error) {
            console.error("Targeted click error:", error);
            sendResponse({ success: false, error: error.message });
        }
    }
}

function extractAllLinks() {
    const urls = new Set();
    function findLinks(rootNode) {
        const anchors = rootNode.querySelectorAll('a[href]');
        for (const anchor of anchors) {
            if (anchor.href) {
                urls.add(anchor.href);
            }
        }
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

function findAndClickElement(text) {
    function findElement(rootNode, searchText) {
        const elements = rootNode.querySelectorAll('*');
        for (const element of elements) {
            // More robust text matching
            const elementText = element.textContent.trim().toLowerCase();
            const searchLower = searchText.trim().toLowerCase();

            if (elementText.includes(searchLower)) {
                let clickableElement = element;
                while (clickableElement && typeof clickableElement.click !== 'function') {
                    clickableElement = clickableElement.parentElement;
                }

                if (clickableElement) {
                    // Check if element is visible before clicking
                    const style = window.getComputedStyle(clickableElement);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                        clickableElement.click();
                        return true;
                    }
                }
            }

            if (element.shadowRoot) {
                if (findElement(element.shadowRoot, searchText)) {
                    return true;
                }
            }
        }
        return false;
    }
    return findElement(document, text);
}

// Initialize the background service
const backgroundService = new BackgroundService();
