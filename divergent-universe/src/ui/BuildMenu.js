export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.tabs = document.querySelectorAll('.catalog-tab');
        this.grids = document.querySelectorAll('.catalog-grid');
        this.selectedType = 'rock'; // default to first item in first tab
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Toggle on '1', '`', '~', 'ё', or 'Ё'
        window.addEventListener('keydown', (e) => {
            if (e.key === '1' || e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё') {
                this.toggleVisibility();
            }
        });

        // Handle tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetTab = tab.dataset.tab;

                // Update active tab style
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active grid visibility
                this.grids.forEach(grid => {
                    grid.classList.remove('active');
                    if (grid.id === `grid-${targetTab}`) {
                        grid.classList.add('active');
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
        const firstItem = document.querySelector('.catalog-grid.active .catalog-item');
        if (firstItem) {
            firstItem.classList.add('selected');
            this.selectedType = firstItem.dataset.type;
        }
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
