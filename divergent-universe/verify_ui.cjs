const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Navigating to local server...");
    await page.goto('http://localhost:3000');

    // Wait for the login screen to appear
    await page.waitForSelector('#login-screen');

    console.log("Checking Russian translations in UI...");
    const loginHeader = await page.evaluate("document.querySelector('h2').innerText");
    console.log("Header text:", loginHeader);

    const userPlaceholder = await page.evaluate("document.getElementById('username').placeholder");
    console.log("Username placeholder:", userPlaceholder);

    const passPlaceholder = await page.evaluate("document.getElementById('password').placeholder");
    console.log("Password placeholder:", passPlaceholder);

    const btnText = await page.evaluate("document.getElementById('login-btn').innerText");
    console.log("Button text:", btnText);

    console.log("Logging in as snk...");
    // Use page.evaluate because of canvas z-index / interception issues
    await page.evaluate("document.getElementById('username').value = 'snk'");
    await page.evaluate("document.getElementById('password').value = 'snk001'");
    await page.evaluate("document.getElementById('login-btn').click()");

    // Wait for UI Layer to show
    await page.waitForTimeout(2000); // give it time to animate and fade out login

    const uiLayerDisplay = await page.evaluate("document.getElementById('ui-layer').style.display");
    console.log("UI Layer display property:", uiLayerDisplay);

    console.log("Toggling Build Catalog...");
    // Need to send the key event that BuildMenu.js is listening to
    await page.keyboard.press('`');
    await page.waitForTimeout(500);

    const buildCatalogDisplay = await page.evaluate("document.getElementById('build-catalog').style.display");
    console.log("Build Catalog display property:", buildCatalogDisplay);

    console.log("Checking Catalog Categories...");
    const categories = await page.evaluate("Array.from(document.querySelectorAll('.catalog-category h3')).map(e => e.innerText)");
    console.log("Categories found:", categories);

    await browser.close();
    console.log("Verification complete.");
})();
