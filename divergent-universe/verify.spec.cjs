const { test, expect } = require('@playwright/test');

test('verify translations and layout', async ({ page }) => {
  await page.goto('http://localhost:4173');

  // Hide canvas to avoid GPU stalls
  await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");

  // Screenshot login screen
  await page.screenshot({ path: 'login-screen.png' });

  // Login
  await page.fill('#username', 'snk');
  await page.fill('#password', 'snk001');
  await page.click('#login-btn', { force: true });

  // Wait for login transition
  await page.waitForTimeout(1500);

  // Open build catalog
  await page.keyboard.press('1');
  await page.waitForSelector('#build-catalog', { state: 'visible' });

  // Screenshot build catalog
  await page.screenshot({ path: 'build-catalog.png' });
});
