import time
from playwright.sync_api import sync_playwright

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Browser error: {exc}"))

        page.goto('http://localhost:4173') # vite preview is on 4173
        time.sleep(2)

        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
            page.screenshot(path='initial.png')
        except Exception as e:
            print("Failed screenshot", e)

        try:
            page.wait_for_selector('#login-screen', timeout=5000)
        except Exception as e:
            print("Failed to wait for #login-screen:", e)

        # Fill in the login form using evaluate since standard fill might fail due to canvas z-index
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")

        # Click login
        page.evaluate("document.getElementById('login-btn').click()")

        # Wait for flash effect / login success transition
        time.sleep(2)

        # Verify ui-layer is now visible
        ui_layer_display = page.evaluate("document.getElementById('ui-layer').style.display")
        assert ui_layer_display == 'block', f"Expected ui-layer to be block, got {ui_layer_display}"

        # Take a screenshot to see what it looks like after login
        # First hide canvas to avoid GPU stall readpixels issue during screenshot
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except:
            pass

        page.screenshot(path='after_login.png')

        browser.close()
        print("UI Test Passed successfully")

if __name__ == "__main__":
    test_ui()
