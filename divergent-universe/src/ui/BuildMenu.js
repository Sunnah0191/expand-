export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.selectedType = 'glass-cube'; // default
        this.isVisible = false;

        this.initEventListeners();
    }

    initEventListeners() {
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
            this.selectedType = this.items[0].dataset.type;
        }

        // Handle category switching
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.catalogTitle = document.getElementById('catalog-title');

        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update active button
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update title
                this.catalogTitle.innerText = btn.innerText;

                // Show/hide items based on category
                const category = btn.dataset.category;
                this.items.forEach(item => {
                    if (item.classList.contains(category)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
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
