import { test, expect } from '@playwright/test';

test('login and open build menu', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.evaluate(() => {
    document.getElementById('username').value = 'snk';
    document.getElementById('password').value = 'snk001';
    document.getElementById('login-btn').click();
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  await page.keyboard.press('1');

  const display = await page.evaluate(() => {
    return document.getElementById('build-catalog').style.display;
  });

  expect(display).toBe('flex');
});
