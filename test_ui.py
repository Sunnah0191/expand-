import time
from playwright.sync_api import sync_playwright

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")
        time.sleep(4)  # Wait for Vite and Three.js

        # Hide canvas to avoid GPU stalls
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except:
            pass

        # Screenshot login screen
        page.screenshot(path="login_screen.png")

        # Type credentials (using evaluate to bypass canvas interception)
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")

        # Click login
        page.evaluate("document.getElementById('login-btn').click()")

        time.sleep(1) # wait for flash effect
        page.screenshot(path="god_mode_flash.png")

        time.sleep(1) # wait for UI layer

        # Open build menu (simulate keypress)
        page.evaluate("""
            window.dispatchEvent(new KeyboardEvent('keydown', {key: '1'}));
        """)
        time.sleep(1)

        page.screenshot(path="build_menu.png")

        browser.close()

test_ui()
