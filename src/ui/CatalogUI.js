export class CatalogUI {
  constructor(builderSystem) {
    this.builderSystem = builderSystem;
    this.isVisible = false;
    this.createUI();

    document.addEventListener('keydown', (e) => {
      // Toggle catalog on '1' or '~' or '`'
      if (e.key === '1' || e.key === '`' || e.key === '~') {
        if (this.builderSystem.enabled) {
          this.toggle();
        }
      }
    });
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'catalog-ui';
    this.container.className = 'glass-panel';

    // Style the catalog overlay
    Object.assign(this.container.style, {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '800px',
      padding: '20px',
      display: 'none',
      flexDirection: 'column',
      gap: '15px',
      zIndex: '100',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    const title = document.createElement('h2');
    title.innerText = 'Creation Catalog';
    title.style.margin = '0';
    title.style.fontWeight = '300';
    title.style.borderBottom = '1px solid rgba(100, 200, 255, 0.2)';
    title.style.paddingBottom = '10px';
    this.container.appendChild(title);

    const categories = {
      'Landscape': [
        { id: 'glass_tree', name: 'Glass Tree', type: 'model' },
        { id: 'crystal', name: 'Crystal Formation', type: 'model' }
      ],
      'WuWa Architecture': [
        { id: 'neon_monolith', name: 'Neon Monolith', type: 'model' },
        { id: 'glass_bridge', name: 'Glass Bridge', type: 'model' }
      ],
      'Constructor (Blocks)': [
        { id: 'block_glass', name: 'Glass Block', type: 'block' },
        { id: 'block_chrome', name: 'Chrome Block', type: 'block' },
        { id: 'block_neon', name: 'Neon Block', type: 'block' }
      ]
    };

    const grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexWrap = 'wrap';
    grid.style.gap = '10px';

    for (const [catName, items] of Object.entries(categories)) {
      const catHeader = document.createElement('h3');
      catHeader.innerText = catName;
      catHeader.style.width = '100%';
      catHeader.style.fontSize = '14px';
      catHeader.style.color = '#64c8ff';
      catHeader.style.marginTop = '10px';
      grid.appendChild(catHeader);

      items.forEach(item => {
        const btn = document.createElement('button');
        btn.innerText = item.name;
        Object.assign(btn.style, {
          padding: '10px 15px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(100, 200, 255, 0.3)',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        });

        btn.addEventListener('mouseover', () => {
          btn.style.borderColor = '#64c8ff';
          btn.style.boxShadow = '0 0 10px rgba(100, 200, 255, 0.2)';
        });

        btn.addEventListener('mouseout', () => {
          if (this.builderSystem.selectedBlockId !== item.id) {
            btn.style.borderColor = 'rgba(100, 200, 255, 0.3)';
            btn.style.boxShadow = 'none';
          }
        });

        btn.addEventListener('click', () => {
          // Reset other buttons
          Array.from(grid.querySelectorAll('button')).forEach(b => {
            b.style.background = 'rgba(0, 0, 0, 0.4)';
            b.style.borderColor = 'rgba(100, 200, 255, 0.3)';
          });

          btn.style.background = 'rgba(100, 200, 255, 0.2)';
          btn.style.borderColor = '#64c8ff';

          this.builderSystem.selectItem(item.id);
        });

        grid.appendChild(btn);
      });
    }

    this.container.appendChild(grid);

    // Add instruction text
    const hint = document.createElement('div');
    hint.innerText = 'Click to place. Press `1` or `~` to close.';
    hint.style.fontSize = '12px';
    hint.style.color = '#888';
    hint.style.textAlign = 'right';
    this.container.appendChild(hint);

    document.body.appendChild(this.container);
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      document.exitPointerLock(); // Free mouse to click UI
      this.container.style.display = 'flex';
      // Force reflow
      void this.container.offsetWidth;
      this.container.style.opacity = '1';
    } else {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.style.display = 'none';
      }, 300);
      // Re-engage pointer lock
      document.body.requestPointerLock();
    }
  }
}
