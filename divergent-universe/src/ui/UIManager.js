import { toggleCatalog, initCatalog } from './CatalogUI.js';
import { enableGodMode } from '../controls/ControlsManager.js';

export function setupUI(appState, canvas, camera, scene) {
  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginScreen = document.getElementById('login-screen');
  const flashOverlay = document.getElementById('flash-overlay');

  initCatalog(appState);

  loginBtn.addEventListener('click', attemptLogin);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  function attemptLogin() {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (user === 'snk' && pass === 'snk001') {
      // God Mode activated
      activateGodMode();
    } else {
      // Normal viewer login
      enterViewerMode();
    }
  }

  function activateGodMode() {
    // Flash effect
    flashOverlay.style.opacity = '1';

    // Play activation sound (simulated here)
    console.log("Play futuristic activation sound");

    setTimeout(() => {
      loginScreen.style.display = 'none';
      canvas.classList.remove('blur-canvas');
      flashOverlay.style.opacity = '0';

      appState.isGodMode = true;
      enableGodMode();

      // Setup catalog toggle shortcut
      window.addEventListener('keydown', (e) => {
        // Handle 1, ~, `, Ё, ё
        if (e.key === '1' || e.key === '`' || e.key === '~' || e.key.toLowerCase() === 'ё') {
          if (!appState.isCatalogOpen) {
            toggleCatalog(true);
          } else {
            toggleCatalog(false);
          }
        }
      });

    }, 100); // Short delay for the flash
  }

  function enterViewerMode() {
    loginScreen.style.display = 'none';
    canvas.classList.remove('blur-canvas');
    // Basic rotating camera around center
    appState.isViewer = true;
  }
}
