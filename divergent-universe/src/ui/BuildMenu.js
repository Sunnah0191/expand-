export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.tabs = document.querySelectorAll('.catalog-tab');
        this.grids = document.querySelectorAll('.catalog-grid');
        this.items = document.querySelectorAll('.catalog-item');

        // Start with a valid default based on the first tab
        this.selectedType = 'midpoly-rock';
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();

                // Remove active from all tabs and grids
                this.tabs.forEach(t => t.classList.remove('active'));
                this.grids.forEach(g => g.classList.remove('active'));

                // Add active to clicked tab
                tab.classList.add('active');

                // Add active to target grid
                const targetId = `cat-${tab.dataset.target}`;
                const targetGrid = document.getElementById(targetId);
                if (targetGrid) {
                    targetGrid.classList.add('active');

                    // Optionally auto-select the first item in the new tab
                    const firstItem = targetGrid.querySelector('.catalog-item');
                    if (firstItem) {
                        this.selectItem(firstItem);
                    }
                }
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
        if (this.items.length > 0) {
            this.selectItem(this.items[0]);
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
