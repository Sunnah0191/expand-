export class LoginScreen {
    constructor(onSuccess) {
        this.onSuccess = onSuccess;
        this.container = document.getElementById('login-screen');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('login-btn');
        this.errorMsg = document.getElementById('login-error');
        this.flashEl = document.getElementById('god-mode-flash');

        this.initEventListeners();
    }

    initEventListeners() {
        this.loginBtn.addEventListener('click', () => this.handleLogin());

        // Allow pressing Enter
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
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (username === 'snk' && password === 'snk001') {
            this.triggerSuccess();
        } else {
            // Normal viewer mode can be implemented here,
            // but for now we'll just show an error if it's not the admin
            // Or we could let them in as a viewer:
            if (username === '' && password === '') {
                 this.triggerSuccess(false); // viewer mode
            } else {
                 this.showError();
            }
        }
    }

    showError() {
        this.errorMsg.style.display = 'block';
        this.loginBtn.style.borderColor = '#ff4a4a';
        this.loginBtn.style.color = '#ff4a4a';
        setTimeout(() => {
            this.errorMsg.style.display = 'none';
            this.loginBtn.style.borderColor = 'var(--neon-cyan)';
            this.loginBtn.style.color = 'white';
        }, 2000);
    }

    triggerSuccess(isAdmin = true) {
        // Play activation sound
        this.playActivationSound();

        // Flash effect
        if (isAdmin) {
            // Force reflow in case it's already running
            this.flashEl.classList.remove('flash-active');
            void this.flashEl.offsetWidth;
            this.flashEl.classList.add('flash-active');
        }

        // Fade out login screen
        this.container.style.opacity = '0';

        setTimeout(() => {
            this.container.style.display = 'none';
            if (isAdmin) {
                this.flashEl.classList.remove('flash-active');
            }

            // Callback to main game loop to init controls
            if (this.onSuccess) {
                this.onSuccess(isAdmin);
            }
        }, 1000); // Wait for transition
    }

    playActivationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();

            // Simple synth sound
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.warn("AudioContext not supported or blocked");
        }
    }
}
