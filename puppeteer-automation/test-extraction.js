#!/usr/bin/env node

/**
 * Pinocchios Extraction Test Suite
 * 🎭 Test the URL extraction capabilities with a Pinocchio theme
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

// This is a simple test script to demonstrate Puppeteer's capabilities
// in automating interactions with a Chrome extension.

class PinocchioTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async run() {
        try {
            await this.setup();
            await this.testUrlExtraction();
        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            await this.teardown();
        }
    }

    async setup() {
        const extensionPath = path.resolve(__dirname, '../chrome-extension');
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.goto('https://www.google.com/search?q=google+ad+manager', { waitUntil: 'networkidle2' });
    }

    async testUrlExtraction() {
        console.log('Testing URL Extraction...');
        
        const extensionTarget = await this.browser.waitForTarget(
            target => target.type() === 'service_worker'
        );
        const partialExtensionUrl = extensionTarget.url() || '';
        const extensionId = partialExtensionUrl.split('/')[2];

        await this.page.goto(`chrome-extension://${extensionId}/popup.html`);
        await this.page.waitForSelector('#extractBtn');
        await this.page.click('#extractBtn');
        await this.page.waitForSelector('.url-item');

        const urls = await this.page.evaluate(() => {
            const items = document.querySelectorAll('.url-item');
            return Array.from(items).map(item => item.textContent);
        });

        if (urls.length > 0) {
            console.log(`  ✅ Success: Found ${urls.length} Ad Manager URLs.`);
        } else {
            console.log('  ❌ Failure: No Ad Manager URLs found.');
        }
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

(async () => {
    const testSuite = new PinocchioTestSuite();
    await testSuite.run();
})();
