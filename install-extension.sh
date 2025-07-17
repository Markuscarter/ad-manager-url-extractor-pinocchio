#!/bin/bash

echo "🎭 Pinocchio's Ad Manager URL Extractor - Installation Script"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "chrome-extension/manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found manifest.json"

# Validate the extension structure
echo "🔍 Validating extension structure..."
node test-extension.js

if [ $? -ne 0 ]; then
    echo "❌ Extension validation failed. Please fix the issues above."
    exit 1
fi

echo ""
echo "📋 Installation Instructions:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'chrome-extension' folder from this project"
echo "5. The extension should appear with Pinocchio's icon"
echo ""
echo "🎯 To use the extension:"
echo "1. Go to Google Ad Manager's Ad Review Center"
echo "2. Click the Pinocchio extension icon in your toolbar"
echo "3. Click 'Extract URLs' to get ad preview URLs"
echo ""
echo "🎭 Happy extracting! Pinocchio's strings will reveal the hidden treasures!"
