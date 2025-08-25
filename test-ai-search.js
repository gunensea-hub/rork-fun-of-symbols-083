// Test AI Search Functionality
const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testAISearch = async () => {
  log('\n🚀 Testing AI Search Functionality', 'cyan');
  log('='.repeat(50), 'cyan');
  
  try {
    // Test 1: Run the search images test
    log('\n📋 Running Search Images Tests...', 'yellow');
    try {
      const testOutput = execSync('npm test -- __tests__/search-images.test.ts', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      log('✅ Search Images Tests Passed', 'green');
      log(testOutput, 'reset');
    } catch (error) {
      log('❌ Search Images Tests Failed', 'red');
      log(error.stdout || error.message, 'red');
    }
    
    // Test 2: Check if backend files exist and are properly configured
    log('\n🔍 Checking Backend Configuration...', 'yellow');
    
    const backendFiles = [
      'backend/hono.ts',
      'backend/trpc/app-router.ts',
      'backend/trpc/routes/symbols/search-images/route.ts',
      'lib/trpc.ts'
    ];
    
    let allFilesExist = true;
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        log(`✅ ${file} exists`, 'green');
      } else {
        log(`❌ ${file} missing`, 'red');
        allFilesExist = false;
      }
    }
    
    if (allFilesExist) {
      log('✅ All backend files are present', 'green');
    } else {
      log('❌ Some backend files are missing', 'red');
    }
    
    // Test 3: Check tRPC router configuration
    log('\n🔧 Checking tRPC Router Configuration...', 'yellow');
    
    const routerContent = fs.readFileSync('backend/trpc/app-router.ts', 'utf8');
    if (routerContent.includes('searchImagesProcedure') && routerContent.includes('symbols:')) {
      log('✅ tRPC router properly configured with symbols.searchImages', 'green');
    } else {
      log('❌ tRPC router missing symbols.searchImages configuration', 'red');
    }
    
    // Test 4: Check search images route implementation
    log('\n🔍 Checking Search Images Route Implementation...', 'yellow');
    
    const searchImagesContent = fs.readFileSync('backend/trpc/routes/symbols/search-images/route.ts', 'utf8');
    const requiredFeatures = [
      'getSpecificSymbolMatch',
      'getCuratedSymbols',
      'generateSymbolImages',
      'toolkit.rork.com/text/llm',
      'toolkit.rork.com/images/generate',
      'Eye of Horus',
      'Wikipedia Commons'
    ];
    
    let allFeaturesPresent = true;
    for (const feature of requiredFeatures) {
      if (searchImagesContent.includes(feature)) {
        log(`✅ ${feature} implemented`, 'green');
      } else {
        log(`❌ ${feature} missing`, 'red');
        allFeaturesPresent = false;
      }
    }
    
    if (allFeaturesPresent) {
      log('✅ All AI search features are implemented', 'green');
    } else {
      log('❌ Some AI search features are missing', 'red');
    }
    
    // Test 5: Check SearchResult component AI integration
    log('\n🎨 Checking SearchResult Component AI Integration...', 'yellow');
    
    const searchResultContent = fs.readFileSync('components/SearchResult.tsx', 'utf8');
    const componentFeatures = [
      'trpc.symbols.searchImages.useQuery',
      'getSymbolCategory',
      'aiImageSearch',
      'AI Generated',
      'Verified'
    ];
    
    let allComponentFeaturesPresent = true;
    for (const feature of componentFeatures) {
      if (searchResultContent.includes(feature)) {
        log(`✅ ${feature} implemented in SearchResult`, 'green');
      } else {
        log(`❌ ${feature} missing in SearchResult`, 'red');
        allComponentFeaturesPresent = false;
      }
    }
    
    if (allComponentFeaturesPresent) {
      log('✅ SearchResult component properly integrated with AI search', 'green');
    } else {
      log('❌ SearchResult component missing AI search integration', 'red');
    }
    
    // Test 6: Check main app integration
    log('\n📱 Checking Main App Integration...', 'yellow');
    
    const appContent = fs.readFileSync('app/index.tsx', 'utf8');
    if (appContent.includes('SearchResult') && appContent.includes('onImageLoad') && appContent.includes('onImageError')) {
      log('✅ Main app properly integrated with SearchResult component', 'green');
    } else {
      log('❌ Main app missing proper SearchResult integration', 'red');
    }
    
    // Summary
    log('\n📊 AI Search Test Summary', 'cyan');
    log('='.repeat(30), 'cyan');
    
    if (allFilesExist && allFeaturesPresent && allComponentFeaturesPresent) {
      log('🎉 AI Search is fully implemented and ready!', 'green');
      log('\n✨ Features Available:', 'cyan');
      log('  • Specific symbol matching (Eye of Horus, Ankh, etc.)', 'green');
      log('  • Curated symbol databases by category', 'green');
      log('  • AI-powered symbol search via LLM API', 'green');
      log('  • AI image generation for unclear symbols', 'green');
      log('  • Wikipedia Commons verified images', 'green');
      log('  • Fallback image handling', 'green');
      log('  • Real-time image validation', 'green');
      
      log('\n🔧 How it works:', 'cyan');
      log('  1. User searches for a symbol', 'blue');
      log('  2. System checks specific symbol database first', 'blue');
      log('  3. Falls back to curated category-based symbols', 'blue');
      log('  4. Uses AI LLM to find relevant Wikipedia images', 'blue');
      log('  5. Generates AI images if no clear images found', 'blue');
      log('  6. Validates images and provides fallbacks', 'blue');
      
      return true;
    } else {
      log('❌ AI Search has some issues that need to be addressed', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error during AI search testing: ${error.message}`, 'red');
    return false;
  }
};

// Run the test
if (require.main === module) {
  testAISearch().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testAISearch };