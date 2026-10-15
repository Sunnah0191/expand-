from playwright.sync_api import sync_playwright
import time
import sys
import os

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:5173")
            page.goto('http://localhost:5173', timeout=10000)

            # Wait a bit for Vite and Three.js
            time.sleep(2)

            # Verify UI Russian text
            print("Verifying Russian text...")
            login_heading = page.locator('.login-form h2').inner_text()
            assert "Авторизация" in login_heading, f"Expected 'Авторизация', got {login_heading}"

            username_placeholder = page.locator('#username').get_attribute('placeholder')
            assert "Ник" in username_placeholder, f"Expected 'Ник', got {username_placeholder}"

            password_placeholder = page.locator('#password').get_attribute('placeholder')
            assert "Пароль" in password_placeholder, f"Expected 'Пароль', got {password_placeholder}"

            login_btn_text = page.locator('#login-btn').inner_text()
            assert "ВОЙТИ" in login_btn_text.upper(), f"Expected 'ВОЙТИ', got {login_btn_text}" # it might be uppercase due to css

            # Test Login and Error
            print("Testing invalid login...")
            time.sleep(2)
            page.evaluate("document.getElementById('username').value = 'wrong'")
            page.evaluate("document.getElementById('password').value = 'wrong'")
            # Need to trigger input events for value changes to be picked up sometimes
            page.evaluate("let el = document.getElementById('username'); el.dispatchEvent(new Event('input', {bubbles: true}));")
            page.evaluate("let el = document.getElementById('password'); el.dispatchEvent(new Event('input', {bubbles: true}));")
            page.evaluate("document.getElementById('login-btn').click()")

            time.sleep(1)
            error_msg = page.locator('#login-error')
            is_visible = page.evaluate("document.getElementById('login-error').style.display !== 'none'")
            assert is_visible, "Error message should be visible"
            assert "Неверные данные" in error_msg.inner_text(), f"Expected 'Неверные данные', got {error_msg.inner_text()}"

            time.sleep(3) # wait for error to hide

            # Test God Mode Login
            print("Testing God Mode Login...")
            page.evaluate("document.getElementById('username').value = 'snk'")
            page.evaluate("document.getElementById('password').value = 'snk001'")
            page.evaluate("let el2 = document.getElementById('username'); el2.dispatchEvent(new Event('input', {bubbles: true}));")
            page.evaluate("let el3 = document.getElementById('password'); el3.dispatchEvent(new Event('input', {bubbles: true}));")
            page.evaluate("document.getElementById('login-btn').click()")

            # Wait for UI layer to show
            time.sleep(2)

            print("Testing Build Menu toggling and text...")
            # Toggle build menu with 'Ё'
            # Note: memory says non-standard characters might fail, so we simulate event via evaluate or use standard english key '`' first. Let's use '`'
            page.evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {'key': '`'}))")
            time.sleep(0.5)

            build_catalog = page.locator('#build-catalog')
            assert build_catalog.is_visible(), "Build catalog should be visible after pressing '`'"

            # verify categories and items
            catalog_text = build_catalog.text_content()
            assert "Меню строительства" in catalog_text, "Missing 'Меню строительства'"
            assert "Ландшафт" in catalog_text, "Missing 'Ландшафт'"
            assert "Архитектура WuWa" in catalog_text, "Missing 'Архитектура WuWa'"
            assert "Конструктор (Блоки)" in catalog_text, "Missing 'Конструктор (Блоки)'"
            assert "Скалы" in catalog_text, "Missing 'Скалы'"
            assert "Неоновое дерево" in catalog_text, "Missing 'Неоновое дерево'"

            # Test selecting a different item
            print("Testing item selection...")
            neon_tree = page.locator('.catalog-item[data-type="neon-tree"]')
            neon_tree.evaluate("node => node.click()")

            assert "selected" in neon_tree.get_attribute("class"), "neon-tree item should be selected"

            # Turn off canvas for screenshot
            try:
                page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
            except Exception as e:
                print(f"Could not hide canvas: {e}")

            page.screenshot(path="verify-screenshot.png")
            print("All tests passed!")

        except AssertionError as e:
            print(f"Assertion failed: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"An error occurred: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_tests()
