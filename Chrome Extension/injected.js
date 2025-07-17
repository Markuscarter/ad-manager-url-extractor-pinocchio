// injected.js - Injected script for deeper DOM access in Ad Manager

(function() {
    'use strict';
    
    // This script runs in the page context to access variables and functions
    // that content scripts cannot reach due to isolation
    
    class AdManagerInjectedExtractor {
        constructor() {
            this.extractedData = [];
            this.observerActive = false;
            this.initializeExtractor();
        }
        
        initializeExtractor() {
            // Listen for messages from content script
            window.addEventListener('message', (event) => {
                if (event.source !== window) return;
                
                if (event.data.type === 'AD_MANAGER_EXTRACT_REQUEST') {
                    this.performDeepExtraction();
                }
                
                if (event.data.type === 'AD_MANAGER_STOP_EXTRACTION') {
                    this.stopExtraction();
                }
            });
            
            // Start monitoring page for Ad Manager data
            this.startPageMonitoring();
        }
        
        startPageMonitoring() {
            // Monitor for Angular/React state changes
            this.monitorAngularData();
            
            // Monitor network requests
            this.interceptNetworkRequests();
            
            // Monitor clipboard operations
            this.monitorClipboardOperations();
        }
        
        performDeepExtraction() {
            const extractedUrls = new Set();
            
            // Extract from global variables
            this.extractFromGlobalVariables(extractedUrls);
            
            // Extract from Angular/React components
            this.extractFromFrameworkData(extractedUrls);
            
            // Extract from network request data
            this.extractFromNetworkData(extractedUrls);
            
            // Extract from localStorage/sessionStorage
            this.extractFromStorageData(extractedUrls);
            
            // Send results back to content script
            window.postMessage({
                type: 'AD_MANAGER_EXTRACTION_RESULTS',
                urls: Array.from(extractedUrls),
                timestamp: new Date().toISOString()
            }, '*');
        }
        
        extractFromGlobalVariables(urlSet) {
            // Check common global variables where Ad Manager might store data
            const globals = ['window._docs', 'window.AF_initDataCallback', 'window.WIZ_global_data'];
            
            globals.forEach(globalPath => {
                try {
                    const data = this.getNestedProperty(window, globalPath.replace('window.', ''));
                    if (data) {
                        this.searchObjectForUrls(data, urlSet);
                    }
                } catch (error) {
                    console.log('Error accessing global:', globalPath, error);
                }
            });
        }
        
        extractFromFrameworkData(urlSet) {
            // Try to extract from Angular elements
            const ngElements = document.querySelectorAll('[ng-controller], [ng-app], [data-ng-controller]');
            ngElements.forEach(element => {
                try {
                    const scope = angular && angular.element(element).scope ? angular.element(element).scope() : null;
                    if (scope) {
                        this.searchObjectForUrls(scope, urlSet);
                    }
                } catch (error) {
                    // Angular not available or error accessing scope
                }
            });
            
            // Try to extract from React components
            this.extractFromReactComponents(urlSet);
        }
        
        extractFromReactComponents(urlSet) {
            const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
            reactElements.forEach(element => {
                try {
                    // Access React fiber data
                    const reactFiber = element._reactInternalFiber || element._reactInternalInstance;
                    if (reactFiber) {
                        this.searchObjectForUrls(reactFiber, urlSet);
                    }
                } catch (error) {
                    // React not available or error accessing fiber
                }
            });
        }
        
        extractFromNetworkData(urlSet) {
            // Access intercepted network data (if available)
            if (window._adManagerNetworkData) {
                this.searchObjectForUrls(window._adManagerNetworkData, urlSet);
            }
        }
        
        extractFromStorageData(urlSet) {
            // Check localStorage
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    if (value && value.includes('creativeId')) {
                        this.extractUrlsFromString(value, urlSet);
                    }
                }
            } catch (error) {
                console.log('Error accessing localStorage:', error);
            }
            
            // Check sessionStorage
            try {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);
                    if (value && value.includes('creativeId')) {
                        this.extractUrlsFromString(value, urlSet);
                    }
                }
            } catch (error) {
                console.log('Error accessing sessionStorage:', error);
            }
        }
        
        monitorAngularData() {
            // Monitor Angular digest cycles for data changes
            if (window.angular) {
                const originalDigest = window.angular.module('ng').digest;
                if (originalDigest) {
                    window.angular.module('ng').digest = function() {
                        const result = originalDigest.apply(this, arguments);
                        // Extract data after digest cycle
                        setTimeout(() => this.performDeepExtraction(), 100);
                        return result;
                    }.bind(this);
                }
            }
        }
        
        interceptNetworkRequests() {
            // Store original fetch and XMLHttpRequest
            const originalFetch = window.fetch;
            const originalXHR = window.XMLHttpRequest.prototype.open;
            
            // Intercept fetch requests
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    if (response.url.includes('admanager.google.com')) {
                        response.clone().text().then(text => {
                            if (text.includes('creativeId')) {
                                window._adManagerNetworkData = window._adManagerNetworkData || [];
                                window._adManagerNetworkData.push({
                                    url: response.url,
                                    data: text,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        });
                    }
                    return response;
                });
            };
            
            // Intercept XMLHttpRequest
            window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
                const xhr = this;
                const originalOnLoad = xhr.onload;
                
                xhr.onload = function() {
                    if (url.includes('admanager.google.com') && xhr.responseText.includes('creativeId')) {
                        window._adManagerNetworkData = window._adManagerNetworkData || [];
                        window._adManagerNetworkData.push({
                            url: url,
                            data: xhr.responseText,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    if (originalOnLoad) {
                        originalOnLoad.apply(this, arguments);
                    }
                };
                
                return originalXHR.apply(this, [method, url, ...args]);
            };
        }
        
        monitorClipboardOperations() {
            // Monitor clipboard write operations
            const originalWriteText = navigator.clipboard.writeText;
            
            if (originalWriteText) {
                navigator.clipboard.writeText = function(text) {
                    if (text && text.includes('ad_review_center')) {
                        window.postMessage({
                            type: 'AD_MANAGER_CLIPBOARD_URL',
                            url: text,
                            timestamp: new Date().toISOString()
                        }, '*');
                    }
                    return originalWriteText.apply(this, arguments);
                };
            }
        }
        
        searchObjectForUrls(obj, urlSet, depth = 0, maxDepth = 5) {
            if (depth > maxDepth || !obj || typeof obj !== 'object') {
                return;
            }
            
            try {
                if (Array.isArray(obj)) {
                    obj.forEach(item => this.searchObjectForUrls(item, urlSet, depth + 1, maxDepth));
                } else {
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        
                        if (typeof value === 'string') {
                            this.extractUrlsFromString(value, urlSet);
                        } else if (typeof value === 'object') {
                            this.searchObjectForUrls(value, urlSet, depth + 1, maxDepth);
                        }
                    });
                }
            } catch (error) {
                // Handle circular references or other errors
                console.log('Error searching object:', error);
            }
        }
        
        extractUrlsFromString(str, urlSet) {
            const urlPattern = /https:\/\/admanager\.google\.com\/\d+#creatives\/ad_review_center\/[^"'\s]+/g;
            const matches = str.match(urlPattern) || [];
            
            matches.forEach(url => {
                if (url.includes('creativeId')) {
                    urlSet.add(url);
                }
            });
            
            // Also look for creativeId/ecid pairs to construct URLs
            const creativeIdPattern = /creativeId['":\s]*(\d+)/g;
            const ecidPattern = /ecid['":\s]*(\d+)/g;
            
            const creativeMatches = [...str.matchAll(creativeIdPattern)];
            const ecidMatches = [...str.matchAll(ecidPattern)];
            
            if (creativeMatches.length && ecidMatches.length) {
                const networkCode = this.extractNetworkCode();
                creativeMatches.forEach((creativeMatch, index) => {
                    const ecidMatch = ecidMatches[index];
                    if (ecidMatch) {
                        const url = `https://admanager.google.com/${networkCode}#creatives/ad_review_center/product=MOBILE&creativeId=${creativeMatch[1]}&ecid=${ecidMatch[1]}`;
                        urlSet.add(url);
                    }
                });
            }
        }
        
        extractNetworkCode() {
            const match = window.location.href.match(/admanager\.google\.com\/(\d+)/);
            return match ? match[1] : '22849053685';
        }
        
        getNestedProperty(obj, path) {
            return path.split('.').reduce((current, prop) => current && current[prop], obj);
        }
        
        stopExtraction() {
            this.observerActive = false;
            // Clean up any observers or intervals
        }
    }
    
    // Initialize the injected extractor
    const injectedExtractor = new AdManagerInjectedExtractor();
    
    // Signal that the injected script is ready
    window.postMessage({
        type: 'AD_MANAGER_INJECTED_READY',
        timestamp: new Date().toISOString()
    }, '*');
    
})();
