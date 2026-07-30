const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173');

  // Wait for rendering
  await new Promise(r => setTimeout(r, 2000));

  // Hide canvas for screenshot
  await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");

  console.log("Verifying Login UI...");
  const h2Text = await page.evaluate(() => document.querySelector('.login-form h2').innerText);
  console.log("h2 text:", h2Text);
  if (h2Text !== 'Авторизация') {
      console.error("Login header translation failed");
      process.exit(1);
  }

  // Login
  await page.evaluate(() => {
    document.getElementById('username').value = 'snk';
    document.getElementById('password').value = 'snk001';
    document.getElementById('login-btn').click();
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log("Checking God Mode Flash...");
  const uiLayerVisible = await page.evaluate(() => {
      const el = document.getElementById('ui-layer');
      return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log("ui-layer visible:", uiLayerVisible);

  console.log("Pressing '1' to show Build Catalog");
  await page.keyboard.press('1');

  await new Promise(r => setTimeout(r, 1000));

  const catalogVisible = await page.evaluate(() => {
      const el = document.getElementById('build-catalog');
      return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log("catalog visible:", catalogVisible);

  if (!catalogVisible) {
      console.error("Catalog did not become visible after pressing 1");
      process.exit(1);
  }

  const categoryTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.catalog-category h3')).map(el => el.innerText.trim().toLowerCase());
  });
  console.log("Categories:", categoryTexts);

  const expectedCategories = ['ландшафт', 'архитектура wuwa', 'конструктор (блоки)'];
  for (const expected of expectedCategories) {
      if (!categoryTexts.includes(expected)) {
          console.error(`Missing expected category: ${expected}`);
          process.exit(1);
      }
  }

  console.log("Verification passed!");

  await browser.close();
})();
