from playwright.sync_api import sync_playwright
import time

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Wait for the scene to render
        time.sleep(3)

        # Hide the canvas to prevent GPU stalls when screenshotting
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception:
            pass

        # Take screenshot of the login screen
        page.screenshot(path="login_screen.png")

        # Login
        page.evaluate('document.getElementById("username").value = "snk"')
        page.evaluate('document.getElementById("password").value = "snk001"')
        page.evaluate('document.getElementById("login-btn").click()')

        # Wait for transition
        time.sleep(2)

        # Open build menu (simulate keypress with standard English character instead of Ё)
        page.keyboard.press('`')
        time.sleep(1)

        # Take screenshot of the build catalog
        page.screenshot(path="build_catalog.png")

        print("Test complete.")

        browser.close()

if __name__ == "__main__":
    test_ui()
