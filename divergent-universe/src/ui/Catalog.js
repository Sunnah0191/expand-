export class Catalog {
  constructor(onSelectBuilding) {
    this.container = document.getElementById('build-catalog');
    this.reticle = document.getElementById('reticle');
    this.categoryBtns = document.querySelectorAll('.category-btn');
    this.grids = document.querySelectorAll('.catalog-grid');
    this.items = document.querySelectorAll('.catalog-item');

    this.isVisible = false;
    this.selectedType = null;
    this.onSelectBuilding = onSelectBuilding;

    // Toggle catalog shortcut
    window.addEventListener('keydown', (e) => {
      // Allow 1, ~, `, Ё, ё to toggle
      if (['1', '~', '`', 'Ё', 'ё'].includes(e.key)) {
        // Prevent toggle if we are in input fields
        if(document.activeElement.tagName === 'INPUT') return;
        this.toggle();
      }
    });

    // Category Switching
    this.categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.categoryBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const cat = e.target.dataset.category;
        this.grids.forEach(g => g.classList.add('hidden'));
        document.getElementById(`grid-${cat}`).classList.remove('hidden');
      });
    });

    // Item Selection
    this.items.forEach(item => {
      item.addEventListener('click', (e) => {
        this.items.forEach(i => i.classList.remove('selected'));
        e.currentTarget.classList.add('selected');

        this.selectedType = e.currentTarget.dataset.type;
        if(this.onSelectBuilding) {
          this.onSelectBuilding(this.selectedType);
        }
      });
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.container.classList.remove('hidden');
      document.exitPointerLock(); // Free mouse for catalog
    } else {
      this.container.classList.add('hidden');
      document.body.requestPointerLock(); // Lock back to fly
    }
  }

  showReticle(show) {
    if(show) {
      this.reticle.classList.remove('hidden');
    } else {
      this.reticle.classList.add('hidden');
    }
  }
}
