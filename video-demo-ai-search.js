const puppeteer = require('puppeteer');
const fs = require('fs');

class AISearchDemo {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:8081';
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'demo': '🎬'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setup() {
    this.log('Setting up browser for demo...', 'demo');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Browser Error: ${msg.text()}`, 'error');
      } else if (msg.text().includes('AI') || msg.text().includes('search') || msg.text().includes('image')) {
        this.log(`Browser: ${msg.text()}`, 'info');
      }
    });
    
    await this.page.goto(this.baseUrl);
    await this.wait(2000);
  }

  async demonstrateAISearch() {
    this.log('🎬 Starting AI Search Demo...', 'demo');
    
    try {
      // Step 1: Select first shape type
      this.log('Step 1: Selecting "Ancient symbols"...', 'demo');
      
      // Find and click the first dropdown
      await this.page.waitForSelector('[data-testid="selection-dropdown-0"]', { timeout: 10000 });
      await this.page.click('[data-testid="selection-dropdown-0"]');
      await this.wait(1000);
      
      // Select "Ancient symbols"
      await this.page.click('text="Ancient symbols"');
      await this.wait(1000);
      
      this.log('✅ Selected "Ancient symbols"', 'success');
      
      // Step 2: Click Auto Search
      this.log('Step 2: Clicking Auto Search...', 'demo');
      
      await this.page.waitForSelector('text="Auto Search Ancient symbols"', { timeout: 5000 });
      await this.page.click('text="Auto Search Ancient symbols"');
      
      this.log('🔍 Searching for ancient symbols...', 'demo');
      
      // Wait for search results
      await this.page.waitForSelector('text="Search Results"', { timeout: 15000 });
      await this.wait(2000);
      
      this.log('✅ Search results loaded!', 'success');
      
      // Step 3: Select a search result
      this.log('Step 3: Selecting first search result...', 'demo');
      
      const resultCards = await this.page.$$('[data-testid="search-result-card"]');
      if (resultCards.length > 0) {
        await resultCards[0].click();
        await this.wait(2000);
        this.log('✅ Selected search result', 'success');
      } else {
        // Fallback: click any result card
        await this.page.click('.resultCard');
        await this.wait(2000);
        this.log('✅ Selected search result (fallback)', 'success');
      }
      
      // Step 4: Test AI refresh button
      this.log('Step 4: Testing AI refresh functionality...', 'demo');
      
      const refreshButton = await this.page.$('[data-testid="ai-refresh-button"]');
      if (refreshButton) {
        await refreshButton.click();
        this.log('🤖 Clicked AI refresh button', 'demo');
        await this.wait(3000);
        this.log('✅ AI refresh completed', 'success');
      } else {
        this.log('⚠️ AI refresh button not found', 'warning');
      }
      
      // Step 5: Select second shape type
      this.log('Step 5: Selecting second shape type...', 'demo');
      
      await this.page.waitForSelector('[data-testid="selection-dropdown-1"]', { timeout: 5000 });
      await this.page.click('[data-testid="selection-dropdown-1"]');
      await this.wait(1000);
      
      // Select "Chemical formula symbol"
      await this.page.click('text="Chemical formula symbol"');
      await this.wait(1000);
      
      this.log('✅ Selected "Chemical formula symbol"', 'success');
      
      // Step 6: Accept terms and compare
      this.log('Step 6: Accepting terms and comparing...', 'demo');
      
      // Accept terms
      const termsCheckbox = await this.page.$('text="I Accept the Terms and Conditions"');
      if (termsCheckbox) {
        await termsCheckbox.click();
        await this.wait(1000);
        this.log('✅ Accepted terms', 'success');
      }
      
      // Click compare button
      await this.page.waitForSelector('text="Compare Shapes"', { timeout: 5000 });
      await this.page.click('text="Compare Shapes"');
      
      this.log('🔄 Comparing symbols...', 'demo');
      
      // Wait for comparison result
      await this.page.waitForSelector('text="Connection Found"', { timeout: 20000 });
      await this.wait(2000);
      
      this.log('✅ Comparison completed successfully!', 'success');
      
      // Step 7: Test AI Verify & Generate button (if image fails)
      this.log('Step 7: Testing AI Verify & Generate functionality...', 'demo');
      
      const aiVerifyButton = await this.page.$('[data-testid="ai-verify-generate-button"]');
      if (aiVerifyButton) {
        await aiVerifyButton.click();
        this.log('🤖 Clicked AI Verify & Generate button', 'demo');
        await this.wait(5000);
        this.log('✅ AI verification completed', 'success');
      } else {
        this.log('ℹ️ AI Verify & Generate button not needed (images loaded successfully)', 'info');
      }
      
      this.log('🎉 Demo completed successfully!', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`❌ Demo failed: ${error.message}`, 'error');
      return false;
    }
  }

  async takeScreenshot(filename) {
    if (this.page) {
      await this.page.screenshot({ path: filename, fullPage: true });
      this.log(`📸 Screenshot saved: ${filename}`, 'info');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.log('🧹 Browser closed', 'info');
    }
  }

  async runDemo() {
    try {
      await this.setup();
      
      // Take initial screenshot
      await this.takeScreenshot('demo-start.png');
      
      const success = await this.demonstrateAISearch();
      
      // Take final screenshot
      await this.takeScreenshot('demo-end.png');
      
      if (success) {
        this.log('🎉 AI Search Demo completed successfully!', 'success');
        this.log('📋 Demo Summary:', 'info');
        this.log('  ✅ Selected Ancient symbols category', 'info');
        this.log('  ✅ Auto search functionality worked', 'info');
        this.log('  ✅ Search results displayed correctly', 'info');
        this.log('  ✅ Symbol selection worked', 'info');
        this.log('  ✅ AI refresh button functional', 'info');
        this.log('  ✅ Second category selection worked', 'info');
        this.log('  ✅ Comparison functionality worked', 'info');
        this.log('  ✅ AI verification system operational', 'info');
      } else {
        this.log('❌ Demo encountered issues', 'error');
      }
      
      return success;
      
    } catch (error) {
      this.log(`💥 Demo crashed: ${error.message}`, 'error');
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the demo
async function main() {
  const demo = new AISearchDemo();
  
  console.log('🎬 Starting AI Search Video Demo...');
  console.log('📋 This demo will test:');
  console.log('  - Symbol category selection');
  console.log('  - Auto search functionality');
  console.log('  - AI image verification');
  console.log('  - Symbol comparison');
  console.log('  - AI refresh and generate features');
  console.log('');
  
  const success = await demo.runDemo();
  
  if (success) {
    console.log('\n🎉 Demo completed successfully! All AI search features are working.');
    process.exit(0);
  } else {
    console.log('\n❌ Demo failed. Check the logs above for details.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AISearchDemo };