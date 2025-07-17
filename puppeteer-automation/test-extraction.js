#!/usr/bin/env node

/**
 * Pinocchios Extraction Test Suite
 * 🎭 Test the URL extraction capabilities with a Pinocchio theme
 */

const puppeteer = require('puppeteer');
const fs = require(fs-extra');
const path = require('path');

class PinocchioTestSuite[object Object]
    constructor() {
        this.testResults =       this.browser = null;
        this.page = null;
    }

    async runTests()[object Object]       console.log('🎭 Pinocchio\s Extraction Test Suite Starting...\n');
        
        try {
            await this.setupBrowser();
            await this.runAllTests();
            await this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    async setupBrowser()[object Object]       console.log('🎪 Setting up test environment...');
        
        this.browser = await puppeteer.launch([object Object]          headless: false,
            defaultViewport: { width:1280720,
            args: ['--no-sandbox',--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X10_157) AppleWebKit/537.36;
        
        console.log('✅ Test environment ready!\n');
    }

    async runAllTests()[object Object]       const tests = [
            { name: Extension Loading', fn: this.testExtensionLoading.bind(this) },
      [object Object]name: 'URL Pattern Detection', fn: this.testUrlPatternDetection.bind(this) },
            { name:DOM Extraction', fn: this.testDomExtraction.bind(this) },
            { name: 'Network Interception', fn: this.testNetworkInterception.bind(this) },
            { name: 'Clipboard Operations', fn: this.testClipboardOperations.bind(this) }
        ];

        for (const test of tests)[object Object]             await this.runTest(test);
        }
    }

    async runTest(test)[object Object]       console.log(`🎭 Running test: ${test.name}...`);
        
        const startTime = Date.now();
        let passed = false;
        let error = null;
        
        try {
            await test.fn();
            passed = true;
        } catch (err) {
            error = err.message;
        }
        
        const duration = Date.now() - startTime;
        
        this.testResults.push([object Object]
            name: test.name,
            passed,
            duration,
            error
        });
        
        const status = passed ? ✅PASS' :❌ FAIL;       console.log(`${status} ${test.name} (${duration}ms)`);
        
        if (error) {
            console.log(`   Error: ${error}`);
        }
        
        console.log('');
    }

    async testExtensionLoading()[object Object]       // Test if extension loads without errors
        await this.page.goto('chrome://extensions/');
        await this.page.waitForTimeout(1000);
        
        // Check if extension is listed
        const extensionText = await this.page.evaluate(() => {
            return document.body.textContent.includes('Ad Manager URL Extractor');
        });
        
        if (!extensionText) {
            throw new Error('Extension not found in Chrome extensions page');
        }
    }

    async testUrlPatternDetection()[object Object]       // Test URL pattern matching
        const testUrls = [
            https://admanager.google.com/123456reatives/ad_review_center/product=MOBILE&creativeId=7891112            https://admanager.google.com/654321reatives/ad_review_center/product=DESKTOP&creativeId=9871415       invalid-url',
         https://google.com/not-ad-manager'
        ];

        const results = await this.page.evaluate((urls) => {
            const urlPattern = /https:\/\/admanager\.google\.com\/\d+#creatives\/ad_review_center\/[^"'\s]+/g;
            return urls.map(url => ({
                url,
                matches: url.match(urlPattern) !== null
            }));
        }, testUrls);

        const validMatches = results.filter(r => r.matches).length;
        if (validMatches !== 2) {
            throw new Error(`Expected2valid URLs, got ${validMatches}`);
        }
    }

    async testDomExtraction()[object Object]       // Test DOM element extraction
        await this.page.setContent(`
            <html>
                <body>
                    <div data-creative-id="123data-ecid="456"></div>
                    <script>
                        window.testData = {
                            creativeId: "789",
                            ecid: "101112"
                        };
                    </script>
                </body>
            </html>
        `);

        const extractedData = await this.page.evaluate(() => {
            const elements = document.querySelectorAll([data-creative-id], [data-ecid]');
            const scriptData = window.testData;
            
            return[object Object]          elements: elements.length,
                hasCreativeId: !!scriptData.creativeId,
                hasEcid: !!scriptData.ecid
            };
        });

        if (extractedData.elements !== 1 || !extractedData.hasCreativeId || !extractedData.hasEcid) {
            throw new Error('DOM extraction test failed');
        }
    }

    async testNetworkInterception()[object Object]       // Test network request interception
        await this.page.setRequestInterception(true);
        
        let interceptedRequests = 0;
        
        this.page.on('request, (request) => [object Object]       if (request.url().includes('admanager.google.com'))[object Object]       interceptedRequests++;
            }
            request.continue();
        });

        await this.page.goto(https://admanager.google.com', { waitUntil: 'networkidle0' });
        
        if (interceptedRequests === 0) {
            throw new Error('No network requests were intercepted');
        }
        
        await this.page.setRequestInterception(false);
    }

    async testClipboardOperations()[object Object]       // Test clipboard functionality
        const testUrl = https://admanager.google.com/123456reatives/ad_review_center/product=MOBILE&creativeId=789101112;
        
        await this.page.evaluate((url) => {
            navigator.clipboard.writeText(url);
        }, testUrl);
        
        // Note: Reading clipboard requires HTTPS or localhost
        // This is a simplified test
        console.log('   Note: Clipboard read test requires HTTPS context');
    }

    async generateReport()[object Object]       console.log('🎭 Test Results Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const successRate = ((passed / total) *100ixed(1);
        
        console.log(`✅ Passed: ${passed}/${total} (${successRate}%)`);
        console.log('');
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name} (${result.duration}ms)`);
            if (result.error)[object Object]           console.log(`   Error: ${result.error}`);
            }
        });
        
        // Save detailed report
        const reportPath = path.join(__dirname,test-report.json');
        await fs.writeJson(reportPath, {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary:[object Object]             total,
                passed,
                failed: total - passed,
                successRate
            }
        }, { spaces: 2 });
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        if (passed === total) {
            console.log('\n🎭 All tests passed! Pinocchio would be proud! 🎪);
        } else {
            console.log('\n🎭 Some tests failed. Time to pull some strings! 🎪');
        }
    }

    async cleanup()[object Object]       if (this.browser) {
            await this.browser.close();
        }
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new PinocchioTestSuite();
    testSuite.runTests().catch(console.error);
}

module.exports = PinocchioTestSuite;
