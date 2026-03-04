# Candy Landy v5 - Comprehensive Testing Guide

## Testing Checklist

This document provides a complete testing checklist for all features implemented in Candy Landy v5 across all 5 sprints.

---

## Sprint 1 Features: Mobile & Stability

### 1. Mobile Touch Controls
- [ ] **D-Pad Display**: D-pad appears on mobile devices
- [ ] **D-Pad Up**: Moves character up/jump
- [ ] **D-Pad Down**: Moves character down/ground pound
- [ ] **D-Pad Left**: Moves character left
- [ ] **D-Pad Right**: Moves character right
- [ ] **Jump Button**: Green button triggers jump
- [ ] **Dash Button**: Yellow button triggers dash
- [ ] **Touch Feedback**: Buttons show visual feedback when pressed
- [ ] **Responsive Design**: Controls adapt to different screen sizes
- [ ] **No Double-Tap Zoom**: Double-tap doesn't zoom browser
- [ ] **No Pinch Zoom**: Pinch gesture doesn't zoom browser

### 2. iOS Audio Fix
- [ ] **Tap to Play Overlay**: Appears on mobile devices
- [ ] **Overlay Dismisses**: Tapping anywhere dismisses overlay
- [ ] **Audio Initializes**: Sound effects work after tapping
- [ ] **Background Music**: Plays after first interaction
- [ ] **No Autoplay Errors**: No console errors about autoplay

### 3. Landscape Prompt
- [ ] **Portrait Detection**: Prompt appears in portrait mode
- [ ] **Landscape Dismissal**: Prompt hides in landscape mode
- [ ] **Rotate Detection**: Prompt responds to orientation changes
- [ ] **Visual Design**: Prompt is clear and readable

### 4. Checkpoint Invincibility
- [ ] **1-Second Duration**: Invincibility lasts ~1 second
- [ ] **Visual Flashing**: Player flashes during invincibility
- [ ] **Enemy Collision**: Player doesn't take damage from enemies
- [ ] **Respawn Works**: Player respawns at checkpoint after death
- [ ] **Health Restored**: Player health restored to 3 hearts

---

## Sprint 2 Features: Quality of Life

### 1. Level Select Screen
- [ ] **Screen Display**: Level select appears after pressing SPACE on start
- [ ] **3 Level Cards**: All 3 levels shown with thumbnails
- [ ] **Level Info**: Name, description, best score, secrets displayed
- [ ] **Level Locking**: Levels 2-3 locked until previous completed
- [ ] **Unlock Progression**: Completing level 1 unlocks level 2
- [ ] **Level Selection**: Keys 1-3 select levels
- [ ] **Start Level**: SPACE starts selected level
- [ ] **Back Navigation**: ESC returns to start screen
- [ ] **Best Scores**: High scores persist across sessions

### 2. Tutorial Popups
- [ ] **Jump Hint**: "Press SPACE or UP to jump!" appears when first grounded
- [ ] **Double Jump Hint**: "Press jump again..." appears on first air jump
- [ ] **Enemy Hint**: "Jump on enemies..." appears near enemy
- [ ] **Checkpoint Hint**: "Collect checkpoints..." appears near checkpoint
- [ ] **Dash Hint**: "Press SHIFT..." appears when dash available
- [ ] **Ground Pound Hint**: "Press DOWN + JUMP..." appears when airborne
- [ ] **Auto-Dismiss**: Hints disappear after 5 seconds
- [ ] **Once Per Session**: Each hint shows only once per session
- [ ] **Visual Design**: Hints are readable and don't block gameplay

### 3. Ground Pound Attack
- [ ] **Input**: DOWN + JUMP while airborne activates ground pound
- [ ] **Fast Fall**: Player falls quickly during ground pound
- [ ] **Enemy Damage**: Enemies in radius take damage
- [ ] **Bonus Points**: 75 points per enemy killed
- [ ] **Cooldown**: 1-second cooldown between uses
- [ ] **Once Per Jump**: Can only use once per jump
- [ ] **Visual Trail**: Orange particle trail while falling
- [ ] **Screen Shake**: Screen shakes on impact
- [ ] **Explosion Particles**: Explosion effect on impact
- [ ] **Ring Burst**: Ring particle effect on impact
- [ ] **Sound Effect**: Ground pound sound plays
- [ ] **Achievement**: "Ground Pounder" achievement unlocks

### 4. Secret Collectibles
- [ ] **2 Secrets Per Level**: 2 purple diamonds in each level
- [ ] **Visual Design**: Purple diamond with sparkle effect
- [ ] **Pulsing Glow**: Gems pulse with purple/gold glow
- [ ] **Collection**: Walking over secret collects it
- [ ] **500 Points**: Each secret worth 500 points
- [ ] **HUD Display**: "💎 Secrets: X/2" shown in HUD
- [ ] **Level Select Display**: Secrets found shown per level
- [ ] **Persistence**: Secret progress saved to localStorage
- [ ] **Collection Effect**: Screen shake and particle burst
- [ ] **Achievement**: "Treasure Hunter" for all secrets in level

---

## Sprint 3 Features: Code Organization

### Modular Architecture
- [ ] **ES6 Modules**: Code split into separate module files
- [ ] **Module Loading**: Game loads without errors
- [ ] **Fallback**: Enhanced-game.js loads for non-module browsers
- [ ] **Config Module**: Settings properly exported/imported
- [ ] **Audio Module**: Sound system works correctly
- [ ] **Particles Module**: Enhanced particle effects work
- [ ] **Input Module**: Keyboard and touch input work
- [ ] **Levels Module**: Level data loads correctly
- [ ] **Player Module**: Player movement and physics work
- [ ] **UI Module**: HUD, menus, and transitions work
- [ ] **Game Module**: Main game loop runs correctly

---

## Sprint 4 Features: Quality Improvements

### 1. Screen Transitions
- [ ] **Fade Transition**: Smooth fade between states
- [ ] **Swipe Transition**: Dynamic swipe effect
- [ ] **Zoom Transition**: Exciting zoom effect
- [ ] **Candy Fall Transition**: Beautiful falling candy animation
- [ ] **Start to Playing**: Transition works when starting game
- [ ] **Level Complete**: Transition to next level works
- [ ] **Game Over**: Transition to game over screen works
- [ ] **Pause/Resume**: Fade transition on pause/resume
- [ ] **Level Select**: Transition when selecting level
- [ ] **Duration**: Transitions last appropriate time (0.5-1.0s)
- [ ] **No Blocking**: Gameplay doesn't update during transitions

### 2. Enhanced Visual Effects

#### Particle System
- [ ] **Multiple Shapes**: Stars, hearts, diamonds, rings appear
- [ ] **Glow Effects**: Particles have glow effects
- [ ] **Trail Effects**: Motion blur trails work
- [ ] **Wave Motion**: Floating particles have wave motion
- [ ] **Sparkle Effect**: Sparkle highlights appear
- [ ] **Color Variation**: Particles have natural color variation
- [ ] **Performance**: Max 500 particles maintained

#### Screen Shake
- [ ] **Light Shake**: Subtle shake on light impacts
- [ ] **Medium Shake**: Medium intensity shake
- [ ] **Heavy Shake**: Strong shake on heavy impacts
- [ ] **Explosion Shake**: Explosive shake pattern
- [ ] **Stomp Shake**: Ground pound shake effect
- [ ] **Collect Shake**: Collection shake effect
- [ ] **Hit Shake**: Damage shake effect
- [ ] **Decay**: Shake decays smoothly

#### Glow Effects
- [ ] **Power-Up Glow**: Power-ups have pulsing glow
- [ ] **Secret Glow**: Secrets have sparkle aura
- [ ] **Checkpoint Glow**: Checkpoints have green glow
- [ ] **Candy Glow**: Candies have golden shimmer

#### Enhanced Invincibility
- [ ] **Dramatic Flashing**: Multiple color flashing
- [ ] **Golden Aura**: Pulsing golden aura around player
- [ ] **White Inner Glow**: White glow inside player
- [ ] **Visibility**: Enhanced effect is clearly visible

#### Improved Dash Trail
- [ ] **Longer Trail**: 5 segments visible
- [ ] **Gradient Coloring**: Trail has gradient effect
- [ ] **Visibility**: Trail is more dramatic and visible

### 3. Achievement System

#### All 13 Achievements
- [ ] **First Hop**: Jump for the first time
- [ ] **Stomper**: Defeat an enemy by stomping
- [ ] **Sky High**: Perform a double jump
- [ ] **Speedster**: Use the dash ability
- [ ] **Ground Pounder**: Perform a ground pound
- [ ] **Perfect Run**: Complete level without damage
- [ ] **Treasure Hunter**: Find all secrets in level
- [ ] **Combo Master**: Reach 5x combo
- [ ] **Combo Legend**: Reach 10x combo
- [ ] **Speed Runner**: Complete level in <30s
- [ ] **Untouchable**: Complete all levels without dying
- [ ] **Candy Collector**: Collect 100 candies total
- [ ] **Champion**: Complete the entire game

#### Achievement Features
- [ ] **Notification**: Slide-in notification on unlock
- [ ] **Achievements Menu**: Press A to open menu
- [ ] **Achievement Cards**: Cards show unlock status
- [ ] **Stats Display**: Stats shown in menu
- [ ] **Progress Tracking**: Progress tracked correctly
- [ ] **localStorage Persistence**: Achievements persist across sessions
- [ ] **Auto-Save**: Achievements save automatically

---

## Edge Cases & Advanced Testing

### Player Mechanics
- [ ] **Death with Checkpoints**: Respawn at checkpoint after death
- [ ] **Enemy Stomp Angles**: Stomp works from all angles
- [ ] **Double Jump + Wall Jump**: Combination works correctly
- [ ] **Power-Up Stacking**: Multiple power-ups don't conflict
- [ ] **Dash Cooldown**: Cooldown prevents spam
- [ ] **Secret Order**: Secrets collectible in any order

### Performance
- [ ] **Particle Limit**: Max 500 particles respected
- [ ] **60fps Gameplay**: Smooth 60fps maintained
- [ ] **Memory Stable**: No memory leaks during gameplay
- [ ] **Long Play Session**: Game stable after 30+ minutes

### Mobile Testing
- [ ] **iPhone Safari**: Touch controls work on iOS
- [ ] **iPad Safari**: Touch controls work on iPad
- [ ] **Android Chrome**: Touch controls work on Android
- [ ] **Small Screens**: Controls fit on small screens
- [ ] **Large Screens**: Controls scale appropriately
- [ ] **Portrait Mode**: Landscape prompt appears
- [ ] **Landscape Mode**: Game plays correctly
- [ ] **Orientation Change**: Game handles rotation

### Save System
- [ ] **High Scores**: Persist across browser sessions
- [ ] **Achievements**: Persist across browser sessions
- [ ] **Level Progress**: Persist across browser sessions
- [ ] **Secret Progress**: Persist across browser sessions
- [ ] **localStorage Full**: Graceful handling when storage full

---

## Browser Compatibility

### Desktop Browsers
- [ ] **Chrome 90+**: All features work
- [ ] **Firefox 88+**: All features work
- [ ] **Safari 14+**: All features work
- [ ] **Edge 90+**: All features work

### Mobile Browsers
- [ ] **iOS Safari**: All features work
- [ ] **Chrome Android**: All features work
- [ ] **Samsung Internet**: All features work

---

## Console Errors

### Check for JavaScript Errors
- [ ] **No Syntax Errors**: Console shows no syntax errors
- [ ] **No Runtime Errors**: Console shows no runtime errors
- [ ] **No Warnings**: Console shows no warnings
- [ ] **Module Loading**: All modules load without errors

### Common Issues to Check
- [ ] **Audio Context**: No autoplay policy errors
- [ ] **localStorage**: No quota exceeded errors
- [ ] **Canvas**: No drawing errors
- [ ] **Import/Export**: No module errors

---

## Performance Testing

### Frame Rate
- [ ] **60fps Target**: Maintain 60fps during gameplay
- [ ] **Particle Heavy**: 60fps with max particles
- [ ] **Multiple Enemies**: 60fps with many enemies
- [ ] **Transitions**: Smooth transitions at 60fps

### Memory
- [ ] **Initial Load**: Memory usage reasonable on load
- [ ] **After 10 Minutes**: No significant memory increase
- [ ] **After 30 Minutes**: Memory stable
- [ ] **Level Transitions**: Memory doesn't spike

### Load Time
- [ ] **Initial Load**: Game loads in <3 seconds
- [ ] **Module Loading**: All modules load quickly
- [ ] **No Blocking**: No long blocking operations

---

## Test Results Template

### Test Date: _______________
### Tester: _______________
### Browser: _______________
### Device: _______________

#### Sprint 1: ___/40 tests passed
#### Sprint 2: ___/48 tests passed
#### Sprint 3: ___/12 tests passed
#### Sprint 4: ___/62 tests passed
#### Edge Cases: ___/28 tests passed
#### Performance: ___/12 tests passed

### Total: ___/202 tests passed

### Issues Found:
1. 
2. 
3. 

### Critical Bugs:
1. 
2. 

### Minor Bugs:
1. 
2. 

### Suggestions:
1. 
2. 

---

## Reporting Bugs

When reporting bugs, please include:
1. **Description**: What happened?
2. **Expected**: What should have happened?
3. **Steps to Reproduce**: How to trigger the bug
4. **Browser/Device**: Where did it occur?
5. **Screenshot**: If applicable
6. **Console Errors**: Any error messages

---

## Automated Testing

For automated testing, open the browser console and run:
```javascript
// Check module loading
console.log('Modules loaded:', typeof Game !== 'undefined');

// Check achievement system
console.log('Achievements:', game.ui.achievements.achievements);

// Check particle count
console.log('Particles:', particleSystem.particles.length);

// Check performance
console.log('FPS:', game.fps);
```

---

## Final Verification

Before release, verify:
- [ ] All critical tests pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Mobile controls work
- [ ] Achievements persist
- [ ] All features documented
- [ ] README is complete
- [ ] CHANGELOG is updated
- [ ] Version numbers updated

**Ready for Release**: ☐ YES  ☐ NO

---

*Testing Guide v5 - Candy Landy Enhanced Edition*
