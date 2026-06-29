const { test, expect } = require('@playwright/test');

test('verify ui changes', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Hide canvas to avoid GPU stall
    await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
    await page.screenshot({ path: 'login-screen.png' });
});
