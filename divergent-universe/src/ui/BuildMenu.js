export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.grids = document.querySelectorAll('.catalog-grid');
        this.selectedType = 'rock'; // default to first item in first category
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Category switching
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update active button
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show corresponding grid
                const category = btn.dataset.category;
                this.grids.forEach(grid => {
                    if (grid.id === `grid-${category}`) {
                        grid.style.display = 'flex';
                        // Auto-select first item in new category
                        const firstItem = grid.querySelector('.catalog-item');
                        if (firstItem) {
                            this.selectItem(firstItem);
                        }
                    } else {
                        grid.style.display = 'none';
                    }
                });
            });
        });

        // Toggle on '1' or '`'
        window.addEventListener('keydown', (e) => {
            if (e.key === '1' || e.key === '`' || e.key === '~') {
                this.toggleVisibility();
            }
        });

        // Handle item selection
        this.items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item);
            });
        });

        // Select first item by default
        const initialGrid = document.getElementById('grid-landscape');
        if (initialGrid) {
            const firstItem = initialGrid.querySelector('.catalog-item');
            if (firstItem) {
                this.selectItem(firstItem);
            }
        }
    }

    selectItem(item) {
        // Remove selected class from all
        this.items.forEach(i => i.classList.remove('selected'));

        // Add to clicked
        item.classList.add('selected');
        this.selectedType = item.dataset.type;
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';

        // When menu is open, release pointer lock so user can click
        if (this.isVisible) {
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            if(document.exitPointerLock) document.exitPointerLock();
        } else {
            // Regain pointer lock if we close the menu
            const app = document.getElementById('app');
            app.requestPointerLock = app.requestPointerLock || app.mozRequestPointerLock;
            if (app.requestPointerLock) app.requestPointerLock();
        }
    }

    getSelectedType() {
        return this.selectedType;
    }
}
