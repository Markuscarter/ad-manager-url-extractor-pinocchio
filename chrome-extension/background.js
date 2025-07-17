// background.js - Service worker for Chrome extension

class BackgroundService[object Object]
    constructor() {
        this.initializeListeners();
        this.extractionSessions = new Map();
    }

    initializeListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => [object Object]       if (details.reason === 'install')[object Object]              this.onInstall();
            } else if (details.reason === 'update')[object Object]              this.onUpdate(details.previousVersion);
            }
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => [object Object]       this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => [object Object]        if (changeInfo.status === 'complete' && 
                tab.url && 
                tab.url.includes('admanager.google.com'))[object Object]              this.onAdManagerPageLoad(tabId, tab);
            }
        });

        // Handle tab removal
        chrome.tabs.onRemoved.addListener((tabId) => [object Object]
            this.cleanupSession(tabId);
        });
    }

    onInstall()[object Object]       console.log('Ad Manager URL Extractor installed');
        
        // Set default settings
        chrome.storage.local.set({
            settings:[object Object]              autoExtract: false,
                maxUrls: 1000             delay: 200               retryAttempts: 3
            }
        });
    }

    onUpdate(previousVersion)[object Object]       console.log(`Ad Manager URL Extractor updated from ${previousVersion}`);
        
        // Handle any migration logic here if needed
        this.migrateSettings(previousVersion);
    }

    async migrateSettings(previousVersion) {
        try {
            const result = await chrome.storage.local.get('settings');
            const currentSettings = result.settings ||[object Object]      
            // Add any new settings with defaults
            const updatedSettings =[object Object]              autoExtract: false,
                maxUrls: 1000             delay: 200               retryAttempts: 3               ...currentSettings
            };
            
            await chrome.storage.local.set({ settings: updatedSettings });
        } catch (error) {
            console.error('Error migrating settings:,error);
        }
    }

    handleMessage(message, sender, sendResponse) {
        const tabId = sender.tab?.id;
        
        switch (message.action) [object Object]            case 'startExtraction:              this.startExtractionSession(tabId, message.options);
                sendResponse({ success: true });
                break;
                
            case stopExtraction:              this.stopExtractionSession(tabId);
                sendResponse({ success: true });
                break;
                
            case 'getExtractionStatus:             const status = this.getExtractionStatus(tabId);
                sendResponse(status);
                break;
                
            case 'saveResults:              this.saveExtractionResults(tabId, message.results);
                sendResponse({ success: true });
                break;
                
            case 'getSettings:              this.getSettings().then(settings => sendResponse(settings));
                break;
                
            case updateSettings:              this.updateSettings(message.settings).then(() => {
                    sendResponse({ success: true });
                });
                break;
                
            case 'statusUpdate':
            case 'urlUpdate':
            case progressUpdate:                // Forward these messages to any listening popups
                this.forwardToPopup(message);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    startExtractionSession(tabId, options = {}) [object Object]        if (!tabId) return;
        
        const session =[object Object]
            tabId,
            startTime: Date.now(),
            status: 'running',
            options,
            results: [],
            progress: { current: 0, total: 0, urls: 0 }
        };
        
        this.extractionSessions.set(tabId, session);
        
        // Set a timeout to auto-stop extraction after 10        setTimeout(() => [object Object]          if (this.extractionSessions.has(tabId))[object Object]              this.stopExtractionSession(tabId);
            }
        }, 10 *6000 // 10minutes
    }

    stopExtractionSession(tabId) [object Object]        if (!tabId || !this.extractionSessions.has(tabId)) return;
        
        const session = this.extractionSessions.get(tabId);
        session.status = 'completed;       session.endTime = Date.now();
        
        // Save results to storage
        this.saveSessionResults(session);
        
        // Keep session for a bit longer for popup to access
        setTimeout(() => [object Object]          this.extractionSessions.delete(tabId);
        }, 30000 // 30seconds
    }

    getExtractionStatus(tabId) [object Object]        if (!tabId || !this.extractionSessions.has(tabId)) {
            return { isExtracting: false, session: null };
        }
        
        const session = this.extractionSessions.get(tabId);
        return {
            isExtracting: session.status === 'running',
            session:[object Object]             startTime: session.startTime,
                status: session.status,
                progress: session.progress,
                resultCount: session.results.length
            }
        };
    }

    async saveExtractionResults(tabId, results) {
        if (!results || !Array.isArray(results)) return;
        
        try {
            const timestamp = new Date().toISOString();
            const key = `extraction_${timestamp}`;
            
            const extractionData =[object Object]         timestamp,
                tabId,
                url: await this.getTabUrl(tabId),
                results,
                count: results.length
            };
            
            await chrome.storage.local.set({ [key]: extractionData });
            
            // Also update the session if it exists
            if (this.extractionSessions.has(tabId))[object Object]             const session = this.extractionSessions.get(tabId);
                session.results = results;
            }
            
        } catch (error) {
            console.error('Error saving extraction results:,error);
        }
    }

    async saveSessionResults(session) {
        try {
            const timestamp = new Date().toISOString();
            const key = `session_${session.tabId}_${timestamp}`;
            
            await chrome.storage.local.set({ [key]: session });
        } catch (error) {
            console.error('Error saving session results:,error);
        }
    }

    async getTabUrl(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            return tab.url;
        } catch (error) {
            return null;
        }
    }

    async getSettings() {
        try {
            const result = await chrome.storage.local.get('settings');
            return result.settings ||[object Object]              autoExtract: false,
                maxUrls: 1000             delay: 200               retryAttempts:3        };
        } catch (error) {
            console.error('Error getting settings:', error);
            return[object Object]
        }
    }

    async updateSettings(newSettings) {
        try {
            await chrome.storage.local.set({ settings: newSettings });
        } catch (error) {
            console.error('Error updating settings:,error);
        }
    }

    forwardToPopup(message)[object Object]     // This would forward messages to any open popup windows
        // Chrome extensions don't have a direct way to message popups,
        // so we rely on the popup polling for updates
    }

    onAdManagerPageLoad(tabId, tab) {
        // Inject content script if needed
        this.ensureContentScriptInjected(tabId);
        
        // If auto-extract is enabled, start extraction
        this.getSettings().then(settings => [object Object]      if (settings.autoExtract && tab.url.includes('ad_review_center'))[object Object]        setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'startExtraction',
                        options: { auto: true }
                    }).catch(() => {
                        // Content script might not be ready yet
                    });
                }, 2000         }
        });
    }

    async ensureContentScriptInjected(tabId) {
        try {
            // Check if content script is already injected
            const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            if (response?.success)[object Object]            return; // Already injected
            }
        } catch (error) {
            // Content script not injected, inject it
            try[object Object]             await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js]              });
            } catch (injectionError)[object Object]           console.error('Error injecting content script:', injectionError);
            }
        }
    }

    cleanupSession(tabId) [object Object]      if (this.extractionSessions.has(tabId)) [object Object]          this.extractionSessions.delete(tabId);
        }
    }

    // Utility method to clean up old stored data
    async cleanupOldData() {
        try {
            const result = await chrome.storage.local.get();
            const thirtyDaysAgo = Date.now() - (30 * 24600      
            const keysToRemove =      
            for (const [key, value] of Object.entries(result))[object Object]                if (key.startsWith('extraction_') || key.startsWith('session_')) {
                    const timestamp = new Date(value.timestamp).getTime();
                    if (timestamp < thirtyDaysAgo) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            if (keysToRemove.length > 0)[object Object]             await chrome.storage.local.remove(keysToRemove);
                console.log(`Cleaned up ${keysToRemove.length} old extraction records`);
            }
        } catch (error) {
            console.error(Error cleaning up old data:,error);
        }
    }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Run cleanup weekly
chrome.alarms.create('cleanup', [object Object] periodInMinutes: 1080; // 7 days
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        backgroundService.cleanupOldData();
    }
}); 