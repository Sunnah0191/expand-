import { test, expect } from '@playwright/test';

test('Verify God Mode login, particles, and build menu with new blocks', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give three.js time to init

  // Hide canvas to prevent GPU stalls during screenshots (and general flakiness)
  await page.evaluate(() => {
    if(document.querySelector('canvas')) {
      document.querySelector('canvas').style.display = 'none';
    }
  });

  // Check translated strings
  await expect(page.locator('h2')).toHaveText('Авторизация');

  // Use page.$eval instead of page.evaluate
  const userPlaceholder = await page.$eval('#username', el => el.placeholder);
  expect(userPlaceholder).toBe('Ник');

  const passPlaceholder = await page.$eval('#password', el => el.placeholder);
  expect(passPlaceholder).toBe('Пароль');

  await expect(page.locator('#login-btn')).toHaveText(/ВОЙТИ/i);

  // Login as admin using locator fill (since evaluate can be finicky)
  await page.locator('#username').fill('snk');
  await page.locator('#password').fill('snk001');
  await page.locator('#login-btn').click();

  // Check if flash effect appears
  await expect(page.locator('#god-mode-flash')).toHaveClass(/flash-active/);

  // Wait a bit for particles to generate
  await page.waitForTimeout(500);

  // Check if golden particles were spawned
  const particleCount = await page.locator('.golden-particle').count();
  expect(particleCount).toBeGreaterThan(0);
  console.log(`Found ${particleCount} golden particles`);

  // Wait for login screen to fade out
  await page.waitForTimeout(1500);

  // Open build menu using the new 'Ё' key binding
  await page.keyboard.press('Backquote');

  // Check if menu opens
  await expect(page.locator('#build-catalog')).toBeVisible();

  // Verify new catalog categories and some items
  const categoriesText = await page.locator('#build-catalog h3').allTextContents();
  expect(categoriesText).toContain('Ландшафт');
  expect(categoriesText).toContain('Архитектура WuWa');
  expect(categoriesText).toContain('Конструктор (Блоки)');

  const rockItem = page.locator('.catalog-item[data-type="rock"]');
  await expect(rockItem).toBeVisible();

  const chromeCubeItem = page.locator('.catalog-item[data-type="chrome-cube"]');
  await expect(chromeCubeItem).toBeVisible();

  // Test selecting an item
  await chromeCubeItem.click();
  await expect(chromeCubeItem).toHaveClass(/selected/);

  console.log("All UI tests passed!");
});
