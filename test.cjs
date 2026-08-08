const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to local server...');
    await page.goto('http://localhost:5173');

    // Hide canvas to avoid GPU stalls in CI
    try {
        await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
    } catch(e) {}

    // Wait for the UI
    await page.waitForTimeout(1000);
    await page.waitForSelector('#login-screen', { state: 'visible', timeout: 10000 });

    // Check Russian text on UI
    console.log('Checking Russian translations...');
    const loginTitle = await page.locator('#login-screen h2').innerText();
    if (loginTitle !== 'Авторизация') throw new Error('Login title is incorrect: ' + loginTitle);

    const btnText = await page.locator('#login-btn').innerText();
    if (btnText !== 'ВОЙТИ') throw new Error('Login button text is incorrect: ' + btnText);

    // Login
    console.log('Logging in as snk...');
    await page.evaluate(() => {
        document.getElementById('username').value = 'snk';
        document.getElementById('password').value = 'snk001';
        document.getElementById('login-btn').click();
    });

    // Wait for fade out
    await page.waitForTimeout(2000);

    const uiLayerStyle = await page.locator('#ui-layer').getAttribute('style');
    if (!uiLayerStyle.includes('display: block')) throw new Error('UI layer is not block');

    // Toggle menu
    console.log('Toggling build menu...');
    await page.keyboard.press('Backquote'); // `
    await page.waitForTimeout(500);

    const catalogStyle = await page.locator('#build-catalog').getAttribute('style');
    if (!catalogStyle.includes('display: flex')) throw new Error('Catalog is not visible');

    const firstCategory = await page.locator('.catalog-category h3').first().innerText();
    if (firstCategory.toLowerCase() !== 'ландшафт') throw new Error('First category is incorrect: ' + firstCategory);

    console.log('All tests passed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    process.exit();
  }
})();
