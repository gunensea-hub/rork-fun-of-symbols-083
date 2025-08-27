#!/usr/bin/env node

console.log('🚀 Starting AI Search Tests...');
console.log('📋 Testing AI search functionality and compare button...');
console.log('');

// Test the backend API directly
async function testBackendAPI() {
  console.log('🧪 Testing Backend API...');
  
  try {
    const testPayload = {
      symbolName: 'Ancient symbols',
      symbolDescription: 'Find specific examples from the category: Ancient symbols',
      category: 'ancient symbols'
    };
    
    const response = await fetch(`http://localhost:8081/api/trpc/symbols.searchImages?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': testPayload }))}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data[0]?.result?.data?.images) {
      throw new Error('Invalid response structure');
    }
    
    const images = data[0].result.data.images;
    console.log(`✅ Backend API working - ${images.length} images returned`);
    console.log(`📋 Sample result: ${images[0]?.description || 'No description'}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Backend API failed: ${error.message}`);
    return false;
  }
}

// Test AI image generation
async function testAIGeneration() {
  console.log('🤖 Testing AI Image Generation...');
  
  try {
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a clear illustration of the Eye of Horus ancient Egyptian symbol',
        size: '1024x1024'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.image?.base64Data) {
      throw new Error('No image data returned');
    }
    
    console.log('✅ AI Image Generation working');
    return true;
    
  } catch (error) {
    console.log(`❌ AI Image Generation failed: ${error.message}`);
    return false;
  }
}

// Test AI text completion for comparison
async function testAIComparison() {
  console.log('🔄 Testing AI Comparison...');
  
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
            content: 'You are an expert at finding connections between symbols. Respond with valid JSON containing connection, targetName, and explanation fields.'
          },
          {
            role: 'user',
            content: 'Find a connection between the Eye of Horus (ancient symbol) and water molecule (chemical formula). Return JSON format.'
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.completion) {
      throw new Error('No completion returned');
    }
    
    console.log('✅ AI Comparison working');
    console.log(`📋 Sample response: ${data.completion.substring(0, 100)}...`);
    return true;
    
  } catch (error) {
    console.log(`❌ AI Comparison failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🔍 Running AI Search Tests...');
  console.log('');
  
  const results = {
    backend: await testBackendAPI(),
    aiGeneration: await testAIGeneration(),
    aiComparison: await testAIComparison()
  };
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('');
  console.log('📊 TEST SUMMARY:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('');
  
  console.log('📋 DETAILED RESULTS:');
  console.log(`Backend API: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AI Generation: ${results.aiGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AI Comparison: ${results.aiComparison ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ AI search functionality is working correctly');
    console.log('✅ Compare button should be functional');
    console.log('✅ AI image verification is operational');
    console.log('');
    console.log('🎬 You can now test the app manually:');
    console.log('1. Select "Ancient symbols" from first dropdown');
    console.log('2. Click "Auto Search Ancient symbols"');
    console.log('3. Select a search result');
    console.log('4. Select second category (e.g., "Chemical formula symbol")');
    console.log('5. Accept terms and click "Compare Shapes"');
    console.log('6. Test AI refresh button (↻) if needed');
    return true;
  } else {
    console.log('❌ Some tests failed. Check the results above.');
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner crashed:', error.message);
    process.exit(1);
  });