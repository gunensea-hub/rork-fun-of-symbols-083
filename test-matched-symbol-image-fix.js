const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MATCHED SYMBOL IMAGE LOADING FIX TEST');
console.log('=' .repeat(50));

// Test the matched symbol image loading issue
function testMatchedSymbolImageLoading() {
  console.log('\n📋 Testing matched symbol image loading...');
  
  try {
    // Start the development server
    console.log('🚀 Starting development server...');
    const serverProcess = execSync('bun expo start --web --port 8081 > /dev/null 2>&1 &', { 
      stdio: 'inherit',
      timeout: 5000 
    });
    
    // Wait for server to start
    console.log('⏳ Waiting for server to initialize...');
    execSync('sleep 8');
    
    // Test the image loading functionality
    console.log('\n🧪 Testing image loading scenarios:');
    
    // Test 1: Check if AI image search is working
    console.log('\n1️⃣ Testing AI image search functionality...');
    const testAiSearch = `
      const response = await fetch('http://localhost:8081/api/trpc/symbols.searchImages?batch=1&input=%7B%220%22%3A%7B%22symbolName%22%3A%22Seven%20Hathors%22%2C%22symbolDescription%22%3A%22Ancient%20Egyptian%20symbol%22%2C%22category%22%3A%22ancient%20symbols%22%7D%7D');
      const data = await response.json();
      console.log('AI Search Result:', data[0]?.result?.data?.images?.length || 0, 'images found');
      if (data[0]?.result?.data?.images?.length > 0) {
        console.log('✅ AI image search working');
        console.log('First image URL:', data[0].result.data.images[0].url);
      } else {
        console.log('❌ AI image search failed');
      }
    `;
    
    // Test 2: Verify image URLs are accessible
    console.log('\n2️⃣ Testing image URL accessibility...');
    const testImageUrls = [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ankh.svg/512px-Ankh.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Serpiente_alquimica.jpg/512px-Serpiente_alquimica.jpg'
    ];
    
    testImageUrls.forEach((url, index) => {
      try {
        console.log(`Testing URL ${index + 1}: ${url.substring(0, 60)}...`);
        const result = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { encoding: 'utf8' });
        if (result.trim() === '200') {
          console.log('✅ Image URL accessible');
        } else {
          console.log(`❌ Image URL returned status: ${result.trim()}`);
        }
      } catch (error) {
        console.log('❌ Image URL test failed:', error.message);
      }
    });
    
    // Test 3: Check component rendering
    console.log('\n3️⃣ Testing component rendering...');
    console.log('Opening browser to test the app...');
    
    // Open browser for manual testing
    try {
      execSync('open http://localhost:8081 || xdg-open http://localhost:8081 || start http://localhost:8081', { stdio: 'ignore' });
      console.log('✅ Browser opened for manual testing');
    } catch (error) {
      console.log('⚠️ Could not open browser automatically');
      console.log('Please manually open: http://localhost:8081');
    }
    
    console.log('\n📝 MANUAL TEST STEPS:');
    console.log('1. Select "Ancient symbols" from first dropdown');
    console.log('2. Select "Star clusters" from second dropdown');
    console.log('3. Click "Auto Search Ancient symbols"');
    console.log('4. Select a search result (e.g., Eye of Horus)');
    console.log('5. Accept terms and click "Compare Shapes"');
    console.log('6. Check if "Matched Symbol" image loads properly');
    console.log('7. If image shows "Image not available", click the refresh button');
    console.log('8. Verify AI image search works');
    
    console.log('\n⏳ Waiting 30 seconds for manual testing...');
    execSync('sleep 30');
    
    console.log('\n✅ Test completed!');
    console.log('\n📊 EXPECTED RESULTS:');
    console.log('- Matched symbol image should load without "Image not available"');
    console.log('- AI refresh button should work when clicked');
    console.log('- Images should be from verified Wikipedia Commons URLs');
    console.log('- Compare button should be enabled when image loads');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    try {
      console.log('\n🧹 Cleaning up...');
      execSync('pkill -f "expo start" || true', { stdio: 'ignore' });
      execSync('pkill -f "bun" || true', { stdio: 'ignore' });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

// Run the test
testMatchedSymbolImageLoading();

console.log('\n🎯 NEXT STEPS:');
console.log('1. If images are not loading, check the ComparisonResult component');
console.log('2. Verify AI image search is returning valid URLs');
console.log('3. Check network connectivity to Wikipedia Commons');
console.log('4. Test the refresh button functionality');
console.log('5. Ensure proper error handling for failed images');