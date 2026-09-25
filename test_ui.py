from playwright.sync_api import sync_playwright
import time

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:4173/")

        # Wait for app to load
        time.sleep(2)

        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except:
            pass

        page.fill("#username", "snk")
        page.fill("#password", "snk001")
        page.evaluate("document.getElementById('login-btn').click()")

        # Wait for transition
        time.sleep(2)

        # Try opening build catalog using english standard key '1' vs 'Backquote' vs JS KeyboardEvent
        page.keyboard.press("1")
        time.sleep(1)

        catalog_display = page.evaluate("window.getComputedStyle(document.getElementById('build-catalog')).display")
        print(f"Build Catalog display after keyboard.press('1'): {catalog_display}")

        if catalog_display == 'none':
            page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {'key': '1'}))")
            time.sleep(1)
            catalog_display_window = page.evaluate("window.getComputedStyle(document.getElementById('build-catalog')).display")
            print(f"Build Catalog display after window.dispatchEvent: {catalog_display_window}")

        browser.close()

if __name__ == "__main__":
    test_ui()
