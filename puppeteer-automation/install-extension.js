#!/usr/bin/env node

/**
 * 🎭 Pinocchio's Chrome Extension Installer
 * A magical script to install the Ad Manager URL Extractor extension
 */

const fs = require('fs-extra');
const path = require('path');

class PinocchioInstaller {
    constructor() {
        this.extensionPath = path.join(__dirname, '..', 'chrome-extension');
        this.chromeProfiles = this.findChromeProfiles();
        this.installedCount = 0;
    }

    async install() {
        console.log('🎭 Pinocchio\'s Extension Installer Starting...\n');
        
        try {
            await this.verifyExtensionFiles();
            
            for (const profile of this.chromeProfiles) {
                await this.installToProfile(profile);
            }
            
            this.showInstallationSummary();
            
        } catch (error) {
            console.error('❌ Installation failed:', error.message);
            process.exit(1);
        }
    }

    async verifyExtensionFiles() {
        console.log('🔍 Verifying extension files...');
        
        const requiredFiles = [
            'manifest.json',
            'popup.html',
            'popup.js',
            'content.js',
            'background.js',
            'injected.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.extensionPath, file);
            if (!await fs.pathExists(filePath)) {
                throw new Error(`Missing required file: ${file}`);
            }
        }
        
        console.log('✅ All extension files verified!\n');
    }

    findChromeProfiles() {
        const profiles = [];
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        
        // macOS Chrome profiles
        const macChromeDir = path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
        if (fs.existsSync(macChromeDir)) {
            const defaultProfile = path.join(macChromeDir, 'Default');
            if (fs.existsSync(defaultProfile)) {
                profiles.push({
                    name: 'Default',
                    path: defaultProfile,
                    platform: 'macOS'
                });
            }
        }
        
        return profiles;
    }

    async installToProfile(profile) {
        console.log(`🎭 Installing to ${profile.name} profile (${profile.platform})...`);
        
        const extensionsDir = path.join(profile.path, 'Extensions');
        const extensionId = 'ad-manager-url-extractor-pinocchio';
        const extensionDir = path.join(extensionsDir, extensionId);
        
        try {
            await fs.ensureDir(extensionsDir);
            await fs.ensureDir(extensionDir);
            await fs.copy(this.extensionPath, extensionDir);
            await this.createPreferencesFile(profile.path, extensionId);
            
            console.log(`✅ Successfully installed to ${profile.name} profile`);
            this.installedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to install to ${profile.name}:`, error.message);
        }
    }

    async createPreferencesFile(profilePath, extensionId) {
        const preferencesDir = path.join(profilePath, 'Local Extension Settings');
        await fs.ensureDir(preferencesDir);
        
        const preferencesFile = path.join(preferencesDir, `${extensionId}.json`);
        const preferences = {
            "installation_time": new Date().toISOString(),
            "version": "1.0.0",
            "theme": "pinocchio",
            "auto_extract": false,
            "max_urls": 1000
        };
        
        await fs.writeJson(preferencesFile, preferences, { spaces: 2 });
    }

    showInstallationSummary() {
        console.log('\n🎭 Installation Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully installed to ${this.installedCount} Chrome profile(s)`);
        console.log('🎭 Extension ID: ad-manager-url-extractor-pinocchio');
        console.log('🎪 Theme: Pinocchio Puppet Master');
        console.log('\n📋 Next Steps:');
        console.log('1. Open Chrome and go to chrome://extensions/');
        console.log('2. Enable "Developer mode" (top right toggle)');
        console.log('3. Look for "Ad Manager URL Extractor (PINOCCHIO)"');
        console.log('4. Click "Load unpacked" and select the extension folder');
        console.log('5. Navigate to Google Ad Manager and start extracting!');
        console.log('\n🎭 May your strings always lead to truth! 🎪\n');
    }
}

// Run the installer
if (require.main === module) {
    const installer = new PinocchioInstaller();
    installer.install().catch(console.error);
}

module.exports = PinocchioInstaller;
