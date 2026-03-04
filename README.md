# 🍬 Candy Landy - Enhanced Edition v5 🍬

A polished candy-themed platformer game with advanced features including multiple levels, power-ups, enemies, combo systems, checkpoints, dash mechanics, wall jumps, achievements, screen transitions, and more!

## 📁 Project Structure

The codebase is organized into modular ES6 classes for better maintainability:

```
candy-landy/
├── index.html          # Main HTML file with mobile support
├── mobile.css          # Mobile-specific styles
├── enhanced-game.js    # Legacy monolithic file (fallback)
├── src/                # Modular source code
│   ├── config.js       # Game constants and settings
│   ├── audio.js        # Sound system (Web Audio API)
│   ├── particles.js    # Enhanced particle system with glow effects
│   ├── input.js        # Keyboard and touch input handling
│   ├── levels.js       # Level data and management
│   ├── player.js       # Player and Enemy classes
│   ├── ui.js           # HUD, menus, screens, transitions, achievements
│   ├── game.js         # Main game loop and controller
│   └── README.md       # Module documentation
└── README.md           # This file
```

See [src/README.md](src/README.md) for detailed module documentation.

## 🎮 Features

### Gameplay Enhancements
- **3 Unique Levels** with increasing difficulty
- **Multiple Platform Types**:
  - Normal platforms (stable)
  - Moving platforms (↔) - move back and forth
  - Disappearing platforms (⏳) - fade in and out with warning glow
- **Combo System** - Collect candies quickly for score multipliers (up to 5x!)
- **Time Bonuses** - Complete levels quickly for extra points
- **High Score Tracking** - Your best scores are saved locally

### 🏆 Achievement System (NEW!)
Track your progress with 13 achievements:
- **First Hop** - Jump for the first time
- **Stomper** - Defeat an enemy by stomping
- **Sky High** - Perform a double jump
- **Speedster** - Use the dash ability
- **Ground Pounder** - Perform a ground pound
- **Perfect Run** - Complete a level without taking damage
- **Treasure Hunter** - Find all secrets in a level
- **Combo Master** - Reach a 5x combo
- **Combo Legend** - Reach a 10x combo
- **Speed Runner** - Complete a level in under 30 seconds
- **Untouchable** - Complete all levels without dying
- **Candy Collector** - Collect 100 candies total
- **Champion** - Complete the entire game

Achievements are saved to localStorage and displayed in a dedicated menu (Press **A**).

### Power-Ups
- **⚡ Speed Boost** - Move 60% faster for 10 seconds
- **★ Invincibility** - Defeat enemies on contact for 5 seconds
- **↑↑ Triple Jump** - Jump three times in the air for 7.5 seconds
- **💨 Dash** - Perform a powerful dash (SHIFT key) - invincible and double speed

### Screen Transitions (NEW!)
- **Candy Fall Transition** - Beautiful falling candy animation between screens
- **Fade Transition** - Smooth fade with pink gradient for pause/resume
- **Swipe Transition** - Dynamic swipe effect for level starts
- **Zoom Transition** - Exciting zoom effect for game over
- All transitions are candy-themed with sparkle effects

### Enemies
- Red blob enemies that patrol platforms
- **Jump on enemies from above** to stomp and defeat them! (Mario-style)
- Avoid hitting enemies from the side or bottom, or use invincibility
- Stomping enemies awards 50 points and triggers combo system
- Defeating enemies creates enhanced explosion and star particle effects

### Checkpoints
- Green flag markers scattered throughout each level
- Touching a checkpoint heals you to full health
- Sets your respawn point - if you die or fall, you'll respawn at the last checkpoint
- Collected checkpoints show enhanced glow effects

### Secret Collectibles (NEW!)
- Hidden purple diamonds scattered throughout levels
- Worth 500 points each!
- Feature enhanced sparkle and glow effects
- Track secrets found per level in the level select screen

### Visual Effects (Enhanced!)
- **Enhanced Particle System** with multiple shapes (stars, hearts, diamonds, rings)
- **Glow Effects** on power-ups, secrets, and special collectibles
- **Screen Shake** with different intensities (light, medium, heavy, explosion, stomp, collect, hit)
- **Animated Character** with pigtails, dress, and running animations
- **Background Animations** with floating clouds
- **Smooth Game State Transitions** with candy-themed overlays
- **Enhanced Invincibility Visual** - Dramatic flashing with golden aura
- **Improved Dash Trail** - Longer, more visible trail with gradient
- **Mini-Map** - Bottom-right corner shows all level elements

### Sound System
- **Web Audio API** for crisp, generated sound effects
- **Jump, collect, power-up, hurt, victory, and game over sounds**
- **Volume Controls** - Adjust from 0-100% (keys 0-5)

### Game States
- **Start Screen** with instructions, high score, and achievement count
- **Level Select Screen** with level cards showing best scores and secrets
- **Pause Functionality** (ESC key) with volume adjustment
- **Achievements Menu** (A key) with progress tracking
- **Level Complete** with time bonuses and transition to next level
- **Game Complete** with celebration effects
- **Game Over** with retry option

## 🎯 Controls

### Keyboard Controls
| Key | Action |
|-----|--------|
| **← →** | Move left/right |
| **SPACE / ↑** | Jump (double tap for double jump!) |
| **SHIFT** | Dash (grounded only, 1 second cooldown) |
| **ESC** | Pause/Resume game |
| **A** | Open Achievements menu |
| **R** | Restart (on game over/victory) |
| **0-5** | Volume control (0=mute, 5=max) |
| **1-3** | Select level (on level select screen) |

### Mobile Controls
- **D-Pad** - Directional movement on left side
- **Jump Button** - Large green button on right
- **Dash Button** - Yellow button below jump
- **Tap to Play** - Initial tap required for audio on iOS

### Wall Jump
- **Jump near wall** - Slide down slowly
- **Jump again** - Launch off wall in opposite direction

### Ground Pound
- **DOWN + JUMP** (while airborne) - Powerful downward attack
- Creates shockwave that damages nearby enemies
- Bounces you up after impact

## 📊 Scoring

### Points
- **Candy Collection**: 10 points (base) × combo multiplier
- **Combo Multiplier**: Up to 5x for rapid collection
- **Time Bonus**: Up to 300 points per level
- **Enemy Stomp**: 50 points each
- **Secret Collectible**: 500 points each
- **Power-Up Collection**: 25 points each

### High Scores
- Scores saved to local storage
- Best score displayed per level
- Total high score shown on level select

## 🎨 Power-Up Guide

### ⚡ Speed Boost
- **Effect**: 60% faster movement
- **Duration**: 10 seconds
- **Visual**: Golden glow around character
- **Strategy**: Use for quick platform crossing

### ★ Invincibility
- **Effect**: Defeat enemies on contact, temporary invulnerability
- **Duration**: 5 seconds
- **Visual**: Character turns gold and flashes with aura
- **Strategy**: Use to clear enemy-infested areas

### ↑↑ Triple Jump
- **Effect**: Jump three times before touching ground
- **Duration**: 7.5 seconds
- **Visual**: Blue glow around character
- **Strategy**: Essential for reaching high platforms

### 💨 Dash
- **Effect**: Quick invincible dash with double speed
- **Activation**: Press SHIFT while grounded
- **Duration**: 0.17 seconds dash, 1 second cooldown
- **Visual**: Yellow trail behind character
- **Strategy**: Use to quickly cross dangerous areas

## 🏆 Tips for High Scores

1. **Build Combos** - Collect candies quickly for multipliers
2. **Stomp Enemies** - Jump on enemies from above for 50 points each
3. **Watch the Clock** - Complete levels quickly for time bonuses
4. **Find Secrets** - Purple diamonds are worth 500 points!
5. **Go for Perfect Runs** - No damage = achievement unlock
6. **Use Checkpoints** - They heal you and provide safety nets
7. **Master Wall Jumps** - Reach high platforms and secret areas
8. **Dash Strategically** - Cross gaps and dodge enemies quickly
9. **Ground Pound Groups** - Damage multiple enemies at once
10. **Track Achievements** - Press A to see your progress

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
- Time limit: 3 minutes
- Requires timing and precision

### Level 3: Challenge Mode
- All platform types including disappearing
- Three checkpoints
- All power-up types available
- Multiple enemies in tight spaces
- Time limit: 4 minutes
- Requires mastery of all mechanics

## 🔧 Technical Features

### Physics
- Custom gravity system
- Smooth collision detection
- Platform edge handling
- Knockback on damage
- Wall sliding physics
- Wall jump mechanics
- Dash mechanics with invincibility

### Enhanced Visual System
- Multi-shape particle system (circles, stars, hearts, diamonds, rings)
- Glow effects with configurable intensity
- Trail effects with gradients
- Screen shake with type-based patterns
- Smooth 60fps animations

### Audio
- Web Audio API implementation
- Procedurally generated sounds
- Master and SFX volume controls
- Sounds for all actions and events

### Storage
- localStorage for high scores
- localStorage for achievements
- localStorage for level progress
- No external dependencies required

### Performance
- Optimized particle systems (max 500 particles)
- Efficient rendering loop
- requestAnimationFrame for smooth gameplay
- Validated inputs to prevent errors

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. Click/tap anywhere to initialize audio (required by browsers)
3. Press SPACE, ENTER, or UP ARROW to start
4. Use arrow keys to move, SPACE to jump
5. Collect candies, stomp enemies, find secrets!
6. Complete all 3 levels for victory!
7. Press A anytime to check achievements!

## 📱 Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- Web Audio API
- ES6 JavaScript modules
- localStorage

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🎨 Customization

### Adjusting Difficulty
Edit `src/config.js`:
```javascript
export const PHYSICS = {
    GRAVITY: 0.8,           // Gravity strength
    PLAYER_SPEED: 5,        // Movement speed
    JUMP_POWER: -16,        // Jump power
};
```

### Adding New Levels
Add to `levelData` array in `src/levels.js`:
```javascript
{
    name: "Level Name",
    description: "Description",
    thumbnail: "🎮",
    platforms: [...],
    candies: [...],
    secrets: [...],
    enemies: [...],
}
```

### Adding New Achievements
Edit the `achievements` object in `src/ui.js`:
```javascript
newAchievement: { 
    id: 'newAchievement', 
    name: 'Name', 
    desc: 'Description', 
    icon: '🏆',
    unlocked: false 
}
```

## 📝 Version History

### v5 - Enhanced Edition
- **Sprint 1**: Mobile touch controls, iOS audio fix, landscape prompt, checkpoint invincibility
- **Sprint 2**: Level select, tutorial hints, ground pound attack, secret collectibles
- **Sprint 3**: Modular code structure (ES6 modules)
- **Sprint 4**: Screen transitions, achievement system, enhanced visuals
  - Smooth fade, swipe, zoom, and candy fall transitions
  - 13-track achievement system with notifications
  - Enhanced particle effects with glow
  - Improved screen shake with presets
  - Better invincibility and dash visuals
- **Sprint 5**: Testing, documentation, and final polish
  - Comprehensive testing of all features
  - Complete documentation (README, CONTRIBUTING, TESTING, CHANGELOG)
  - Bug fixes and performance optimization
  - Final release preparation

## 📝 Credits

Built with vanilla JavaScript, HTML5 Canvas, and Web Audio API.
No external libraries or assets required!

## 🎮 Have Fun!

Enjoy the enhanced Candy Landy experience! 🍬🎉

*Collect all achievements to become the ultimate Candy Landy Champion!*
