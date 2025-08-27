#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('curl -s http://localhost:8081/api/trpc/example.hi', (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting development server...', 'cyan');
    
    const server = spawn('bun', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let serverReady = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost:8081')) {
        if (!serverReady) {
          serverReady = true;
          log('✅ Server is ready!', 'green');
          resolve(server);
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost:8081')) {
        if (!serverReady) {
          serverReady = true;
          log('✅ Server is ready!', 'green');
          resolve(server);
        }
      }
    });
    
    server.on('error', (error) => {
      log(`❌ Server error: ${error.message}`, 'red');
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        log('⏰ Server startup timeout', 'yellow');
        resolve(server); // Still resolve, maybe server is running
      }
    }, 30000);
  });
}

function runTests() {
  return new Promise((resolve, reject) => {
    log('🧪 Running comprehensive AI search tests...', 'cyan');
    
    const testProcess = spawn('node', ['test-ai-search-comprehensive.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log('✅ All tests completed successfully!', 'green');
        resolve(true);
      } else {
        log(`❌ Tests failed with exit code: ${code}`, 'red');
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      log(`❌ Test error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function main() {
  log('🎯 Starting Comprehensive AI Search Test Suite', 'bright');
  log('=' .repeat(50), 'blue');
  
  let server = null;
  let serverWasRunning = false;
  
  try {
    // Check if server is already running
    serverWasRunning = await checkServerRunning();
    
    if (serverWasRunning) {
      log('✅ Server is already running', 'green');
    } else {
      // Start the server
      server = await startServer();
      
      // Wait a bit for server to fully initialize
      log('⏳ Waiting for server to initialize...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Double-check server is responding
      const isRunning = await checkServerRunning();
      if (!isRunning) {
        throw new Error('Server failed to start properly');
      }
    }
    
    // Run the tests
    const testsPassed = await runTests();
    
    if (testsPassed) {
      log('\n🎉 All tests passed! AI search functionality is working correctly.', 'green');
      
      // Check if report was generated
      const reportPath = path.join(process.cwd(), 'ai-search-test-report.json');
      if (fs.existsSync(reportPath)) {
        log(`📄 Detailed test report available at: ${reportPath}`, 'cyan');
      }
    } else {
      log('\n⚠️ Some tests failed. Check the output above for details.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Clean up: kill server if we started it
    if (server && !serverWasRunning) {
      log('🛑 Stopping development server...', 'yellow');
      server.kill('SIGTERM');
      
      // Force kill after 5 seconds if it doesn't stop gracefully
      setTimeout(() => {
        if (!server.killed) {
          server.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 Test suite interrupted', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Test suite terminated', 'yellow');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});