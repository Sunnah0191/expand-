const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
    console.log('Starting preview server...');
    const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], { cwd: __dirname, shell: true });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('http://localhost:4173');
        await page.waitForTimeout(2000); // Wait for initial render

        console.log('Testing login...');
        await page.evaluate(() => {
            document.getElementById('username').value = 'snk';
            document.getElementById('password').value = 'snk001';
            document.getElementById('login-btn').click();
        });

        await page.waitForTimeout(2500);

        console.log('Testing catalog toggle with ` ...');
        await page.keyboard.press('`');
        await page.waitForTimeout(500);

        let catalogDisplay = await page.evaluate(() => document.getElementById('build-catalog').style.display);
        if (catalogDisplay === 'block') {
            console.log('✅ Catalog opened successfully with ` key.');
        } else {
            console.error('❌ Catalog failed to open with ` key. Display:', catalogDisplay);
        }

        console.log('Testing catalog toggle with simulated `ё` key event...');
        // Simulate a keydown event for 'ё'
        await page.evaluate(() => {
            const event = new KeyboardEvent('keydown', { key: 'ё' });
            window.dispatchEvent(event);
        });
        await page.waitForTimeout(500);

        catalogDisplay = await page.evaluate(() => document.getElementById('build-catalog').style.display);
        if (catalogDisplay === 'none') {
            console.log('✅ Catalog closed successfully with ё key event.');
        } else {
            console.error('❌ Catalog failed to close with ё key event. Display:', catalogDisplay);
        }

        // Simulate a keydown event for 'Ё'
        await page.evaluate(() => {
            const event = new KeyboardEvent('keydown', { key: 'Ё' });
            window.dispatchEvent(event);
        });
        await page.waitForTimeout(500);

        catalogDisplay = await page.evaluate(() => document.getElementById('build-catalog').style.display);
        if (catalogDisplay === 'block') {
            console.log('✅ Catalog opened successfully with Ё key event.');
        } else {
            console.error('❌ Catalog failed to open with Ё key event. Display:', catalogDisplay);
        }

        await browser.close();
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        server.kill();
        process.exit(0);
    }
})();
