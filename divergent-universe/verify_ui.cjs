const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log("Navigating to local dev server...");
    await page.goto('http://localhost:5173/');

    console.log("Waiting for rendering (Three.js and UI)...");
    await page.waitForTimeout(2000);

    // Login as 'snk'/'snk001'
    console.log("Entering credentials...");
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    await page.waitForTimeout(1000);

    console.log("Checking if HUD is visible (God Mode activated)...");
    const isHudVisible = await page.evaluate(() => {
        return !document.getElementById('hud-screen').classList.contains('hidden');
    });

    if (isHudVisible) {
        console.log("✅ God Mode successfully activated!");
    } else {
        console.error("❌ God Mode was NOT activated.");
        process.exit(1);
    }

    // Toggle catalog
    console.log("Pressing '1' to toggle building catalog...");
    // Use backquote standard key instead of non-standard 'Ё' to avoid Unknown Key error
    await page.keyboard.press('1');

    await page.waitForTimeout(500);

    const isCatalogVisible = await page.evaluate(() => {
        return !document.getElementById('catalog-screen').classList.contains('hidden');
    });

    if (isCatalogVisible) {
        console.log("✅ Catalog successfully opened!");
    } else {
        console.error("❌ Catalog was NOT opened.");
        process.exit(1);
    }

    // Avoid GPU stall when taking screenshot by hiding canvas
    await page.evaluate(() => {
        if(document.querySelector('canvas')) {
            document.querySelector('canvas').style.display = 'none';
        }
    });

    console.log("Taking screenshot of UI...");
    await page.screenshot({ path: 'verify_ui_state.png' });

    await browser.close();
    console.log("Test completed successfully.");
})();