from playwright.sync_api import sync_playwright
import time

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Hiding canvas to avoid GPU stall if any
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception:
            pass

        # Take a screenshot of the initial login screen
        page.screenshot(path="login_screen.png")

        # Fill in the login credentials
        page.evaluate("document.getElementById('username').value = 'snk';")
        page.evaluate("document.getElementById('password').value = 'snk001';")
        page.evaluate("document.getElementById('login-btn').click();")

        # Wait for God Mode to trigger (wait for ui-layer to be visible)
        page.wait_for_selector("#ui-layer", state="visible", timeout=5000)

        # Press '1' to open build menu
        page.keyboard.press("1")

        # Let the canvas load a bit
        time.sleep(1)

        # Take a screenshot of the build catalog
        # Hiding canvas to avoid GPU stall if any
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception:
            pass
        page.screenshot(path="build_catalog.png")

        browser.close()

if __name__ == "__main__":
    test_ui()
