const fs = require('fs');
const path = require('path');

console.log('🔍 Chrome Extension Troubleshooting Tool');
console.log('==========================================\n');

// Check all possible manifest locations
const manifestPaths = [
  './manifest.json',
  './chrome-extension/manifest.json',
  './Chrome Extension/manifest.json'
];

manifestPaths.forEach(manifestPath => {
  console.log(`Checking: ${manifestPath}`);
  
  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      
      console.log(`✅ EXISTS - ${fs.statSync(manifestPath).size} bytes`);
      console.log(`   Name: ${manifest.name}`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Manifest Version: ${manifest.manifest_version}`);
      
      // Check if all referenced files exist
      if (manifest.background && manifest.background.service_worker) {
        const bgPath = path.join(path.dirname(manifestPath), manifest.background.service_worker);
        console.log(`   Background: ${fs.existsSync(bgPath) ? '✅' : '❌'} ${bgPath}`);
      }
      
      if (manifest.action && manifest.action.default_popup) {
        const popupPath = path.join(path.dirname(manifestPath), manifest.action.default_popup);
        console.log(`   Popup: ${fs.existsSync(popupPath) ? '✅' : '❌'} ${popupPath}`);
      }
      
      if (manifest.content_scripts && manifest.content_scripts[0] && manifest.content_scripts[0].js) {
        manifest.content_scripts[0].js.forEach(jsFile => {
          const jsPath = path.join(path.dirname(manifestPath), jsFile);
          console.log(`   Content Script: ${fs.existsSync(jsPath) ? '✅' : '❌'} ${jsPath}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  } else {
    console.log('❌ NOT FOUND');
  }
  console.log('');
});

console.log('📋 Installation Instructions:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode" (toggle in top right)');
console.log('3. Click "Load unpacked"');
console.log('4. Select the folder containing manifest.json');
console.log('5. If you see errors, check the console for details');
console.log('');
console.log('🎯 Try loading these folders:');
console.log('   - ./chrome-extension/');
console.log('   - ./Chrome Extension/');
console.log('   - ./ (if manifest.json is in root)');
