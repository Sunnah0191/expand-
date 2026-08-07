export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');
        this.selectedType = 'glass-block'; // default
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

        // Select glass-block by default, or first item if not found
        let foundDefault = false;
        this.items.forEach(item => {
            if (item.dataset.type === 'glass-block') {
                item.classList.add('selected');
                this.selectedType = 'glass-block';
                foundDefault = true;
            }
        });

        if (!foundDefault && this.items.length > 0) {
            this.items[0].classList.add('selected');
            this.selectedType = this.items[0].dataset.type;
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
