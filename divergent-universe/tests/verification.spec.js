import { test, expect } from '@playwright/test';

test.describe('Divergent Universe UI Verification', () => {
    test('Login screen and build catalog UI', async ({ page }) => {
        await page.goto('http://localhost:5173/');

        // Hide canvas to avoid GPU stalls
        await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");
        await page.waitForTimeout(2000);

        const loginHeader = await page.locator('.login-form h2');
        await expect(loginHeader).toHaveText('Авторизация', { ignoreCase: true });

        const usernameInput = await page.locator('#username');
        await expect(usernameInput).toHaveAttribute('placeholder', 'Ник');

        const passwordInput = await page.locator('#password');
        await expect(passwordInput).toHaveAttribute('placeholder', 'Пароль');

        const loginBtn = await page.locator('#login-btn');
        await expect(loginBtn).toHaveText('ВОЙТИ', { ignoreCase: true });

        // Login
        await page.evaluate(() => {
            document.getElementById('username').value = 'snk';
            document.getElementById('password').value = 'snk001';
            document.getElementById('login-btn').click();
        });

        await page.waitForTimeout(1500);
        await page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }");

        // Open catalog
        await page.keyboard.press('Backquote');
        await page.waitForTimeout(500);

        const catalog = await page.locator('#build-catalog');
        await expect(catalog).toBeVisible();

        const categories = await page.locator('.catalog-category h3');
        await expect(categories).toHaveCount(3);

        const texts = await categories.allTextContents();
        expect(texts[0].toUpperCase()).toBe('ЛАНДШАФТ');
        expect(texts[1].toUpperCase()).toBe('АРХИТЕКТУРА WUWA');
        expect(texts[2].toUpperCase()).toBe('КОНСТРУКТОР (БЛОКИ)');
    });
});
