// Updated content of engine.js with destroy method and event listener cleanup

class WASDCamera {
    //... other methods and properties

    destroy() {
        // Cleanup logic
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    // Additional methods
}

// Other content of engine.js
