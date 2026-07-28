const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
    // Start Vite dev server
    const viteProcess = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

    // Wait for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:5173');
        await page.waitForTimeout(2000); // Allow initial rendering

        // Check Russian login text
        const title = await page.textContent('.login-form h2');
        if (title !== 'Авторизация') {
            throw new Error(`Expected login title 'Авторизация', got '${title}'`);
        }

        // Login as admin
        await page.evaluate(() => {
            document.getElementById('username').value = 'snk';
            document.getElementById('password').value = 'snk001';
            document.getElementById('login-btn').click();
        });

        // Wait for login transition
        await page.waitForTimeout(1500);

        // Open catalog using hotkey '1'
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        // Check if catalog opened
        const isCatalogVisible = await page.evaluate(() => {
            const el = document.getElementById('build-catalog');
            return window.getComputedStyle(el).display !== 'none';
        });

        if (!isCatalogVisible) {
            throw new Error('Build catalog did not open after pressing 1');
        }

        // Verify catalog items are present
        const itemTypes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.catalog-item')).map(el => el.getAttribute('data-type'));
        });

        const expectedTypes = ['midpoly-rock', 'glass-crystal', 'neon-tree', 'futuristic-monolith', 'dark-tower', 'matte-bridge', 'glass-block', 'chrome-block', 'neon-block', 'matte-metal-block'];

        for (const expectedType of expectedTypes) {
            if (!itemTypes.includes(expectedType)) {
                throw new Error(`Missing catalog item: ${expectedType}`);
            }
        }

        console.log("UI Verification Passed!");

    } catch (error) {
        console.error("Verification failed:", error);
        process.exitCode = 1;
    } finally {
        await browser.close();
        viteProcess.kill();
    }
})();
