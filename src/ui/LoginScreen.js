export class LoginScreen {
  constructor(onLoginSuccess) {
    this.onLoginSuccess = onLoginSuccess;
    this.container = document.createElement('div');
    this.container.id = 'login-screen';
    this.createUI();
    this.addStyles();
    document.getElementById('app').appendChild(this.container);

    // Enable pointer events for app container so we can interact with login
    document.getElementById('app').style.pointerEvents = 'auto';
  }

  createUI() {
    this.container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-box">
          <h1 class="login-title">DIVERGENT UNIVERSE</h1>
          <form id="login-form">
            <div class="input-group">
              <input type="text" id="username" placeholder="Nickname" autocomplete="off" />
              <div class="glow-border"></div>
            </div>
            <div class="input-group">
              <input type="password" id="password" placeholder="Password" autocomplete="off" />
              <div class="glow-border"></div>
            </div>
            <button type="submit" class="login-btn">
              <span>ENTER</span>
              <div class="btn-glow"></div>
            </button>
          </form>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#login-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  addStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      #login-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        font-family: 'Inter', sans-serif;
      }

      .login-wrapper {
        position: relative;
        padding: 40px;
        border-radius: 12px;
        background: rgba(10, 15, 25, 0.4);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 255, 255, 0.1);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.05);
        overflow: hidden;
        transition: opacity 0.5s ease-out;
      }

      .login-title {
        color: #fff;
        text-align: center;
        font-size: 24px;
        letter-spacing: 4px;
        margin-bottom: 40px;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        font-weight: 300;
      }

      .input-group {
        position: relative;
        margin-bottom: 25px;
        width: 300px;
      }

      .input-group input {
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: none;
        padding: 15px 15px;
        color: #fff;
        font-size: 16px;
        outline: none;
        box-sizing: border-box;
        transition: background 0.3s ease;
      }

      .input-group input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .input-group input:focus {
        background: rgba(0, 0, 0, 0.5);
      }

      .glow-border {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }

      .input-group input:focus ~ .glow-border,
      .input-group:hover .glow-border {
        height: 2px;
        background: #00ffff;
        box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
      }

      .login-btn {
        position: relative;
        width: 100%;
        padding: 15px;
        background: transparent;
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #fff;
        font-size: 16px;
        letter-spacing: 2px;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s ease;
        margin-top: 10px;
      }

      .login-btn span {
        position: relative;
        z-index: 2;
      }

      .btn-glow {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent);
        transition: left 0.5s ease;
        z-index: 1;
      }

      .login-btn:hover {
        border-color: #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
      }

      .login-btn:hover .btn-glow {
        left: 100%;
      }

      /* Gold effect for god mode */
      .god-mode-flash {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(0,0,0,0) 70%);
        opacity: 0;
        pointer-events: none;
        z-index: 200;
        transition: opacity 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  handleSubmit(e) {
    e.preventDefault();
    const user = this.container.querySelector('#username').value;
    const pass = this.container.querySelector('#password').value;

    let isGodMode = false;

    if (user === 'snk' && pass === 'snk001') {
      isGodMode = true;
      this.playGodModeEffect();
    }

    // Fade out and remove
    const wrapper = this.container.querySelector('.login-wrapper');
    wrapper.style.opacity = '0';

    setTimeout(() => {
      this.container.remove();
      // Re-disable pointer events for app container so canvas can get them
      document.getElementById('app').style.pointerEvents = 'none';
      this.onLoginSuccess(isGodMode);
    }, 500);
  }

  playGodModeEffect() {
    // Play sound (mocking a synth sound with AudioContext)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); // Slide up to A5

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {
      console.warn('AudioContext not supported or blocked');
    }

    // Visual flash
    const flash = document.createElement('div');
    flash.className = 'god-mode-flash';
    document.body.appendChild(flash);

    // Trigger reflow to ensure transition works
    void flash.offsetWidth;

    flash.style.opacity = '1';

    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 500);
    }, 200);
  }
}
