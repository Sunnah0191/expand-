import time
from playwright.sync_api import sync_playwright

def test_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Wait for initial load
        time.sleep(2)

        # Check login screen text (Russian translation)
        assert page.locator('h2').inner_text() == 'Авторизация'

        # We need to evaluate JS to set values and click because the canvas overlay might intercept clicks
        page.evaluate("document.getElementById('username').value = 'snk';")
        page.evaluate("document.getElementById('password').value = 'snk001';")
        page.evaluate("document.getElementById('login-btn').click();")

        time.sleep(2)

        # Open build menu (God Mode enabled should allow this)
        page.keyboard.press('`')
        time.sleep(1)

        # Check catalog visibility and some classes
        catalog_display = page.evaluate("document.getElementById('build-catalog').style.display;")
        assert catalog_display == 'block'

        category_titles = page.locator('.catalog-category-title').all_inner_texts()
        print("Category Titles found:", category_titles)
        assert any('ЛАНДШАФТ' in t.upper() for t in category_titles)
        assert any('АРХИТЕКТУРА WUWA' in t.upper() for t in category_titles)
        assert any('КОНСТРУКТОР (БЛОКИ)' in t.upper() for t in category_titles)

        # Check that we have the new blocks
        assert page.locator('.catalog-item[data-type="mid-poly-rock"]').count() == 1
        assert page.locator('.catalog-item[data-type="futuristic-monolith"]').count() == 1
        assert page.locator('.catalog-item[data-type="glass-block"]').count() == 1

        # Ensure default selected type is glass-block
        selected_type = page.evaluate("document.querySelector('.catalog-item.selected').getAttribute('data-type');")
        print("Selected Type is:", selected_type)
        assert selected_type == 'glass-block'

        # Attempt to take a screenshot to verify visual changes
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
        page.screenshot(path='ui_verification.png')

        print("Tests passed successfully!")

        browser.close()

if __name__ == '__main__':
    test_ui()