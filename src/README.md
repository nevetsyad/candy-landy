# Candy Landy - Source Modules

This directory contains the modularized source code for Candy Landy, organized into separate ES6 modules for better maintainability and code organization.

## Module Structure

### `config.js` - Game Constants and Settings
Contains all game configuration, constants, and settings used throughout the game.

**Exports:**
- `POWER_UPS` - Power-up type constants (SPEED, JUMP, SHIELD, DOUBLE_POINTS, DASH)
- `SETTINGS` - Game settings (volume, combo timer, screen shake, particle intensity)
- `PHYSICS` - Physics constants (gravity, terminal velocity, player speed, jump power)
- `PLAYER_CONFIG` - Player configuration (dimensions, start position, lives, timing)
- `GROUND_POUND` - Ground pound mechanic constants
- `HINT_DURATION` - Tutorial hint display duration
- `CANVAS` - Canvas dimensions
- `COLORS` - Color constants for rendering

**Dependencies:** None

---

### `audio.js` - Sound System
Manages all audio functionality including sound effects and background music using the Web Audio API.

**Exports:**
- `AudioManager` class - Main audio controller
- `audioManager` - Singleton instance
- Convenience functions: `initAudio()`, `resumeAudio()`, `playSound()`, `startBackgroundMusic()`, `stopBackgroundMusic()`

**Dependencies:**
- `config.js` (SETTINGS)

---

### `particles.js` - Particle System
Handles particle creation, updates, and rendering for visual effects.

**Exports:**
- `Particle` class - Individual particle
- `ParticleSystem` class - Manages all particles
- `particleSystem` - Singleton instance
- Convenience functions: `createParticles()`, `createExplosion()`, `createConfetti()`, `updateParticles()`, `drawParticles()`

**Dependencies:** None

---

### `input.js` - Input Handling
Manages keyboard and touch input for player controls.

**Exports:**
- `InputManager` class - Handles all input
- `inputManager` - Singleton instance
- Convenience functions: `initInput()`, `isKeyPressed()`, `wasKeyJustPressed()`

**Dependencies:** None

---

### `levels.js` - Level Data and Management
Contains all level definitions and manages level loading/progress.

**Exports:**
- `Level` class - Represents a single game level
- `LevelManager` class - Manages level loading and progress
- `levelManager` - Singleton instance
- `levels` - Array of all level data
- `levelData` - Raw level data

**Dependencies:**
- `config.js` (POWER_UPS)

---

### `player.js` - Player and Enemy Classes
Contains the Player class with movement, physics, and interactions, plus the Enemy class.

**Exports:**
- `Player` class - Main player character with all movement and physics
- `Enemy` class - Enemy entity
- `player` - Default player instance

**Dependencies:**
- `config.js` (POWER_UPS, SETTINGS, PHYSICS, PLAYER_CONFIG, GROUND_POUND, CANVAS)
- `particles.js` (particleSystem)
- `audio.js` (audioManager)
- `input.js` (inputManager)

---

### `ui.js` - User Interface
Handles all UI rendering including HUD, menus, level select, and start screens.

**Exports:**
- `UIManager` class - Manages all UI rendering

**Dependencies:**
- `config.js` (SETTINGS, CANVAS, COLORS, HINT_DURATION)
- `levels.js` (levels, levelManager)
- `player.js` (Player)
- `particles.js` (particleSystem)

---

### `game.js` - Main Game Controller
The main game loop, state machine, and initialization.

**Exports:**
- `Game` class - Main game controller

**Dependencies:**
- All other modules

---

## Dependency Graph

```
config.js (no dependencies)
    ↓
audio.js ← config.js
particles.js (no dependencies)
input.js (no dependencies)
    ↓
levels.js ← config.js
    ↓
player.js ← config.js, particles.js, audio.js, input.js
    ↓
ui.js ← config.js, levels.js, player.js, particles.js
    ↓
game.js ← all modules
```

## Loading Order

When using ES6 modules, the browser automatically handles the loading order based on imports. The modules should be loaded in this logical order:

1. `config.js` - Core configuration (no dependencies)
2. `audio.js` - Audio system (depends on config)
3. `particles.js` - Particle system (no dependencies)
4. `input.js` - Input handling (no dependencies)
5. `levels.js` - Level data (depends on config)
6. `player.js` - Player class (depends on config, particles, audio, input)
7. `ui.js` - UI rendering (depends on config, levels, player, particles)
8. `game.js` - Main game (depends on all)

## Usage

The game is initialized by loading `game.js` as an ES6 module:

```html
<script type="module" src="src/game.js"></script>
```

For browsers without ES6 module support, a fallback is provided:

```html
<script nomodule src="enhanced-game.js"></script>
```

## Code Organization Principles

1. **Single Responsibility**: Each module has a clear, focused purpose
2. **Dependency Injection**: Modules export classes and singleton instances
3. **Configuration Centralization**: All constants are in `config.js`
4. **Backward Compatibility**: Convenience functions maintain compatibility with the original monolithic code

## Migration Notes

The original `enhanced-game.js` (2,478 lines) has been split into these modules:

- `config.js` - ~90 lines
- `audio.js` - ~400 lines
- `particles.js` - ~280 lines
- `input.js` - ~120 lines
- `levels.js` - ~340 lines
- `player.js` - ~630 lines
- `ui.js` - ~820 lines
- `game.js` - ~900 lines

Total: ~3,580 lines (including documentation and class structure)

The increase in line count is due to:
- ES6 class syntax (more verbose but clearer)
- JSDoc documentation comments
- Better code organization with clear module boundaries
