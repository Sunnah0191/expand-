export class Auth {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
    this.screen = document.getElementById('auth-screen');
    this.usernameInput = document.getElementById('username');
    this.passwordInput = document.getElementById('password');
    this.loginBtn = document.getElementById('login-btn');

    this.loginBtn.addEventListener('click', () => this.checkAuth());

    // Also allow enter key
    this.passwordInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') this.checkAuth();
    });
  }

  checkAuth() {
    const user = this.usernameInput.value;
    const pass = this.passwordInput.value;

    if (user === 'snk' && pass === 'snk001') {
      this.activateGodMode();
    } else {
      // Normal viewer mode
      this.hide();
      this.onSuccess(false);
    }
  }

  activateGodMode() {
    // Play sound if possible (skip for now to avoid browser autoplay issues, but hook is here)
    console.log("God Mode Activated");

    // UI Flash effect
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.backgroundColor = '#ffd700'; // Gold flash
    flash.style.zIndex = 9999;
    flash.style.opacity = 1;
    flash.style.transition = 'opacity 1s ease-out';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = 0;
      setTimeout(() => flash.remove(), 1000);
    }, 50);

    this.hide();
    this.onSuccess(true);
  }

  hide() {
    this.screen.style.opacity = 0;
    setTimeout(() => {
      this.screen.classList.add('hidden');
    }, 500);
  }
}
