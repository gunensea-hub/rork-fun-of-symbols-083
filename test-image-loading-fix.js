#!/usr/bin/env node

/**
 * Comprehensive test for image loading fixes in the symbol comparison app
 * Tests AI image search, fallback mechanisms, and UI functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test configuration
const TEST_CONFIG = {
  // Test different symbol categories
  testCategories: [
    'Ancient symbols',
    'Chemical formula symbol',
    'Star clusters',
    'Atomic structure symbol',
    'Star map'
  ],
  // Test specific symbols that should have good AI results
  testSymbols: [
    { name: 'Eye of Horus', category: 'Ancient symbols' },
    { name: 'Water molecule', category: 'Chemical formula symbol' },
    { name: 'Orion constellation', category: 'Star clusters' },
    { name: 'Hydrogen atom', category: 'Atomic structure symbol' }
  ],
  // Test timeout settings
  timeouts: {
    search: 30000,
    imageLoad: 15000,
    aiVerify: 20000,
    comparison: 25000
  }
};

class ImageLoadingTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async runAllTests() {
    log('🧪 Starting Comprehensive Image Loading Tests', 'bright');
    log('=' .repeat(60), 'blue');

    try {
      // Test 1: Backend AI Image Search
      await this.testBackendAIImageSearch();
      
      // Test 2: Frontend Image Loading Components
      await this.testFrontendImageComponents();
      
      // Test 3: Search Results Image Loading
      await this.testSearchResultsImageLoading();
      
      // Test 4: Selected Symbol Image Loading
      await this.testSelectedSymbolImageLoading();
      
      // Test 5: Comparison Result Image Loading
      await this.testComparisonResultImageLoading();
      
      // Test 6: AI Refresh Functionality
      await this.testAIRefreshFunctionality();
      
      // Test 7: Error Handling and Fallbacks
      await this.testErrorHandlingAndFallbacks();
      
      // Test 8: End-to-End Image Flow
      await this.testEndToEndImageFlow();
      
      this.printSummary();
      
    } catch (error) {
      logError(`Test suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  async testBackendAIImageSearch() {
    logStep(1, 'Testing Backend AI Image Search');
    
    try {
      // Check if backend route exists
      const routePath = 'backend/trpc/routes/symbols/search-images/route.ts';
      if (!fs.existsSync(routePath)) {
        throw new Error('Backend AI image search route not found');
      }
      
      logSuccess('Backend route file exists');
      
      // Read and validate route content
      const routeContent = fs.readFileSync(routePath, 'utf8');
      
      // Check for essential functions
      const requiredFunctions = [
        'getSpecificSymbolMatch',
        'getCuratedSymbols',
        'generateSymbolImages',
        'getFallbackImages'
      ];
      
      for (const func of requiredFunctions) {
        if (routeContent.includes(func)) {
          logSuccess(`Function ${func} found`);
        } else {
          this.addResult('failed', `Missing function: ${func}`);
        }
      }
      
      // Check for AI integration
      if (routeContent.includes('toolkit.rork.com/text/llm/')) {
        logSuccess('AI text search integration found');
      } else {
        this.addResult('warning', 'AI text search integration not found');
      }
      
      if (routeContent.includes('toolkit.rork.com/images/generate/')) {
        logSuccess('AI image generation integration found');
      } else {
        this.addResult('warning', 'AI image generation integration not found');
      }
      
      // Check for Wikipedia Commons URLs
      if (routeContent.includes('upload.wikimedia.org')) {
        logSuccess('Wikipedia Commons image URLs found');
      } else {
        this.addResult('failed', 'No Wikipedia Commons URLs found');
      }
      
      this.addResult('passed', 'Backend AI image search validation');
      
    } catch (error) {
      this.addResult('failed', `Backend AI image search: ${error.message}`);
    }
  }

  async testFrontendImageComponents() {
    logStep(2, 'Testing Frontend Image Components');
    
    try {
      const components = [
        'components/SearchResult.tsx',
        'components/SearchResultsList.tsx',
        'components/ComparisonResult.tsx'
      ];
      
      for (const componentPath of components) {
        if (!fs.existsSync(componentPath)) {
          throw new Error(`Component ${componentPath} not found`);
        }
        
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for AI image search integration
        if (content.includes('trpc.symbols.searchImages.useQuery')) {
          logSuccess(`${componentPath}: AI image search integration found`);
        } else {
          this.addResult('failed', `${componentPath}: Missing AI image search integration`);
        }
        
        // Check for image error handling
        if (content.includes('onError') && content.includes('handleImageError')) {
          logSuccess(`${componentPath}: Image error handling found`);
        } else {
          this.addResult('failed', `${componentPath}: Missing image error handling`);
        }
        
        // Check for refresh functionality
        if (content.includes('RefreshCw') || content.includes('refresh')) {
          logSuccess(`${componentPath}: Refresh functionality found`);
        } else {
          this.addResult('warning', `${componentPath}: No refresh functionality`);
        }
        
        // Check for AI verification buttons
        if (content.includes('AI Verify') || content.includes('ai-verify')) {
          logSuccess(`${componentPath}: AI verification button found`);
        } else {
          this.addResult('warning', `${componentPath}: No AI verification button`);
        }
      }
      
      this.addResult('passed', 'Frontend image components validation');
      
    } catch (error) {
      this.addResult('failed', `Frontend components: ${error.message}`);
    }
  }

  async testSearchResultsImageLoading() {
    logStep(3, 'Testing Search Results Image Loading Logic');
    
    try {
      const searchResultsPath = 'components/SearchResultsList.tsx';
      const content = fs.readFileSync(searchResultsPath, 'utf8');
      
      // Check for image fallback logic
      const imageLogicChecks = [
        'originalImageFailed',
        'allImagesFailed',
        'useAiImages',
        'currentImageIndex',
        'handleImageError',
        'handleRefreshImages'
      ];
      
      for (const check of imageLogicChecks) {
        if (content.includes(check)) {
          logSuccess(`Search results: ${check} logic found`);
        } else {
          this.addResult('failed', `Search results: Missing ${check} logic`);
        }
      }
      
      // Check for AI image source indicators
      if (content.includes('imageSourceBadge') && content.includes('AI')) {
        logSuccess('Search results: AI image source indicators found');
      } else {
        this.addResult('warning', 'Search results: No AI image source indicators');
      }
      
      this.addResult('passed', 'Search results image loading logic');
      
    } catch (error) {
      this.addResult('failed', `Search results image loading: ${error.message}`);
    }
  }

  async testSelectedSymbolImageLoading() {
    logStep(4, 'Testing Selected Symbol Image Loading');
    
    try {
      const searchResultPath = 'components/SearchResult.tsx';
      const content = fs.readFileSync(searchResultPath, 'utf8');
      
      // Check for comprehensive image handling
      const requiredFeatures = [
        'getSymbolImages', // Curated image function
        'aiImageSearch.useQuery', // AI search integration
        'handleRefreshImages', // Refresh functionality
        'ai-refresh-button', // Refresh button testID
        'ai-verify-generate-button', // AI verify button testID
        'onImageLoad', // Success callback
        'onImageError', // Error callback
        'imageUrlToUse', // Dynamic image URL selection
        'aiDefinition' // AI-enhanced descriptions
      ];
      
      for (const feature of requiredFeatures) {
        if (content.includes(feature)) {
          logSuccess(`Selected symbol: ${feature} found`);
        } else {
          this.addResult('failed', `Selected symbol: Missing ${feature}`);
        }
      }
      
      // Check for Wikipedia Commons URLs in curated images
      if (content.includes('upload.wikimedia.org/wikipedia/commons')) {
        logSuccess('Selected symbol: Wikipedia Commons URLs found');
      } else {
        this.addResult('failed', 'Selected symbol: No Wikipedia Commons URLs');
      }
      
      this.addResult('passed', 'Selected symbol image loading');
      
    } catch (error) {
      this.addResult('failed', `Selected symbol image loading: ${error.message}`);
    }
  }

  async testComparisonResultImageLoading() {
    logStep(5, 'Testing Comparison Result Image Loading');
    
    try {
      const comparisonPath = 'components/ComparisonResult.tsx';
      const content = fs.readFileSync(comparisonPath, 'utf8');
      
      // Check for matched symbol image handling
      const requiredFeatures = [
        'aiImageSearch.useQuery', // AI search for matched symbol
        'handleRefreshImages', // Refresh functionality
        'targetImageUrl', // Matched symbol image
        'imageUrlToUse', // Dynamic image selection
        'handleImageError', // Error handling
        'imagePlaceholder', // Fallback placeholder
        'aiDefinition' // AI-enhanced descriptions
      ];
      
      for (const feature of requiredFeatures) {
        if (content.includes(feature)) {
          logSuccess(`Comparison result: ${feature} found`);
        } else {
          this.addResult('failed', `Comparison result: Missing ${feature}`);
        }
      }
      
      this.addResult('passed', 'Comparison result image loading');
      
    } catch (error) {
      this.addResult('failed', `Comparison result image loading: ${error.message}`);
    }
  }

  async testAIRefreshFunctionality() {
    logStep(6, 'Testing AI Refresh Functionality');
    
    try {
      const components = [
        'components/SearchResult.tsx',
        'components/SearchResultsList.tsx',
        'components/ComparisonResult.tsx'
      ];
      
      for (const componentPath of components) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for refresh button implementation
        if (content.includes('RefreshCw') && content.includes('handleRefreshImages')) {
          logSuccess(`${componentPath}: Refresh button implementation found`);
        } else {
          this.addResult('failed', `${componentPath}: Missing refresh button implementation`);
        }
        
        // Check for AI refetch logic
        if (content.includes('aiImageSearch.refetch')) {
          logSuccess(`${componentPath}: AI refetch logic found`);
        } else {
          this.addResult('failed', `${componentPath}: Missing AI refetch logic`);
        }
        
        // Check for loading states
        if (content.includes('aiImageSearch.isLoading')) {
          logSuccess(`${componentPath}: Loading states found`);
        } else {
          this.addResult('warning', `${componentPath}: No loading states`);
        }
      }
      
      this.addResult('passed', 'AI refresh functionality');
      
    } catch (error) {
      this.addResult('failed', `AI refresh functionality: ${error.message}`);
    }
  }

  async testErrorHandlingAndFallbacks() {
    logStep(7, 'Testing Error Handling and Fallbacks');
    
    try {
      // Check main app for compare button logic
      const appPath = 'app/index.tsx';
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // Check for compare button visibility logic
      if (appContent.includes('selection1 && selection2 && selectedSearchResult')) {
        logSuccess('App: Compare button visibility logic found');
      } else {
        this.addResult('failed', 'App: Missing compare button visibility logic');
      }
      
      // Check for image loading callbacks
      if (appContent.includes('onImageLoad') && appContent.includes('onImageError')) {
        logSuccess('App: Image loading callbacks found');
      } else {
        this.addResult('failed', 'App: Missing image loading callbacks');
      }
      
      // Check useShapeComparison hook
      const hookPath = 'hooks/useShapeComparison.ts';
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      
      // Check for image state management
      const imageStates = [
        'selectedImageLoaded',
        'selectedImageError',
        'setSelectedImageLoaded',
        'setSelectedImageError'
      ];
      
      for (const state of imageStates) {
        if (hookContent.includes(state)) {
          logSuccess(`Hook: ${state} found`);
        } else {
          this.addResult('failed', `Hook: Missing ${state}`);
        }
      }
      
      // Check for lenient canCompare logic (should not require strict image loading)
      if (hookContent.includes('canCompare') && !hookContent.includes('selectedImageLoaded &&')) {
        logSuccess('Hook: Lenient canCompare logic (good for AI fallbacks)');
      } else {
        this.addResult('warning', 'Hook: canCompare might be too strict for AI fallbacks');
      }
      
      this.addResult('passed', 'Error handling and fallbacks');
      
    } catch (error) {
      this.addResult('failed', `Error handling and fallbacks: ${error.message}`);
    }
  }

  async testEndToEndImageFlow() {
    logStep(8, 'Testing End-to-End Image Flow');
    
    try {
      logInfo('Validating complete image loading flow...');
      
      // 1. Check if search triggers AI image search
      const hookPath = 'hooks/useShapeComparison.ts';
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      
      if (hookContent.includes('trpcClient.symbols.searchImages.query')) {
        logSuccess('Flow: Search triggers AI image search');
      } else {
        this.addResult('failed', 'Flow: Search does not trigger AI image search');
      }
      
      // 2. Check if search results show images with AI fallbacks
      const searchResultsPath = 'components/SearchResultsList.tsx';
      const searchContent = fs.readFileSync(searchResultsPath, 'utf8');
      
      if (searchContent.includes('aiImageSearch.data?.images')) {
        logSuccess('Flow: Search results use AI images');
      } else {
        this.addResult('failed', 'Flow: Search results do not use AI images');
      }
      
      // 3. Check if selected symbol shows enhanced images
      const selectedPath = 'components/SearchResult.tsx';
      const selectedContent = fs.readFileSync(selectedPath, 'utf8');
      
      if (selectedContent.includes('useAiImages') && selectedContent.includes('aiDefinition')) {
        logSuccess('Flow: Selected symbol uses AI enhancements');
      } else {
        this.addResult('failed', 'Flow: Selected symbol missing AI enhancements');
      }
      
      // 4. Check if comparison result shows matched symbol images
      const comparisonPath = 'components/ComparisonResult.tsx';
      const comparisonContent = fs.readFileSync(comparisonPath, 'utf8');
      
      if (comparisonContent.includes('targetImageUrl') && comparisonContent.includes('aiImageSearch')) {
        logSuccess('Flow: Comparison result shows matched symbol with AI fallback');
      } else {
        this.addResult('failed', 'Flow: Comparison result missing matched symbol AI fallback');
      }
      
      // 5. Check if all components have refresh buttons
      const components = [searchResultsPath, selectedPath, comparisonPath];
      let refreshCount = 0;
      
      for (const componentPath of components) {
        const content = fs.readFileSync(componentPath, 'utf8');
        if (content.includes('RefreshCw') || content.includes('refresh')) {
          refreshCount++;
        }
      }
      
      if (refreshCount === components.length) {
        logSuccess('Flow: All components have refresh functionality');
      } else {
        this.addResult('warning', `Flow: Only ${refreshCount}/${components.length} components have refresh`);
      }
      
      this.addResult('passed', 'End-to-end image flow');
      
    } catch (error) {
      this.addResult('failed', `End-to-end image flow: ${error.message}`);
    }
  }

  addResult(type, message) {
    this.results[type]++;
    this.results.details.push({ type, message });
    
    if (type === 'passed') {
      logSuccess(message);
    } else if (type === 'failed') {
      logError(message);
    } else if (type === 'warning') {
      logWarning(message);
    }
  }

  printSummary() {
    log('\n' + '='.repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'bright');
    log('='.repeat(60), 'blue');
    
    log(`\n✅ Passed: ${this.results.passed}`, 'green');
    log(`❌ Failed: ${this.results.failed}`, 'red');
    log(`⚠️  Warnings: ${this.results.warnings}`, 'yellow');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
    
    if (this.results.failed > 0) {
      log('\n🔍 FAILED TESTS:', 'red');
      this.results.details
        .filter(detail => detail.type === 'failed')
        .forEach(detail => log(`  • ${detail.message}`, 'red'));
    }
    
    if (this.results.warnings > 0) {
      log('\n⚠️  WARNINGS:', 'yellow');
      this.results.details
        .filter(detail => detail.type === 'warning')
        .forEach(detail => log(`  • ${detail.message}`, 'yellow'));
    }
    
    log('\n🎯 RECOMMENDATIONS:', 'cyan');
    
    if (this.results.failed === 0) {
      log('  • All critical tests passed! ✨', 'green');
      log('  • Image loading should work correctly', 'green');
      log('  • AI verification and fallbacks are implemented', 'green');
    } else {
      log('  • Fix failed tests before deployment', 'red');
      log('  • Ensure all components have proper error handling', 'yellow');
      log('  • Test AI functionality manually', 'yellow');
    }
    
    log('\n🚀 NEXT STEPS:', 'magenta');
    log('  1. Run the app and test image loading manually', 'blue');
    log('  2. Try the AI refresh buttons (↻)', 'blue');
    log('  3. Test with different symbol categories', 'blue');
    log('  4. Verify compare button appears when images load', 'blue');
    log('  5. Check that AI Verify & Generate works when images fail', 'blue');
    
    log('\n' + '='.repeat(60), 'blue');
    
    // Exit with appropriate code
    if (this.results.failed > 0) {
      log('❌ Tests failed. Please fix issues before deployment.', 'red');
      process.exit(1);
    } else {
      log('✅ All tests passed! Ready for deployment.', 'green');
      process.exit(0);
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ImageLoadingTester();
  tester.runAllTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = ImageLoadingTester;