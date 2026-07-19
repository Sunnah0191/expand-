const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173');

  console.log('Waiting for load...');
  await page.waitForTimeout(2000);

  // Take screenshot of login screen
  await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
  await page.screenshot({ path: 'login_screen.png' });
  console.log('Saved login_screen.png');

  // Login as God
  console.log('Logging in...');
  await page.evaluate(() => {
    document.getElementById('username').value = 'snk';
    document.getElementById('password').value = 'snk001';
    document.getElementById('login-btn').click();
  });

  console.log('Waiting for God mode transition...');
  await page.waitForTimeout(1000);

  // Open Catalog
  console.log('Opening catalog...');
  await page.keyboard.press('1');

  await page.waitForTimeout(500);

  // Take screenshot of catalog
  await page.screenshot({ path: 'catalog_screen.png' });
  console.log('Saved catalog_screen.png');

  await browser.close();
})();
