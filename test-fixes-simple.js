#!/usr/bin/env node

// Simple test to verify AI search fixes
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8081';

class SimpleAITester {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${timestamp} ${icons[type] || '📋'} ${message}`);
  }

  async testTrpcCall(procedure, input) {
    try {
      const endpoint = `${BASE_URL}/api/trpc/${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": input }))}`;
      
      this.log(`Testing: ${procedure}`);
      this.log(`Input: ${JSON.stringify(input)}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data[0] && data[0].result && data[0].result.data) {
        const result = data[0].result.data;
        this.log(`Success: Found ${result.images?.length || 0} images`, 'success');
        
        if (result.images && result.images.length > 0) {
          result.images.forEach((img, i) => {
            this.log(`  Image ${i + 1}: ${img.description} (Score: ${img.relevanceScore})`);
          });
        }
        
        return { success: true, data: result };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      this.log(`Failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testScenario(name, symbolName, symbolDescription, category) {
    this.log(`\n🧪 Testing: ${name}`);
    
    const result = await this.testTrpcCall('symbols.searchImages', {
      symbolName,
      symbolDescription,
      category
    });
    
    this.testResults.push({
      name,
      success: result.success,
      imageCount: result.data?.images?.length || 0,
      error: result.error
    });
    
    return result.success;
  }

  async runAllTests() {
    this.log('🚀 Starting AI Search Fix Verification Tests');
    
    // Test server health
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/trpc/example.hi`);
      if (!healthResponse.ok) {
        throw new Error('Server not responding');
      }
      this.log('✅ Server is healthy', 'success');
    } catch (_error) {
      this.log('❌ Server health check failed', 'error');
      return;
    }
    
    // Test scenarios
    const scenarios = [
      {
        name: 'Star Clusters Search',
        symbolName: 'Star clusters',
        symbolDescription: 'Find specific examples from the category: Star clusters',
        category: 'star clusters'
      },
      {
        name: 'Ancient Symbols Search',
        symbolName: 'Ancient symbols',
        symbolDescription: 'Find specific examples from the category: Ancient symbols',
        category: 'ancient symbols'
      },
      {
        name: 'Chemical Formula Search',
        symbolName: 'Chemical formula symbol',
        symbolDescription: 'Find specific examples from the category: Chemical formula symbol',
        category: 'chemical formula symbol'
      },
      {
        name: 'Custom Eye of Horus Search',
        symbolName: 'Eye of Horus ancient Egyptian symbol',
        symbolDescription: 'Eye of Horus ancient Egyptian symbol',
        category: 'ancient symbols'
      }
    ];
    
    let passedTests = 0;
    
    for (const scenario of scenarios) {
      const success = await this.testScenario(
        scenario.name,
        scenario.symbolName,
        scenario.symbolDescription,
        scenario.category
      );
      
      if (success) passedTests++;
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    this.log('\n📊 TEST SUMMARY');
    this.log('=' .repeat(40));
    this.log(`Total tests: ${scenarios.length}`);
    this.log(`Passed: ${passedTests}`, passedTests === scenarios.length ? 'success' : 'warning');
    this.log(`Failed: ${scenarios.length - passedTests}`, scenarios.length - passedTests === 0 ? 'success' : 'error');
    
    if (passedTests === scenarios.length) {
      this.log('\n🎉 All tests passed! AI search is working correctly.', 'success');
    } else {
      this.log('\n⚠️ Some tests failed. Check the logs above.', 'warning');
      
      this.testResults.filter(r => !r.success).forEach(test => {
        this.log(`  ❌ ${test.name}: ${test.error}`, 'error');
      });
    }
    
    return passedTests === scenarios.length;
  }
}

// Run tests
async function main() {
  const tester = new SimpleAITester();
  
  try {
    const allPassed = await tester.runAllTests();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SimpleAITester };