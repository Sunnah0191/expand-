from playwright.sync_api import sync_playwright
import time

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        page.on("console", lambda msg: print(f"Browser console: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        print("Navigating to app...")
        page.goto("http://localhost:5173")
        page.wait_for_timeout(2000)

        print("Testing God Mode Login...")
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")
        page.evaluate("document.getElementById('login-btn').click()")

        page.wait_for_timeout(2000) # Wait for animation

        ui_layer_display = page.evaluate("document.getElementById('ui-layer').style.display")
        print(f"UI Layer display after login: {ui_layer_display}")

        print("Testing Building Menu...")
        page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {'key': '1'}))")
        page.wait_for_timeout(500)

        menu_display = page.evaluate("window.getComputedStyle(document.getElementById('build-catalog')).display")
        print(f"Build Catalog display after hotkey: {menu_display}")

        browser.close()
        print("Test Complete.")

test_app()
