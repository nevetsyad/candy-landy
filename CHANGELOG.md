# Changelog

All notable changes to Candy Landy will be documented in this file.

## [5.0.0] - 2026-03-04

### Major Release - Enhanced Edition v5

This release represents a complete overhaul with 5 development sprints implementing mobile support, quality of life improvements, code organization, visual enhancements, and comprehensive documentation.

### Sprint 1: Mobile & Stability
#### Added
- **Mobile Touch Controls**
  - D-pad for directional movement (up, down, left, right)
  - Action buttons for jump (green) and dash (yellow)
  - Visual touch feedback with animations
  - Responsive design for all screen sizes
  - Prevention of default mobile behaviors (double-tap zoom, pinch zoom)
  
- **iOS Audio Fix**
  - "Tap to Play" overlay for audio initialization
  - Automatic audio context resume on user interaction
  - Multiple touch event handlers for reliable audio
  - No autoplay policy violations
  
- **Landscape Orientation Prompt**
  - Automatic detection of portrait mode
  - Animated rotate icon with instructions
  - Auto-dismissal when rotated to landscape
  - Orientation change event handling
  
- **Checkpoint Improvements**
  - 1-second invincibility after respawn (reduced from 2 seconds)
  - Enhanced visual feedback during invincibility
  - Debug logging for testing

### Sprint 2: Quality of Life
#### Added
- **Level Select Screen**
  - Visual level cards with thumbnails (🎓, 🎢, 🔥)
  - Level information display (name, description, best score, secrets found)
  - Level locking system (complete previous to unlock next)
  - Keyboard navigation (1-3 to select, SPACE to start, ESC to go back)
  - Persistent best scores per level
  
- **Tutorial Popup System**
  - Context-sensitive hints triggered by player actions
  - 6 unique tutorial messages:
    - Jump hint (first time grounded)
    - Double jump hint (first air jump)
    - Enemy stomp hint (near enemy)
    - Checkpoint hint (near checkpoint)
    - Dash hint (when dash available)
    - Ground pound hint (when airborne)
  - Auto-dismiss after 5 seconds
  - Session-based (shows once per session)
  - Sparkle particle effects
  
- **Ground Pound Attack**
  - Input: DOWN + JUMP while airborne
  - Fast downward velocity (25 units/frame)
  - Damages enemies in 80-pixel radius
  - 75 bonus points per enemy killed
  - 1-second cooldown between uses
  - Once per jump limitation
  - Orange particle trail while falling
  - Screen shake on impact
  - Explosion and ring burst particle effects
  - Custom ground pound sound effect
  - "Ground Pounder" achievement
  
- **Secret Collectibles**
  - 2 hidden purple diamonds per level (6 total)
  - Worth 500 points each
  - Pulsing purple/gold glow effect
  - Sparkle particle animations
  - HUD display: "💎 Secrets: X/2"
  - Level select display per level
  - localStorage persistence
  - Collection effects (screen shake, particle burst)
  - "Treasure Hunter" achievement

### Sprint 3: Code Organization
#### Changed
- **Complete Modularization**
  - Split monolithic enhanced-game.js (2,478 lines) into 8 ES6 modules
  - Total: ~4,650 lines (including documentation and enhancements)
  
#### Added
- **ES6 Module Structure**
  - `config.js` (~90 lines) - Game constants and settings
  - `audio.js` (~400 lines) - Sound system with Web Audio API
  - `particles.js` (~550 lines) - Enhanced particle system
  - `input.js` (~120 lines) - Keyboard and touch input handling
  - `levels.js` (~340 lines) - Level data and management
  - `player.js` (~650 lines) - Player and Enemy classes
  - `ui.js` (~1400 lines) - HUD, menus, achievements, transitions
  - `game.js` (~1100 lines) - Main game loop and controller
  - Fallback to enhanced-game.js for non-module browsers
  
- **Module Documentation**
  - Comprehensive src/README.md
  - JSDoc comments throughout
  - Dependency graph documentation
  - Usage examples

### Sprint 4: Quality Improvements
#### Added
- **Screen Transitions**
  - 4 transition types: fade, swipe, zoom, candy fall
  - Smooth transitions between all game states
  - 30-60 frame durations (0.5-1.0 seconds)
  - Candy-themed design throughout
  - TransitionManager class
  
- **Enhanced Visual Effects**
  - **Improved Particle System**
    - 5 particle shapes (circle, star, heart, diamond, ring)
    - Configurable glow effects with radial gradients
    - Trail effects for motion blur
    - Wave motion for floating particles
    - Sparkle and color variation
    - Particle shrinking with configurable rates
    - Maximum 500 particles for performance
    
  - **Enhanced Screen Shake**
    - 7 shake presets (light, medium, heavy, explosion, stomp, collect, hit)
    - Type-based shake patterns
    - Improved decay curves
    
  - **Glow Effects**
    - Power-ups with pulsing glow
    - Secret collectibles with sparkle aura
    - Checkpoints with green glow
    - Candies with golden shimmer
    
  - **Enhanced Invincibility Visual**
    - Dramatic flashing with multiple colors
    - Golden aura with pulsing size
    - White inner glow
    
  - **Improved Dash Trail**
    - Longer trail (5 segments)
    - Gradient coloring
    - More visible and dramatic
  
- **Achievement System**
  - 13 achievements with localStorage persistence:
    - First Hop - Jump for the first time
    - Stomper - Defeat an enemy by stomping
    - Sky High - Perform a double jump
    - Speedster - Use the dash ability
    - Ground Pounder - Perform a ground pound
    - Perfect Run - Complete level without damage
    - Treasure Hunter - Find all secrets in a level
    - Combo Master - Reach 5x combo
    - Combo Legend - Reach 10x combo
    - Speed Runner - Complete level in under 30 seconds
    - Untouchable - Complete all levels without dying
    - Candy Collector - Collect 100 candies total
    - Champion - Complete the entire game
  - Slide-in notification animations
  - Achievements menu (Press A)
  - Achievement cards with unlock status
  - Stats display (candies, enemies, deaths)
  - Progress tracking
  - Auto-save on unlock
  - AchievementSystem class

### Sprint 5: Testing & Documentation
#### Added
- **Comprehensive Documentation**
  - Updated README.md with complete v5 feature list
  - Created TESTING.md with 202-item test checklist
  - Created CONTRIBUTING.md with development guide
  - Updated src/README.md with Sprint 4 enhancements
  - Updated CHANGELOG.md with version history
  
- **Testing Infrastructure**
  - Manual testing checklist covering all features
  - Edge case testing guidelines
  - Performance testing benchmarks
  - Mobile testing procedures
  - Browser compatibility matrix
  - Console error checking
  
- **Code Quality**
  - Fixed missing achievement unlocks (firstJump, firstDoubleJump)
  - Verified all Sprint 1-4 features working correctly
  - No console errors or warnings
  - Performance validated at 60fps
  - Memory usage stable

### Changed
- Version updated from v4 to v5 in all documentation
- Enhanced mobile.css with transition and achievement styles
- Improved index.html with achievement notification placeholder

### Fixed
- Missing firstJump achievement unlock
- Missing firstDoubleJump achievement unlock
- Jump tracking across level transitions

### Technical Details
- **Total Lines of Code**: ~4,650 lines (modular) + 2,478 lines (fallback)
- **No External Dependencies**: Pure vanilla JavaScript
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari, Chrome Android
- **Performance**: 60fps gameplay, max 500 particles, stable memory

### Migration from v4
No migration needed. v5 is backward compatible with v4 save data (high scores, achievements, level progress).

---

## [2.0.0] - 2025-02-25

### Added
- **Complete Sound System** using Web Audio API
  - Jump, collect, power-up, hurt, victory, game over, and landing sounds
  - Volume controls (0-5 keys) with mute option
  - Master volume adjustment
  
- **Sophisticated Scoring System**
  - Combo multipliers (up to 5x) for rapid candy collection
  - Time bonuses based on level completion speed
  - High score tracking with localStorage (top 10 scores)
  - Score persistence across browser sessions
  
- **Enhanced Particle Effects**
  - Candy collection particles (star bursts)
  - Jump and landing particles
  - Power-up collection effects
  - Enemy defeat celebrations
  - Multiple particle shapes (square, circle, star)
  
- **Diverse Platform Types**
  - Normal platforms (stable)
  - Moving platforms (horizontal patrol)
  - Disappearing platforms (timed fade)
  - Visual indicators for each type
  
- **Enemy System**
  - Animated walker enemies
  - Patrol behavior within defined ranges
  - Collision detection with player
  - Defeat mechanic when invincible
  - Knockback on player damage
  
- **Power-Up System**
  - Speed Boost (⚡) - 60% faster movement
  - Invincibility (★) - Defeat enemies, no damage
  - Triple Jump (↑↑) - Three aerial jumps
  - Visual glow effects and floating animation
  - Timer display showing remaining duration
  
- **Level Progression**
  - 3 unique levels with increasing difficulty
  - Level-specific platform and enemy layouts
  - Progressive introduction of mechanics
  - Level complete screens with bonuses
  - Continue system between levels
  
- **Background Animations**
  - Gradient sky background
  - Animated drifting clouds
  - Floating background candies
  - Parallax-like motion effects
  
- **Enhanced Visual Design**
  - Improved character animations (pigtails, legs, arms)
  - Canvas gradients for glows and backgrounds
  - Platform shadows and highlights
  - Candy glow and shine effects
  - Flag waving animation
  - Screen shake on damage
  - Confetti on victory
  
- **Improved UI/UX**
  - Polished start screen with instructions
  - In-game HUD with score, high score, level, jumps
  - Combo display with multiplier
  - Power-up status indicators with timers
  - Pause functionality (ESC key)
  - Smooth game state transitions
  - Volume control hints
  
- **Better Collision Detection**
  - Improved platform collision with velocity checking
  - Previous position tracking to prevent clipping
  - AABB collision for enemies and power-ups
  - Circle-based distance for candy collection
  
- **Documentation**
  - Comprehensive README with controls and tips
  - Detailed FEATURES.md with all implemented features
  - Updated DEPLOY.md with deployment options
  - Changelog (this file)

### Changed
- Renamed main game file from `game.js` to `enhanced-game.js`
- Updated index.html to reference enhanced version
- Added improved CSS styling with gradient background
- Updated package.json with better metadata and scripts

### Technical
- Approximately 1,600 lines of enhanced JavaScript code
- 9 well-organized classes
- No external dependencies
- Pure vanilla JavaScript, HTML5 Canvas, and Web Audio API

## [1.0.0] - 2025-02-22

### Initial Release
- Basic platformer game
- Character (Emmaline) with animations
- Double jump mechanics
- Simple candy collection
- Basic platforms
- Start/win/lose screens
- Simple scoring system
- Single level

---

## Future Plans

### Potential Enhancements
- [ ] Mobile touch controls
- [ ] Additional levels (4+)
- [ ] More enemy types
- [ ] Boss battles
- [ ] Achievements system
- [ ] Level editor
- [ ] Custom sound file support
- [ ] Multiplayer mode
- [ ] Story mode with dialogue
- [ ] Additional power-up types

### Improvements
- [ ] Performance profiling and optimization
- [ ] Accessibility features
- [ ] Internationalization (i18n)
- [ ] Save game system
- [ ] Replay system
- [ ] Leaderboards (server-based)
