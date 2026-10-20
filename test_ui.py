import time
from playwright.sync_api import sync_playwright

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:4173/')

        # Give Three.js some time to load
        page.wait_for_timeout(3000)

        # Verify Russian text on login screen
        h2_text = page.locator('.login-form h2').inner_text()
        print(f"Login Header: {h2_text}")

        # Login with God Mode credentials using DOM events since WebGL might be blocking
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")
        page.evaluate("document.getElementById('login-btn').click()")

        # Wait for UI layer to show
        page.wait_for_timeout(2000) # Give it time to fade out and show the UI layer

        try:
            # Hide the canvas to prevent GPU stalls when taking screenshots
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception as e:
            print(f"Warning: Canvas not found or could not hide: {e}")

        # Press '1' to open build catalog using DOM event
        page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {'key': '1'}))")

        page.wait_for_timeout(1000) # Give menu time to appear

        # Check if catalog is visible
        catalog_style = page.evaluate("window.getComputedStyle(document.getElementById('build-catalog')).display")
        print(f"Catalog display property: {catalog_style}")

        # Take a screenshot
        page.screenshot(path='screenshot.png')
        print("Screenshot saved to screenshot.png")

        browser.close()

test_ui()
