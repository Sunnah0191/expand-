const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Connecting to localhost:5173...");
    await page.goto('http://localhost:5173');

    // Hide canvas to avoid GPU stall
    try {
        await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
    } catch(e) {
        console.log("Canvas not ready to hide.");
    }

    console.log("Waiting for login screen...");
    await page.waitForSelector('#login-screen', { timeout: 10000 });

    console.log("Typing credentials...");
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    console.log("Waiting for God Mode Flash to disappear...");
    await page.waitForTimeout(1500);

    console.log("Pressing 'ё' to open catalog...");
    await page.keyboard.press('`'); // Use backtick as fallback since 'ё' is non-standard

    // Take screenshot of catalog
    await page.waitForSelector('#build-catalog', { state: 'visible', timeout: 5000 });
    console.log("Catalog is visible. Taking screenshot...");
    await page.screenshot({ path: 'screenshot.png' });

    console.log("Success! screenshot.png created.");

    await browser.close();
})();
