import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Wait a bit for initial render
        time.sleep(2)

        # Take a screenshot of the login screen
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        page.screenshot(path='login_screen.png')
        print("Login screenshot taken.")

        # Fill in the login form using evaluate to avoid timeouts with canvas interception
        page.evaluate("document.getElementById('username').value = 'snk'")
        page.evaluate("document.getElementById('password').value = 'snk001'")
        page.evaluate("document.getElementById('login-btn').click()")

        # Wait for God Mode flash effect and UI layer to display
        time.sleep(2)

        # Press the Backquote / '1' key to toggle the build catalog
        page.keyboard.press('Backquote')

        # Wait for the catalog to become visible
        time.sleep(1)

        # Take screenshot of the build catalog
        page.screenshot(path='catalog_screen.png')
        print("Catalog screenshot taken.")

        browser.close()

if __name__ == '__main__':
    verify()
