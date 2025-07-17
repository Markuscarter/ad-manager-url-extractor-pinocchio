// puppeteer-integration.js - Server-side Puppeteer automation for Ad Manager

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AdManagerPuppeteerAutomator {
    constructor(options = {}) {
        this.options = {
            headless: options.headless !== false, // Default to headless
            slowMo: options.slowMo || 100,
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            ...options
        };
        
        this.browser = null;
        this.page = null;
        this.extractedUrls = [];
        this.processed = new Set();
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                slowMo: this.options.slowMo,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Set viewport for desktop experience
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Set user agent to appear as regular Chrome
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Enable request/response interception for debugging
            await this.page.setRequestInterception(true);
            this.page.on('request', this.handleRequest.bind(this));
            this.page.on('response', this.handleResponse.bind(this));
            
            // Listen for console messages
            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.error('Page error:', msg.text());
                }
            });

            console.log('Puppeteer browser initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Puppeteer:', error);
            return false;
        }
    }

    handleRequest(request) {
        // Allow all requests but log important ones
        if (request.url().includes('admanager.google.com')) {
            console.log('AdManager request:', request.method(), request.url());
        }
        request.continue();
    }

    handleResponse(response) {
        // Log responses that might contain ad data
        if (response.url().includes('admanager.google.com') && 
            (response.url().includes('creative') || response.url().includes('ad'))) {
            console.log('AdManager response:', response.status(), response.url());
        }
    }

    async navigateToAdManager(networkCode = null) {
        try {
            let url = 'https://admanager.google.com/';
            if (networkCode) {
                url += `${networkCode}#creatives/ad_review_center`;
            }

            console.log('Navigating to:', url);
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: this.options.timeout 
            });

            // Wait for the page to fully load
            await this.waitForAdManagerLoad();
            
            return true;
        } catch (error) {
            console.error('Failed to navigate to Ad Manager:', error);
            return false;
        }
    }

    async waitForAdManagerLoad() {
        console.log('Waiting for Ad Manager to load...');
        
        // Wait for key elements that indicate the page is ready
        const selectors = [
            '[data-creative-id]',
            '.creative-card',
            '.ad-card',
            '.review-card',
            'material-select-item'
        ];

        let loaded = false;
        for (const selector of selectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                loaded = true;
                console.log(`Found elements with selector: ${selector}`);
                break;
            } catch (error) {
                // Try next selector
            }
        }

        if (!loaded) {
            console.log('No specific Ad Manager elements found, waiting for general page load');
            await this.page.waitForTimeout(3000);
        }

        // Additional wait for Angular/dynamic content
        await this.page.waitForFunction(
            () => document.readyState === 'complete',
            { timeout: 10000 }
        );

        console.log('Ad Manager page loaded');
    }

    async extractAllUrls() {
        console.log('Starting URL extraction...');
        
        try {
            // Reset extraction state
            this.extractedUrls = [];
            this.processed.clear();

            // Extract URLs using multiple methods
            await this.extractFromPageSource();
            await this.extractFromElements();
            await this.extractViaInteraction();
            
            console.log(`Extraction complete. Found ${this.extractedUrls.length} unique URLs`);
            return this.extractedUrls;
            
        } catch (error) {
            console.error('Error during URL extraction:', error);
            throw error;
        }
    }

    async extractFromPageSource() {
        console.log('Extracting URLs from page source...');
        
        const content = await this.page.content();
        
        // Extract direct URLs
        const urlPattern = /https:\/\/admanager\.google\.com\/\d+#creatives\/ad_review_center\/[^"'\s]+/g;
        const urls = content.match(urlPattern) || [];
        
        urls.forEach(url => this.addUrl(url, 'page-source'));
        
        // Extract creative IDs and ECIDs to construct URLs
        const creativeIdPattern = /creativeId['":][\s]*['"]?(\d+)['"]?/g;
        const ecidPattern = /ecid['":][\s]*['"]?(\d+)['"]?/g;
        
        const creativeMatches = [...content.matchAll(creativeIdPattern)];
        const ecidMatches = [...content.matchAll(ecidPattern)];
        
        // Try to pair creative IDs with ECIDs
        for (let i = 0; i < Math.min(creativeMatches.length, ecidMatches.length); i++) {
            const creativeId = creativeMatches[i][1];
            const ecid = ecidMatches[i][1];
            
            if (creativeId && ecid) {
                const networkCode = await this.getNetworkCode();
                const url = `https://admanager.google.com/${networkCode}#creatives/ad_review_center/product=MOBILE&creativeId=${creativeId}&ecid=${ecid}`;
                this.addUrl(url, 'constructed');
            }
        }
        
        console.log(`Found ${urls.length} direct URLs and constructed additional URLs from IDs`);
    }

    async extractFromElements() {
        console.log('Extracting URLs from DOM elements...');
        
        // Look for elements with data attributes
        const elementsWithData = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('[data-creative-id], [data-ecid]');
            return Array.from(elements).map(el => ({
                creativeId: el.getAttribute('data-creative-id'),
                ecid: el.getAttribute('data-ecid'),
                tagName: el.tagName,
                className: el.className
            }));
        });
        
        for (const element of elementsWithData) {
            if (element.creativeId && element.ecid) {
                const networkCode = await this.getNetworkCode();
                const url = `https://admanager.google.com/${networkCode}#creatives/ad_review_center/product=MOBILE&creativeId=${element.creativeId}&ecid=${element.ecid}`;
                this.addUrl(url, 'data-attributes');
            }
        }
        
        console.log(`Processed ${elementsWithData.length} elements with data attributes`);
    }

    async extractViaInteraction() {
        console.log('Extracting URLs via element interaction...');
        
        // Find all potential ad cards
        const adCards = await this.findAdCards();
        console.log(`Found ${adCards.length} potential ad cards`);
        
        for (let i = 0; i < adCards.length; i++) {
            try {
                console.log(`Processing card ${i + 1}/${adCards.length}`);
                await this.processAdCard(i);
                
                // Small delay between cards to avoid overwhelming the page
                await this.page.waitForTimeout(this.options.slowMo);
                
            } catch (error) {
                console.error(`Error processing card ${i}:`, error);
            }
        }
    }

    async findAdCards() {
        return await this.page.evaluate(() => {
            const selectors = [
                '.creative-card',
                '.ad-card',
                '[data-creative-id]',
                '.creative-item',
                '.review-card'
            ];
            
            let cards = [];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    cards = Array.from(elements);
                    break;
                }
            }
            
            // If no specific cards found, look for generic containers
            if (cards.length === 0) {
                const candidates = document.querySelectorAll('[class*="creative"], [class*="ad"], [class*="review"]');
                cards = Array.from(candidates).filter(el => {
                    const text = el.textContent || '';
                    return text.includes('creative') || text.includes('ad') || el.querySelector('img');
                });
            }
            
            return cards.map((card, index) => ({ index, rect: card.getBoundingClientRect() }));
        });
    }

    async processAdCard(cardIndex) {
        // Scroll card into view
        await this.page.evaluate((index) => {
            const cards = document.querySelectorAll('.creative-card, .ad-card, [data-creative-id], .creative-item, .review-card');
            if (cards[index]) {
                cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, cardIndex);
        
        await this.page.waitForTimeout(500);
        
        // Try to find and click dropdown/menu triggers
        const dropdownFound = await this.clickDropdownTrigger(cardIndex);
        
        if (dropdownFound) {
            await this.page.waitForTimeout(300);
            
            // Look for copy URL button in the menu
            const copyButtonClicked = await this.clickCopyUrlButton();
            
            if (copyButtonClicked) {
                // Check clipboard for new URL
                await this.checkClipboardForUrl();
            }
            
            // Close the menu
            await this.closeMenu();
        }
    }

    async clickDropdownTrigger(cardIndex) {
        return await this.page.evaluate((index) => {
            const cards = document.querySelectorAll('.creative-card, .ad-card, [data-creative-id], .creative-item, .review-card');
            const card = cards[index];
            
            if (!card) return false;
            
            const dropdownSelectors = [
                '.more-actions',
                '.dropdown-trigger',
                '.menu-trigger',
                'material-icon[title*="More"]',
                '[aria-label*="More"]'
            ];
            
            for (const selector of dropdownSelectors) {
                const trigger = card.querySelector(selector);
                if (trigger && trigger.offsetParent !== null) {
                    trigger.click();
                    return true;
                }
            }
            
            return false;
        }, cardIndex);
    }

    async clickCopyUrlButton() {
        return await this.page.evaluate(() => {
            const copySelectors = [
                '.copy-url-to-share-ad',
                'material-select-item:contains("Copy URL to share ad")',
                '[aria-label*="Copy URL"]',
                '.menu-item'
            ];
            
            for (const selector of copySelectors) {
                let elements;
                
                if (selector.includes(':contains')) {
                    // Handle pseudo-selector manually
                    elements = Array.from(document.querySelectorAll('material-select-item, .menu-item'))
                        .filter(el => el.textContent.toLowerCase().includes('copy url') || 
                                     el.textContent.toLowerCase().includes('share ad'));
                } else {
                    elements = document.querySelectorAll(selector);
                }
                
                for (const element of elements) {
                    if (element && element.offsetParent !== null) {
                        element.click();
                        return true;
                    }
                }
            }
            
            return false;
        });
    }

    async checkClipboardForUrl() {
        try {
            // Since we can't directly access clipboard in headless mode,
            // we'll look for success indicators or network requests
            await this.page.waitForTimeout(500);
            
            // Check for any toast notifications or success messages
            const successIndicator = await this.page.evaluate(() => {
                const indicators = document.querySelectorAll('.toast, .notification, .success, .copied');
                return indicators.length > 0;
            });
            
            if (successIndicator) {
                console.log('Copy operation appears successful');
            }
        } catch (error) {
            console.error('Error checking clipboard:', error);
        }
    }

    async closeMenu() {
        try {
            await this.page.evaluate(() => {
                // Try to close menu by clicking backdrop or pressing escape
                const backdrop = document.querySelector('.cdk-overlay-backdrop, .backdrop');
                if (backdrop) {
                    backdrop.click();
                } else {
                    // Press escape key
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                }
            });
            
            await this.page.waitForTimeout(200);
        } catch (error) {
            console.error('Error closing menu:', error);
        }
    }

    async getNetworkCode() {
        try {
            const url = this.page.url();
            const match = url.match(/admanager\.google\.com\/(\d+)/);
            return match ? match[1] : '22849053685'; // fallback
        } catch (error) {
            return '22849053685'; // fallback
        }
    }

    addUrl(url, source) {
        if (!url || this.processed.has(url)) {
            return;
        }
        
        // Clean and validate URL
        const cleanUrl = url.trim();
        if (!cleanUrl.includes('ad_review_center') || !cleanUrl.includes('creativeId')) {
            return;
        }
        
        this.processed.add(cleanUrl);
        this.extractedUrls.push({
            url: cleanUrl,
            source: source,
            timestamp: new Date().toISOString(),
            creativeId: this.extractCreativeId(cleanUrl),
            ecid: this.extractEcid(cleanUrl)
        });
        
        console.log(`Added URL from ${source}: ${cleanUrl}`);
    }

    extractCreativeId(url) {
        const match = url.match(/creativeId=(\d+)/);
        return match ? match[1] : null;
    }

    extractEcid(url) {
        const match = url.match(/ecid=(\d+)/);
        return match ? match[1] : null;
    }

    async saveResults(filename = null) {
        if (!filename) {
            filename = `ad-manager-urls-${new Date().toISOString().split('T')[0]}.json`;
        }
        
        const results = {
            timestamp: new Date().toISOString(),
            totalUrls: this.extractedUrls.length,
            networkCode: await this.getNetworkCode(),
            urls: this.extractedUrls
        };
        
        try {
            await fs.writeFile(filename, JSON.stringify(results, null, 2));
            console.log(`Results saved to ${filename}`);
            return filename;
        } catch (error) {
            console.error('Error saving results:', error);
            throw error;
        }
    }

    async saveCsv(filename = null) {
        if (!filename) {
            filename = `ad-manager-urls-${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        const headers = ['URL', 'Creative ID', 'ECID', 'Source', 'Timestamp'];
        const rows = this.extractedUrls.map(urlData => [
            urlData.url,
            urlData.creativeId || '',
            urlData.ecid || '',
            urlData.source,
            urlData.timestamp
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        try {
            await fs.writeFile(filename, csvContent);
            console.log(`CSV saved to ${filename}`);
            return filename;
        } catch (error) {
            console.error('Error saving CSV:', error);
            throw error;
        }
    }

    async takeScreenshot(filename = null) {
        if (!filename) {
            filename = `ad-manager-screenshot-${Date.now()}.png`;
        }
        
        try {
            await this.page.screenshot({
                path: filename,
                fullPage: true
            });
            console.log(`Screenshot saved to ${filename}`);
            return filename;
        } catch (error) {
            console.error('Error taking screenshot:', error);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Puppeteer browser closed');
        }
    }

    // Static method to run a complete extraction session
    static async extractUrls(options = {}) {
        const automator = new AdManagerPuppeteerAutomator(options);
        
        try {
            const initialized = await automator.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize Puppeteer');
            }
            
            const navigated = await automator.navigateToAdManager(options.networkCode);
            if (!navigated) {
                throw new Error('Failed to navigate to Ad Manager');
            }
            
            const urls = await automator.extractAllUrls();
            
            if (options.saveJson !== false) {
                await automator.saveResults(options.jsonFilename);
            }
            
            if (options.saveCsv !== false) {
                await automator.saveCsv(options.csvFilename);
            }
            
            if (options.takeScreenshot) {
                await automator.takeScreenshot(options.screenshotFilename);
            }
            
            return urls;
            
        } finally {
            await automator.close();
        }
    }
}

// CLI interface for running the automation
async function main() {
    const args = process.argv.slice(2);
    const options = {
        headless: !args.includes('--no-headless'),
        slowMo: args.includes('--slow') ? 300 : 100,
        takeScreenshot: args.includes('--screenshot'),
        networkCode: null
    };
    
    // Parse network code if provided
    const networkCodeIndex = args.indexOf('--network-code');
    if (networkCodeIndex !== -1 && args[networkCodeIndex + 1]) {
        options.networkCode = args[networkCodeIndex + 1];
    }
    
    console.log('Starting Ad Manager URL extraction...');
    console.log('Options:', options);
    
    try {
        const urls = await AdManagerPuppeteerAutomator.extractUrls(options);
        
        console.log('\n=== EXTRACTION COMPLETE ===');
        console.log(`Total URLs found: ${urls.length}`);
        
        if (urls.length > 0) {
            console.log('\nSample URLs:');
            urls.slice(0, 3).forEach((urlData, index) => {
                console.log(`${index + 1}. ${urlData.url}`);
                console.log(`   Source: ${urlData.source}`);
                console.log(`   Creative ID: ${urlData.creativeId || 'N/A'}`);
                console.log(`   ECID: ${urlData.ecid || 'N/A'}`);
                console.log('');
            });
            
            if (urls.length > 3) {
                console.log(`... and ${urls.length - 3} more URLs`);
            }
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('Extraction failed:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { AdManagerPuppeteerAutomator };

// Run CLI if this file is executed directly
if (require.main === module) {
    main();
}
