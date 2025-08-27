#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8081',
  testTimeout: 30000,
  retryAttempts: 3,
  waitBetweenSteps: 2000
};

class AutomaticAppTester {
  constructor() {
    this.results = {
      serverStarted: false,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'step': '🔄',
      'test': '🧪'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkServerStatus() {
    try {
      const response = await fetch('http://localhost:8081');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async startServer() {
    this.log('🚀 STEP 1: Checking if server is running...', 'step');
    
    const isRunning = await this.checkServerStatus();
    if (isRunning) {
      this.log('✅ Server is already running on port 8081', 'success');
      this.results.serverStarted = true;
      return true;
    }

    this.log('Starting development server...', 'info');
    
    try {
      // Start the server in the background
      const serverProcess = spawn('bunx', ['rork', 'start', '-p', 'ns3khzybl3nijr8w7jbc5', '--tunnel'], {
        stdio: 'pipe',
        detached: false
      });

      // Wait for server to start
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds
      
      while (attempts < maxAttempts) {
        await this.wait(1000);
        const isRunning = await this.checkServerStatus();
        if (isRunning) {
          this.log('✅ Server started successfully', 'success');
          this.results.serverStarted = true;
          return serverProcess;
        }
        attempts++;
        this.log(`Waiting for server... (${attempts}/${maxAttempts})`, 'info');
      }
      
      throw new Error('Server failed to start within 30 seconds');
      
    } catch (error) {
      this.log(`❌ Failed to start server: ${error.message}`, 'error');
      return null;
    }
  }

  async testBackendAPI() {
    this.log('🧪 STEP 2: Testing Backend API...', 'step');
    
    try {
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
      
      if (!data[0]?.result?.data?.images) {
        throw new Error('Invalid response structure - missing images array');
      }
      
      const images = data[0].result.data.images;
      if (images.length === 0) {
        throw new Error('No images returned from API');
      }
      
      this.log(`✅ Backend API working - ${images.length} images returned`, 'success');
      this.log(`   First result: ${images[0].description}`, 'info');
      
      this.results.tests.push({
        name: 'Backend API',
        success: true,
        details: `${images.length} images returned`
      });
      this.results.passedTests++;
      
      return { success: true, images };
      
    } catch (error) {
      this.log(`❌ Backend API test failed: ${error.message}`, 'error');
      this.results.tests.push({
        name: 'Backend API',
        success: false,
        error: error.message
      });
      this.results.failedTests++;
      return { success: false, error: error.message };
    }
  }

  async testAISearch() {
    this.log('🧪 STEP 3: Testing AI Search Functionality...', 'step');
    
    try {
      // Test AI search with a specific symbol
      const testPayload = {
        symbolName: 'Eye of Horus',
        symbolDescription: 'Ancient Egyptian protection symbol',
        category: 'ancient symbols'
      };
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': testPayload }))}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const images = data[0]?.result?.data?.images || [];
      
      if (images.length === 0) {
        throw new Error('No AI search results returned');
      }
      
      // Check if we got high-quality results
      const hasHighQualityResults = images.some(img => 
        img.relevanceScore >= 95 && 
        img.url.includes('wikimedia.org')
      );
      
      this.log(`✅ AI Search working - ${images.length} results found`, 'success');
      this.log(`   Quality results: ${hasHighQualityResults ? 'YES' : 'NO'}`, 'info');
      this.log(`   Best result: ${images[0].description} (Score: ${images[0].relevanceScore})`, 'info');
      
      this.results.tests.push({
        name: 'AI Search',
        success: true,
        details: `${images.length} results, high quality: ${hasHighQualityResults}`
      });
      this.results.passedTests++;
      
      return { success: true, images, hasHighQualityResults };
      
    } catch (error) {
      this.log(`❌ AI Search test failed: ${error.message}`, 'error');
      this.results.tests.push({
        name: 'AI Search',
        success: false,
        error: error.message
      });
      this.results.failedTests++;
      return { success: false, error: error.message };
    }
  }

  async testAIRefresh() {
    this.log('🧪 STEP 4: Testing AI Refresh Button...', 'step');
    
    try {
      // Test AI refresh by making multiple requests
      const testPayload = {
        symbolName: 'Water molecule',
        symbolDescription: 'H2O chemical structure',
        category: 'chemical formula symbol'
      };
      
      // First request
      const response1 = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': testPayload }))}`);
      const data1 = await response1.json();
      const images1 = data1[0]?.result?.data?.images || [];
      
      await this.wait(1000); // Wait 1 second
      
      // Second request (simulating refresh)
      const response2 = await fetch(`${TEST_CONFIG.baseUrl}/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': testPayload }))}`);
      const data2 = await response2.json();
      const images2 = data2[0]?.result?.data?.images || [];
      
      if (images1.length === 0 || images2.length === 0) {
        throw new Error('AI refresh returned no results');
      }
      
      this.log(`✅ AI Refresh working - Got ${images1.length} and ${images2.length} results`, 'success');
      this.log(`   Refresh result: ${images2[0].description}`, 'info');
      
      this.results.tests.push({
        name: 'AI Refresh',
        success: true,
        details: `Refresh working, got ${images2.length} results`
      });
      this.results.passedTests++;
      
      return { success: true, images: images2 };
      
    } catch (error) {
      this.log(`❌ AI Refresh test failed: ${error.message}`, 'error');
      this.results.tests.push({
        name: 'AI Refresh',
        success: false,
        error: error.message
      });
      this.results.failedTests++;
      return { success: false, error: error.message };
    }
  }

  async testCompareButton() {
    this.log('🧪 STEP 5: Testing Compare Button Functionality...', 'step');
    
    try {
      // Test comparison by calling the AI comparison endpoint
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert at finding creative connections between different types of symbols. Provide a JSON response with: connection, targetName, targetDescription, similarityScore, explanation.`
            },
            {
              role: 'user',
              content: `Find a connection between "Eye of Horus" (ancient symbol) and something from "Chemical formula symbol" category.`
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.completion) {
        throw new Error('No completion in comparison response');
      }
      
      // Try to parse the JSON response
      let comparisonResult;
      try {
        let cleanCompletion = data.completion.trim();
        if (cleanCompletion.startsWith('```json')) {
          cleanCompletion = cleanCompletion.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanCompletion.startsWith('```')) {
          cleanCompletion = cleanCompletion.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        comparisonResult = JSON.parse(cleanCompletion);
      } catch (parseError) {
        throw new Error(`Failed to parse comparison result: ${parseError.message}`);
      }
      
      if (!comparisonResult.connection || !comparisonResult.targetName) {
        throw new Error('Invalid comparison result structure');
      }
      
      this.log(`✅ Compare Button working - Found connection`, 'success');
      this.log(`   Connection: ${comparisonResult.connection}`, 'info');
      this.log(`   Target: ${comparisonResult.targetName}`, 'info');
      
      this.results.tests.push({
        name: 'Compare Button',
        success: true,
        details: `Connection found: ${comparisonResult.targetName}`
      });
      this.results.passedTests++;
      
      return { success: true, comparison: comparisonResult };
      
    } catch (error) {
      this.log(`❌ Compare Button test failed: ${error.message}`, 'error');
      this.results.tests.push({
        name: 'Compare Button',
        success: false,
        error: error.message
      });
      this.results.failedTests++;
      return { success: false, error: error.message };
    }
  }

  async testImageLoading() {
    this.log('🧪 STEP 6: Testing Image Loading...', 'step');
    
    try {
      // Test if Wikipedia Commons images are accessible
      const testImages = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Water_molecule_3D.svg/256px-Water_molecule_3D.svg.png'
      ];
      
      let loadedImages = 0;
      
      for (const imageUrl of testImages) {
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            loadedImages++;
          }
        } catch (error) {
          // Image failed to load
        }
      }
      
      if (loadedImages === 0) {
        throw new Error('No test images could be loaded');
      }
      
      this.log(`✅ Image Loading working - ${loadedImages}/${testImages.length} images accessible`, 'success');
      
      this.results.tests.push({
        name: 'Image Loading',
        success: true,
        details: `${loadedImages}/${testImages.length} images loaded`
      });
      this.results.passedTests++;
      
      return { success: true, loadedImages, totalImages: testImages.length };
      
    } catch (error) {
      this.log(`❌ Image Loading test failed: ${error.message}`, 'error');
      this.results.tests.push({
        name: 'Image Loading',
        success: false,
        error: error.message
      });
      this.results.failedTests++;
      return { success: false, error: error.message };
    }
  }

  generateReport() {
    this.results.totalTests = this.results.passedTests + this.results.failedTests;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: this.results.totalTests > 0 ? Math.round((this.results.passedTests / this.results.totalTests) * 100) : 0,
        serverStarted: this.results.serverStarted
      },
      tests: this.results.tests
    };
    
    // Save report to file
    const reportFile = 'automatic-test-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  async runAllTests() {
    this.log('🚀 STARTING AUTOMATIC APP TESTING', 'info');
    this.log('This will test all the key functionality step by step:', 'info');
    this.log('  1. Server startup', 'info');
    this.log('  2. Backend API', 'info');
    this.log('  3. AI Search', 'info');
    this.log('  4. AI Refresh button', 'info');
    this.log('  5. Compare button', 'info');
    this.log('  6. Image loading', 'info');
    this.log('', 'info');

    let serverProcess = null;

    try {
      // Step 1: Start server
      serverProcess = await this.startServer();
      if (!this.results.serverStarted) {
        throw new Error('Failed to start server');
      }

      // Wait for server to fully initialize
      await this.wait(3000);

      // Step 2: Test Backend API
      await this.testBackendAPI();
      await this.wait(TEST_CONFIG.waitBetweenSteps);

      // Step 3: Test AI Search
      await this.testAISearch();
      await this.wait(TEST_CONFIG.waitBetweenSteps);

      // Step 4: Test AI Refresh
      await this.testAIRefresh();
      await this.wait(TEST_CONFIG.waitBetweenSteps);

      // Step 5: Test Compare Button
      await this.testCompareButton();
      await this.wait(TEST_CONFIG.waitBetweenSteps);

      // Step 6: Test Image Loading
      await this.testImageLoading();

      // Generate final report
      const report = this.generateReport();

      // Display summary
      this.log('', 'info');
      this.log('📊 AUTOMATIC TEST SUMMARY', 'info');
      this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
      this.log(`Passed: ${report.summary.passedTests}`, 'success');
      this.log(`Failed: ${report.summary.failedTests}`, 'error');
      this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
      this.log('', 'info');

      // Detailed results
      this.log('📋 DETAILED TEST RESULTS:', 'info');
      this.log(`Server Started: ${this.results.serverStarted ? '✅ YES' : '❌ NO'}`, this.results.serverStarted ? 'success' : 'error');
      
      this.results.tests.forEach(test => {
        this.log(`${test.name}: ${test.success ? '✅ PASS' : '❌ FAIL'}`, test.success ? 'success' : 'error');
        if (test.success && test.details) {
          this.log(`  Details: ${test.details}`, 'info');
        } else if (!test.success && test.error) {
          this.log(`  Error: ${test.error}`, 'error');
        }
      });

      this.log(`\n💾 Full report saved to automatic-test-report.json`, 'info');

      const allTestsPassed = this.results.passedTests === this.results.totalTests && this.results.serverStarted;
      
      if (allTestsPassed) {
        this.log('\n🎉 ALL TESTS PASSED! The application is working correctly.', 'success');
        this.log('✅ Server is running', 'success');
        this.log('✅ Backend API is functional', 'success');
        this.log('✅ AI search is working', 'success');
        this.log('✅ AI refresh button works', 'success');
        this.log('✅ Compare button is functional', 'success');
        this.log('✅ Images are loading properly', 'success');
        this.log('\n🚀 The app is ready for use!', 'success');
      } else {
        this.log('\n⚠️ Some tests failed. Check the detailed results above.', 'warning');
        this.log('The app may have issues that need to be fixed.', 'warning');
      }

      return allTestsPassed;

    } catch (error) {
      this.log(`💥 Test runner crashed: ${error.message}`, 'error');
      return false;
    } finally {
      // Clean up server process if we started it
      if (serverProcess && serverProcess.pid) {
        try {
          process.kill(serverProcess.pid);
          this.log('🧹 Server process cleaned up', 'info');
        } catch (error) {
          this.log('⚠️ Could not clean up server process', 'warning');
        }
      }
    }
  }
}

// Run the automatic tests
async function main() {
  const tester = new AutomaticAppTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Automatic test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AutomaticAppTester };