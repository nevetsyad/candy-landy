# Candy Landy Implementation Task

**Priority:** HIGH
**Model:** zai/glm-5
**Goal:** Fix all critical bugs and implement all recommended improvements

---

## PHASE 1: CRITICAL FIXES (Must Complete First)

### 1.1 Fix Combo Multiplier Bug
**File:** `enhanced-game.js`
**Location:** In `updatePlayer()` function where candies are collected
**Current buggy code:**
```javascript
combo = Math.min(combo + 1, 100);
comboMultiplier = Math.min(combo, 5);
points = 10 * comboMultiplier; // This is wrong!
```

**Fix to implement:**
```javascript
if (comboTimer > 0) {
  combo = Math.min(combo + 1, 100);
  comboTimer = SETTINGS.comboTimer;
  if (combo % 5 === 0) {
    playSound('combo');
    triggerScreenShake(2);
  }
  comboMultiplier = Math.min(combo, 5);
} else {
  combo = 1;
  comboTimer = SETTINGS.comboTimer;
  comboMultiplier = 1;
}

// CRITICAL FIX: Multiply combo by base points, don't min it
let points = 10 * comboMultiplier;
if (player.powerUp === POWER_UPS.DOUBLE_POINTS) {
  points = 20 * comboMultiplier;
}
points = Math.max(0, Math.floor(points)); // Ensure valid number
score += points;
```

### 1.2 Add Edge Case Validation
**File:** `enhanced-game.js`
**Location:** At the end of `loadLevel()` function

Add validation before initializing enemies:
```javascript
// Validate enemy spawn positions
currentLevelData.enemies.forEach(e => {
  const onPlatform = currentLevelData.platforms.some(p =>
    e.x >= p.x && e.x <= p.x + p.width &&
    e.y >= p.y && e.y <= p.y + p.height
  );
  if (!onPlatform) {
    console.warn(`Warning: Enemy spawned off-platform at (${e.x}, ${e.y})`);
    // Optional: Move enemy to nearest platform
    const nearestPlatform = currentLevelData.platforms.reduce((nearest, p) => {
      return p.y > nearest.y ? p : nearest;
    });
    e.x = nearestPlatform.x;
    e.y = nearestPlatform.y - e.height;
  }
});

// Validate disappearing platforms have floor underneath
currentLevelData.disappearingPlatforms.forEach(dp => {
  const hasFloor = currentLevelData.platforms.some(p =>
    p.y >= dp.y - 5 && p.y <= dp.y + 5 &&
    dp.x >= p.x && dp.x <= p.x + p.width
  );
  if (!hasFloor) {
    console.warn(`Warning: Disappearing platform has no floor at (${dp.x}, ${dp.y})`);
  }
});
```

### 1.3 Fix Double Jump State Bug
**File:** `enhanced-game.js`
**Location:** Throughout `updatePlayer()` function

Add explicit state tracking variable:
```javascript
let jumpState = 'grounded'; // 'grounded', 'jumping', 'doubleJump', 'falling', 'wallSliding'

// Reset state properly on ground
if (player.grounded) {
  jumpState = 'grounded';
  jumpCount = 0;
} else if (player.vy < 0) {
  // Jumping up
  if (jumpCount === 0) {
    jumpState = 'jumping';
  } else {
    jumpState = 'doubleJump';
  }
} else if (player.vy > 0) {
  // Falling
  jumpState = 'falling';
}
```

Replace all instances of `player.jumpState` with `jumpState` variable.

### 1.4 Optimize Particle System
**File:** `enhanced-game.js`
**Location:** In `createExplosion()` function

Add particle limits:
```javascript
function createExplosion(x, y, color, count = 30) {
  if (typeof x !== 'number' || typeof y !== 'number') {
    console.warn('Invalid explosion position');
    return;
  }
  count = Math.max(0, Math.min(count, 100)); // Cap at 100

  // Limit total particles to prevent performance issues
  if (particles.length > 300) {
    particles.splice(0, Math.min(count, particles.length - 300));
  }

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 10 + 5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      maxLife: 1.0,
      color: color,
      size: Math.random() * 8 + 4,
      gravity: 0.2,
      fade: 0.025,
      shape: 'circle',
      rotation: 0,
      rotationSpeed: 0
    });
  }
}
```

Also add same optimization to `createParticles()`.

---

## PHASE 2: HIGH-IMPACT FEATURES

### 2.1 Implement Checkpoint System
**File:** `enhanced-game.js`
**Location:** Add checkpoint definitions to `levels` array

Add to level configs:
```javascript
const levels = [
  {
    platforms: [/* existing */],
    candies: [/* existing */],
    powerUps: [/* existing */],
    enemies: [/* existing */],
    disappearingPlatforms: [/* existing */],
    goal: { x: 750, y: 200, width: 50, height: 50 },
    checkpoints: [
      { x: 400, y: 500, collected: false },
      { x: 650, y: 400, collected: false }
    ]
  },
  // Level 2:
  {
    // ...
    checkpoints: [
      { x: 300, y: 450, collected: false },
      { x: 600, y: 350, collected: false }
    ]
  },
  // Level 3:
  {
    // ...
    checkpoints: [
      { x: 200, y: 500, collected: false },
      { x: 400, y: 450, collected: false },
      { x: 600, y: 400, collected: false }
    ]
  }
];
```

Update `loadLevel()` to reset checkpoints:
```javascript
currentLevelData.checkpoints = JSON.parse(JSON.stringify(levels[levelIndex].checkpoints || []));
```

Add checkpoint collection logic in `updatePlayer()`:
```javascript
currentLevelData.checkpoints.forEach(cp => {
  if (!cp.collected &&
      player.x < cp.x + 30 && player.x + player.width > cp.x &&
      player.y < cp.y + 30 && player.y + player.height > cp.y) {

    cp.collected = true;
    player.lives = 3; // Full heal at checkpoint
    player.x = cp.x + 15 - player.width / 2;
    player.y = cp.y - player.height;
    player.vx = 0;
    player.vy = 0;
    player.invincible = true;
    player.invincibleTimer = 60; // 1 second invincibility
    playSound('checkpoint');
    createExplosion(cp.x + 15, cp.y + 15, '#00ff00', 15);
    triggerScreenShake(5);
  }
});
```

Add checkpoint indicator to HUD:
```javascript
// In drawHUD() function
let collectedCheckpoints = currentLevelData.checkpoints.filter(cp => cp.collected).length;
const totalCheckpoints = currentLevelData.checkpoints.length;
ctx.fillStyle = '#00ff00';
ctx.font = '16px Comic Sans MS';
ctx.fillText('🚩 Checkpoints: ' + collectedCheckpoints + '/' + totalCheckpoints, 20, 210);
```

### 2.2 Add Visible Timer
**File:** `enhanced-game.js`
**Location:** Add to level configs

Add time limit to levels:
```javascript
const levels = [
  {
    // ...
    timeLimit: 120, // 2 minutes
    timeBonusMultiplier: 2
  },
  {
    // ...
    timeLimit: 180, // 3 minutes
    timeBonusMultiplier: 3
  },
  {
    // ...
    timeLimit: 240, // 4 minutes
    timeBonusMultiplier: 3
  }
];
```

Add timer to HUD:
```javascript
// In drawHUD()
if (levels[currentLevel].timeLimit) {
  const timeRemaining = levels[currentLevel].timeLimit - Math.floor(animationFrame / 60);
  const timePercent = timeRemaining / levels[currentLevel].timeLimit;

  // Color gradient
  let timeColor = '#00ff00';
  if (timePercent < 0.5) timeColor = '#ffff00';
  if (timePercent < 0.25) timeColor = '#ff0000';

  ctx.fillStyle = timeColor;
  ctx.font = '16px Comic Sans MS';
  ctx.fillText(`⏱️ Time: ${Math.ceil(timeRemaining)}s`, 20, 190);
}
```

### 2.3 Implement Dash Mechanic
**File:** `enhanced-game.js`
**Location:** Update player object and input handling

Add dash properties to player object:
```javascript
let player = {
  x: 100,
  y: 400,
  width: 40,
  height: 60,
  vx: 0,
  vy: 0,
  speed: 5,
  jumpPower: -16,
  grounded: false,
  lives: 3,
  powerUp: null,
  powerUpTimer: 0,
  invincible: false,
  invincibleTimer: 0,
  jumpState: 'grounded',
  jumpCount: 0,
  legAnimation: 0,
  armAnimation: 0,
  bodyBounce: 0,
  jumpAnimationFrame: 0,
  currentPlatform: null,
  previousPlatformX: 0,
  coyoteTime: 0,
  jumpBuffer: 0,
  canDoubleJump: true,
  // ADD DASH PROPERTIES:
  dashCooldown: 0,
  dashTimer: 0,
  isDashing: false,
  wallSliding: false,
  wallDir: 0
};
```

Add sound effect for dash:
```javascript
// In playSound() function, add new case:
case 'dash':
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.25 * volumeGain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
  break;
```

Add new power-up type:
```javascript
const POWER_UPS = {
  SPEED: 'speed',
  JUMP: 'jump',
  SHIELD: 'shield',
  DOUBLE_POINTS: 'double',
  DASH: 'dash'
};
```

Add dash power-ups to level configs (3-4 per level):
```javascript
powerUps: [
  { x: 280, y: 420, type: POWER_UPS.JUMP, collected: false },
  { x: 750, y: 120, type: POWER_UPS.SHIELD, collected: false },
  { x: 350, y: 520, type: POWER_UPS.DOUBLE_POINTS, collected: false },
  { x: 500, y: 350, type: POWER_UPS.DASH, collected: false } // NEW
]
```

Handle dash in input handler:
```javascript
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  // Dash
  if (e.key === 'Shift' && player.dashCooldown <= 0 && player.grounded) {
    player.isDashing = true;
    player.dashTimer = 10; // 10 frames dash
    player.dashCooldown = 60; // 1 second cooldown
    player.vx = player.speed * 2; // Double speed
    player.vy = 0; // No vertical movement
    player.invincible = true; // Invincible during dash
    playSound('dash');
    createParticles(player.x, player.y + 30, '#ffff00', 5, {
      spread: 8, gravity: 0.1, life: 1.0, size: { min: 3, max: 6 }, fade: 0.1, shape: 'square'
    });
  }

  // Start game, jump, pause, restart, volume as before...
});
```

Handle dash in update loop:
```javascript
function updatePlayer() {
  if (gameState !== 'playing') return;

  // Handle dash
  if (player.isDashing) {
    player.dashTimer--;
    if (player.dashTimer <= 0) {
      player.isDashing = false;
      player.invincible = false;
    }
  }

  // Handle dash cooldown
  if (player.dashCooldown > 0) {
    player.dashCooldown--;
  }

  // Handle wall sliding
  if (player.wallSliding) {
    player.wallSliding = false;
  }

  // Update power-ups, invincibility, combo, etc. as before...
}
```

Add dash visual effect in drawPlayer():
```javascript
function drawPlayer() {
  let playerColor = '#ff69b4';
  let hasGlow = false;

  // Dash trail effect
  if (player.isDashing) {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.fillRect(player.x - 20, player.y, 40, player.height);
  }

  // Invincibility blinking
  if (player.invincible && Math.floor(animationFrame / 5) % 2 === 0) {
    return;
  }

  // ... rest of drawing code
}
```

Add dash indicator to HUD:
```javascript
// In drawHUD()
if (player.dashCooldown > 0) {
  ctx.fillStyle = '#ffff00';
  ctx.font = '16px Comic Sans MS';
  ctx.fillText(`⚡ Dash: ${Math.ceil(player.dashCooldown / 60)}s`, 20, 210);
}
```

### 2.4 Add Wall Jump
**File:** `enhanced-game.js`
**Location:** Update player object and update loop

Add wall jump properties:
```javascript
let player = {
  // ... existing properties
  canWallSlide: true,
  canWallJump: true
};
```

Update jump handling to detect walls:
```javascript
function updatePlayer() {
  if (gameState !== 'playing') return;

  // Handle dash, cooldown, etc. as above

  // Detect wall sliding
  player.wallSliding = false;
  player.wallDir = 0;

  if (player.canWallSlide && player.vy > 0 && player.jumpCount === 0) {
    // Check left wall
    if (player.x > 0 && !player.grounded) {
      for (let i = 0; i < player.height; i += 10) {
        const checkY = player.y + i;
        if (currentLevelData.platforms.some(p =>
            p.x + p.width > player.x &&
            p.x <= player.x &&
            checkY >= p.y &&
            checkY <= p.y + 10)) {
          player.wallSliding = true;
          player.wallDir = -1;
          player.vy = Math.min(player.vy, 2); // Slide slowly
          break;
        }
      }
    }

    // Check right wall
    if (player.wallSliding === false && player.x < canvas.width && !player.grounded) {
      for (let i = 0; i < player.height; i += 10) {
        const checkY = player.y + i;
        if (currentLevelData.platforms.some(p =>
            p.x < player.x + player.width &&
            p.x + p.width >= player.x &&
            checkY >= p.y &&
            checkY <= p.y + 10)) {
          player.wallSliding = true;
          player.wallDir = 1;
          player.vy = Math.min(player.vy, 2);
          break;
        }
      }
    }
  }

  // Wall jump
  const canWallJump = (keys['ArrowUp'] || keys[' '] || keys['Enter']) &&
                      player.wallSliding &&
                      player.jumpCount === 0;

  if (canWallJump && player.vy < 0) {
    player.vy = -14;
    player.vx = player.wallDir * 10;
    player.jumpCount = 1;
    player.wallSliding = false;
    player.grounded = false;
    playSound('wallJump');
    createParticles(player.x + (player.wallDir > 0 ? player.width : 0), player.y + player.height/2, '#00ffff', 8);
  }

  // Normal jumping
  const canJump = (player.jumpBuffer > 0 || keys[' '] || keys['Enter'] || keys['ArrowUp']) &&
                   (player.grounded || player.coyoteTime > 0 || player.jumpCount < 2);

  if (canJump && !canWallJump) {
    let jumpPower = player.jumpPower;
    if (player.powerUp === POWER_UPS.JUMP) jumpPower = -20;

    if (player.grounded || player.coyoteTime > 0) {
      player.jumpCount = 1;
    } else {
      player.jumpCount = 2;
    }

    player.vy = jumpPower;
    player.grounded = false;
    player.coyoteTime = 0;
    player.jumpBuffer = 0;
    player.jumpAnimationFrame = 0;
    playSound('jump');
    triggerScreenShake(2);
  }

  // ... rest of update loop
}
```

Add wall jump sound:
```javascript
// In playSound() function:
case 'wallJump':
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(450, audioContext.currentTime + 0.15);
  gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
  break;
```

---

## PHASE 3: QUALITY IMPROVEMENTS

### 3.1 Add Invincibility Visual Effect
**File:** `enhanced-game.js`
**Location:** In `drawPlayer()` function

Add transparency pulsing:
```javascript
function drawPlayer() {
  // Add before drawing player body
  if (player.invincible && !player.isDashing) {
    const alpha = 0.5 + Math.sin(animationFrame * 0.3) * 0.3;
    ctx.globalAlpha = alpha;
  }

  // Draw hair, body, hat, head, eyes, mouth...

  ctx.globalAlpha = 1.0;
}
```

### 3.2 Improve Screen Shake Variety
**File:** `enhanced-game.js`
**Location:** Update `triggerScreenShake()` function signature

Change function to accept duration:
```javascript
let screenShake = {
  x: 0,
  y: 0,
  intensity: 0,
  duration: 0
};

function triggerScreenShake(intensity = 5, duration = 10) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
  screenShake.x = (Math.random() - 0.5) * intensity;
  screenShake.y = (Math.random() - 0.5) * intensity;
}

function updateScreenShake() {
  if (screenShake.duration > 0) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.duration--;
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
    screenShake.intensity = 0;
    screenShake.duration = 0;
  }
}
```

Update all calls to `triggerScreenShake()` with different parameters:
- Jump: `triggerScreenShake(2, 5)`
- Collect candy: `triggerScreenShake(1, 3)`
- Stomp enemy: `triggerScreenShake(5, 8)`
- Take damage: `triggerScreenShake(10, 15)`
- Collect power-up: `triggerScreenShake(4, 6)`
- Reach checkpoint: `triggerScreenShake(6, 10)`

### 3.3 Add Mini-map
**File:** `enhanced-game.js`
**Location:** Add to `drawHUD()` function

Add at end of drawHUD():
```javascript
function drawMiniMap() {
  // Don't draw if not playing
  if (gameState !== 'playing') return;

  const mapSize = 100;
  const mapX = canvas.width - mapSize - 10;
  const mapY = 10;
  const scale = mapSize / canvas.width;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(mapX, mapY, mapSize, mapSize);

  // Platforms (dark pink)
  ctx.fillStyle = 'rgba(255, 105, 180, 0.8)';
  currentLevelData.platforms.forEach(p => {
    ctx.fillRect(mapX + p.x * scale, mapY + p.y * scale, p.width * scale, p.height * scale);
  });

  // Goal (green)
  const goal = currentLevelData.goal;
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(mapX + goal.x * scale, mapY + goal.y * scale, goal.width * scale, goal.height * scale);

  // Player (cyan)
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(mapX + player.x * scale, mapY + player.y * scale, player.width * scale, player.height * scale);
}
```

Call it in `drawGame()` after drawing entities but before restoring context:
```javascript
function drawGame() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);

  // ... draw everything ...

  drawMiniMap();

  ctx.restore();
}
```

---

## TESTING REQUIREMENTS

After implementation, test:
1. Combo multiplier shows correct points for all combo values
2. Enemies can spawn safely
3. Double jump works correctly after wall sliding
4. Checkpoints heal and save position
5. Timer displays and counts down
6. Dash has cooldown and visual trail
7. Wall jump works on both walls
8. Invincibility visual effect works
9. Screen shakes have different intensities
10. Mini-map shows all platforms and player

---

## IMPLEMENTATION INSTRUCTIONS

1. **Backup current file**: Rename `enhanced-game.js` to `enhanced-game-v4-backup.js`
2. **Implement Phase 1 fixes** first
3. **Test Phase 1** before moving to Phase 2
4. **Implement Phase 2 features**
5. **Test Phase 2** thoroughly
6. **Implement Phase 3 improvements**
7. **Final testing** and bug fixing
8. **Update README.md** with new features

**IMPORTANT:** After each phase, test the game in browser before proceeding to next phase. This ensures bugs are caught early and can be fixed before they compound.

**Files to modify:**
- `enhanced-game.js` (main game code)
- `index.html` (update title to v5)
- `README.md` (update with new features)

**Files to create (optional):**
- `TEST_RESULTS.md` (document test results after each phase)
- `IMPLEMENTATION_LOG.md` (track implementation progress)
