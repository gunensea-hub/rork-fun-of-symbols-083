const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8081',
  testTimeout: 30000,
  retryAttempts: 3,
  waitBetweenSteps: 2000
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Star Clusters Auto Search',
    selection1: 'Star clusters',
    expectedResults: ['Messier', 'Pleiades', 'Orion', 'Helix', 'Crab'],
    testAiRefresh: true
  },
  {
    name: 'Chemical Formula Auto Search',
    selection1: 'Chemical formula symbol',
    expectedResults: ['Water', 'H2O', 'Carbon', 'CO2', 'Methane'],
    testAiRefresh: true
  },
  {
    name: 'Ancient Symbols Auto Search',
    selection1: 'Ancient symbols',
    expectedResults: ['Horus', 'Ankh', 'Ouroboros', 'Yin', 'Pentagram'],
    testAiRefresh: true
  },
  {
    name: 'Custom Search - Eye of Horus',
    selection1: 'Ancient symbols',
    customQuery: 'Eye of Horus ancient Egyptian symbol',
    expectedResults: ['Eye of Horus', 'Horus', 'Egyptian'],
    testAiRefresh: true
  },
  {
    name: 'Custom Search - Water Molecule',
    selection1: 'Chemical formula symbol',
    customQuery: 'Water molecule H2O structure',
    expectedResults: ['Water', 'H2O', 'Molecule'],
    testAiRefresh: true
  }
];

class AISearchTester {
  constructor() {
    this.results = [];
    this.currentTest = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || '📋';
    
    const logMessage = `${timestamp} ${prefix} ${message}`;
    console.log(logMessage);
    
    if (this.currentTest) {
      this.currentTest.logs = this.currentTest.logs || [];
      this.currentTest.logs.push(logMessage);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testTrpcEndpoint(procedure, input) {
    const endpoint = `/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": input }))}`;
    
    this.log(`Testing tRPC endpoint: ${procedure}`);
    this.log(`Input: ${JSON.stringify(input)}`);
    
    const result = await this.makeRequest(endpoint);
    
    if (result.success) {
      this.log(`tRPC call successful`, 'success');
      this.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
      return result.data;
    } else {
      this.log(`tRPC call failed: ${result.error}`, 'error');
      throw new Error(result.error);
    }
  }

  async testAIImageSearch(symbolName, symbolDescription, category) {
    this.log(`🤖 Testing AI Image Search for: ${symbolName}`);
    
    try {
      const input = {
        symbolName,
        symbolDescription,
        category
      };
      
      const response = await this.testTrpcEndpoint('symbols.searchImages', input);
      
      // Parse tRPC batch response
      let searchResult;
      if (response && response[0] && response[0].result && response[0].result.data) {
        searchResult = response[0].result.data;
      } else {
        throw new Error('Invalid tRPC response format');
      }
      
      this.log(`Found ${searchResult.images?.length || 0} images`);
      
      if (searchResult.images && searchResult.images.length > 0) {
        searchResult.images.forEach((img, index) => {
          this.log(`Image ${index + 1}: ${img.description} (Score: ${img.relevanceScore})`);
          this.log(`URL: ${img.url}`);
          this.log(`Source: ${img.source}`);
        });
        
        // Test image URLs
        await this.testImageUrls(searchResult.images);
        
        return {
          success: true,
          images: searchResult.images,
          aiDefinition: searchResult.aiDefinition
        };
      } else {
        this.log('No images found in search result', 'warning');
        return { success: false, error: 'No images found' };
      }
    } catch (error) {
      this.log(`AI Image Search failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testImageUrls(images) {
    this.log('🖼️ Testing image URL accessibility...');
    
    for (let i = 0; i < Math.min(images.length, 3); i++) {
      const img = images[i];
      try {
        const response = await fetch(img.url, { method: 'HEAD' });
        if (response.ok) {
          this.log(`✅ Image ${i + 1} accessible: ${img.url}`, 'success');
        } else {
          this.log(`❌ Image ${i + 1} not accessible (${response.status}): ${img.url}`, 'error');
        }
      } catch (error) {
        this.log(`❌ Image ${i + 1} failed to load: ${error.message}`, 'error');
      }
    }
  }

  async testScenario(scenario) {
    this.currentTest = {
      name: scenario.name,
      startTime: Date.now(),
      logs: [],
      success: false
    };
    
    this.log(`\n🧪 Starting test: ${scenario.name}`, 'test');
    
    try {
      let searchResult;
      
      if (scenario.customQuery) {
        // Test custom search
        this.log(`Testing custom search: "${scenario.customQuery}"`);
        searchResult = await this.testAIImageSearch(
          scenario.customQuery,
          scenario.customQuery,
          scenario.selection1.toLowerCase()
        );
      } else {
        // Test auto search
        this.log(`Testing auto search for: ${scenario.selection1}`);
        searchResult = await this.testAIImageSearch(
          scenario.selection1,
          `Find specific examples from the category: ${scenario.selection1}`,
          scenario.selection1.toLowerCase()
        );
      }
      
      if (!searchResult.success) {
        throw new Error(searchResult.error);
      }
      
      // Validate results
      const foundResults = this.validateSearchResults(searchResult, scenario.expectedResults);
      
      if (foundResults.length === 0) {
        this.log('⚠️ No expected results found, but search returned data', 'warning');
      } else {
        this.log(`✅ Found ${foundResults.length} expected results: ${foundResults.join(', ')}`, 'success');
      }
      
      // Test AI refresh functionality if enabled
      if (scenario.testAiRefresh && searchResult.images && searchResult.images.length > 0) {
        this.log('🔄 Testing AI refresh functionality...');
        await this.wait(1000);
        
        const refreshResult = await this.testAIImageSearch(
          scenario.customQuery || scenario.selection1,
          scenario.customQuery || `Find specific examples from the category: ${scenario.selection1}`,
          scenario.selection1.toLowerCase()
        );
        
        if (refreshResult.success) {
          this.log('✅ AI refresh successful', 'success');
        } else {
          this.log('❌ AI refresh failed', 'error');
        }
      }
      
      this.currentTest.success = true;
      this.currentTest.endTime = Date.now();
      this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
      
      this.log(`✅ Test completed successfully in ${this.currentTest.duration}ms`, 'success');
      
    } catch (error) {
      this.currentTest.success = false;
      this.currentTest.error = error.message;
      this.currentTest.endTime = Date.now();
      this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
      
      this.log(`❌ Test failed: ${error.message}`, 'error');
    }
    
    this.results.push(this.currentTest);
    this.currentTest = null;
  }

  validateSearchResults(searchResult, expectedResults) {
    const foundResults = [];
    
    if (searchResult.images) {
      searchResult.images.forEach(img => {
        const description = img.description.toLowerCase();
        expectedResults.forEach(expected => {
          if (description.includes(expected.toLowerCase())) {
            foundResults.push(expected);
          }
        });
      });
    }
    
    return [...new Set(foundResults)]; // Remove duplicates
  }

  async testServerHealth() {
    this.log('🏥 Testing server health...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/example.hi`);
      if (response.ok) {
        this.log('✅ Server is responding', 'success');
        return true;
      } else {
        this.log(`❌ Server health check failed: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Server health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive AI search tests...', 'test');
    this.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
    this.log(`Test scenarios: ${TEST_SCENARIOS.length}`);
    
    // Test server health first
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      this.log('❌ Server is not healthy, aborting tests', 'error');
      return;
    }
    
    // Run all test scenarios
    for (const scenario of TEST_SCENARIOS) {
      await this.testScenario(scenario);
      await this.wait(TEST_CONFIG.waitBetweenSteps);
    }
    
    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    this.log('\n📊 TEST SUMMARY', 'test');
    this.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    this.log(`Total tests: ${totalTests}`);
    this.log(`Passed: ${passedTests} ✅`);
    this.log(`Failed: ${failedTests} ❌`);
    this.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.success).forEach(test => {
        this.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    this.log('\n✅ PASSED TESTS:');
    this.results.filter(r => r.success).forEach(test => {
      this.log(`  - ${test.name} (${test.duration}ms)`);
    });
    
    // Save detailed results
    const reportPath = path.join(process.cwd(), 'ai-search-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100
      },
      results: this.results
    }, null, 2));
    
    this.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (failedTests === 0) {
      this.log('\n🎉 All tests passed! AI search functionality is working correctly.', 'success');
    } else {
      this.log(`\n⚠️ ${failedTests} test(s) failed. Please check the issues above.`, 'warning');
    }
  }
}

// Main execution
async function main() {
  const tester = new AISearchTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AISearchTester, TEST_SCENARIOS, TEST_CONFIG };