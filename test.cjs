const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/');

  // Wait for initial render
  await page.waitForTimeout(2000);

  // Hide canvas to avoid GPU stall reading pixels
  try {
      await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
  } catch (e) {}

  // Test translations
  const usernamePlaceholder = await page.evaluate("document.getElementById('username').placeholder");
  const passwordPlaceholder = await page.evaluate("document.getElementById('password').placeholder");
  const buttonText = await page.evaluate("document.getElementById('login-btn').innerText");

  console.log('Username Placeholder:', usernamePlaceholder);
  console.log('Password Placeholder:', passwordPlaceholder);
  console.log('Button Text:', buttonText);

  if (usernamePlaceholder !== 'Ник' || passwordPlaceholder !== 'Пароль' || buttonText.trim() !== 'АВТОРИЗАЦИЯ') {
      console.error('Translation failed!');
      process.exit(1);
  }

  // Test login
  await page.evaluate(() => {
      document.getElementById('username').value = 'snk';
      document.getElementById('password').value = 'snk001';
      document.getElementById('login-btn').click();
  });

  // Wait for login transition
  await page.waitForTimeout(1500);

  // Check if UI layer is visible
  const uiLayerDisplay = await page.evaluate("window.getComputedStyle(document.getElementById('ui-layer')).display");
  console.log('UI Layer Display:', uiLayerDisplay);

  if (uiLayerDisplay !== 'block') {
      console.error('Login failed to display UI layer!');
      process.exit(1);
  }

  // Test opening catalog
  // Dispatch keyboard event '1'
  await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', { key: '1' });
      window.dispatchEvent(event);
  });

  await page.waitForTimeout(500);

  const catalogDisplay = await page.evaluate("window.getComputedStyle(document.getElementById('build-catalog')).display");
  console.log('Build Catalog Display:', catalogDisplay);

  if (catalogDisplay !== 'block') {
      console.error('Catalog failed to open!');
      process.exit(1);
  }

  // Test categories
  const categoryCount = await page.evaluate("document.querySelectorAll('.catalog-category').length");
  console.log('Catalog Categories Count:', categoryCount);

  if (categoryCount !== 3) {
      console.error('Missing categories!');
      process.exit(1);
  }

  console.log('UI Tests Passed Successfully!');

  await browser.close();
})();
