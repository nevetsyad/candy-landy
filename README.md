# 🍬 Candy Landy - Enhanced Edition 🍬

A polished candy-themed platformer game with advanced features including multiple levels, power-ups, enemies, combo systems, and more!

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

### Enemies
- Red blob enemies that patrol platforms
- **Jump on enemies from above** to stomp and defeat them! (Mario-style)
- Avoid hitting enemies from the side or bottom, or use invincibility
- Stomping enemies awards 50 points and triggers combo system
- Defeating enemies creates explosion and star particle effects

### Visual Effects
- **Particle Systems** for candy collection, jumps, and landings
- **Screen Shake** when taking damage
- **Animated Character** with pigtails, dress, and running animations
- **Background Animations** with floating clouds and candies
- **Glowing Effects** on candies and power-ups
- **Smooth Game State Transitions** with polished UI

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
- **ESC** - Pause/Resume game

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

## 🏆 Tips for High Scores

1. **Build Combos** - Collect candies quickly (within 1.5 seconds) for multipliers
2. **Stomp Enemies** - Jump on enemies from above for 50 points each! Perfect for building combos
3. **Watch the Clock** - Complete levels under 60 seconds for maximum time bonus
4. **Collect Everything** - Don't miss candies or power-ups
5. **Defeat Enemies** - Use stomp jumps or invincibility to defeat enemies for bonus points
6. **Plan Your Route** - Memorize platform patterns and disappearing timings
7. **Use Power-Ups Wisely** - Save invincibility for enemy-dense areas

## 🌟 Level Guide

### Level 1: Tutorial
- Introduces basic platforming
- Single speed power-up
- No enemies
- Perfect for learning mechanics

### Level 2: Moving Platforms
- Introduces moving and disappearing platforms
- First enemies appear
- Multiple power-ups available
- Requires timing and precision

### Level 3+: Challenge Mode
- All platform types
- Multiple enemies
- Complex platform layouts
- Requires mastery of all mechanics

## 🔧 Technical Features

### Physics
- Custom gravity system
- Smooth collision detection
- Platform edge handling
- Knockback on damage

### Audio
- Web Audio API implementation
- Procedurally generated sounds (no external files needed)
- Master and SFX volume controls

### Storage
- localStorage for high scores
- No external dependencies required

### Performance
- Optimized particle systems
- Efficient rendering loop
- requestAnimationFrame for smooth 60fps gameplay

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
