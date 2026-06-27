export class BuildingCatalog {
  constructor(onSelect) {
    this.overlay = document.getElementById('catalog-overlay');
    this.onSelect = onSelect;
    this.isVisible = false;
    this.selectedItem = null;

    this.categories = [
      {
        id: 'landscape',
        name: 'Ландшафт',
        items: [
          { id: 'rock', type: 'rock', color: '#555' },
          { id: 'crystal', type: 'crystal', color: '#0ff' },
          { id: 'tree', type: 'tree', color: '#0f5' }
        ]
      },
      {
        id: 'architecture',
        name: 'Архитектура WuWa',
        items: [
          { id: 'monolith', type: 'monolith', color: '#222' },
          { id: 'tower', type: 'tower', color: '#113' },
          { id: 'bridge', type: 'bridge', color: '#8cf' }
        ]
      },
      {
        id: 'blocks',
        name: 'Конструктор',
        items: [
          { id: 'glass_block', type: 'block_glass', color: 'rgba(255,255,255,0.5)' },
          { id: 'neon_block', type: 'block_neon', color: '#f05' },
          { id: 'metal_block', type: 'block_metal', color: '#aaa' }
        ]
      }
    ];

    this.init();
    this.initEvents();
  }

  init() {
    this.categories.forEach(cat => {
      const catEl = document.createElement('div');
      catEl.className = 'catalog-category';

      const title = document.createElement('div');
      title.className = 'catalog-category-title';
      title.innerText = cat.name;
      catEl.appendChild(title);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'catalog-items';

      cat.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'catalog-item';
        itemEl.dataset.id = item.id;
        itemEl.dataset.type = item.type;

        // Simple visual representation instead of icons for now
        const icon = document.createElement('div');
        icon.style.width = '30px';
        icon.style.height = '30px';
        icon.style.backgroundColor = item.color;
        icon.style.borderRadius = item.type.includes('tree') ? '15px' : '4px';

        itemEl.appendChild(icon);

        itemEl.addEventListener('click', (e) => {
          document.querySelectorAll('.catalog-item').forEach(el => el.classList.remove('selected'));
          itemEl.classList.add('selected');
          this.selectedItem = item;
          if (this.onSelect) this.onSelect(item);
        });

        itemsContainer.appendChild(itemEl);
      });

      catEl.appendChild(itemsContainer);
      this.overlay.appendChild(catEl);
    });
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      // Toggle catalog with '1' or '~'
      if (e.key === '1' || e.key === '`' || e.key === '~' || e.key === 'Ё' || e.key === 'ё') {
        this.toggle();
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.overlay.style.display = this.isVisible ? 'flex' : 'none';
  }

  show() {
    this.isVisible = true;
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
  }
}
