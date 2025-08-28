#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('🧪 Running Image Loading Tests...');
  execSync('node test-image-loading-fix.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}