from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait a bit for Vite and Three.js
        time.sleep(2)

        print("Verifying login screen...")
        title = page.locator("h2").inner_text()
        assert title.upper() == "АВТОРИЗАЦИЯ", f"Expected 'АВТОРИЗАЦИЯ', got '{title.upper()}'"

        username_placeholder = page.locator("#username").get_attribute("placeholder")
        assert username_placeholder == "Ник", f"Expected 'Ник', got '{username_placeholder}'"

        # Login to open UI
        print("Logging in...")
        # Use evaluate for setting values and clicking to bypass webgl blocking
        page.evaluate('document.getElementById("username").value = "snk"')
        page.evaluate('document.getElementById("password").value = "snk001"')
        page.evaluate('document.getElementById("login-btn").click()')

        # Wait for God Mode to activate and UI to show
        time.sleep(3)

        # Open build menu via pressing '1'
        print("Opening build menu...")
        page.evaluate('window.dispatchEvent(new KeyboardEvent("keydown", {key: "1"}))')
        time.sleep(1)

        # Check build catalog text content
        print("Verifying build catalog...")
        catalog_title = page.locator("#build-catalog h3").inner_text()
        assert catalog_title.upper() == "КАТАЛОГ СТРОИТЕЛЬСТВА", f"Expected 'КАТАЛОГ СТРОИТЕЛЬСТВА', got '{catalog_title.upper()}'"

        # Assert categories
        categories = page.locator(".catalog-category h4").all_inner_texts()
        expected_categories = ["ЛАНДШАФТ", "АРХИТЕКТУРА WUWA", "КОНСТРУКТОР (БЛОКИ)"]
        for cat in expected_categories:
            assert cat in [c.upper() for c in categories], f"Missing category: {cat}, got: {categories}"

        print("UI Verification Successful!")
        browser.close()

if __name__ == "__main__":
    verify()
