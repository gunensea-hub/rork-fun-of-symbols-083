const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Video demo configuration
const DEMO_CONFIG = {
  testSymbol: 'Eye of Horus',
  testCategory: 'Ancient symbols',
  demoSteps: [
    'Launch app and show homepage',
    'Select "Ancient symbols" from first dropdown',
    'Click "Auto Search Ancient symbols" button',
    'Wait for search results to appear',
    'Select "Eye of Horus" result from the list',
    'Verify image loads or shows placeholder',
    'Click the refresh button (↻) to trigger AI verification',
    'Wait for AI verification to complete',
    'Verify AI-generated or verified image appears',
    'Click "🤖 AI Verify & Generate" if image fails',
    'Show final working state with proper image'
  ],
  recordingDuration: 60000, // 60 seconds
  serverPort: 8081
};

class VideoDemoRecorder {
  constructor() {
    this.startTime = Date.now();
    this.serverProcess = null;
    this.isRecording = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`[${elapsed}s] [${type.toUpperCase()}] ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startExpoServer() {
    this.log('🚀 Starting Expo development server...', 'demo');
    
    try {
      // Kill any existing processes on the port
      try {
        execSync(`lsof -ti:${DEMO_CONFIG.serverPort} | xargs kill -9`, { stdio: 'ignore' });
        await this.delay(2000);
      } catch (e) {
        // Port might not be in use, continue
      }

      // Start Expo server
      this.serverProcess = spawn('npx', ['expo', 'start', '--web', '--port', DEMO_CONFIG.serverPort.toString()], {
        stdio: 'pipe',
        detached: false
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Web') || output.includes('Metro')) {
          this.log(`📱 Expo: ${output.trim()}`);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('Warning') && !error.includes('ExpoWarning')) {
          this.log(`⚠️ Expo Error: ${error.trim()}`, 'warn');
        }
      });

      // Wait for server to be ready
      this.log('⏳ Waiting for Expo server to start...');
      await this.delay(15000);

      // Test if server is responding
      try {
        const response = await fetch(`http://localhost:${DEMO_CONFIG.serverPort}`);
        if (response.ok) {
          this.log('✅ Expo server is ready!');
          return true;
        }
      } catch (e) {
        this.log('⚠️ Server might still be starting...', 'warn');
        await this.delay(5000);
      }

      return true;
    } catch (error) {
      this.log(`❌ Failed to start Expo server: ${error.message}`, 'error');
      return false;
    }
  }

  async stopExpoServer() {
    if (this.serverProcess) {
      this.log('🛑 Stopping Expo server...');
      this.serverProcess.kill('SIGTERM');
      await this.delay(2000);
      
      // Force kill if still running
      try {
        execSync(`lsof -ti:${DEMO_CONFIG.serverPort} | xargs kill -9`, { stdio: 'ignore' });
      } catch (e) {
        // Already stopped
      }
    }
  }

  async testAIEndpoints() {
    this.log('🧪 Testing AI endpoints before demo...', 'test');
    
    const tests = [
      {
        name: 'AI Text Search',
        url: 'https://toolkit.rork.com/text/llm/',
        payload: {
          messages: [
            {
              role: 'system',
              content: 'You are a symbol expert. Return a JSON with verified Wikipedia Commons URLs for ancient symbols.'
            },
            {
              role: 'user', 
              content: 'Find the Eye of Horus symbol with Wikipedia Commons URL'
            }
          ]
        }
      },
      {
        name: 'AI Image Generation',
        url: 'https://toolkit.rork.com/images/generate/',
        payload: {
          prompt: 'Create a clear illustration of the Eye of Horus ancient Egyptian symbol',
          size: '1024x1024'
        }
      }
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        this.log(`Testing ${test.name}...`);
        const response = await fetch(test.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });
        
        if (response.ok) {
          const data = await response.json();
          results[test.name] = { success: true, data };
          this.log(`✅ ${test.name} working`);
        } else {
          results[test.name] = { success: false, status: response.status };
          this.log(`❌ ${test.name} failed: ${response.status}`, 'error');
        }
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
        this.log(`❌ ${test.name} error: ${error.message}`, 'error');
      }
    }
    
    return results;
  }

  async recordDemo() {
    this.log('🎬 Starting video demo recording...', 'demo');
    
    const demoScript = `
# AI Verification Demo Script
# Testing Eye of Horus symbol search and AI verification

## Demo Steps:
${DEMO_CONFIG.demoSteps.map((step, i) => `${i + 1}. ${step}`).join('\\n')}

## Expected Behavior:
- App should load successfully
- Search should return Eye of Horus results
- Image should load or show AI verification options
- AI refresh button should work
- AI verification should provide working images
- Final state should show proper Eye of Horus image

## URLs to Test:
- App: http://localhost:${DEMO_CONFIG.serverPort}
- Expected Image: https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Eye_of_Horus_bw.svg/512px-Eye_of_Horus_bw.svg.png

## Test Instructions:
1. Open browser to http://localhost:${DEMO_CONFIG.serverPort}
2. Follow the demo steps above
3. Verify each step works as expected
4. Test AI verification buttons if images fail to load
5. Confirm final working state

## Troubleshooting:
- If images don't load, click the refresh button (↻)
- If still no images, click "🤖 AI Verify & Generate"
- Check browser console for any errors
- Verify network connectivity to AI endpoints
`;

    // Save demo script
    fs.writeFileSync('demo-script.md', demoScript);
    this.log('📝 Demo script saved to demo-script.md');

    // Create a simple HTML test page for manual testing
    const testPage = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Verification Demo Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .step { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; }
        .completed { border-left-color: #28a745; background: #f8fff8; }
        .failed { border-left-color: #dc3545; background: #fff8f8; }
        button { padding: 10px 20px; margin: 5px; }
        .app-frame { width: 100%; height: 600px; border: 1px solid #ccc; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🎬 AI Verification Demo</h1>
    <p>Testing Eye of Horus symbol search and AI verification functionality</p>
    
    <h2>Demo Steps:</h2>
    <div id="steps">
        ${DEMO_CONFIG.demoSteps.map((step, i) => 
          `<div class="step" id="step-${i}">
            <strong>Step ${i + 1}:</strong> ${step}
            <button onclick="markCompleted(${i})">✅ Completed</button>
            <button onclick="markFailed(${i})">❌ Failed</button>
          </div>`
        ).join('')}
    </div>
    
    <h2>App Preview:</h2>
    <iframe class="app-frame" src="http://localhost:${DEMO_CONFIG.serverPort}" title="App Demo"></iframe>
    
    <h2>Test Results:</h2>
    <div id="results"></div>
    
    <script>
        let completedSteps = 0;
        let failedSteps = 0;
        
        function markCompleted(stepIndex) {
            const step = document.getElementById('step-' + stepIndex);
            step.classList.add('completed');
            step.classList.remove('failed');
            updateResults();
        }
        
        function markFailed(stepIndex) {
            const step = document.getElementById('step-' + stepIndex);
            step.classList.add('failed');
            step.classList.remove('completed');
            updateResults();
        }
        
        function updateResults() {
            const completed = document.querySelectorAll('.completed').length;
            const failed = document.querySelectorAll('.failed').length;
            const total = ${DEMO_CONFIG.demoSteps.length};
            
            document.getElementById('results').innerHTML = 
                '<p><strong>Progress:</strong> ' + completed + '/' + total + ' steps completed</p>' +
                '<p><strong>Failed:</strong> ' + failed + ' steps</p>' +
                '<p><strong>Status:</strong> ' + (failed === 0 && completed === total ? '✅ All tests passed!' : '⏳ Testing in progress...') + '</p>';
        }
        
        // Initialize results
        updateResults();
    </script>
</body>
</html>`;

    fs.writeFileSync('demo-test.html', testPage);
    this.log('🌐 Demo test page saved to demo-test.html');

    return {
      success: true,
      demoScript: 'demo-script.md',
      testPage: 'demo-test.html',
      appUrl: `http://localhost:${DEMO_CONFIG.serverPort}`,
      steps: DEMO_CONFIG.demoSteps
    };
  }

  async runFullDemo() {
    this.log('🎯 Starting full AI verification demo...', 'demo');
    
    try {
      // Test AI endpoints first
      this.log('1️⃣ Testing AI endpoints...');
      const endpointResults = await this.testAIEndpoints();
      
      const workingEndpoints = Object.values(endpointResults).filter(r => r.success).length;
      this.log(`📊 AI Endpoints: ${workingEndpoints}/${Object.keys(endpointResults).length} working`);
      
      // Start Expo server
      this.log('2️⃣ Starting Expo server...');
      const serverStarted = await this.startExpoServer();
      
      if (!serverStarted) {
        throw new Error('Failed to start Expo server');
      }
      
      // Create demo materials
      this.log('3️⃣ Creating demo materials...');
      const demoMaterials = await this.recordDemo();
      
      // Final instructions
      this.log('\\n🎉 Demo setup complete!', 'demo');
      this.log('\\n📋 Next steps:');
      this.log('1. Open demo-test.html in your browser for guided testing');
      this.log(`2. Or directly visit: ${demoMaterials.appUrl}`);
      this.log('3. Follow the demo script in demo-script.md');
      this.log('4. Test the AI verification functionality');
      this.log('5. Mark steps as completed in the test page');
      
      this.log('\\n🔧 Manual Testing Instructions:');
      this.log('- Select "Ancient symbols" from dropdown');
      this.log('- Search for symbols');
      this.log('- Select "Eye of Horus" result');
      this.log('- Click refresh button (↻) if image does not load');
      this.log('- Click "🤖 AI Verify & Generate" for AI assistance');
      this.log('- Verify final image appears correctly');
      
      // Keep server running
      this.log('\\n⏳ Server will keep running for testing...');
      this.log('Press Ctrl+C to stop the server when done');
      
      return {
        success: true,
        endpointResults,
        demoMaterials,
        serverUrl: demoMaterials.appUrl
      };
      
    } catch (error) {
      this.log(`❌ Demo setup failed: ${error.message}`, 'error');
      await this.stopExpoServer();
      return { success: false, error: error.message };
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up demo resources...');
    await this.stopExpoServer();
    this.log('✅ Cleanup complete');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Shutting down demo...');
  const recorder = new VideoDemoRecorder();
  await recorder.cleanup();
  process.exit(0);
});

// Run the demo
async function main() {
  const recorder = new VideoDemoRecorder();
  
  try {
    const result = await recorder.runFullDemo();
    
    if (result.success) {
      // Keep the process alive to maintain the server
      process.stdin.resume();
    } else {
      console.error('❌ Demo failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Demo crashed:', error);
    await recorder.cleanup();
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VideoDemoRecorder, DEMO_CONFIG };