#!/usr/bin/env node

// Quick test runner for AI search functionality
const { spawn } = require('child_process');

console.log('🚀 Running AI Search Functionality Tests');
console.log('=' .repeat(50));

async function runTest(testFile, testName) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${testName}...`);
    
    const testProcess = spawn('node', [testFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} PASSED`);
        resolve(true);
      } else {
        console.log(`❌ ${testName} FAILED`);
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      console.log(`❌ ${testName} ERROR: ${error.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const tests = [
    { file: 'test-fixes-simple.js', name: 'Simple AI Search Test' },
    { file: 'test-complete-flow.js', name: 'Complete User Flow Test' }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const passed = await runTest(test.file, test.name);
    if (passed) passedTests++;
  }
  
  console.log('\n📊 FINAL RESULTS');
  console.log('=' .repeat(30));
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${tests.length - passedTests}`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! AI search functionality is working correctly.');
    console.log('✅ The app is ready for use on iOS and web.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the output above.');
  }
  
  process.exit(passedTests === tests.length ? 0 : 1);
}

main().catch(console.error);