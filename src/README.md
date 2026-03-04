# Candy Landy - Source Modules

This directory contains the modularized source code for Candy Landy, organized into separate ES6 modules for better maintainability and code organization.

## Sprint 4 Enhancements

### Enhanced Particle System (`particles.js`)
- Multiple particle shapes: circles, stars, hearts, diamonds, rings
- Glow effects with configurable colors and sizes
- Trail effects for movement
- Sparkle and wave animations
- Color variation for natural look
- Particle shrinking with configurable rates

### UI Enhancements (`ui.js`)
- **AchievementSystem class**: Tracks 13 achievements with localStorage persistence
- **TransitionManager class**: Smooth screen transitions (fade, swipe, zoom, candy)
- Enhanced screen shake with presets (light, medium, heavy, explosion, stomp, collect, hit)
- Achievement notifications with slide-in animation
- Achievements menu with progress tracking

### Game Enhancements (`game.js`)
- Achievement unlocking on various actions
- Transition effects between game states
- Enhanced visual feedback for all actions
- Improved combo tracking with max combo recording
- Perfect level and speedrun detection

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

### `particles.js` - Enhanced Particle System
Handles particle creation, updates, and rendering for visual effects.

**Sprint 4 Features:**
- Multiple shapes (circle, star, heart, diamond, ring)
- Glow effects with radial gradients
- Trail effects for motion blur
- Wave motion for floating particles
- Sparkle effect for highlights
- Color variation for natural appearance

**Exports:**
- `Particle` class - Individual particle with enhanced effects
- `ParticleSystem` class - Manages all particles
- `particleSystem` - Singleton instance
- Convenience functions: `createParticles()`, `createExplosion()`, `createConfetti()`, `createSparkles()`, `createRingBurst()`, `createPowerUpEffect()`, `createSecretEffect()`, `createInvincibilityAura()`, `createDashTrail()`

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

**Sprint 4 Enhancements:**
- Enhanced invincibility visual with dramatic aura
- Improved dash trail with gradient effect
- Better wall slide visual with motion lines

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

### `ui.js` - User Interface with Achievements and Transitions
Handles all UI rendering including HUD, menus, level select, start screens, transitions, and achievements.

**Sprint 4 Features:**
- **AchievementSystem class**: Full achievement tracking with 13 achievements
- **TransitionManager class**: Four transition types (fade, swipe, zoom, candy)
- Enhanced screen shake with type-based patterns
- Achievement notification system
- Achievements menu with stats display

**Exports:**
- `AchievementSystem` class - Achievement tracking and display
- `TransitionManager` class - Screen transition effects
- `UIManager` class - Manages all UI rendering

**Dependencies:**
- `config.js` (SETTINGS, CANVAS, COLORS, HINT_DURATION)
- `levels.js` (levels, levelManager)
- `player.js` (Player)
- `particles.js` (particleSystem)

---

### `game.js` - Main Game Controller
The main game loop, state machine, and initialization.

**Sprint 4 Enhancements:**
- Achievement unlocking integration
- Transition effects between states
- Enhanced visual feedback for all game events
- Perfect level and speedrun tracking
- Improved damage and death handling

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
3. `particles.js` - Enhanced particle system (no dependencies)
4. `input.js` - Input handling (no dependencies)
5. `levels.js` - Level data (depends on config)
6. `player.js` - Player class (depends on config, particles, audio, input)
7. `ui.js` - UI rendering with achievements and transitions (depends on config, levels, player, particles)
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
5. **Visual Enhancement**: Sprint 4 adds glow, transitions, and achievements as cross-cutting concerns

## Migration Notes

The original `enhanced-game.js` (2,478 lines) has been split into these modules:

- `config.js` - ~90 lines
- `audio.js` - ~400 lines
- `particles.js` - ~550 lines (Sprint 4: enhanced)
- `input.js` - ~120 lines
- `levels.js` - ~340 lines
- `player.js` - ~650 lines (Sprint 4: enhanced visuals)
- `ui.js` - ~1400 lines (Sprint 4: achievements + transitions)
- `game.js` - ~1100 lines (Sprint 4: achievement integration)

Total: ~4,650 lines (including documentation and enhanced features)

The increase in line count is due to:
- ES6 class syntax (more verbose but clearer)
- JSDoc documentation comments
- Better code organization with clear module boundaries
- Sprint 4 enhancements (particles, transitions, achievements)
- Comprehensive visual effect system
