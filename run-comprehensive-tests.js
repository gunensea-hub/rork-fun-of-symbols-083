#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import our test modules
const { AISearchTester } = require('./test-ai-search-complete.js');
const { AISearchDemo } = require('./video-demo-ai-search.js');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      serverStarted: false,
      apiTests: null,
      demoTests: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'demo': '🎬',
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
    this.log('Checking if server is already running...', 'info');
    
    const isRunning = await this.checkServerStatus();
    if (isRunning) {
      this.log('✅ Server is already running on port 8081', 'success');
      this.results.serverStarted = true;
      return true;
    }

    this.log('Starting development server...', 'info');
    
    try {
      // Start the server in the background
      const serverProcess = spawn('npm', ['start'], {
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

  async runAPITests() {
    this.log('🧪 Running API Tests...', 'test');
    
    try {
      const tester = new AISearchTester();
      const success = await tester.runAllTests();
      
      this.results.apiTests = {
        success,
        details: 'API tests completed'
      };
      
      if (success) {
        this.log('✅ All API tests passed!', 'success');
        this.results.passedTests += 1;
      } else {
        this.log('❌ Some API tests failed', 'error');
        this.results.failedTests += 1;
      }
      
      this.results.totalTests += 1;
      return success;
      
    } catch (error) {
      this.log(`❌ API tests crashed: ${error.message}`, 'error');
      this.results.apiTests = {
        success: false,
        error: error.message
      };
      this.results.failedTests += 1;
      this.results.totalTests += 1;
      return false;
    }
  }

  async runDemoTests() {
    this.log('🎬 Running Demo Tests...', 'demo');
    
    try {
      const demo = new AISearchDemo();
      const success = await demo.runDemo();
      
      this.results.demoTests = {
        success,
        details: 'Demo tests completed'
      };
      
      if (success) {
        this.log('✅ Demo tests passed!', 'success');
        this.results.passedTests += 1;
      } else {
        this.log('❌ Demo tests failed', 'error');
        this.results.failedTests += 1;
      }
      
      this.results.totalTests += 1;
      return success;
      
    } catch (error) {
      this.log(`❌ Demo tests crashed: ${error.message}`, 'error');
      this.results.demoTests = {
        success: false,
        error: error.message
      };
      this.results.failedTests += 1;
      this.results.totalTests += 1;
      return false;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: this.results.totalTests > 0 ? Math.round((this.results.passedTests / this.results.totalTests) * 100) : 0
      },
      details: {
        serverStarted: this.results.serverStarted,
        apiTests: this.results.apiTests,
        demoTests: this.results.demoTests
      }
    };

    // Save report to file
    const reportFile = 'comprehensive-test-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive AI Search Tests...', 'info');
    this.log('📋 This will test:', 'info');
    this.log('  - Backend API functionality', 'info');
    this.log('  - AI image search and generation', 'info');
    this.log('  - Frontend UI interactions', 'info');
    this.log('  - End-to-end user workflows', 'info');
    this.log('', 'info');

    let serverProcess = null;

    try {
      // Step 1: Start server
      serverProcess = await this.startServer();
      if (!this.results.serverStarted) {
        throw new Error('Failed to start server');
      }

      // Wait a bit for server to fully initialize
      await this.wait(3000);

      // Step 2: Run API tests
      await this.runAPITests();

      // Step 3: Run demo tests
      await this.runDemoTests();

      // Generate final report
      const report = this.generateReport();

      // Display summary
      this.log('', 'info');
      this.log('📊 COMPREHENSIVE TEST SUMMARY', 'info');
      this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
      this.log(`Passed: ${report.summary.passedTests}`, 'success');
      this.log(`Failed: ${report.summary.failedTests}`, 'error');
      this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
      this.log('', 'info');

      // Detailed results
      this.log('📋 DETAILED RESULTS:', 'info');
      this.log(`Server Started: ${this.results.serverStarted ? '✅ YES' : '❌ NO'}`, this.results.serverStarted ? 'success' : 'error');
      this.log(`API Tests: ${this.results.apiTests?.success ? '✅ PASS' : '❌ FAIL'}`, this.results.apiTests?.success ? 'success' : 'error');
      this.log(`Demo Tests: ${this.results.demoTests?.success ? '✅ PASS' : '❌ FAIL'}`, this.results.demoTests?.success ? 'success' : 'error');

      if (this.results.apiTests?.error) {
        this.log(`  API Error: ${this.results.apiTests.error}`, 'error');
      }
      if (this.results.demoTests?.error) {
        this.log(`  Demo Error: ${this.results.demoTests.error}`, 'error');
      }

      this.log(`\\n💾 Full report saved to comprehensive-test-report.json`, 'info');

      const allTestsPassed = this.results.passedTests === this.results.totalTests && this.results.serverStarted;
      
      if (allTestsPassed) {
        this.log('\\n🎉 ALL TESTS PASSED! AI search functionality is working correctly.', 'success');
        this.log('✅ Backend API is functional', 'success');
        this.log('✅ AI image search and generation working', 'success');
        this.log('✅ Frontend UI interactions working', 'success');
        this.log('✅ End-to-end workflows functional', 'success');
      } else {
        this.log('\\n⚠️ Some tests failed. Check the detailed results above.', 'warning');
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

// Run the comprehensive tests
async function main() {
  const runner = new ComprehensiveTestRunner();
  
  try {
    const success = await runner.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComprehensiveTestRunner };