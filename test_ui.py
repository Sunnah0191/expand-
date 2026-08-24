import time
from playwright.sync_api import sync_playwright

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Wait for load and check translation
        page.wait_for_timeout(2000)
        login_title = page.locator(".login-form h2").inner_text()
        print(f"Login title: {login_title}")
        assert login_title == "Авторизация"

        username_placeholder = page.locator("#username").get_attribute("placeholder")
        print(f"Username placeholder: {username_placeholder}")
        assert username_placeholder == "Ник"

        password_placeholder = page.locator("#password").get_attribute("placeholder")
        print(f"Password placeholder: {password_placeholder}")
        assert password_placeholder == "Пароль"

        # Login
        # Hide the canvas so it doesn't cause GPU stalls and blocks events
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")

        page.evaluate('document.getElementById("username").value = "snk"')
        page.evaluate('document.getElementById("password").value = "snk001"')
        page.evaluate('document.getElementById("login-btn").click()')

        # Wait for UI layer to become visible. The login screen fades out over 1s.
        page.wait_for_timeout(3000)

        display = page.evaluate('window.getComputedStyle(document.getElementById("ui-layer")).display')
        print(f"UI layer display: {display}")
        assert display == "block"

        # Toggle build catalog
        # page.keyboard.press('`') can fail, simulate via evaluate
        page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ё'}))")
        page.wait_for_timeout(500)

        catalog_display = page.evaluate('document.getElementById("build-catalog").style.display')
        print(f"Catalog display: {catalog_display}")
        assert catalog_display == "block"

        # Verify catalog items
        categories = page.locator(".catalog-category").all_inner_texts()
        print(f"Categories: {categories}")
        assert "ЛАНДШАФТ" in categories # Uppercase due to css

        print("All tests passed!")
        browser.close()

if __name__ == "__main__":
    test_ui()