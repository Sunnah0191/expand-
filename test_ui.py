from playwright.sync_api import sync_playwright
import time

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")

        # Wait for the page and WebGL to load
        time.sleep(5)

        print("Taking login screenshot...")
        # Hide canvas to avoid GPU stall screenshot issue
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        page.screenshot(path="login_screen.png")
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'block'; }")

        print("Logging in with 'snk'/'snk001'...")
        try:
            page.wait_for_selector("#username", timeout=10000, state="attached")
            # Use javascript to fill in values if normal fill fails due to canvas covering
            page.evaluate("document.getElementById('username').value = 'snk'")
            page.evaluate("document.getElementById('password').value = 'snk001'")
            page.evaluate("document.getElementById('login-btn').click()")
        except Exception as e:
            print("Failed to find inputs or click, screenshotting current state.")
            page.screenshot(path="error_state.png")
            raise e

        # Wait for login transition
        time.sleep(2)

        print("Taking main game screenshot...")
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        page.screenshot(path="main_game.png")
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'block'; }")

        print("Opening build catalog (pressing '1')...")
        page.keyboard.press("1")

        # Wait for catalog to appear
        time.sleep(1)

        print("Taking catalog screenshot...")
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        page.screenshot(path="build_catalog.png")
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'block'; }")

        # Check for errors
        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        if errors:
            print("Errors found:", errors)
        else:
            print("No console errors detected.")

        browser.close()

if __name__ == "__main__":
    test_ui()
