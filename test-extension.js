const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Chrome Extension Structure...\n');

const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'injected.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

let allGood = true;

requiredFiles.forEach(file => {
  const filePath = path.join('chrome-extension', file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 0) {
      console.log(`✅ ${file} - ${stats.size} bytes`);
    } else {
      console.log(`❌ ${file} - EMPTY (0 bytes)`);
      allGood = false;
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Test manifest.json
try {
  const manifestPath = path.join('chrome-extension', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('\n✅ manifest.json is valid JSON');
  
  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ manifest.json has ${field}: "${manifest[field]}"`);
    } else {
      console.log(`❌ manifest.json missing ${field}`);
      allGood = false;
    }
  });
} catch (error) {
  console.log(`❌ manifest.json error: ${error.message}`);
  allGood = false;
}

console.log(`\n${allGood ? '🎉 All tests passed! Extension should load properly.' : '⚠️  Some issues found that may prevent extension loading.'}`);
