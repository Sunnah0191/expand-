const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');

  // Wait a moment for Vite and Three.js to load
  await new Promise(r => setTimeout(r, 2000));

  // Hide canvas to avoid GPU stall reading pixels, as noted in memory
  await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");

  // Take screenshot of login screen
  await page.screenshot({ path: 'login_screen.png' });

  // Test admin login using snk/snk001
  await page.evaluate(() => {
    document.getElementById('username').value = 'snk';
    document.getElementById('password').value = 'snk001';
    document.getElementById('login-btn').click();
  });

  // Wait a moment for login animation and God mode UI
  await new Promise(r => setTimeout(r, 1500));

  // Simulate pressing '`' to open the catalog (which is mapped the same way in our event listener)
  await page.keyboard.press('`');
  await new Promise(r => setTimeout(r, 500));

  // Screenshot the catalog
  await page.screenshot({ path: 'catalog_screen.png' });

  await browser.close();
})();
