import time
from playwright.sync_api import sync_playwright

def test_divergent_universe():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.on("pageerror", lambda err: print(f"Page error: {err}"))
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))

        # Connect to local Vite dev server
        page.goto("http://localhost:5173")

        # Wait for a short time for WebGL to initialize
        time.sleep(2)

        # Verify text is in Russian
        heading = page.evaluate("document.querySelector('#login-screen h2').textContent")
        assert "Авторизация" in heading, f"Expected 'Авторизация', got '{heading}'"

        # Login using evaluate to bypass timeout issues
        page.evaluate("""
            document.querySelector('#username').value = 'snk';
            document.querySelector('#password').value = 'snk001';
            document.querySelector('#login-btn').dispatchEvent(new MouseEvent('click', {bubbles: true}));
        """)

        # Wait for UI layer
        time.sleep(2)

        # Open build menu using standard English key equivalent
        page.evaluate("""
            window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1' }));
        """)

        # Wait for catalog
        time.sleep(1)

        # Verify categories
        categories = page.evaluate("""
            Array.from(document.querySelectorAll('.catalog-category h3')).map(el => el.textContent)
        """)
        print(f"Categories found: {categories}")
        assert "ЛАНДШАФТ" in categories or "Ландшафт" in categories
        assert "АРХИТЕКТУРА WUWA" in categories or "Архитектура WuWa" in categories
        assert "КОНСТРУКТОР (БЛОКИ)" in categories or "Конструктор (Блоки)" in categories

        # Hide WebGL canvas to avoid screenshot stall
        try:
            page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        except:
            pass

        # Take screenshot
        page.screenshot(path="screenshot.png")

        browser.close()
        print("Playwright test passed!")

if __name__ == "__main__":
    test_divergent_universe()
