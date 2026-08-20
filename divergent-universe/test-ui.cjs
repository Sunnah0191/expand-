const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to app...');
    await page.goto('http://localhost:4173');
    await page.waitForTimeout(2000); // Wait for WebGL load

    console.log('Verifying Russian UI translation...');
    const heading = await page.evaluate(() => document.querySelector('.login-form h2').innerText);
    assert.strictEqual(heading, 'Авторизация', 'Heading should be translated');
    const usernamePlaceholder = await page.evaluate(() => document.querySelector('#username').placeholder);
    assert.strictEqual(usernamePlaceholder, 'Ник', 'Username placeholder should be translated');
    const passwordPlaceholder = await page.evaluate(() => document.querySelector('#password').placeholder);
    assert.strictEqual(passwordPlaceholder, 'Пароль', 'Password placeholder should be translated');

    console.log('Logging in as snk (God Mode)...');
    await page.evaluate(() => {
        document.querySelector('#username').value = 'snk';
        document.querySelector('#password').value = 'snk001';
        document.querySelector('#login-btn').click();
    });

    await page.waitForTimeout(4000); // Wait for login transition (timeout 1s) and explosion
    // Sometimes playwright is too fast, let's also wait for the element specifically
    await page.waitForSelector('#ui-layer', { state: 'visible', timeout: 5000 }).catch(e => console.log('ui-layer not visible within timeout'));

    console.log('Verifying God Mode unlock...');
    const uiDisplay = await page.evaluate(() => document.querySelector('#ui-layer').style.display);
    assert.strictEqual(uiDisplay, 'block', 'UI layer should be visible after God Mode login');

    console.log('Testing Build Menu toggle with `Ё` key...');
    await page.evaluate(() => {
        const event = new KeyboardEvent('keydown', { key: 'Ё' });
        window.dispatchEvent(event);
    });

    await page.waitForTimeout(500);
    const catalogDisplay = await page.evaluate(() => document.querySelector('#build-catalog').style.display);
    assert.strictEqual(catalogDisplay, 'block', 'Build catalog should be visible after pressing Ё');

    console.log('Verifying Build Menu Categories...');
    const categories = await page.evaluate(() => Array.from(document.querySelectorAll('.catalog-category')).map(el => el.innerText.trim()));
    assert.ok(categories.some(c => c.toLowerCase() === 'ландшафт'), 'Should have Landscape category');
    assert.ok(categories.some(c => c.toLowerCase() === 'архитектура wuwa'), 'Should have WuWa Architecture category');
    assert.ok(categories.some(c => c.toLowerCase() === 'конструктор (блоки)'), 'Should have Blocks category');

    console.log('Testing block placement (dispatching custom event to simulate intersection)...');
    await page.evaluate(() => {
        // Select dark-tower
        document.querySelector('.catalog-item[data-type="dark-tower"]').click();

        // Dispatch custom placeBlock event
        const event = new CustomEvent('placeBlock', {
            detail: {
                position: { x: 10, y: 0, z: 10, clone: function() { return this; } },
                normal: { x: 0, y: 1, z: 0, clone: function() { return this; } }
            }
        });
        window.dispatchEvent(event);
    });

    // Take screenshot of the result (hide canvas to prevent GPU read pixels crash on headless)
    await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
    await page.screenshot({ path: 'test-result.png' });
    console.log('Screenshot saved to test-result.png');

    console.log('All tests passed!');
    await browser.close();
    process.exit(0);
})();
