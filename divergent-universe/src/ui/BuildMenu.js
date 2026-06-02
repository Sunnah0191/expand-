export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.categories = document.querySelectorAll('.catalog-category');
        this.selectedType = 'mid-poly-rock'; // default to first item in landscape
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

        // Handle tab selection
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Remove active from all tabs and categories
                this.tabBtns.forEach(b => b.classList.remove('active'));
                this.categories.forEach(c => c.classList.remove('active'));

                // Add active to clicked tab
                btn.classList.add('active');

                // Add active to corresponding category
                const targetId = btn.dataset.target;
                document.getElementById(targetId).classList.add('active');
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
