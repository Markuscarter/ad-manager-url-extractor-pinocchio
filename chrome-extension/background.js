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

        navigator.clipboard.writeText = function(text) {
            if (typeof text === 'string' && text.includes('admanager.google.com')) {
                urls.add(text);
            }
            return originalWriteText.apply(this, arguments);
        };

        async function scrollToBottom() {
            let lastHeight = 0;
            let currentHeight = -1;
            while (lastHeight !== currentHeight) {
                lastHeight = document.body.scrollHeight;
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(r => setTimeout(r, 2000)); // Wait for lazy-loaded content
                currentHeight = document.body.scrollHeight;
            }
        }

        function findElementsRecursively(rootNode, selector) {
            let elements = Array.from(rootNode.querySelectorAll(selector));
            const allNodes = rootNode.querySelectorAll('*');
            for (const node of allNodes) {
                if (node.shadowRoot) {
                    elements = elements.concat(findElementsRecursively(node.shadowRoot, selector));
                }
            }
            return elements;
        }

        function findAndClickByText(rootNode, searchText) {
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
                    if (findAndClickByText(element.shadowRoot, searchText)) return true;
                }
            }
            return false;
        }

        await scrollToBottom();

        const adCreatives = findElementsRecursively(document, '[aria-label="Ad creative"]');
        for (const creative of adCreatives) {
            const menuButtons = findElementsRecursively(creative, '[aria-label="More actions"]');
            if (menuButtons.length > 0) {
                menuButtons[0].click();
                await new Promise(r => setTimeout(r, 200));
                findAndClickByText(document, "Copy URL to share ad");
                await new Promise(r => setTimeout(r, 100));
                // Attempt to close the menu, e.g., by clicking the button again or pressing escape
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
            }
        }

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
