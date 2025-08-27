#!/usr/bin/env node

console.log('🚀 STARTING AUTOMATIC APP TESTING');
console.log('==================================');
console.log('');
console.log('This test will automatically:');
console.log('1. ✅ Start the development server');
console.log('2. 🧪 Test the backend API');
console.log('3. 🤖 Test AI search functionality');
console.log('4. 🔄 Test AI refresh button');
console.log('5. ⚡ Test compare button');
console.log('6. 🖼️  Test image loading');
console.log('');
console.log('Running tests now...');
console.log('');

// Import and run the automatic tester
const { AutomaticAppTester } = require('./test-app-automatically.js');

async function runTests() {
  const tester = new AutomaticAppTester();
  
  try {
    const success = await tester.runAllTests();
    
    console.log('');
    console.log('==================================');
    if (success) {
      console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
      console.log('');
      console.log('✅ Your app is working correctly:');
      console.log('  - Server starts properly');
      console.log('  - Backend API is functional');
      console.log('  - AI search finds symbols');
      console.log('  - AI refresh button works');
      console.log('  - Compare button creates connections');
      console.log('  - Images load properly');
      console.log('');
      console.log('🚀 The app is ready for use!');
      console.log('');
      console.log('📱 To use the app:');
      console.log('  1. Run: npm start');
      console.log('  2. Open the app in Expo Go');
      console.log('  3. Select two symbol categories');
      console.log('  4. Search for symbols');
      console.log('  5. Select a symbol');
      console.log('  6. Click compare to find connections');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log('');
      console.log('Check the detailed results above to see what needs to be fixed.');
      console.log('The test report has been saved to automatic-test-report.json');
    }
    console.log('==================================');
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

runTests();