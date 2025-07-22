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
                function: automatedExtraction
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

function automatedExtraction() {
    return new Promise(async (resolve) => {
        const urls = new Set();
        const originalWriteText = navigator.clipboard.writeText;

        // Temporarily override the clipboard function to intercept URLs
        navigator.clipboard.writeText = function(text) {
            if (typeof text === 'string' && text.includes('admanager.google.com')) {
                urls.add(text);
            }
            // We still call the original function, but we don't need its result
            return originalWriteText.apply(this, arguments);
        };

        function findAndClick(rootNode, searchText) {
            const elements = rootNode.querySelectorAll('*');
            for (const element of elements) {
                if (element.textContent.trim().includes(searchText)) {
                    let clickableElement = element;
                    while (clickableElement && typeof clickableElement.click !== 'function') {
                        clickableElement = clickableElement.parentElement;
                    }
                    if (clickableElement) {
                        clickableElement.click();
                        return true;
                    }
                }
                if (element.shadowRoot) {
                    if (findAndClick(element.shadowRoot, searchText)) return true;
                }
            }
            return false;
        }

        const adCreatives = document.querySelectorAll('[aria-label="Ad creative"]');
        for (const creative of adCreatives) {
            const menuButton = creative.querySelector('[aria-label="More actions"]');
            if (menuButton) {
                menuButton.click();
                // Wait for the menu to appear
                await new Promise(r => setTimeout(r, 200));
                findAndClick(document, "Copy URL to share ad");
                // Close the menu by clicking the button again
                menuButton.click();
                await new Promise(r => setTimeout(r, 100));
            }
        }

        // Restore the original clipboard function
        navigator.clipboard.writeText = originalWriteText;
        resolve(Array.from(urls));
    });
}

function findAndClickElement(text) {
    function findElement(rootNode, searchText) {
        const elements = rootNode.querySelectorAll('*');
        for (const element of elements) {
            if (element.textContent.trim().includes(searchText)) {
                // Find the closest clickable ancestor
                let clickableElement = element;
                while (clickableElement && typeof clickableElement.click !== 'function') {
                    clickableElement = clickableElement.parentElement;
                }
                if (clickableElement) {
                    clickableElement.click();
                    return true;
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
