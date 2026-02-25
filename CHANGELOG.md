# Changelog

All notable changes to Candy Landy will be documented in this file.

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
