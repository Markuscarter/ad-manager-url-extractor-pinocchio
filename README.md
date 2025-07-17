# 🎭 Pinocchio's Ad Manager URL Extractor (PINOCCHIO)

> *"Pulling strings to reveal hidden treasures"* 🎪

A magical Chrome extension and Puppeteer automation system for extracting ad preview URLs from Google Ad Manager's Ad Review Center. Like a puppet master pulling strings, this tool reveals the hidden treasures of ad preview links.

## 🌟 Features

- **🎭 Pinocchio-themed UI** - Beautiful wooden interface with puppet aesthetics
- **🔍 Deep DOM Extraction** - Accesses hidden data through injected scripts
- **�� Puppeteer Automation** - Automated extraction with headless browser support
- **📊 CSV Export** - Export extracted URLs with metadata
- **🎪 Real-time Progress** - Watch as Pinocchio pulls the strings
- **🔄 Network Monitoring** - Intercepts and analyzes network requests
- **📋 Clipboard Integration** - Automatic URL copying and management

## 🚀 Quick Start

### Chrome Extension Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ad-manager-url-extractor-pinocchio.git
   cd ad-manager-url-extractor-pinocchio
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `chrome-extension` folder
   - Look for "🎭 Pinocchio's URL Extractor" in your extensions

3. **Start extracting:**
   - Navigate to Google Ad Manager's Ad Review Center
   - Click the Pinocchio extension icon
   - Click "🎪 Extract URLs" and watch the magic happen!

### Puppeteer Automation

1. **Install dependencies:**
   ```bash
   cd puppeteer-automation
   npm install
   ```

2. **Run automated extraction:**
   ```bash
   npm run extract
   ```

3. **Available scripts:**
   ```bash
   npm run extract-headless    # Run in headless mode
   npm run extract-visible     # Run with visible browser
   npm run extract-slow        # Slower, more thorough extraction
   npm run test               # Run test suite
   npm run install-extension  # Install extension automatically
   ```

## 🎪 Pinocchio Theme

This extension features a unique Pinocchio theme throughout:

- **Wooden gradient backgrounds** with warm brown tones
- **Golden accent colors** reminiscent of puppet strings
- **Theater/mask emojis** (🎭, 🎪) for visual appeal
- **Puppet string visual elements** in the UI
- **Themed messaging** that makes extraction feel magical

## 📁 Project Structure

```
ad-manager-url-extractor-pinocchio/
├── chrome-extension/          # Chrome extension files
│   ├── manifest.json         # Extension configuration
│   ├── popup.html           # Pinocchio-themed UI
│   ├── popup.js             # UI controller
│   ├── content.js           # Content script
│   ├── background.js        # Service worker
│   ├── injected.js          # Deep DOM access
│   └── icons/               # Extension icons
├── puppeteer-automation/     # Automation scripts
│   ├── package.json         # Dependencies
│   ├── puppeteer-integration.js
│   ├── test-extraction.js   # Test suite
│   └── install-extension.js # Installation script
├── docs/                    # Documentation
└── README.md               # This file
```

## 🔧 Configuration

### Extension Settings

The extension can be configured through the popup interface:

- **Auto-extract**: Automatically start extraction when visiting Ad Review Center
- **Max URLs**: Limit the number of URLs to extract
- **Delay**: Control extraction speed
- **Retry attempts**: Number of retry attempts for failed extractions

### Puppeteer Options

```javascript
const options = {
  headless: true,           // Run in headless mode
  slowMo: 200,             // Slow down operations
  timeout: 30000,          // Page timeout
  screenshot: false,       // Take screenshots
  networkMonitoring: true  // Monitor network requests
};
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd puppeteer-automation
npm test
```

The test suite includes:
- Extension loading verification
- URL pattern detection
- DOM extraction testing
- Network interception validation
- Clipboard operations testing

## 📊 Output Formats

### CSV Export
The extension exports URLs with the following columns:
- URL
- Creative ID
- ECID
- Source (script, DOM, clipboard, etc.)
- Timestamp

### JSON Format
```json
{
  "url": "https://admanager.google.com/123456#creatives/ad_review_center/...",
  "creativeId": "789101112",
  "ecid": "1314151617",
  "source": "clipboard",
  "timestamp": "2024-07-16T22:30:00.000Z"
}
```

## 🎭 How It Works

1. **Content Script Injection**: The extension injects scripts into Ad Manager pages
2. **Deep DOM Access**: Uses injected scripts to access hidden data
3. **Network Monitoring**: Intercepts network requests for URL data
4. **Pattern Matching**: Extracts URLs using regex patterns
5. **Data Construction**: Builds URLs from creative IDs and ECIDs
6. **Real-time Updates**: Provides live progress and results

## 🤝 Contributing

We welcome contributions to make Pinocchio's magic even stronger!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎪 Acknowledgments

- Inspired by the magic of Pinocchio and the power of automation
- Built with love for the advertising and development communities
- Special thanks to Google Ad Manager for providing the playground

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/ad-manager-url-extractor-pinocchio/issues) page
2. Create a new issue with detailed information
3. Include screenshots and error messages when possible

---

**🎭 May your strings always lead to truth! 🎪**

*Built with ❤️ and a touch of magic*
