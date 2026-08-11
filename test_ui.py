from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:4173')

        # Wait for the app to load
        time.sleep(2)

        # Verify UI Translations
        username_placeholder = page.locator('#username').get_attribute('placeholder')
        password_placeholder = page.locator('#password').get_attribute('placeholder')
        login_btn_text = page.locator('#login-btn').inner_text()

        assert username_placeholder == "Ник", f"Expected 'Ник', got '{username_placeholder}'"
        assert password_placeholder == "Пароль", f"Expected 'Пароль', got '{password_placeholder}'"
        assert login_btn_text == "АВТОРИЗАЦИЯ", f"Expected 'АВТОРИЗАЦИЯ', got '{login_btn_text}'" # CSS text-transform uppercase

        # Hide Canvas to avoid GPU stall
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception as e:
            pass

        # Login to God Mode
        # Use evaluate for direct DOM interaction due to canvas overlay/z-index issues
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")
        page.evaluate("document.getElementById('login-btn').click()")

        time.sleep(2)

        # Toggle Build Catalog with 'Ё'
        page.keyboard.press('Backquote') # Simulate the physical key where Ё/` is located

        time.sleep(1)

        # Verify Catalog UI structure
        cat_1 = page.locator('h4', has_text='Ландшафт')
        cat_2 = page.locator('h4', has_text='Архитектура WuWa')
        cat_3 = page.locator('h4', has_text='Конструктор (Блоки)')

        assert cat_1.is_visible(), "Category 'Ландшафт' not visible"
        assert cat_2.is_visible(), "Category 'Архитектура WuWa' not visible"
        assert cat_3.is_visible(), "Category 'Конструктор (Блоки)' not visible"

        print("All UI text and interaction tests passed successfully!")

        browser.close()

if __name__ == '__main__':
    run()
