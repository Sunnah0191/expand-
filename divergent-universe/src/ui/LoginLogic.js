export class LoginLogic {
    constructor(scene, camera, onLoginSuccess) {
        this.scene = scene;
        this.camera = camera;
        this.onLoginSuccess = onLoginSuccess;

        this.loginBtn = document.getElementById('login-btn');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginScreen = document.getElementById('login-screen');
        this.catalogScreen = document.getElementById('catalog-screen');

        this._onLoginClick = this.onLoginClick.bind(this);
        this._onKeyDown = this.onKeyDown.bind(this);

        this.loginBtn.addEventListener('click', this._onLoginClick);
        window.addEventListener('keydown', this._onKeyDown);
    }

    onLoginClick() {
        const user = this.usernameInput.value;
        const pass = this.passwordInput.value;

        if (user === 'snk' && pass === 'snk001') {
            this.activateGodMode();
        } else {
            // Standard viewer mode, maybe just hide UI and let them watch
            this.loginScreen.classList.remove('active');
            this.loginScreen.classList.add('hidden');
        }
    }

    activateGodMode() {
        // Play activation sound (simulated with console log if no audio file)
        console.log("God Mode Activated: [Futuristic Activation Sound]");

        // Hide login UI
        this.loginScreen.classList.remove('active');
        this.loginScreen.classList.add('hidden');

        // Flash effect (simple CSS or overlay could be used, here we just do a quick background flash)
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = '#ffd700';
        flashOverlay.style.opacity = '0.8';
        flashOverlay.style.zIndex = '9999';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.transition = 'opacity 1s ease-out';
        document.body.appendChild(flashOverlay);

        // Trigger callback to enable controls
        if (this.onLoginSuccess) {
            this.onLoginSuccess();
        }

        // Fade out flash
        setTimeout(() => {
            flashOverlay.style.opacity = '0';
            setTimeout(() => flashOverlay.remove(), 1000);
        }, 100);
    }

    onKeyDown(event) {
        // Toggle building catalog with 1, ~, or Ё
        if (window.gameState && window.gameState.isGodMode) {
            if (event.key === '1' || event.key === '`' || event.key === '~' || event.key === 'Ё' || event.key === 'ё') {
                if (this.catalogScreen.classList.contains('hidden')) {
                    this.catalogScreen.classList.remove('hidden');
                    this.catalogScreen.classList.add('active');
                    // Release pointer lock if using it, so user can click UI
                } else {
                    this.catalogScreen.classList.remove('active');
                    this.catalogScreen.classList.add('hidden');
                }
            }
        }
    }
}