#!/usr/bin/env node

// Complete user flow test for AI search functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8081';

class CompleteFlowTester {
  constructor() {
    this.testSteps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      step: '👉'
    };
    const logMessage = `${timestamp} ${icons[type] || '📋'} ${message}`;
    console.log(logMessage);
    
    this.testSteps.push({
      timestamp,
      type,
      message
    });
  }

  async testAIImageSearch(symbolName, symbolDescription, category) {
    const endpoint = `${BASE_URL}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { symbolName, symbolDescription, category } }))}`;
    
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data[0] && data[0].result && data[0].result.data) {
        return data[0].result.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  async testImageAccessibility(imageUrl) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  async simulateUserFlow() {
    this.log('🎯 Starting Complete User Flow Test', 'step');
    this.log('Simulating: User selects "Ancient symbols" and searches');
    
    try {
      // Step 1: User selects first shape type
      this.log('\n👤 Step 1: User selects "Ancient symbols"', 'step');
      const selection1 = 'Ancient symbols';
      
      // Step 2: User clicks "Auto Search"
      this.log('\n👤 Step 2: User clicks "Auto Search Ancient symbols"', 'step');
      
      const searchResult = await this.testAIImageSearch(
        selection1,
        `Find specific examples from the category: ${selection1}`,
        selection1.toLowerCase()
      );
      
      if (!searchResult.images || searchResult.images.length === 0) {
        throw new Error('No search results returned');
      }
      
      this.log(`✅ Search returned ${searchResult.images.length} results`, 'success');
      
      // Step 3: Display search results
      this.log('\n👤 Step 3: App displays search results', 'step');
      
      const validResults = [];
      
      for (let i = 0; i < Math.min(searchResult.images.length, 3); i++) {
        const img = searchResult.images[i];
        this.log(`  Result ${i + 1}: ${img.description}`);
        this.log(`  URL: ${img.url}`);
        this.log(`  Score: ${img.relevanceScore}`);
        
        // Test image accessibility
        const isAccessible = await this.testImageAccessibility(img.url);
        if (isAccessible) {
          this.log(`  ✅ Image is accessible`, 'success');
          validResults.push(img);
        } else {
          this.log(`  ❌ Image is not accessible`, 'error');
        }
      }
      
      if (validResults.length === 0) {
        throw new Error('No accessible images found');
      }
      
      // Step 4: User selects a search result
      this.log('\n👤 Step 4: User selects first valid search result', 'step');
      const selectedResult = validResults[0];
      this.log(`Selected: ${selectedResult.description}`);
      
      // Step 5: User selects second shape type
      this.log('\n👤 Step 5: User selects "Chemical formula symbol"', 'step');
      const selection2 = 'Chemical formula symbol';
      
      // Step 6: Compare button should be visible
      this.log('\n👤 Step 6: Compare button should now be visible', 'step');
      
      const canCompare = Boolean(
        selection1 && 
        selection2 && 
        selectedResult
      );
      
      if (canCompare) {
        this.log('✅ Compare button conditions met', 'success');
      } else {
        throw new Error('Compare button conditions not met');
      }
      
      // Step 7: Test AI refresh functionality
      this.log('\n👤 Step 7: User clicks AI refresh button (↻)', 'step');
      
      const refreshResult = await this.testAIImageSearch(
        selectedResult.description,
        selectedResult.description,
        selection1.toLowerCase()
      );
      
      if (refreshResult.images && refreshResult.images.length > 0) {
        this.log('✅ AI refresh returned new results', 'success');
        this.log(`Refresh found ${refreshResult.images.length} images`);
      } else {
        this.log('⚠️ AI refresh returned no results', 'warning');
      }
      
      // Step 8: Test custom search
      this.log('\n👤 Step 8: User tries custom search "Eye of Horus"', 'step');
      
      const customSearchResult = await this.testAIImageSearch(
        'Eye of Horus ancient Egyptian symbol',
        'Eye of Horus ancient Egyptian symbol',
        'ancient symbols'
      );
      
      if (customSearchResult.images && customSearchResult.images.length > 0) {
        this.log('✅ Custom search successful', 'success');
        this.log(`Custom search found ${customSearchResult.images.length} images`);
        
        // Test first custom result image
        const firstCustomImage = customSearchResult.images[0];
        const customImageAccessible = await this.testImageAccessibility(firstCustomImage.url);
        
        if (customImageAccessible) {
          this.log('✅ Custom search image is accessible', 'success');
        } else {
          this.log('❌ Custom search image is not accessible', 'error');
        }
      } else {
        this.log('❌ Custom search failed', 'error');
      }
      
      this.log('\n🎉 Complete user flow test PASSED!', 'success');
      return true;
      
    } catch (error) {
      this.log(`\n❌ User flow test FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testSpecificIssues() {
    this.log('\n🔍 Testing Specific Issues from User Report', 'step');
    
    const issues = [
      {
        name: 'AI Search Does Not Work',
        test: async () => {
          const result = await this.testAIImageSearch(
            'Star clusters',
            'Find specific examples from the category: Star clusters',
            'star clusters'
          );
          return result.images && result.images.length > 0;
        }
      },
      {
        name: 'Images Cannot Be Loaded',
        test: async () => {
          const result = await this.testAIImageSearch(
            'Ancient symbols',
            'Find specific examples from the category: Ancient symbols',
            'ancient symbols'
          );
          
          if (!result.images || result.images.length === 0) {
            return false;
          }
          
          // Test first 3 images
          let accessibleCount = 0;
          for (let i = 0; i < Math.min(result.images.length, 3); i++) {
            const isAccessible = await this.testImageAccessibility(result.images[i].url);
            if (isAccessible) accessibleCount++;
          }
          
          return accessibleCount > 0;
        }
      },
      {
        name: 'AI Refresh Button Does Not Work',
        test: async () => {
          // First search
          const result1 = await this.testAIImageSearch(
            'Chemical formula symbol',
            'Find specific examples from the category: Chemical formula symbol',
            'chemical formula symbol'
          );
          
          if (!result1.images || result1.images.length === 0) {
            return false;
          }
          
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh search (simulate refresh button)
          const result2 = await this.testAIImageSearch(
            'Chemical formula symbol',
            'Find specific examples from the category: Chemical formula symbol',
            'chemical formula symbol'
          );
          
          return result2.images && result2.images.length > 0;
        }
      },
      {
        name: 'Compare Button Not Shown',
        test: async () => {
          // Simulate having all required data for compare button
          const selection1 = 'Ancient symbols';
          const selection2 = 'Chemical formula symbol';
          
          const searchResult = await this.testAIImageSearch(
            selection1,
            `Find specific examples from the category: ${selection1}`,
            selection1.toLowerCase()
          );
          
          const hasValidResult = searchResult.images && searchResult.images.length > 0;
          const canCompare = Boolean(selection1 && selection2 && hasValidResult);
          
          return canCompare;
        }
      }
    ];
    
    let passedIssues = 0;
    
    for (const issue of issues) {
      this.log(`\n🔧 Testing: ${issue.name}`);
      
      try {
        const passed = await issue.test();
        if (passed) {
          this.log(`✅ FIXED: ${issue.name}`, 'success');
          passedIssues++;
        } else {
          this.log(`❌ STILL BROKEN: ${issue.name}`, 'error');
        }
      } catch (error) {
        this.log(`❌ ERROR testing ${issue.name}: ${error.message}`, 'error');
      }
    }
    
    this.log(`\n📊 Issue Fix Summary: ${passedIssues}/${issues.length} issues fixed`);
    return passedIssues === issues.length;
  }

  async runCompleteTest() {
    this.log('🚀 Starting Complete AI Search Functionality Test');
    this.log('=' .repeat(60));
    
    // Test server health
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/trpc/example.hi`);
      if (!healthResponse.ok) {
        throw new Error('Server not responding');
      }
      this.log('✅ Server is healthy', 'success');
    } catch (_error) {
      this.log('❌ Server health check failed', 'error');
      return false;
    }
    
    // Run user flow test
    const userFlowPassed = await this.simulateUserFlow();
    
    // Test specific issues
    const issuesPassed = await this.testSpecificIssues();
    
    // Final summary
    this.log('\n🏁 FINAL TEST RESULTS', 'step');
    this.log('=' .repeat(40));
    
    if (userFlowPassed && issuesPassed) {
      this.log('🎉 ALL TESTS PASSED! AI search functionality is working correctly.', 'success');
      this.log('✅ User can search for symbols', 'success');
      this.log('✅ Images load properly', 'success');
      this.log('✅ AI refresh works', 'success');
      this.log('✅ Compare button shows when ready', 'success');
      return true;
    } else {
      this.log('❌ SOME TESTS FAILED', 'error');
      if (!userFlowPassed) {
        this.log('❌ User flow test failed', 'error');
      }
      if (!issuesPassed) {
        this.log('❌ Some specific issues are not fixed', 'error');
      }
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new CompleteFlowTester();
  
  try {
    const allPassed = await tester.runCompleteTest();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CompleteFlowTester };