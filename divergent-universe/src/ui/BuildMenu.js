export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.grids = document.querySelectorAll('.catalog-grid');
        this.selectedType = 'rock'; // default
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Toggle on '1', '`', '~', 'Ё', or 'ё'
        window.addEventListener('keydown', (e) => {
            if (e.key === '1' || e.key === '`' || e.key === '~' || e.key === 'Ё' || e.key === 'ё') {
                this.toggleVisibility();
            }
        });

        // Handle category selection
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update active button
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show matching grid
                const category = btn.dataset.category;
                let firstItemToSelect = null;

                this.grids.forEach(grid => {
                    if (grid.id === `grid-${category}`) {
                        grid.style.display = 'flex';
                        if (!firstItemToSelect) {
                            firstItemToSelect = grid.querySelector('.catalog-item');
                        }
                    } else {
                        grid.style.display = 'none';
                    }
                });

                // Auto-select first item in new category
                if (firstItemToSelect) {
                    this.selectItem(firstItemToSelect);
                }
            });
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
