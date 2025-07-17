# Google Ad Manager URL Extractor - Complete Guide

A comprehensive automation tool for extracting ad preview URLs from Google Ad Manager's Ad Review Center. This tool provides both a Chrome extension and a Puppeteer-based automation solution.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
-Usage](#usage)
- [Chrome Extension](#chrome-extension)
- [Puppeteer Automation](#puppeteer-automation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Contributing](#contributing)

## Features

- **Chrome Extension**: Browser-based extraction with real-time UI
- **Puppeteer Automation**: Server-side automation for bulk processing
- **Multiple Extraction Methods**: DOM parsing, page source analysis, and interactive extraction
- **Export Options**: JSON, CSV, and clipboard support
- **Progress Tracking**: Real-time progress updates and status monitoring
- **Error Handling**: Robust error handling and retry mechanisms
- **Settings Management**: Configurable extraction parameters

## Installation

### Prerequisites

- Node.js 16or higher
- Chrome browser (for extension)
- Google Ad Manager access

### Chrome Extension Installation

1. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode in the top right
   - Click "Load unpacked andselect the `chrome-extension` folder

2. **Verify Installation**:
   - The extension icon should appear in your Chrome toolbar
   - Navigate to Google Ad Manager to test functionality

### Puppeteer Automation Installation

1. **Install Dependencies**:
   ```bash
   cd puppeteer-automation
   npm install
   ```

2. **Verify Installation**:
   ```bash
   npm test
   ```

## Usage

### Chrome Extension1. **Navigate to Ad Manager**:
   - Go to `https://admanager.google.com/`
   - Navigate to the Ad Review Center

2. **Start Extraction**:
   - Click the extension icon in your toolbar
   - ClickExtract URLs" to begin
   - Monitor progress in the popup window

3. **Export Results**:
   - Use "Copy All URLs" for clipboard export
   - Use "Export CSV" for file download
   - Results are automatically saved to extension storage

### Puppeteer Automation

#### Basic Usage

```bash
# Run with default settings (headless)
npm run extract

# Run with visible browser
npm run extract-visible

# Run with slower execution for debugging
npm run extract-slow

# Take screenshots during extraction
npm run extract-screenshot
```

#### Advanced Usage

```bash
# Specify network code
node puppeteer-integration.js --network-code 123456789

# Custom options
node puppeteer-integration.js --no-headless --slow --screenshot
```

#### Programmatic Usage

```javascript
const [object Object]AdManagerPuppeteerAutomator } = require(./puppeteer-integration.js);

const options = {
    headless: false,
    slowMo: 200,
    networkCode: 123456789
};

AdManagerPuppeteerAutomator.extractUrls(options)
    .then(urls => console.log(`Found $[object Object]urls.length} URLs`))
    .catch(error => console.error(Extraction failed:', error));
```

## Configuration

### Chrome Extension Settings

Access settings through the extension popup:

- **Auto Extract**: Automatically start extraction when visiting Ad Review Center
- **Max URLs**: Maximum number of URLs to extract per session
- **Delay**: Delay between extraction steps (milliseconds)
- **Retry Attempts**: Number of retry attempts for failed extractions

### Puppeteer Configuration

Configure via command line arguments or programmatic options:

```javascript
const options = {
    headless: true,           // Run in headless mode
    slowMo: 10          // Delay between actions
    timeout: 30000,          // Page load timeout
    retries: 3            // Retry attempts
    networkCode: null,       // Specific network code
    takeScreenshot: false,   // Take screenshots
    saveJson: true,          // Save JSON results
    saveCsv: true           // Save CSV results
};
```

## Troubleshooting

### Common Issues

1ension Not Working**:
   - Ensure youre on a Google Ad Manager page
   - Check browser console for errors
   - Verify extension permissions

2. **Puppeteer Errors**:
   - Update Node.js to latest version
   - Reinstall dependencies: `npm install`
   - Check network connectivity

3 **No URLs Found**:
   - Verify you're in the Ad Review Center
   - Check if ads are present on the page
   - Try different extraction methods

### Debug Mode

Enable debug logging:

```bash
# Puppeteer with debug output
DEBUG=puppeteer:* node puppeteer-integration.js

# Chrome extension debug
# Open DevTools in extension popup
```

## API Reference

### Chrome Extension API

#### Content Script Methods

- `startExtraction(options)`: Begin URL extraction
- `stopExtraction()`: Stop current extraction
- `getStatus()`: Get current extraction status

#### Background Script Methods

- `saveExtractionResults(tabId, results)`: Save results to storage
- `getSettings()`: Retrieve extension settings
- `updateSettings(settings)`: Update extension settings

### Puppeteer API

#### AdManagerPuppeteerAutomator Class

- `initialize()`: Initialize browser and page
- `navigateToAdManager(networkCode)`: Navigate to Ad Manager
- `extractAllUrls()`: Extract URLs using all methods
- `saveResults(filename)`: Save results to JSON file
- `saveCsv(filename)`: Save results to CSV file
- `close()`: Close browser and cleanup

#### Static Methods

- `extractUrls(options)`: Complete extraction workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install development dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build extension
npm run build
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

## Changelog

### Version 1.0.0
- Initial release
- Chrome extension with popup UI
- Puppeteer automation
- Multiple extraction methods
- Export functionality
