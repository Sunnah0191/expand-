const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000); // Wait for Three.js init

    // Test login
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    await page.waitForTimeout(1500); // Wait for flash transition

    // Toggle catalog
    await page.keyboard.press('1');
    await page.waitForTimeout(500);

    // Hide canvas to avoid GPU stalls in screenshot
    await page.evaluate(() => {
        if(document.querySelector('canvas')) {
            document.querySelector('canvas').style.display = 'none';
        }
    });

    await page.screenshot({ path: 'catalog-test.png' });
    console.log('Screenshot saved to catalog-test.png');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
