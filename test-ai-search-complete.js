const { execSync } = require('child_process');
const fs = require('fs');

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
    name: 'Ancient Symbols to Chemical Formula',
    selection1: 'Ancient symbols',
    selection2: 'Chemical formula symbol',
    expectedResults: ['Eye of Horus', 'Ankh', 'Ouroboros', 'Yin Yang', 'Pentagram']
  },
  {
    name: 'Star Clusters to Atomic Structure',
    selection1: 'Star clusters',
    selection2: 'Atomic structure symbol',
    expectedResults: ['Messier 13', 'Pleiades', 'Orion Nebula', 'Helix Nebula', 'Crab Nebula']
  },
  {
    name: 'Chemical Formula to Star Map',
    selection1: 'Chemical formula symbol',
    selection2: 'Star map',
    expectedResults: ['Water Molecule', 'Carbon Dioxide', 'Methane', 'Sodium Chloride', 'Ammonia']
  }
];

class AISearchTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'debug': '🔍'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testBackendAPI() {
    this.log('Testing backend tRPC API...', 'info');
    
    try {
      // Test the symbols.searchImages endpoint directly
      const testPayload = {
        symbolName: 'Ancient symbols',
        symbolDescription: 'Find specific examples from the category: Ancient symbols',
        category: 'ancient symbols'
      };
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': testPayload }))}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.log(`Backend API Response: ${JSON.stringify(data, null, 2)}`, 'debug');
      
      // Validate response structure
      if (!data[0]?.result?.data?.images) {
        throw new Error('Invalid response structure - missing images array');
      }
      
      const images = data[0].result.data.images;
      if (images.length === 0) {
        throw new Error('No images returned from API');
      }
      
      // Validate image structure
      const firstImage = images[0];
      const requiredFields = ['url', 'description', 'source', 'relevanceScore'];
      for (const field of requiredFields) {
        if (!firstImage[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      this.log(`✅ Backend API test passed - ${images.length} images returned`, 'success');
      return { success: true, imageCount: images.length };
      
    } catch (error) {
      this.log(`❌ Backend API test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAIImageGeneration() {
    this.log('Testing AI image generation...', 'info');
    
    try {
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a clear, authentic illustration of the ancient symbol "Eye of Horus". Style: Clean black lines on white background, historically accurate, traditional proportions, no text labels.',
          size: '1024x1024'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        throw new Error('Invalid response - missing image data');
      }
      
      this.log('✅ AI image generation test passed', 'success');
      return { success: true };
      
    } catch (error) {
      this.log(`❌ AI image generation test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAITextCompletion() {
    this.log('Testing AI text completion...', 'info');
    
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Respond with a simple JSON object containing a "message" field.'
            },
            {
              role: 'user',
              content: 'Say hello in JSON format'
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.completion) {
        throw new Error('Invalid response - missing completion');
      }
      
      this.log('✅ AI text completion test passed', 'success');
      return { success: true };
      
    } catch (error) {
      this.log(`❌ AI text completion test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runFullWorkflowTest(scenario) {
    this.log(`🧪 Testing scenario: ${scenario.name}`, 'info');
    
    try {
      // Step 1: Test search for first selection
      this.log(`Step 1: Searching for ${scenario.selection1}...`, 'info');
      
      const searchPayload = {
        symbolName: scenario.selection1,
        symbolDescription: `Find specific examples from the category: ${scenario.selection1}`,
        category: scenario.selection1.toLowerCase()
      };
      
      const searchResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': searchPayload }))}`);
      
      if (!searchResponse.ok) {
        throw new Error(`Search failed: HTTP ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      const searchResults = searchData[0]?.result?.data?.images || [];
      
      if (searchResults.length === 0) {
        throw new Error('No search results returned');
      }
      
      this.log(`✅ Search returned ${searchResults.length} results`, 'success');
      
      // Step 2: Select first result and test comparison
      const selectedResult = searchResults[0];
      this.log(`Step 2: Testing comparison with selected result: ${selectedResult.description}`, 'info');
      
      const comparisonResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert at finding creative connections between different types of symbols and shapes across various domains. Given a specific symbol from one category and a target category, find a meaningful connection and suggest a specific symbol from the target category.

Provide a JSON response with:
- connection: Brief explanation of the conceptual connection
- targetName: Specific name of the symbol from the target category
- targetDescription: Brief description of the target symbol
- targetImageUrl: Direct image URL from Unsplash (format: https://images.unsplash.com/photo-[ID]?w=400&h=300&fit=crop&crop=center)
- targetUrl: Wikipedia or educational source URL
- similarityScore: Number from 1-100 indicating strength of connection
- explanation: Detailed explanation of why these symbols are connected

Focus on meaningful connections like: visual similarity, symbolic meaning, cultural significance, scientific relationships, or conceptual parallels.`
            },
            {
              role: 'user',
              content: `I have "${selectedResult.description}" from the category "${scenario.selection1}". Find a meaningful connection to something in the category "${scenario.selection2}". 

Source symbol details:
- Name: ${selectedResult.description}
- Description: ${selectedResult.description}

Target category: ${scenario.selection2}

Return only valid JSON with a specific symbol from the target category and explain the connection.`
            }
          ]
        })
      });
      
      if (!comparisonResponse.ok) {
        throw new Error(`Comparison failed: HTTP ${comparisonResponse.status}`);
      }
      
      const comparisonData = await comparisonResponse.json();
      
      if (!comparisonData.completion) {
        throw new Error('No completion in comparison response');
      }
      
      // Parse the comparison result
      let comparisonResult;
      try {
        let cleanCompletion = comparisonData.completion.trim();
        if (cleanCompletion.startsWith('```json')) {
          cleanCompletion = cleanCompletion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanCompletion.startsWith('```')) {
          cleanCompletion = cleanCompletion.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        comparisonResult = JSON.parse(cleanCompletion);
      } catch (parseError) {
        throw new Error(`Failed to parse comparison result: ${parseError.message}`);
      }
      
      // Validate comparison result
      const requiredFields = ['connection', 'targetName', 'explanation'];
      for (const field of requiredFields) {
        if (!comparisonResult[field]) {
          throw new Error(`Missing required field in comparison: ${field}`);
        }
      }
      
      this.log(`✅ Comparison successful: ${comparisonResult.targetName}`, 'success');
      this.log(`Connection: ${comparisonResult.connection}`, 'info');
      
      return {
        success: true,
        searchResults: searchResults.length,
        selectedResult: selectedResult.description,
        comparisonResult: comparisonResult.targetName,
        connection: comparisonResult.connection
      };
      
    } catch (error) {
      this.log(`❌ Workflow test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive AI search tests...', 'info');
    
    const testResults = {
      backendAPI: await this.testBackendAPI(),
      aiImageGeneration: await this.testAIImageGeneration(),
      aiTextCompletion: await this.testAITextCompletion(),
      workflows: []
    };
    
    // Run workflow tests for each scenario
    for (const scenario of TEST_SCENARIOS) {
      await this.wait(TEST_CONFIG.waitBetweenSteps);
      const workflowResult = await this.runFullWorkflowTest(scenario);
      testResults.workflows.push({
        scenario: scenario.name,
        ...workflowResult
      });
    }
    
    // Generate summary
    const totalTests = 3 + TEST_SCENARIOS.length; // 3 API tests + workflow tests
    const passedTests = [
      testResults.backendAPI.success,
      testResults.aiImageGeneration.success,
      testResults.aiTextCompletion.success,
      ...testResults.workflows.map(w => w.success)
    ].filter(Boolean).length;
    
    this.log('\n📊 TEST SUMMARY', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${passedTests}`, 'success');
    this.log(`Failed: ${totalTests - passedTests}`, 'error');
    this.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');
    
    // Detailed results
    this.log('\n📋 DETAILED RESULTS:', 'info');
    this.log(`Backend API: ${testResults.backendAPI.success ? '✅ PASS' : '❌ FAIL'}`, testResults.backendAPI.success ? 'success' : 'error');
    this.log(`AI Image Generation: ${testResults.aiImageGeneration.success ? '✅ PASS' : '❌ FAIL'}`, testResults.aiImageGeneration.success ? 'success' : 'error');
    this.log(`AI Text Completion: ${testResults.aiTextCompletion.success ? '✅ PASS' : '❌ FAIL'}`, testResults.aiTextCompletion.success ? 'success' : 'error');
    
    testResults.workflows.forEach(workflow => {
      this.log(`Workflow (${workflow.scenario}): ${workflow.success ? '✅ PASS' : '❌ FAIL'}`, workflow.success ? 'success' : 'error');
      if (workflow.success) {
        this.log(`  - Search Results: ${workflow.searchResults}`, 'info');
        this.log(`  - Selected: ${workflow.selectedResult}`, 'info');
        this.log(`  - Comparison: ${workflow.comparisonResult}`, 'info');
        this.log(`  - Connection: ${workflow.connection}`, 'info');
      } else if (workflow.error) {
        this.log(`  - Error: ${workflow.error}`, 'error');
      }
    });
    
    // Save results to file
    const resultsFile = 'ai-search-test-results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    this.log(`\n💾 Results saved to ${resultsFile}`, 'info');
    
    return passedTests === totalTests;
  }
}

// Run the tests
async function main() {
  const tester = new AISearchTester();
  
  try {
    const allTestsPassed = await tester.runAllTests();
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! AI search functionality is working correctly.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed. Check the detailed results above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner crashed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AISearchTester, TEST_SCENARIOS };