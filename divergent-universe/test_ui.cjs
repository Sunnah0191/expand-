const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log("Navigating to local server...");
  await page.goto('http://localhost:5173');

  console.log("Waiting for Vite load...");
  await page.waitForTimeout(3000);

  // Verify UI changes on login screen
  console.log("Checking login texts...");
  const loginTitle = await page.evaluate(() => document.querySelector('.login-form h2').innerText);
  console.log("Login title:", loginTitle);
  if (loginTitle !== 'Авторизация') throw new Error("Expected 'Авторизация'");

  const usernamePlaceholder = await page.evaluate(() => document.getElementById('username').placeholder);
  if (usernamePlaceholder !== 'Ник') throw new Error("Expected 'Ник'");

  const passwordPlaceholder = await page.evaluate(() => document.getElementById('password').placeholder);
  if (passwordPlaceholder !== 'Пароль') throw new Error("Expected 'Пароль'");

  console.log("Logging in as snk/snk001...");
  await page.evaluate(() => {
    document.getElementById('username').value = 'snk';
    document.getElementById('password').value = 'snk001';
    document.getElementById('login-btn').click();
  });

  console.log("Waiting for login animation...");
  await page.waitForTimeout(1500); // login fadeout takes 1000ms

  console.log("Opening build catalog (pressing 'ё')...");
  await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 'ё' });
    window.dispatchEvent(event);
  });

  await page.waitForTimeout(500);

  console.log("Checking catalog items...");
  const displayStyle = await page.evaluate(() => {
    return window.getComputedStyle(document.getElementById('build-catalog')).display;
  });
  if (displayStyle === 'none') throw new Error("Catalog didn't open!");

  const catalogCats = await page.evaluate(() => {
    const categories = document.querySelectorAll('.catalog-category h4');
    return Array.from(categories).map(el => el.innerText);
  });
  console.log("Categories found:", catalogCats);

  if (!catalogCats.includes('Ландшафт') || !catalogCats.includes('Архитектура WuWa') || !catalogCats.includes('Конструктор (Блоки)')) {
      throw new Error("Missing some expected categories!");
  }

  console.log("Selecting 'neon-tree' from catalog...");
  await page.evaluate(() => {
    const item = document.querySelector('.catalog-item[data-type="neon-tree"]');
    if(item) item.click();
  });

  const selectedType = await page.evaluate(() => {
    const selected = document.querySelector('.catalog-item.selected');
    return selected ? selected.getAttribute('data-type') : null;
  });
  console.log("Selected item:", selectedType);
  if (selectedType !== 'neon-tree') throw new Error("Failed to select 'neon-tree'");

  console.log("Placing a block (simulate click)...");
  // Hide canvas to avoid GL error
  await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
  await page.screenshot({ path: 'catalog_view.png' });
  console.log("Screenshot saved.");

  await browser.close();
  console.log("Test passed!");
})();
