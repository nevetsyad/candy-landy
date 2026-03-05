/**
 * input.js - Keyboard and Touch Input Handling
 * Manages all input events and state
 */

/**
 * InputManager class - Handles keyboard and touch input
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            dash: false
        };
    }

    /**
     * Initialize input listeners
     */
    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Prevent default for game keys
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    /**
     * Handle key down event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        this.previousKeys[e.key] = this.keys[e.key];
        this.keys[e.key] = true;
    }

    /**
     * Handle key up event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        this.previousKeys[e.key] = this.keys[e.key];
        this.keys[e.key] = false;
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key to check
     * @returns {boolean} - True if key is pressed
     */
    isPressed(key) {
        return this.keys[key] === true;
    }

    /**
     * Check if a key was just pressed this frame
     * @param {string} key - Key to check
     * @returns {boolean} - True if key was just pressed
     */
    wasJustPressed(key) {
        return this.keys[key] === true && this.previousKeys[key] !== true;
    }

    /**
     * Check if any jump key is pressed
     * @returns {boolean} - True if jump key is pressed
     */
    isJumpPressed() {
        return this.isPressed(' ') || this.isPressed('Enter') || this.isPressed('ArrowUp');
    }

    /**
     * Check if left movement is pressed
     * @returns {boolean} - True if left is pressed
     */
    isLeftPressed() {
        return this.isPressed('ArrowLeft') || this.touchControls.left;
    }

    /**
     * Check if right movement is pressed
     * @returns {boolean} - True if right is pressed
     */
    isRightPressed() {
        return this.isPressed('ArrowRight') || this.touchControls.right;
    }

    /**
     * Check if down is pressed
     * @returns {boolean} - True if down is pressed
     */
    isDownPressed() {
        return this.isPressed('ArrowDown') || this.touchControls.down;
    }

    /**
     * Check if dash is pressed
     * @returns {boolean} - True if dash is pressed
     */
    isDashPressed() {
        return this.isPressed('Shift') || this.touchControls.dash;
    }

    /**
     * Update touch controls state
     * @param {string} control - Control name
     * @param {boolean} state - Pressed state
     */
    updateTouchControl(control, state) {
        if (this.touchControls.hasOwnProperty(control)) {
            this.touchControls[control] = state;
        }
    }

    /**
     * Update previous keys state (call at end of frame)
     */
    update() {
        this.previousKeys = { ...this.keys };
    }

    /**
     * Clear all input state
     */
    clear() {
        this.keys = {};
        this.previousKeys = {};
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            dash: false
        };
    }
}

// Create singleton instance
export const inputManager = new InputManager();

// Export convenience functions for backward compatibility
export function initInput() {
    inputManager.init();
}

export function isKeyPressed(key) {
    return inputManager.isPressed(key);
}

export function wasKeyJustPressed(key) {
    return inputManager.wasJustPressed(key);
}
