export class LoginScreen {
    constructor(onSuccess) {
        this.onSuccess = onSuccess;
        this.container = document.getElementById('login-screen');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('login-btn');
        this.errorMsg = document.getElementById('login-error');
        this.flashEl = document.getElementById('god-mode-flash');
        this.particlesContainer = document.getElementById('god-mode-particles');

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
            this.flashEl.classList.add('flash-active');
            this.createGoldenParticles();
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
            // Futuristic boot up sound
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.2);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);

            // Add a secondary osc for a "chord" feeling
            const osc2 = ctx.createOscillator();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(110, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
            osc2.connect(gainNode);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.6);
        } catch (e) {
            console.warn("AudioContext not supported or blocked");
        }
    }

    createGoldenParticles() {
        if (!this.particlesContainer) return;

        const numParticles = 100;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random size
            const size = Math.random() * 8 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            // Start at center
            particle.style.left = `${cx}px`;
            particle.style.top = `${cy}px`;

            // Random destination
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.max(cx, cy) + 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            // Random delay
            const delay = Math.random() * 0.2;
            particle.style.animationDelay = `${delay}s`;

            this.particlesContainer.appendChild(particle);

            // Clean up
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000 + delay * 1000);
        }
    }
}
