# 🍬 Candy Landy - Enhanced Edition v5 🍬

A polished candy-themed platformer game with advanced features including multiple levels, power-ups, enemies, combo systems, checkpoints, dash mechanics, wall jumps, and more!

## 🎮 Features

### Gameplay Enhancements
- **3 Unique Levels** with increasing difficulty
- **Multiple Platform Types**:
  - Normal platforms (stable)
  - Moving platforms (↔) - move back and forth
  - Disappearing platforms (⏳) - fade in and out
- **Combo System** - Collect candies quickly for score multipliers (up to 5x!)
- **Time Bonuses** - Complete levels quickly for extra points
- **High Score Tracking** - Your best scores are saved locally

### Power-Ups
- **⚡ Speed Boost** - Move 60% faster for 10 seconds
- **★ Invincibility** - Defeat enemies on contact for 5 seconds
- **↑↑ Triple Jump** - Jump three times in the air for 7.5 seconds
- **💨 Dash** - Perform a powerful dash (SHIFT key) - invincible and double speed for 0.17 seconds, 1 second cooldown

### NEW v5 Features
- **🚩 Checkpoint System** - Collect checkpoint flags to heal and set respawn points
- **⏱️ Visible Timer** - Level timer with color changes (green → yellow → red) as time runs low
- **🚶 Wall Jump** - Slide down walls and jump off them for new traversal options
- **💨 Dash Mechanic** - Quick dash with invincibility and visual trail effect
- **🗺️ Mini-Map** - Bottom-right corner shows platforms, checkpoints, goal, and player position
- **✨ Enhanced Visual Effects** - Invincibility transparency pulsing, improved screen shake intensities
- **🐛 Critical Bug Fixes** - Combo multiplier fixed, double jump state tracking improved, particle system optimized

### Enemies
- Red blob enemies that patrol platforms
- **Jump on enemies from above** to stomp and defeat them! (Mario-style)
- Avoid hitting enemies from the side or bottom, or use invincibility
- Stomping enemies awards 50 points and triggers combo system
- Defeating enemies creates explosion and star particle effects

### Checkpoints (NEW!)
- Green flag markers scattered throughout each level
- Touching a checkpoint heals you to full health
- Sets your respawn point - if you die or fall, you'll respawn at the last checkpoint
- Collected checkpoints remain collected for the rest of the level
- Checkpoints show progress in the HUD: 🚩 Checkpoints: 2/3

### Level Timers (NEW!)
- Each level has a time limit (Level 1: 2 min, Level 2: 3 min, Level 3: 4 min)
- Timer displays in HUD with color changes:
  - Green (>50% time remaining)
  - Yellow (25-50% time remaining)
  - Red (<25% time remaining - hurry up!)
- Complete levels quickly for better time bonuses

### Visual Effects
- **Particle Systems** for candy collection, jumps, and landings
- **Screen Shake** with different intensities for various actions
- **Animated Character** with pigtails, dress, and running animations
- **Background Animations** with floating clouds and candies
- **Glowing Effects** on candies and power-ups
- **Smooth Game State Transitions** with polished UI
- **Invincibility Transparency Pulsing** - Character fades in and out when invincible
- **Dash Trail Effect** - Yellow trail follows character during dash
- **Wall Slide Glow** - Cyan glow when sliding on walls
- **Mini-Map** - Bottom-right corner shows all level elements

### Sound System
- **Web Audio API** for crisp, generated sound effects
- **Jump, collect, power-up, hurt, victory, and game over sounds**
- **Volume Controls** - Adjust from 0-100%

### Game States
- **Start Screen** with instructions and high score display
- **Pause Functionality** (ESC key)
- **Level Complete Screens** with time bonuses
- **Game Complete Screen** with final score and high score tracking
- **Game Over Screen** with retry option

## 🎯 Controls

### Movement
- **← → Arrow Keys** - Move left/right
- **SPACE / ↑ Arrow** - Jump (supports double jump!)
- **SHIFT** - Dash (grounded only, 1 second cooldown) - Invincible and double speed!
- **ESC** - Pause/Resume game

### NEW: Wall Jump
- **Jump near wall** - Slide down slowly
- **Jump again** - Launch off wall in opposite direction (great for climbing!)

### Sound Controls
- **0** - Mute
- **1** - 20% volume
- **2** - 40% volume
- **3** - 60% volume
- **4** - 80% volume
- **5** - 100% volume

### Game Navigation
- **SPACE / ENTER** - Start game, continue to next level, or retry

## 📊 Scoring

### Points
- **Candy Collection**: 10 points (base)
- **Combo Multiplier**: Up to 5x for rapid collection
- **Time Bonus**: Up to 300 points per level (based on completion time)
- **Enemy Stomp**: 50 points each (jump on enemies from above!)
- **Power-Up Collection**: 25 points each

### High Scores
- Top 10 scores are saved to local storage
- Includes score, level reached, and date
- New high scores are celebrated on the victory screen!

## 🎨 Power-Up Guide

### ⚡ Speed Boost
- **Effect**: 60% faster movement
- **Duration**: 10 seconds
- **Visual**: Golden glow around character
- **Strategy**: Use for quick platform crossing or collecting distant candies

### ★ Invincibility
- **Effect**: Defeat enemies on contact, temporary invulnerability
- **Duration**: 5 seconds
- **Visual**: Character turns gold and flashes
- **Strategy**: Use to clear enemy-infested areas

### ↑↑ Triple Jump
- **Effect**: Jump three times before touching ground
- **Duration**: 7.5 seconds
- **Visual**: Blue glow around character
- **Strategy**: Essential for reaching high platforms and skipping difficult sections

### 💨 Dash (NEW!)
- **Effect**: Quick invincible dash with double speed
- **Activation**: Press SHIFT while grounded
- **Duration**: 10 frames (0.17 seconds dash, 1 second cooldown)
- **Visual**: Yellow trail behind character
- **Strategy**: Use to quickly cross dangerous areas or escape enemies

## 🧗 Wall Jump Guide (NEW!)

### How to Wall Jump
1. **Approach a wall** while in the air
2. **Character will slide down slowly** on the wall (cyan glow effect)
3. **Press jump while sliding** to launch off in opposite direction
4. **Gain vertical and horizontal momentum** to reach high places

### Tips
- Use wall jumps to climb narrow shafts
- Chain wall jumps on alternating walls
- Wall jumps can help you reach secret areas
- You can wall jump on any solid platform edge

## 🏆 Tips for High Scores

1. **Build Combos** - Collect candies quickly (within 1.5 seconds) for multipliers
2. **Stomp Enemies** - Jump on enemies from above for 50 points each! Perfect for building combos
3. **Watch the Clock** - Complete levels quickly for time bonuses (timer shows urgency!)
4. **Collect Everything** - Don't miss candies or power-ups
5. **Defeat Enemies** - Use stomp jumps or invincibility to defeat enemies for bonus points
6. **Plan Your Route** - Memorize platform patterns and disappearing timings
7. **Use Power-Ups Wisely** - Save invincibility for enemy-dense areas
8. **Collect Checkpoints** - They heal you and provide safety nets
9. **Use Wall Jumps** - Master wall jumping to reach high platforms and bypass enemies
10. **Dash Strategically** - Use dash to quickly cross gaps or dodge enemies

## 🌟 Level Guide

### Level 1: Tutorial
- Introduces basic platforming
- Two checkpoints for safety
- 3 stomp-able enemies
- Time limit: 2 minutes
- Perfect for learning mechanics

### Level 2: Moving Platforms
- Introduces moving and disappearing platforms
- Two checkpoints
- Dash power-up available
- First enemies appear
- Time limit: 3 minutes
- Requires timing and precision

### Level 3: Challenge Mode
- All platform types including disappearing
- Three checkpoints
- All power-up types available (including dash!)
- Multiple enemies in tight spaces
- Time limit: 4 minutes
- Complex platform layouts requiring wall jumps
- Requires mastery of all mechanics

## 🔧 Technical Features

### Physics
- Custom gravity system
- Smooth collision detection
- Platform edge handling
- Knockback on damage
- **Wall sliding physics** - Slow fall when near walls
- **Wall jump mechanics** - Launch off walls with directional momentum
- **Dash mechanics** - Brief invincibility with double speed

### Audio
- Web Audio API implementation
- Procedurally generated sounds (no external files needed)
- Master and SFX volume controls
- **NEW sounds**: Dash, Wall Jump, Checkpoint

### Storage
- localStorage for high scores
- No external dependencies required

### Performance
- Optimized particle systems with size limits (max 100 per explosion, 300 total)
- Efficient rendering loop
- requestAnimationFrame for smooth 60fps gameplay

### v5 Bug Fixes
- **Fixed combo multiplier** - Now correctly multiplies points (was capping at 5x total)
- **Double jump state tracking** - Explicit state variables prevent bugs
- **Edge case validation** - Enemy spawn positions and disappearing platforms validated
- **Particle system optimization** - Capped to prevent performance issues

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. Click anywhere to initialize audio (required by browsers)
3. Press SPACE or ENTER to start
4. Use arrow keys to move, SPACE to jump (double tap for double jump!)
5. Collect candies, stomp enemies by jumping on them from above, reach the flag!
6. Complete all 3 levels for the ultimate victory!

## 📱 Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- Web Audio API
- ES6 JavaScript
- localStorage

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🎨 Customization

### Adjusting Difficulty
Edit these constants in `enhanced-game.js`:
```javascript
const GRAVITY = 0.6;           // Gravity strength
const JUMP_STRENGTH = -14;    // Jump power
const MOVE_SPEED = 5;         // Movement speed
```

### Adding New Levels
Extend the `loadLevel()` method in the `Level` class with additional level designs.

### Modifying Power-Ups
Adjust power-up durations and effects in the `collectPowerUp()` section of the update loop.

## 📝 Credits

Built with vanilla JavaScript, HTML5 Canvas, and Web Audio API.
No external libraries or assets required!

## 🎮 Have Fun!

Enjoy the enhanced Candy Landy experience! 🍬🎉
