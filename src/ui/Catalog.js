export class Catalog {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.isVisible = false;
    this.container = document.createElement('div');
    this.container.id = 'catalog-ui';
    this.createUI();
    this.addStyles();
    document.body.appendChild(this.container);

    this.toggle = this.toggle.bind(this);
    window.addEventListener('keydown', (e) => {
      // Allow toggle with '1' or '~' or '`'
      if (e.key === '1' || e.key === '`' || e.key === '~') {
        this.toggle();
      }
    });
  }

  createUI() {
    this.container.innerHTML = `
      <div class="catalog-overlay">
        <h2 class="catalog-title">CONSTRUCTOR CATALOG</h2>
        <div class="catalog-categories">
          <div class="category" data-type="landscape">Landscape</div>
          <div class="category" data-type="wuwa">Architecture WuWa</div>
          <div class="category active" data-type="blocks">Constructor Blocks</div>
        </div>
        <div class="catalog-grid">
          <!-- Dummy items -->
          <div class="catalog-item" data-id="glass-block">
            <div class="item-preview glass-preview"></div>
            <span>Glass Block</span>
          </div>
          <div class="catalog-item" data-id="chrome-block">
            <div class="item-preview chrome-preview"></div>
            <span>Chrome Block</span>
          </div>
          <div class="catalog-item" data-id="neon-block">
            <div class="item-preview neon-preview"></div>
            <span>Neon Block</span>
          </div>
          <div class="catalog-item" data-id="matte-metal">
            <div class="item-preview metal-preview"></div>
            <span>Matte Metal</span>
          </div>
        </div>
      </div>
    `;

    // Category click
    const cats = this.container.querySelectorAll('.category');
    cats.forEach(c => {
      c.addEventListener('click', () => {
        cats.forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        // In full app, update grid here based on category
      });
    });

    // Item click
    const items = this.container.querySelectorAll('.catalog-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.onSelect(id);
        this.toggle(); // Close after select
      });
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      #catalog-ui {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none; /* hidden by default */
        justify-content: center;
        align-items: center;
        z-index: 150;
        font-family: 'Inter', sans-serif;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: auto;
      }

      .catalog-overlay {
        width: 80%;
        height: 80%;
        background: rgba(10, 15, 25, 0.6);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 0 50px rgba(0, 255, 255, 0.1) inset, 0 0 30px rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
      }

      .catalog-title {
        color: #fff;
        font-size: 20px;
        letter-spacing: 5px;
        text-shadow: 0 0 10px #00ffff;
        margin-top: 0;
        margin-bottom: 30px;
        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        padding-bottom: 15px;
      }

      .catalog-categories {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
      }

      .category {
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        padding: 10px 20px;
        border: 1px solid transparent;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 14px;
      }

      .category:hover {
        color: #fff;
        border-bottom: 1px solid rgba(255,255,255,0.5);
      }

      .category.active {
        color: #00ffff;
        border-bottom: 1px solid #00ffff;
        background: rgba(0, 255, 255, 0.1);
      }

      .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 30px;
        overflow-y: auto;
        padding-right: 10px;
      }

      /* Scrollbar */
      .catalog-grid::-webkit-scrollbar { width: 6px; }
      .catalog-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      .catalog-grid::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.3); border-radius: 3px; }

      .catalog-item {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .catalog-item:hover {
        border-color: #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
        transform: translateY(-5px);
      }

      .catalog-item span {
        margin-top: 15px;
        color: #ccc;
        font-size: 12px;
        text-align: center;
      }

      .item-preview {
        width: 60px;
        height: 60px;
        border-radius: 4px;
      }

      .glass-preview { background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(0,255,255,0.2)); border: 1px solid #00ffff; }
      .chrome-preview { background: linear-gradient(135deg, #eee, #999, #eee); }
      .neon-preview { background: #111; border: 2px solid #aa00ff; box-shadow: 0 0 10px #aa00ff; }
      .metal-preview { background: #222; border: 1px solid #444; }
    `;
    document.head.appendChild(style);
  }

  toggle() {
    if (this.isVisible) {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.style.display = 'none';
      }, 300);
      this.isVisible = false;
      document.getElementById('app').style.pointerEvents = 'none'; // give back to canvas
    } else {
      this.container.style.display = 'flex';
      // Trigger reflow
      void this.container.offsetWidth;
      this.container.style.opacity = '1';
      this.isVisible = true;
      document.getElementById('app').style.pointerEvents = 'auto'; // intercept clicks
    }
  }
}
