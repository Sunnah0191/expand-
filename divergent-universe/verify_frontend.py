from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:4173")
    page.wait_for_timeout(500)

    # Hide canvas for snapshot
    try:
        page.evaluate("if(document.querySelector('canvas')) { document.querySelector('canvas').style.display = 'none'; }")
    except Exception as e:
        pass
    page.wait_for_timeout(500)

    # Verify initial Russian login UI
    page.screenshot(path="/home/jules/verification/screenshots/login.png")
    page.wait_for_timeout(500)

    # Login
    page.fill('#username', 'snk')
    page.wait_for_timeout(200)
    page.fill('#password', 'snk001')
    page.wait_for_timeout(200)
    page.click('#login-btn')

    # Wait for God Mode to activate and canvas transition
    page.wait_for_timeout(2000)

    # Open catalog
    page.keyboard.press('`')
    page.wait_for_timeout(1000)

    # Snapshot the catalog UI to verify new categories and icons
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
