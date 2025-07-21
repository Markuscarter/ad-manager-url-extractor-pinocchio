// popup.js - Popup UI controller

class PopupController {
    constructor() {
        this.extractedUrls = [];
        this.isExtracting = false;
        this.currentProgress = { current: 0, total: 0, urls: 0 };
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkCurrentStatus();
    }

    initializeElements() {
        this.elements = {
            status: document.getElementById('status'),
            extractBtn: document.getElementById('extractBtn'),
            stopBtn: document.getElementById('stopBtn'),
            progress: document.getElementById('progress'),
            progressText: document.getElementById('progressText'),
            progressCount: document.getElementById('progressCount'),
            progressFill: document.getElementById('progressFill'),
            results: document.getElementById('results'),
            exportControls: document.getElementById('exportControls'),
            copyAllBtn: document.getElementById('copyAllBtn'),
            exportCsvBtn: document.getElementById('exportCsvBtn'),
            clearBtn: document.getElementById('clearBtn')
        };
    }

    attachEventListeners() {
        this.elements.extractBtn.addEventListener('click', () => this.startExtraction());
        this.elements.stopBtn.addEventListener('click', () => this.stopExtraction());
        this.elements.copyAllBtn.addEventListener('click', () => this.copyAllUrls());
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportCsv());
        this.elements.clearBtn.addEventListener('click', () => this.clearResults());

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'statusUpdate':
                    this.updateStatus(message.status.type, message.status.message);
                    break;
                case 'urlUpdate':
                    this.updateUrls(message.urls);
                    break;
                case 'progressUpdate':
                    this.updateProgress(message.progress);
                    break;
            }
        });
    }

    async checkCurrentStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('admanager.google.com')) {
                this.updateStatus('error', 'Please navigate to Google Ad Manager first');
                this.elements.extractBtn.disabled = true;
                return;
            }

            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
            
            if (response) {
                this.isExtracting = response.isExtracting;
                this.extractedUrls = response.extractedUrls || [];
                this.updateButtonStates();
                this.renderResults();
                
                if (this.isExtracting) {
                    this.showProgress();
                    this.updateStatus('info', 'Extraction in progress...');
                } else if (this.extractedUrls.length > 0) {
                    this.updateStatus('success', `Found ${this.extractedUrls.length} URLs`);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            this.updateStatus('error', 'Unable to connect to the page. Please refresh and try again.');
        }
    }

    async startExtraction() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            this.isExtracting = true;
            this.extractedUrls = [];
            this.updateButtonStates();
            this.showProgress();
            this.updateStatus('info', 'Starting extraction...');
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'startExtraction',
                options: {
                    // Add any extraction options here
                }
            });
            
        } catch (error) {
            console.error('Error starting extraction:', error);
            this.updateStatus('error', 'Failed to start extraction. Please refresh the page and try again.');
            this.isExtracting = false;
            this.updateButtonStates();
        }
    }

    async stopExtraction() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, { action: 'stopExtraction' });
            
            this.isExtracting = false;
            this.updateButtonStates();
            this.hideProgress();
            
        } catch (error) {
            console.error('Error stopping extraction:', error);
            this.updateStatus('error', 'Unable to stop extraction');
        }
    }

    updateStatus(type, message) {
        this.elements.status.className = `status ${type}`;
        this.elements.status.textContent = message;
    }

    updateUrls(urls) {
        this.extractedUrls = urls;
        this.renderResults();
        this.updateExportControls();
    }

    updateProgress(progress) {
        this.currentProgress = progress;
        
        if (progress.total > 0) {
            const percentage = (progress.current / progress.total) * 100;
            this.elements.progressFill.style.width = `${percentage}%`;
            this.elements.progressText.textContent = `Processing ${progress.current}/${progress.total} ads`;
        }
        
        this.elements.progressCount.textContent = progress.urls.toString();
    }

    showProgress() {
        this.elements.progress.style.display = 'block';
        this.elements.progressFill.style.width = '0%';
        this.elements.progressText.textContent = 'Initializing...';
        this.elements.progressCount.textContent = '0';
    }

    hideProgress() {
        this.elements.progress.style.display = 'none';
    }

    updateButtonStates() {
        this.elements.extractBtn.disabled = this.isExtracting;
        this.elements.stopBtn.disabled = !this.isExtracting;
        
        if (this.isExtracting) {
            this.elements.extractBtn.textContent = 'Extracting...';
        } else {
            this.elements.extractBtn.textContent = 'Extract URLs';
        }
    }

    renderResults() {
        const resultsContainer = this.elements.results;
        resultsContainer.innerHTML = '';
        
        if (this.extractedUrls.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding:20px; color: #666">No URLs found yet</div>';
            return;
        }

        this.extractedUrls.forEach((urlData, index) => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';
            
            const creativeId = this.extractCreativeId(urlData.url);
            const ecid = this.extractEcid(urlData.url);
            
            urlItem.innerHTML = `
                <div class="url-text">${urlData.url}</div>
                <div class="url-meta">
                    <span>Source: ${urlData.source}</span>
                    <span>Creative ID: ${creativeId || 'N/A'}</span>
                </div>
                <button class="copy-btn" data-url="${urlData.url}">Copy</button>
            `;
            
            resultsContainer.appendChild(urlItem);
        });
        
        // Attach copy button listeners
        resultsContainer.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                this.copyToClipboard(url);
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 2000);
            });
        });
    }

    extractCreativeId(url) {
        const match = url.match(/creativeId=(\d+)/);
        return match ? match[1] : null;
    }

    extractEcid(url) {
        const match = url.match(/ecid=(\d+)/);
        return match ? match[1] : null;
    }

    updateExportControls() {
        if (this.extractedUrls.length > 0) {
            this.elements.exportControls.style.display = 'flex';
        } else {
            this.elements.exportControls.style.display = 'none';
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    async copyAllUrls() {
        const allUrls = this.extractedUrls.map(urlData => urlData.url).join('\n');
        await this.copyToClipboard(allUrls);
        
        this.elements.copyAllBtn.textContent = 'Copied!';
        setTimeout(() => {
            this.elements.copyAllBtn.textContent = 'Copy All URLs';
        }, 2000);
    }

    exportCsv() {
        const csvContent = this.generateCsvContent();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ad-manager-urls-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.elements.exportCsvBtn.textContent = 'Exported!';
        setTimeout(() => {
            this.elements.exportCsvBtn.textContent = 'Export CSV';
        }, 2000);
    }

    generateCsvContent() {
        const headers = ['URL', 'Creative ID', 'ECID', 'Source', 'Timestamp'];
        const rows = this.extractedUrls.map(urlData => [
            urlData.url,
            this.extractCreativeId(urlData.url) || '',
            this.extractEcid(urlData.url) || '',
            urlData.source,
            urlData.timestamp
        ]);
        
        const csvRows = [headers, ...rows];
        return csvRows.map(row => 
            row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    clearResults() {
        this.extractedUrls = [];
        this.renderResults();
        this.updateExportControls();
        this.updateStatus('info', 'Results cleared. Ready to extract URLs.');
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const popupController = new PopupController();
    
    // Add event listener for the "Force Click" button
    const forceClickBtn = document.getElementById('forceClickBtn');
    const selectorInput = document.getElementById('selectorInput');
    const clickStatus = document.getElementById('clickStatus');

    if (forceClickBtn) {
        forceClickBtn.addEventListener('click', () => {
            const selector = selectorInput.value;
            if (!selector) {
                clickStatus.textContent = 'Please enter a CSS selector.';
                clickStatus.className = 'status-message error';
                return;
            }
            
            clickStatus.textContent = `Attempting to click "${selector}"...`;
            clickStatus.className = 'status-message info';

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const targetTab = tabs.find(tab => tab.url && !tab.url.startsWith('chrome-extension://'));
                if (!targetTab) {
                    clickStatus.textContent = 'Error: No active page found to interact with.';
                    clickStatus.className = 'status-message error';
                    return;
                }

                chrome.tabs.sendMessage(targetTab.id, {
                    action: 'forceClick',
                    selector: selector
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        clickStatus.textContent = `Error: Could not connect to the page. Make sure the page is fully loaded.`;
                        clickStatus.className = 'status-message error';
                    } else if (response && response.success) {
                        clickStatus.textContent = `Successfully clicked "${selector}"!`;
                        clickStatus.className = 'status-message success';
                    } else {
                        clickStatus.textContent = `Error: ${response.error || 'Could not find or click element.'}`;
                        clickStatus.className = 'status-message error';
                    }
                });
            });
        });
    }

    // Add event listener for the "Run Dialog Test" button
    const testDialogBtn = document.getElementById('testDialogBtn');
    if (testDialogBtn) {
        testDialogBtn.addEventListener('click', () => {
            const testSelector = '#this-element-does-not-exist';
            
            console.log(`[AI DIALOG] Running test: Attempting to click "${testSelector}"`);
            clickStatus.textContent = `[USER DIALOG] Running test...`;
            clickStatus.className = 'status-message info';

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const targetTab = tabs.find(tab => tab.url && !tab.url.startsWith('chrome-extension://'));
                if (!targetTab) {
                    const errorMessage = 'Error: No active page found to interact with.';
                    console.error(`[AI DIALOG] ${errorMessage}`);
                    clickStatus.textContent = `[USER DIALOG] ${errorMessage}`;
                    clickStatus.className = 'status-message error';
                    return;
                }

                chrome.tabs.sendMessage(targetTab.id, {
                    action: 'forceClick',
                    selector: testSelector
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        const errorMessage = `Error: Could not connect to the page. Make sure the page is fully loaded.`;
                        console.error(`[AI DIALOG] ${errorMessage}`);
                        clickStatus.textContent = `[USER DIALOG] ${errorMessage}`;
                        clickStatus.className = 'status-message error';
                    } else if (response && response.success) {
                        const successMessage = `Successfully clicked "${testSelector}"! (This should not happen in a test).`;
                        console.log(`[AI DIALOG] ${successMessage}`);
                        clickStatus.textContent = `[USER DIALOG] ${successMessage}`;
                        clickStatus.className = 'status-message success';
                    } else {
                        const errorMessage = `Test successful: Failed to click non-existent element as expected. Error: ${response.error}`;
                        console.log(`[AI DIALOG] ${errorMessage}`);
                        clickStatus.textContent = `[USER DIALOG] Test successful: Failed to click non-existent element.`;
                        clickStatus.className = 'status-message success';
                    }
                });
            });
        });
    }
});
