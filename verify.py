import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:4173")

        # Wait for initial load
        time.sleep(2)

        # Hide canvas to avoid GPU stalls
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except Exception:
            pass

        # Take screenshot of login screen
        page.screenshot(path="login_screen.png")

        # Fill login and login
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")
        page.evaluate("document.getElementById('login-btn').click()")

        # wait for login transition
        time.sleep(2)

        # press 1 to open catalog
        page.keyboard.press("1")
        time.sleep(1)

        # take screenshot of catalog
        page.screenshot(path="catalog_screen.png")

        browser.close()
        print("Success")

if __name__ == "__main__":
    verify()
