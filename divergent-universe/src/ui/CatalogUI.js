export function initCatalog(appState) {
  const catalogOverlay = document.getElementById('catalog-overlay');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const itemsContainer = document.getElementById('catalog-items-container');

  // Keep track of app state
  window._appState = appState;

  const catalogData = {
    landscape: [
      { id: 'rock1', name: 'Mid-poly скала' },
      { id: 'crystal', name: 'Стеклянный кристалл' },
      { id: 'neon_tree', name: 'Неоновое дерево' }
    ],
    wuwa: [
      { id: 'monolith', name: 'Футуристичный монолит' },
      { id: 'tower', name: 'Левитирующая башня' },
      { id: 'bridge', name: 'Матовый мост' }
    ],
    blocks: [
      { id: 'glass_block', name: 'Стеклянный блок' },
      { id: 'chrome_block', name: 'Хромовый блок' },
      { id: 'neon_block', name: 'Неоновый блок' },
      { id: 'metal_block', name: 'Металлический блок' }
    ]
  };

  function renderItems(category) {
    itemsContainer.innerHTML = '';
    const items = catalogData[category] || [];

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'catalog-item';
      el.dataset.id = item.id;
      el.innerHTML = `<span>${item.name}</span>`;

      el.addEventListener('click', () => {
        window._appState.selectedBlock = item.id;
        toggleCatalog(false);
        // Start building mode
        document.getElementById('crosshair').style.display = 'block';
      });

      itemsContainer.appendChild(el);
    });
  }

  // Initial render
  renderItems('landscape');

  // Tab switching
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderItems(btn.dataset.category);
    });
  });
}

export function toggleCatalog(forceOpen) {
  const catalogOverlay = document.getElementById('catalog-overlay');

  if (forceOpen === undefined) {
    window._appState.isCatalogOpen = !window._appState.isCatalogOpen;
  } else {
    window._appState.isCatalogOpen = forceOpen;
  }

  if (window._appState.isCatalogOpen) {
    catalogOverlay.style.display = 'flex';
    document.exitPointerLock(); // Exit pointer lock to use UI
    document.getElementById('crosshair').style.display = 'none';
  } else {
    catalogOverlay.style.display = 'none';
    if (window._appState.isGodMode) {
      document.body.requestPointerLock(); // Return to fly mode
      if (window._appState.selectedBlock) {
        document.getElementById('crosshair').style.display = 'block';
      }
    }
  }
}
