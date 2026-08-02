from playwright.sync_api import sync_playwright
import time

def test_login_and_catalog():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Hide canvas to avoid GL issues in screenshot
        time.sleep(2)
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")

        # Check Russian text on login
        assert page.locator("h2").inner_text() == "Авторизация"

        # Log in as admin
        page.evaluate("document.querySelector('#username').value = 'snk'")
        page.evaluate("document.querySelector('#password').value = 'snk001'")
        page.evaluate("document.querySelector('#login-btn').click()")

        time.sleep(1.5) # Wait for animation and particle effect

        # Check that UI layer is visible
        assert page.evaluate("document.querySelector('#ui-layer').style.display") == "block"

        # Open catalog
        page.keyboard.press("Backquote")
        time.sleep(0.5)

        # Check that catalog opens and has our categories
        assert page.evaluate("document.querySelector('#build-catalog').style.display") == "block"
        assert "Ландшафт" in page.content()
        assert "Архитектура WuWa" in page.content()
        assert "Конструктор (Блоки)" in page.content()

        # Check some new block types
        assert page.locator("[data-type='rock']").is_visible()
        assert page.locator("[data-type='wuwa-bridge']").is_visible()
        assert page.locator("[data-type='block-chrome']").is_visible()

        print("Test passed successfully!")
        browser.close()

if __name__ == "__main__":
    test_login_and_catalog()
