export class LoginUI {
  constructor(app) {
    this.app = app;
    this.createUI();

    // Add UI layer to app for blurring effect if needed
    // or just let the CSS handle it on the container.
    // In "viewer mode", we just hide the UI and let them see the central continent rotating.
  }

  createUI() {
    this.uiLayer = document.createElement('div');
    this.uiLayer.id = 'ui-layer';

    this.loginPanel = document.createElement('div');
    this.loginPanel.className = 'glass-panel login-panel';

    // Adding some inline styles that could be in CSS, but convenient here
    this.loginPanel.style.width = '360px';
    this.loginPanel.style.padding = '40px';
    this.loginPanel.style.display = 'flex';
    this.loginPanel.style.flexDirection = 'column';
    this.loginPanel.style.gap = '20px';

    const title = document.createElement('h1');
    title.innerText = 'System Login';
    title.style.textAlign = 'center';
    title.style.fontWeight = '300';
    title.style.letterSpacing = '2px';
    title.style.marginBottom = '20px';

    const createInput = (placeholder, type = 'text') => {
      const input = document.createElement('input');
      input.type = type;
      input.placeholder = placeholder;
      input.style.padding = '12px 16px';
      input.style.background = 'rgba(0, 0, 0, 0.3)';
      input.style.border = '1px solid rgba(100, 200, 255, 0.2)';
      input.style.borderRadius = '6px';
      input.style.color = '#fff';
      input.style.outline = 'none';
      input.style.transition = 'all 0.3s ease';

      input.addEventListener('focus', () => {
        input.style.borderColor = 'rgba(100, 200, 255, 0.8)';
        input.style.boxShadow = '0 0 10px rgba(100, 200, 255, 0.2)';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(100, 200, 255, 0.2)';
        input.style.boxShadow = 'none';
      });
      return input;
    };

    this.usernameInput = createInput('Username');
    this.passwordInput = createInput('Password', 'password');

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '10px';

    const createBtn = (text, isPrimary = false) => {
      const btn = document.createElement('button');
      btn.innerText = text;
      btn.style.flex = '1';
      btn.style.padding = '12px';
      btn.style.background = isPrimary ? 'rgba(100, 200, 255, 0.2)' : 'transparent';
      btn.style.border = `1px solid ${isPrimary ? 'rgba(100, 200, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`;
      btn.style.borderRadius = '6px';
      btn.style.color = '#fff';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.3s ease';

      btn.addEventListener('mouseover', () => {
        btn.style.background = isPrimary ? 'rgba(100, 200, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        if (isPrimary) btn.style.boxShadow = '0 0 15px rgba(100, 200, 255, 0.4)';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.background = isPrimary ? 'rgba(100, 200, 255, 0.2)' : 'transparent';
        btn.style.boxShadow = 'none';
      });
      return btn;
    };

    const loginBtn = createBtn('Enter', true);
    const viewBtn = createBtn('Spectate');

    loginBtn.addEventListener('click', () => this.handleLogin());
    viewBtn.addEventListener('click', () => this.handleSpectate());

    // Add Enter key support
    this.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });

    buttonContainer.appendChild(viewBtn);
    buttonContainer.appendChild(loginBtn);

    this.loginPanel.appendChild(title);
    this.loginPanel.appendChild(this.usernameInput);
    this.loginPanel.appendChild(this.passwordInput);
    this.loginPanel.appendChild(buttonContainer);

    this.uiLayer.appendChild(this.loginPanel);
    document.body.appendChild(this.uiLayer);
  }

  handleLogin() {
    const user = this.usernameInput.value;
    const pass = this.passwordInput.value;

    if (user === 'snk' && pass === 'snk001') {
      this.playGodModeSound();
      this.showGoldParticles();
      this.closeUI();
      // Inform app that God mode is activated
      if (this.app.onGodModeActivated) {
        this.app.onGodModeActivated();
      }
    } else {
      // Shake animation for wrong password
      this.loginPanel.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ], { duration: 400 });
      this.usernameInput.style.borderColor = 'rgba(255, 50, 50, 0.6)';
      this.passwordInput.style.borderColor = 'rgba(255, 50, 50, 0.6)';
    }
  }

  handleSpectate() {
    this.closeUI();
    // Inform app to just start in viewer mode
    if (this.app.onSpectateActivated) {
      this.app.onSpectateActivated();
    }
  }

  closeUI() {
    this.uiLayer.style.opacity = '0';
    this.uiLayer.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      this.uiLayer.remove();
    }, 500);

    // Remove blur from canvas if it was added
    document.querySelector('canvas').style.filter = 'none';
  }

  playGodModeSound() {
    // Generate a futuristic activation sound using Web Audio API
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.warn("Audio Context not supported or allowed yet.");
    }
  }

  showGoldParticles() {
    // A quick DOM-based particle flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.background = 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(0,0,0,0) 70%)';
    flash.style.zIndex = '9999';
    flash.style.pointerEvents = 'none';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 1s ease-out';

    document.body.appendChild(flash);

    // Quick frame later trigger fade
    requestAnimationFrame(() => {
      flash.style.opacity = '0';
    });

    setTimeout(() => flash.remove(), 1000);
  }
}
