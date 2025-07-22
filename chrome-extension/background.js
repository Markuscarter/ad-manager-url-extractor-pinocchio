// 🎭 Pinocchio's Background Service Worker
// The puppet master behind the scenes, orchestrating the URL extraction magic

class BackgroundService {
    constructor() {
        this.initializeListeners();
        console.log('🎭 Pinocchio\'s background service initialized!');
    }

    initializeListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('🎭 Extension installed:', details.reason);
        });

        // Add listener for the extension icon click
        chrome.action.onClicked.addListener((tab) => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
        });
    }
}

// Initialize the background service
const backgroundService = new BackgroundService();
