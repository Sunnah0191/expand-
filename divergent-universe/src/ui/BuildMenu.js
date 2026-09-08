export class BuildMenu {
    constructor() {
        this.container = document.getElementById('build-catalog');
        this.items = document.querySelectorAll('.catalog-item');

        this.isVisible = false;

        this.initEventListeners();

        // Set initial selected type to the first item's type
        if (this.items.length > 0) {
            this.selectedType = this.items[0].dataset.type;
        } else {
            this.selectedType = 'rock'; // fallback
        }
    }

    initEventListeners() {
        // Toggle on '1', '`', '~', 'Ё', or 'ё'
        window.addEventListener('keydown', (e) => {
            if (e.key === '1' || e.key === '`' || e.key === '~' || e.key === 'Ё' || e.key === 'ё' || e.code === 'Backquote' || e.code === 'Digit1') {
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

        // Select first item by default visually
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
