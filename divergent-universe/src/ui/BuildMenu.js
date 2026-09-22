export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.tabs = document.querySelectorAll('.catalog-tab');
        this.grids = document.querySelectorAll('.catalog-grid');
        this.selectedType = 'glass-cube'; // default
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Toggle on '1' or '`'
        window.addEventListener('keydown', (e) => {
            // Check for 1, `, ~, and Russian Ё/ё
            if (e.key === '1' || e.key === '`' || e.key === '~' || e.key === 'Ё' || e.key === 'ё' || e.keyCode === 192) {
                this.toggleVisibility();
            }
        });

        // Handle tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update active tab style
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show correct grid
                const category = tab.dataset.category;
                this.grids.forEach(grid => {
                    if (grid.dataset.categoryGrid === category) {
                        grid.classList.remove('hidden');
                    } else {
                        grid.classList.add('hidden');
                    }
                });
            });
        });

        // Handle item selection
        this.items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();

                // Remove selected class from all
                this.items.forEach(i => i.classList.remove('selected'));

                // Add to clicked
                item.classList.add('selected');
                this.selectedType = item.dataset.type;
            });
        });

        // Select first item by default
        if (this.items.length > 0) {
            this.items[0].classList.add('selected');
        }
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';

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
