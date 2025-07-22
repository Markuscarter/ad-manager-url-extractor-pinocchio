// popup.js - Popup UI controller

class PopupController {
    constructor() {
        this.extractedUrls = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            status: document.getElementById('status'),
            extractBtn: document.getElementById('extractBtn'),
            clearBtn: document.getElementById('clearBtn'),
            results: document.getElementById('results'),
            selectorInput: document.getElementById('selectorInput'),
            forceClickBtn: document.getElementById('forceClickBtn'),
            clickStatus: document.getElementById('clickStatus')
        };
    }

    attachEventListeners() {
        this.elements.extractBtn.addEventListener('click', () => this.startExtraction());
        this.elements.clearBtn.addEventListener('click', () => this.clearResults());
        this.elements.forceClickBtn.addEventListener('click', () => this.forceClick());
    }

    startExtraction() {
        this.clearResults();
        this.updateStatus('info', 'Extracting URLs...');
        this.elements.extractBtn.disabled = true;

        chrome.runtime.sendMessage({ action: 'extractUrls' }, (response) => {
            if (chrome.runtime.lastError) {
                this.updateStatus('error', 'Error: ' + chrome.runtime.lastError.message);
                this.elements.extractBtn.disabled = false;
                return;
            }

            if (response && response.success) {
                this.updateUrls(response.urls);
                this.updateStatus('success', `Extraction complete! Found ${response.urls.length} URLs.`);
            } else {
                this.updateStatus('error', response ? response.error : 'An unknown error occurred.');
            }
            this.elements.extractBtn.disabled = false;
        });
    }

    updateStatus(type, message) {
        this.elements.status.className = `status ${type}`;
        this.elements.status.textContent = message;
    }

    updateUrls(urls) {
        if (!Array.isArray(urls)) return;
        this.extractedUrls = urls;
        this.renderResults();
    }

    renderResults() {
        const resultsContainer = this.elements.results;
        resultsContainer.innerHTML = '';
        
        if (this.extractedUrls.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">No URLs found yet</div>';
            return;
        }

        this.extractedUrls.forEach(url => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';
            urlItem.textContent = url;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(url);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            });
            
            urlItem.appendChild(copyBtn);
            resultsContainer.appendChild(urlItem);
        });
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    clearResults() {
        this.extractedUrls = [];
        this.renderResults();
        this.updateStatus('info', 'Results cleared');
    }

    forceClick() {
        const selector = this.elements.selectorInput.value;
        if (!selector) {
            this.updateClickStatus('error', 'Please enter a CSS selector.');
            return;
        }
        
        this.updateClickStatus('info', `Attempting to click "${selector}"...`);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                 this.updateClickStatus('error', 'Could not find active tab.');
                 return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: 'forceClick', selector: selector }, (response) => {
                if (chrome.runtime.lastError) {
                    this.updateClickStatus('error', 'Could not connect to the page.');
                } else if (response && response.success) {
                    this.updateClickStatus('success', `Successfully clicked "${selector}"!`);
                } else {
                    this.updateClickStatus('error', response.error || 'Could not find or click element.');
                }
            });
        });
    }

    updateClickStatus(type, message) {
        this.elements.clickStatus.className = `status-message ${type}`;
        this.elements.clickStatus.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
