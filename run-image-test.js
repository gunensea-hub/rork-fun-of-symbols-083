#!/usr/bin/env node

const { runImageLoadingTest } = require('./test-image-loading-comprehensive');

console.log('🚀 Running Image Loading Test...');
console.log('=' .repeat(50));

try {
  const success = runImageLoadingTest();
  
  if (success) {
    console.log('\n✅ All image loading tests passed!');
    console.log('\n🎉 Image loading system is fully functional!');
    console.log('\n📱 Ready to test in the app:');
    console.log('   • Images should load automatically');
    console.log('   • AI verification works on refresh');
    console.log('   • Compare button appears when images load');
    console.log('   • Fallback mechanisms handle errors');
  } else {
    console.log('\n❌ Some tests failed. Check the output above.');
  }
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}