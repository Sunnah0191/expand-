const fs = require('fs');

const path = 'divergent-universe/src/style.css';
let content = fs.readFileSync(path, 'utf8');

// Update flash effect to be more golden particle-like and faster
content = content.replace('background-color: var(--neon-gold);', 'background-color: var(--neon-gold);\n  background-image: radial-gradient(circle, rgba(255,215,0,0.8) 10%, transparent 10%);\n  background-size: 10px 10px;');
content = content.replace('transition: opacity 0.8s ease-out;', 'transition: opacity 0.2s ease-in, opacity 0.8s ease-out 0.2s;');

fs.writeFileSync(path, content);
