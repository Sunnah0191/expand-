import { App } from './app.js';
import { LoginUI } from './ui/LoginUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  const app = new App(container);

  // Make app accessible globally for debugging if needed
  window.app = app;

  const loginUI = new LoginUI(app);

  // Blur the canvas initially while login is shown
  document.querySelector('canvas').style.filter = 'blur(10px)';

  app.onGodModeActivated = () => {
    console.log("God Mode Activated");
    app.initGodMode();
  };

  app.onSpectateActivated = () => {
    console.log("Spectator Mode Activated");
    // Default Three.js OrbitControls could be added here for spectator
  };

  app.start();
});
