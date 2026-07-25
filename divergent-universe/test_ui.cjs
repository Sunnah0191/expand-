const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting Playwright UI Verification...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    console.log('Page loaded.');

    // Hide WebGL Canvas to prevent GPU stall during screenshot
    try {
        await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
    } catch (e) {
        console.log('Error hiding canvas (it may not have loaded yet).');
    }

    // Wait for the login screen to be visible
    await page.waitForSelector('#login-screen');
    console.log('Login screen visible.');

    // Screenshot before login
    await page.screenshot({ path: path.join(__dirname, 'login-screen.png') });
    console.log('Saved login-screen.png');

    // Perform login to unlock the God Mode build menu
    console.log('Logging in as snk...');
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    console.log('Wait for login flash to finish...');
    await page.waitForTimeout(1500); // Wait for transition

    console.log('Opening build menu by pressing `1`...');
    await page.keyboard.press('1');

    // Wait for the build menu to become visible
    await page.waitForSelector('#build-catalog', { state: 'visible' });
    console.log('Build catalog visible.');

    await page.screenshot({ path: path.join(__dirname, 'build-catalog.png') });
    console.log('Saved build-catalog.png');

    console.log('All tests passed.');
  } catch (error) {
    console.error('UI verification failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
