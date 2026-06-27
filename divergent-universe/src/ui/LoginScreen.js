export class LoginScreen {
  constructor(onSuccess) {
    this.overlay = document.getElementById('login-overlay');
    this.usernameInput = document.getElementById('username');
    this.passwordInput = document.getElementById('password');
    this.loginBtn = document.getElementById('login-btn');
    this.onSuccess = onSuccess;

    this.initEvents();
  }

  initEvents() {
    this.loginBtn.addEventListener('click', () => this.handleLogin());

    // Add enter key support
    this.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  handleLogin() {
    const user = this.usernameInput.value.trim();
    const pass = this.passwordInput.value.trim();

    if (user === 'snk' && pass === 'snk001') {
      this.activateGodMode();
    } else {
      // Regular user - just hide login
      this.hide();
      if (this.onSuccess) this.onSuccess(false);
    }
  }

  activateGodMode() {
    // Flash effect
    const flash = document.createElement('div');
    flash.className = 'god-mode-flash';
    document.body.appendChild(flash);

    // Remove flash after animation
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 1000);

    this.hide();

    if (this.onSuccess) {
      this.onSuccess(true); // true means God Mode
    }
  }

  hide() {
    this.overlay.style.display = 'none';
  }
}
