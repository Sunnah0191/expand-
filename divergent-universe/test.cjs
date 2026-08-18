const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
    console.log("Starting test...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');

    console.log("Waiting for app load...");
    await page.waitForTimeout(2000);

    // Login logic as admin
    console.log("Logging in as snk/snk001...");
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    await page.waitForTimeout(1500);

    // Open Build Menu using '1'
    console.log("Opening build menu...");
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);

    // Verify UI Structure
    console.log("Verifying UI categories...");
    const buildCatalog = await page.locator('#build-catalog');
    const isVisible = await buildCatalog.isVisible();
    assert.strictEqual(isVisible, true, "Build catalog is not visible");

    const landscapeText = await page.locator('.catalog-category:nth-child(1) h3').textContent();
    assert.strictEqual(landscapeText.trim(), 'Ландшафт');

    const architectureText = await page.locator('.catalog-category:nth-child(2) h3').textContent();
    assert.strictEqual(architectureText.trim(), 'Архитектура WuWa');

    const blocksText = await page.locator('.catalog-category:nth-child(3) h3').textContent();
    assert.strictEqual(blocksText.trim(), 'Конструктор (Блоки)');

    console.log("Selecting block-neon...");
    await page.evaluate(() => {
        document.querySelector('.catalog-item[data-type="block-neon"]').click();
    });

    await page.waitForTimeout(500);

    console.log("Verifying selection state...");
    const selectedClass = await page.evaluate(() => {
        return document.querySelector('.catalog-item[data-type="block-neon"]').classList.contains('selected');
    });
    assert.strictEqual(selectedClass, true, "block-neon was not selected");

    console.log("Test passed!");
    await browser.close();
})();