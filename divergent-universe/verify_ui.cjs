const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Start dev server in the background and wait a bit
  // Since we already ran build, we can just use a simple server or just start vite dev
  // But wait, the task is to write a script that runs and screenshots. Let's do it right.
  // We'll use the live preview instructions if needed, or just start vite dev using python.
  // Actually, we can run `npm run dev` in bash, wait for it, and then run this script.
  // Let's rewrite this script to assume a server is running at http://localhost:5173

  try {
      await page.goto('http://localhost:5173');

      // Wait for UI to load
      await page.waitForTimeout(2000);

      // Hide canvas to avoid GPU stalls
      await page.evaluate(() => {
          if(document.querySelector('canvas')) {
              document.querySelector('canvas').style.display = 'none';
          }
      });

      // Screenshot login screen
      await page.screenshot({ path: 'login_screen.png' });

      // Perform login
      await page.evaluate(() => {
          document.getElementById('username').value = 'snk';
          document.getElementById('password').value = 'snk001';
          document.getElementById('login-btn').click();
      });

      // Wait for transition and flash effect
      await page.waitForTimeout(2000);

      // Open build catalog by simulating '`' keypress or by directly calling the UI logic
      // The memory suggests page.keyboard.press() may fail for non-standard characters, but standard '`' is fine.
      await page.keyboard.press('`');

      // Wait for menu animation
      await page.waitForTimeout(1000);

      // Screenshot build catalog
      await page.screenshot({ path: 'build_catalog.png' });

      console.log('Verification screenshots captured successfully.');
  } catch (error) {
      console.error('Error during Playwright verification:', error);
  } finally {
      await browser.close();
  }
})();
