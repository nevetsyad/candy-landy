// Enhanced Candy Landy Game - Multiple Levels, Sound Effects, Power-ups, Enemies
// Version 5 - Critical Fixes + Checkpoints + Timer + Dash + Wall Jump + Mini-map
// SPRINT 2 - Level Select + Tutorial Hints + Ground Pound + Secret Collectibles
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// SPRINT 2: Add roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'undefined') radius = 5;
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
        }
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

// Mobile detection and responsive canvas
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const mobileControls = document.getElementById('mobileControls');

// Set canvas to fixed size for consistent game logic
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start'; // 'start', 'levelSelect', 'playing', 'paused', 'gameover', 'victory'
let score = 0;
let highScore = 0;
let currentLevel = 0;
let animationFrame = 0;

// SPRINT 2: Level Select System
let levelProgress = {
    unlocked: [true, false, false], // Level 1 unlocked by default
    bestScores: [0, 0, 0],
    secretsFound: [0, 0, 0],
    totalSecrets: [2, 2, 2] // 2 secrets per level
};

// Load level progress from localStorage
function loadLevelProgress() {
    try {
        const saved = localStorage.getItem('candyLandyProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            levelProgress = { ...levelProgress, ...parsed };
        }
    } catch (e) {
        console.warn('Could not load level progress:', e.message);
    }
}

// Save level progress to localStorage
function saveLevelProgress() {
    try {
        localStorage.setItem('candyLandyProgress', JSON.stringify(levelProgress));
    } catch (e) {
        console.warn('Could not save level progress:', e.message);
    }
}

// SPRINT 2: Tutorial System
let tutorialHints = {
    jump: { shown: false, text: "Press SPACE or UP to jump!", trigger: 'firstGrounded' },
    doubleJump: { shown: false, text: "Press jump again in the air for DOUBLE JUMP!", trigger: 'firstAirJump' },
    stomp: { shown: false, text: "Jump on enemies from above to defeat them!", trigger: 'firstEnemyNearby' },
    checkpoint: { shown: false, text: "Collect checkpoints to heal and respawn there!", trigger: 'firstCheckpointNearby' },
    dash: { shown: false, text: "Press SHIFT while grounded to DASH (invincible)!", trigger: 'firstDashAvailable' },
    groundPound: { shown: false, text: "Press DOWN + JUMP in the air for GROUND POUND!", trigger: 'firstAirborne' }
};

let activeHint = null;
let hintTimer = 0;
const HINT_DURATION = 300; // 5 seconds at 60fps

// Load tutorial hints state from sessionStorage (resets each session)
function loadTutorialState() {
    // Session storage ensures hints show once per session
    // Don't load from storage - always start fresh per session
}

// SPRINT 2: Show tutorial hint
function showTutorialHint(hintKey) {
    if (tutorialHints[hintKey] && !tutorialHints[hintKey].shown) {
        tutorialHints[hintKey].shown = true;
        activeHint = tutorialHints[hintKey].text;
        hintTimer = HINT_DURATION;
    }
}

// SPRINT 2: Update tutorial hints based on game triggers
function updateTutorialHints() {
    if (gameState !== 'playing') return;

    // Show jump hint when first grounded
    if (tutorialHints.jump.trigger === 'firstGrounded' && player.grounded && !tutorialHints.jump.shown) {
        showTutorialHint('jump');
    }

    // Show double jump hint when first in air
    if (tutorialHints.doubleJump.trigger === 'firstAirJump' && !player.grounded && player.jumpCount === 1 && !tutorialHints.doubleJump.shown) {
        showTutorialHint('doubleJump');
    }

    // Show ground pound hint when airborne
    if (tutorialHints.groundPound.trigger === 'firstAirborne' && !player.grounded && player.jumpCount > 0 && !tutorialHints.groundPound.shown) {
        showTutorialHint('groundPound');
    }

    // Show stomp hint when enemy is nearby
    if (tutorialHints.stomp.trigger === 'firstEnemyNearby') {
        const enemyNearby = enemies.some(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            return Math.sqrt(dx * dx + dy * dy) < 150;
        });
        if (enemyNearby && !tutorialHints.stomp.shown) {
            showTutorialHint('stomp');
        }
    }

    // Show checkpoint hint when checkpoint is nearby
    if (tutorialHints.checkpoint.trigger === 'firstCheckpointNearby' && currentLevelData.checkpoints) {
        const checkpointNearby = currentLevelData.checkpoints.some(cp => {
            if (cp.collected) return false;
            const dx = cp.x - player.x;
            const dy = cp.y - player.y;
            return Math.sqrt(dx * dx + dy * dy) < 150;
        });
        if (checkpointNearby && !tutorialHints.checkpoint.shown) {
            showTutorialHint('checkpoint');
        }
    }

    // Show dash hint when grounded and dash is available
    if (tutorialHints.dash.trigger === 'firstDashAvailable' && player.grounded && player.dashCooldown <= 0 && !tutorialHints.dash.shown) {
        showTutorialHint('dash');
    }

    // Update hint timer
    if (hintTimer > 0) {
        hintTimer--;
        if (hintTimer <= 0) {
            activeHint = null;
        }
    }
}

// SPRINT 2: Draw tutorial hint
function drawTutorialHint() {
    if (!activeHint) return;

    const hintWidth = 400;
    const hintHeight = 60;
    const hintX = (canvas.width - hintWidth) / 2;
    const hintY = 100;

    // Hint background with bubble effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.roundRect(hintX, hintY, hintWidth, hintHeight, 15);
    ctx.fill();
    ctx.stroke();

    // Hint text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeHint, canvas.width / 2, hintY + hintHeight / 2);

    // Add sparkle effect
    if (animationFrame % 10 === 0) {
        createParticles(hintX + Math.random() * hintWidth, hintY, '#ffd700', 2, {
            spread: 3, gravity: 0.05, life: 0.5, size: { min: 2, max: 4 }, fade: 0.1, shape: 'star'
        });
    }
}

// SPRINT 2: Ground Pound System
let groundPound = {
    active: false,
    cooldown: 0,
    velocity: 25,
    radius: 80,
    damage: 50,
    cooldownTime: 60, // 1 second
    canGroundPound: true
};

// Safe localStorage wrapper with error handling
function safeLocalStorage(action, key, value = null) {
    try {
        if (action === 'get') {
            return localStorage.getItem(key);
        } else if (action === 'set') {
            localStorage.setItem(key, value);
            return true;
        }
    } catch (e) {
        console.warn('localStorage not available:', e.message);
        return null;
    }
}

// Initialize high score with error handling
highScore = parseInt(safeLocalStorage('get', 'candyLandyHighScore')) || 0;

// SPRINT 2: Load level progress and tutorial state
loadLevelProgress();
loadTutorialState();

// Audio Context for sound effects
let audioContext = null;
let backgroundMusic = null;
let isMusicPlaying = false;
let audioSupported = true;
let audioContextSuspended = false;

// Sound effects (Web Audio API)
const sounds = {
    jump: null,
    collect: null,
    powerup: null,
    hit: null,
    levelComplete: null,
    gameOver: null,
    combo: null,
    shield: null,
    enemyHit: null,
    dash: null,
    wallJump: null,
    checkpoint: null
};

// Initialize audio with graceful degradation
function initAudio() {
    if (audioContext) {
        // If context exists but is suspended, try to resume
        if (audioContext.state === 'suspended') {
            resumeAudio();
        }
        return audioContext.state === 'running';
    }

    try {
        // Check if Web Audio API is supported
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn('Web Audio API not supported - audio disabled');
            audioSupported = false;
            return false;
        }

        audioContext = new AudioContextClass();

        // Check if context is suspended (common in browsers that require user interaction)
        if (audioContext.state === 'suspended') {
            audioContextSuspended = true;
            console.log('Audio context suspended - will resume on user interaction');
        } else if (audioContext.state === 'running') {
            audioContextSuspended = false;
            audioSupported = true;
        }

        return true;
    } catch (e) {
        console.warn('Failed to initialize audio:', e.message);
        audioSupported = false;
        return false;
    }
}

// Resume audio context (call on user interaction)
function resumeAudio() {
    if (!audioContext) {
        // Try to initialize if not already done
        initAudio();
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            audioContextSuspended = false;
            console.log('Audio context resumed successfully');
        }).catch(e => {
            console.warn('Failed to resume audio context:', e.message);
            // Mark as unsupported if resume fails
            audioSupported = false;
        });
    }
}

// Play sound using Web Audio API
function playSound(type) {
    // Graceful degradation - silently return if audio not available
    if (!audioSupported) return;
    if (!initAudio()) return;

    // Try to resume suspended context
    resumeAudio();

    // If still suspended after resume attempt, don't play
    if (!audioContext || audioContext.state !== 'running') return;

    // Validate audioContext is ready
    if (!audioContext.currentTime && audioContext.currentTime !== 0) {
        console.warn('Audio context not ready');
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Apply volume setting with validation
    const volumeGain = (SETTINGS && SETTINGS.volume !== undefined) ? SETTINGS.volume : 0.5;

    switch(type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'collect':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'powerup':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.2);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.4);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        case 'hit':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.4 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'levelComplete':
            oscillator.type = 'square';
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.2 * volumeGain, audioContext.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.15);
                osc.start(audioContext.currentTime + i * 0.15);
                osc.stop(audioContext.currentTime + i * 0.15 + 0.15);
            });
            break;
        case 'gameOver':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'combo':
            // Play ascending notes for combo
            const comboNotes = [523, 659, 784, 1047, 1319];
            comboNotes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.15 * volumeGain, audioContext.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.1);
                osc.start(audioContext.currentTime + i * 0.1);
                osc.stop(audioContext.currentTime + i * 0.1 + 0.1);
            });
            break;
        case 'shield':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.4 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'enemyHit':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.5 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'dash':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.25 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'wallJump':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(450, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'checkpoint':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.25 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'groundPound':
            // Heavy impact sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.5 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Background music (enhanced melody)
let musicInterval = null;
let musicNoteIndex = 0;
const melody = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047];
const melodyDurations = [0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.25, 0.25, 0.3, 0.3, 0.5];
const chordProgression = [
    [262, 330, 392], // C major
    [294, 369, 440], // D minor
    [330, 415, 494], // E minor
    [349, 440, 523], // F major
    [392, 494, 588], // G major
    [440, 554, 659], // A minor
    [494, 622, 740], // B diminished
    [523, 659, 784]  // C major
];

function startBackgroundMusic() {
    if (isMusicPlaying) return;
    if (!audioSupported) return;
    if (!initAudio()) return;

    // Resume suspended context
    resumeAudio();

    // Don't start if context is still suspended
    if (audioContext && audioContext.state === 'suspended') {
        // Will try again when user interacts
        return;
    }

    isMusicPlaying = true;

    function playNextNote() {
        if (!isMusicPlaying) return;

        // Play chord notes for richer sound
        const chordIndex = Math.floor(musicNoteIndex / 2) % chordProgression.length;
        const chord = chordProgression[chordIndex];
        const noteIndex = musicNoteIndex % chord.length;

        // Play chord notes with slight timing variation for richness
        chord.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = 'sine';
            const noteDelay = i * 0.02; // Stagger chord notes
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + noteDelay);
            gain.gain.setValueAtTime(0.08 * SETTINGS.volume, audioContext.currentTime + noteDelay);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + melodyDurations[musicNoteIndex]);

            osc.start(audioContext.currentTime + noteDelay);
            osc.stop(audioContext.currentTime + melodyDurations[musicNoteIndex] + noteDelay);
        });

        // Add occasional bass notes
        if (musicNoteIndex % 4 === 0) {
            const bassOsc = audioContext.createOscillator();
            const bassGain = audioContext.createGain();
            bassOsc.connect(bassGain);
            bassGain.connect(audioContext.destination);

            bassOsc.type = 'sine';
            const bassFreq = chord[0] / 2; // Octave lower
            bassOsc.frequency.setValueAtTime(bassFreq, audioContext.currentTime);
            bassGain.gain.setValueAtTime(0.05 * SETTINGS.volume, audioContext.currentTime);
            bassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            bassOsc.start(audioContext.currentTime);
            bassOsc.stop(audioContext.currentTime + 0.5);
        }

        musicNoteIndex = (musicNoteIndex + 1) % melody.length;
        musicInterval = setTimeout(playNextNote, melodyDurations[musicNoteIndex] * 1000);
    }

    playNextNote();
}

function stopBackgroundMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
        clearTimeout(musicInterval);
        musicInterval = null;
    }
}

// Player
let player = {
    x: 100,
    y: 400,
    width: 40,
    height: 60,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: -16, // Increased from -15 for better jump feel
    grounded: false,
    lives: 3,
    powerUp: null,
    powerUpTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    // Animation states
    jumpState: 'grounded', // 'grounded', 'jumping', 'doubleJump', 'falling'
    jumpCount: 0,
    legAnimation: 0,
    armAnimation: 0,
    bodyBounce: 0,
    jumpAnimationFrame: 0,
    // Platform tracking
    currentPlatform: null,
    previousPlatformX: 0,
    // Enhanced jump mechanics
    coyoteTime: 0, // Frames to jump after leaving platform
    jumpBuffer: 0, // Remember jump input before landing
    canDoubleJump: true,
    // PHASE 2: Dash properties
    dashCooldown: 0,
    dashTimer: 0,
    isDashing: false,
    // PHASE 2: Wall jump properties
    wallSliding: false,
    wallDir: 0,
    canWallSlide: true,
    canWallJump: true
};

// PHASE 1: Explicit jump state tracking
let jumpState = 'grounded'; // 'grounded', 'jumping', 'doubleJump', 'falling', 'wallSliding'

// Combo and scoring system
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;
let timeBonus = 0;

// PHASE 2: Level timer
let levelStartTime = 0;

// Power-up types (PHASE 2: Added DASH)
const POWER_UPS = {
    SPEED: 'speed',
    JUMP: 'jump',
    SHIELD: 'shield',
    DOUBLE_POINTS: 'double',
    DASH: 'dash'
};

// Particle system for effects
let particles = [];

// Player trail system for visual feedback
let playerTrail = [];

function createParticles(x, y, color, count = 10, options = {}) {
    // Validate inputs
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('Invalid particle position');
        return;
    }
    if (typeof count !== 'number' || count <= 0) {
        count = 10;
    }
    // PHASE 1: Limit particle count for performance
    count = Math.max(0, Math.min(count, 100));

    // PHASE 1: Limit total particles to prevent performance issues
    if (particles.length > 300) {
        particles.splice(0, Math.min(count, particles.length - 300));
    }

    const defaultOptions = {
        spread: 8,
        gravity: 0.1,
        life: 1.0,
        size: { min: 2, max: 8 },
        fade: 0.02,
        shape: 'circle' // 'circle', 'square', 'star'
    };

    const config = { ...defaultOptions, ...options };

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * config.spread + 2;

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: config.life,
            maxLife: config.life,
            color: color || '#ffffff',
            size: Math.random() * (config.size.max - config.size.min) + config.size.min,
            gravity: config.gravity,
            fade: config.fade,
            shape: config.shape,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }
}

// Enhanced confetti particles for victory
function createConfetti(x, y, count = 20) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700', '#ff4500', '#9370db'];

    for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        createParticles(x, y, color, 1, {
            spread: 15,
            gravity: 0.05,
            life: 3.0,
            size: { min: 8, max: 12 },
            fade: 0.005,
            shape: 'square'
        });
    }
}

// Create explosion effect
function createExplosion(x, y, color, count = 30) {
    // PHASE 1: Validate inputs
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('Invalid explosion position');
        return;
    }
    if (typeof count !== 'number' || count <= 0) {
        count = 30;
    }
    // PHASE 1: Limit particle count for performance (cap at 100)
    count = Math.max(0, Math.min(count, 100));

    // PHASE 1: Limit total particles to prevent performance issues
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

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0.1;
        p.life -= p.fade || 0.02;

        if (p.rotation !== undefined) {
            p.rotation += p.rotationSpeed || 0;
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
        }

        switch (p.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                break;
            case 'star':
                drawStar(0, 0, p.size, p.size/2, 5);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    });
    ctx.globalAlpha = 1.0;
}

function updatePlayerTrail() {
    for (let i = playerTrail.length - 1; i >= 0; i--) {
        playerTrail[i].alpha -= 0.05;
        if (playerTrail[i].alpha <= 0) {
            playerTrail.splice(i, 1);
        }
    }
}

function drawPlayerTrail() {
    playerTrail.forEach(trail => {
        if (trail.isDoubleJump) {
            // Removed glow/radiating effect - just a small dot for visual feedback
            ctx.globalAlpha = trail.alpha * 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        // PHASE 2: Dash trail effect
        if (trail.isDash) {
            ctx.globalAlpha = trail.alpha * 0.5;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(trail.x - 20, trail.y, 40, player.height);
        }
    });
    ctx.globalAlpha = 1.0;
}

// Helper function to draw star shapes
function drawStar(cx, cy, outerRadius, innerRadius, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// Game settings
const SETTINGS = {
    volume: 0.5,
    comboTimer: 60, // frames to maintain combo
    screenShakeIntensity: 5,
    particleIntensity: 1.0
};

// PHASE 3: Improved screen shake system with duration
let screenShake = {
    x: 0,
    y: 0,
    intensity: 0,
    duration: 0
};

function triggerScreenShake(intensity = SETTINGS.screenShakeIntensity, duration = 10) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = Math.max(screenShake.duration, duration);
    screenShake.x = (Math.random() - 0.5) * intensity;
    screenShake.y = (Math.random() - 0.5) * intensity;
}

function updateScreenShake() {
    // PHASE 3: Improved screen shake with duration
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

// Level definitions with increasing difficulty
// PHASE 2: Added checkpoints, time limits, and dash power-ups
// SPRINT 2: Added level names and secret collectibles
const levels = [
    // Level 1: Tutorial
    {
        name: "Tutorial",
        description: "Learn the basics",
        thumbnail: "🎓",
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 200, y: 450, width: 120, height: 20 },
            { x: 400, y: 350, width: 120, height: 20 },
            { x: 600, y: 250, width: 120, height: 20 }
        ],
        candies: [
            { x: 250, y: 420, collected: false },
            { x: 450, y: 320, collected: false },
            { x: 650, y: 220, collected: false }
        ],
        // SPRINT 2: Secret collectibles
        secrets: [
            { x: 50, y: 520, collected: false, id: 'secret1_1' },
            { x: 750, y: 150, collected: false, id: 'secret1_2' }
        ],
        powerUps: [],
        enemies: [
            { x: 240, y: 420, width: 30, height: 30, vx: 2, range: 80, startX: 240 }, // Stomp target
            { x: 440, y: 320, width: 30, height: 30, vx: -1, range: 60, startX: 440 }, // Stomp target
            { x: 640, y: 220, width: 30, height: 30, vx: 3, range: 100, startX: 640 }  // Stomp target
        ],
        disappearingPlatforms: [],
        goal: { x: 750, y: 200, width: 50, height: 50 },
        // PHASE 2: Checkpoints
        checkpoints: [
            { x: 400, y: 500, collected: false },
            { x: 650, y: 400, collected: false }
        ],
        // PHASE 2: Timer
        timeLimit: 120, // 2 minutes
        timeBonusMultiplier: 2
    },
    // Level 2: Moving Platforms
    {
        name: "Moving Platforms",
        description: "Master timing and movement",
        thumbnail: "🎢",
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 150, y: 450, width: 120, height: 20, moving: true, range: 100, startX: 150 },
            { x: 400, y: 350, width: 120, height: 20, moving: true, range: 80, startX: 400 },
            { x: 600, y: 250, width: 120, height: 20, moving: true, range: 120, startX: 600 },
            { x: 100, y: 250, width: 100, height: 20 }
        ],
        candies: [
            { x: 200, y: 420, collected: false },
            { x: 450, y: 320, collected: false },
            { x: 650, y: 220, collected: false },
            { x: 140, y: 220, collected: false },
            { x: 350, y: 520, collected: false }
        ],
        // SPRINT 2: Secret collectibles
        secrets: [
            { x: 700, y: 500, collected: false, id: 'secret2_1' },
            { x: 50, y: 200, collected: false, id: 'secret2_2' }
        ],
        powerUps: [
            { x: 280, y: 420, type: POWER_UPS.JUMP, collected: false },
            { x: 500, y: 350, type: POWER_UPS.DASH, collected: false }
        ],
        enemies: [
            { x: 450, y: 310, width: 30, height: 30, vx: 2, range: 100, startX: 450 }
        ],
        disappearingPlatforms: [
            { x: 300, y: 150, width: 100, height: 20, visible: true, timer: 0, cycleTime: 180 }
        ],
        goal: { x: 730, y: 200, width: 50, height: 50 },
        // PHASE 2: Checkpoints
        checkpoints: [
            { x: 300, y: 450, collected: false },
            { x: 600, y: 350, collected: false }
        ],
        // PHASE 2: Timer
        timeLimit: 180, // 3 minutes
        timeBonusMultiplier: 3
    },
    // Level 3: Challenge Mode
    {
        name: "Challenge Mode",
        description: "The ultimate test!",
        thumbnail: "🔥",
        platforms: [
            { x: 0, y: 550, width: 200, height: 50 },
            { x: 300, y: 500, width: 100, height: 20 },
            { x: 500, y: 450, width: 100, height: 20, moving: true, range: 150, startX: 500 },
            { x: 200, y: 350, width: 120, height: 20 },
            { x: 400, y: 300, width: 100, height: 20, moving: true, range: 100, startX: 400 },
            { x: 600, y: 250, width: 100, height: 20 },
            { x: 100, y: 200, width: 150, height: 20 },
            { x: 700, y: 150, width: 100, height: 20 }
        ],
        candies: [
            { x: 340, y: 470, collected: false },
            { x: 540, y: 420, collected: false },
            { x: 250, y: 320, collected: false },
            { x: 440, y: 270, collected: false },
            { x: 640, y: 220, collected: false },
            { x: 170, y: 170, collected: false },
            { x: 740, y: 120, collected: false },
            { x: 100, y: 520, collected: false }
        ],
        // SPRINT 2: Secret collectibles
        secrets: [
            { x: 20, y: 320, collected: false, id: 'secret3_1' },
            { x: 780, y: 420, collected: false, id: 'secret3_2' }
        ],
        powerUps: [
            { x: 270, y: 320, type: POWER_UPS.SPEED, collected: false },
            { x: 750, y: 120, type: POWER_UPS.SHIELD, collected: false },
            { x: 350, y: 520, type: POWER_UPS.DOUBLE_POINTS, collected: false },
            { x: 500, y: 220, type: POWER_UPS.DASH, collected: false }
        ],
        enemies: [
            { x: 200, y: 320, width: 30, height: 30, vx: 3, range: 120, startX: 200 },
            { x: 600, y: 220, width: 30, height: 30, vx: -2, range: 80, startX: 600 },
            { x: 100, y: 170, width: 30, height: 30, vx: 4, range: 150, startX: 100 }
        ],
        disappearingPlatforms: [
            { x: 400, y: 200, width: 80, height: 20, visible: true, timer: 0, cycleTime: 120 },
            { x: 250, y: 420, width: 80, height: 20, visible: true, timer: 0, cycleTime: 150 },
            { x: 550, y: 350, width: 80, height: 20, visible: true, timer: 0, cycleTime: 90 }
        ],
        goal: { x: 730, y: 100, width: 50, height: 50 },
        // PHASE 2: Checkpoints
        checkpoints: [
            { x: 200, y: 500, collected: false },
            { x: 400, y: 450, collected: false },
            { x: 600, y: 400, collected: false }
        ],
        // PHASE 2: Timer
        timeLimit: 240, // 4 minutes
        timeBonusMultiplier: 3
    }
];

let currentLevelData = null;
let enemies = [];
let powerUps = [];

// Input
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Start game or level select
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (gameState === 'start') {
            gameState = 'levelSelect';
        } else if (gameState === 'levelSelect') {
            // Start first unlocked level
            const firstUnlocked = levelProgress.unlocked.findIndex(u => u);
            if (firstUnlocked !== -1) {
                gameState = 'playing';
                startBackgroundMusic();
                loadLevel(firstUnlocked);
            }
        }
    }

    // SPRINT 2: Level select navigation
    if (gameState === 'levelSelect') {
        if (e.key === 'ArrowLeft') {
            // Navigate left
        } else if (e.key === 'ArrowRight') {
            // Navigate right
        } else if (e.key >= '1' && e.key <= '3') {
            const levelNum = parseInt(e.key) - 1;
            if (levelProgress.unlocked[levelNum]) {
                gameState = 'playing';
                startBackgroundMusic();
                loadLevel(levelNum);
            }
        }
    }

    // SPRINT 2: Ground Pound mechanic (DOWN + JUMP while airborne)
    if (e.key === 'ArrowDown' && !player.grounded && groundPound.cooldown <= 0 && groundPound.canGroundPound && gameState === 'playing') {
        // Check if jump key is pressed
        if (keys[' '] || keys['Enter'] || keys['ArrowUp']) {
            groundPound.active = true;
            groundPound.cooldown = groundPound.cooldownTime;
            groundPound.canGroundPound = false;
            player.vy = groundPound.velocity; // Fast downward velocity
            playSound('groundPound');
            createParticles(player.x + player.width/2, player.y + player.height, '#ff8800', 10, {
                spread: 6, gravity: 0.2, life: 0.8, size: { min: 4, max: 8 }, fade: 0.15, shape: 'circle'
            });
            triggerScreenShake(8, 12);
        }
    }

    // PHASE 2: Dash mechanic
    if (e.key === 'Shift' && player.dashCooldown <= 0 && player.grounded && gameState === 'playing') {
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

    // Pause
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
            stopBackgroundMusic();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            startBackgroundMusic();
        } else if (gameState === 'levelSelect') {
            gameState = 'start';
        }
    }

    // Restart
    if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameover') {
            gameState = 'start';
            resetGame();
        }
    }

    // Volume control
    if (e.key >= '0' && e.key <= '5') {
        SETTINGS.volume = parseInt(e.key) / 5;
        if (gameState === 'playing') {
            startBackgroundMusic(); // Restart with new volume
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Load level
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        // Game complete!
        gameState = 'victory';
        stopBackgroundMusic();
        playSound('levelComplete');
        triggerScreenShake(10, 15);
        createConfetti(canvas.width / 2, canvas.height / 2, 50);

        // SPRINT 2: Update high score
        if (score > highScore) {
            highScore = score;
            safeLocalStorage('set', 'candyLandyHighScore', highScore.toString());
        }
        return;
    }

    currentLevel = levelIndex;
    currentLevelData = JSON.parse(JSON.stringify(levels[levelIndex]));

    // Reset player position
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;
    // PHASE 2: Reset dash state
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.isDashing = false;
    // PHASE 2: Reset wall slide state
    player.wallSliding = false;
    player.wallDir = 0;
    // SPRINT 2: Reset ground pound state
    groundPound.active = false;
    groundPound.cooldown = 0;
    groundPound.canGroundPound = true;

    // Clear particles
    particles = [];

    // Clear player trail
    playerTrail = [];

    // Reset combo system
    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;

    // PHASE 2: Reset level timer
    levelStartTime = animationFrame;

    // PHASE 2: Initialize checkpoints
    if (!currentLevelData.checkpoints) {
        currentLevelData.checkpoints = [];
    }

    // SPRINT 2: Initialize secrets
    if (!currentLevelData.secrets) {
        currentLevelData.secrets = [];
    }

    // Initialize enemies
    enemies = currentLevelData.enemies.map(e => ({
        ...e,
        startX: e.startX || e.x
    }));

    // Copy power-ups
    powerUps = [...currentLevelData.powerUps];

    // Initialize disappearing platforms
    if (!currentLevelData.disappearingPlatforms) {
        currentLevelData.disappearingPlatforms = [];
    }

    // PHASE 1: Validate enemy spawn positions
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

    // PHASE 1: Validate disappearing platforms have floor underneath
    currentLevelData.disappearingPlatforms.forEach(dp => {
        const hasFloor = currentLevelData.platforms.some(p =>
            p.y >= dp.y - 5 && p.y <= dp.y + 5 &&
            dp.x >= p.x && dp.x <= p.x + p.width
        );
        if (!hasFloor) {
            console.warn(`Warning: Disappearing platform has no floor at (${dp.x}, ${dp.y})`);
        }
    });
}

// Update functions
function updatePlayer() {
    if (gameState !== 'playing') return;

    // SPRINT 2: Handle ground pound cooldown
    if (groundPound.cooldown > 0) {
        groundPound.cooldown--;
    }

    // SPRINT 2: Reset ground pound ability when grounded
    if (player.grounded) {
        groundPound.canGroundPound = true;
        if (groundPound.active) {
            // Ground pound impact!
            groundPound.active = false;
            playSound('enemyHit');
            triggerScreenShake(15, 20);

            // Create impact particles
            createExplosion(player.x + player.width/2, player.y + player.height, '#ff4400', 30);

            // Damage enemies in radius
            enemies.forEach((enemy, enemyIndex) => {
                const dx = (enemy.x + enemy.width/2) - (player.x + player.width/2);
                const dy = (enemy.y + enemy.height/2) - (player.y + player.height);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < groundPound.radius) {
                    // Enemy is in range - destroy it!
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff6600', 20);
                    score += 75; // Bonus points for ground pound kill
                    enemies.splice(enemyIndex, 1);
                }
            });
        }
    }

    // SPRINT 2: Ground pound active - fast fall
    if (groundPound.active) {
        player.vy = groundPound.velocity;
        // Create trail particles
        if (animationFrame % 3 === 0) {
            createParticles(player.x + player.width/2, player.y, '#ff6600', 3, {
                spread: 4, gravity: 0.05, life: 0.5, size: { min: 3, max: 6 }, fade: 0.1, shape: 'circle'
            });
        }
    }

    // PHASE 2: Handle dash
    if (player.isDashing) {
        player.dashTimer--;
        // Create dash trail
        if (player.dashTimer % 2 === 0) {
            playerTrail.push({
                x: player.x,
                y: player.y,
                alpha: 0.5,
                isDash: true
            });
        }
        if (player.dashTimer <= 0) {
            player.isDashing = false;
            player.invincible = false;
        }
    }

    // PHASE 2: Handle dash cooldown
    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }

    // Power-up timer
    if (player.powerUp) {
        player.powerUpTimer--;
        if (player.powerUpTimer <= 0) {
            player.powerUp = null;
        }
    }

    // Invincibility timer
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Combo system update
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            comboMultiplier = 1;
        }
    }

    // Coyote time (allow jumping shortly after leaving platform)
    if (player.grounded) {
        player.coyoteTime = 6; // 6 frames = 100ms
    } else {
        player.coyoteTime--;
    }

    // Jump buffer (remember jump input for a few frames)
    if (keys[' '] || keys['Enter'] || keys['ArrowUp']) {
        player.jumpBuffer = 6; // 6 frames = 100ms
    } else {
        player.jumpBuffer--;
    }

    // Movement with power-up speed
    let currentSpeed = player.speed;
    if (player.powerUp === POWER_UPS.SPEED) {
        currentSpeed = 8;
    }

    if (keys['ArrowLeft']) {
        player.vx = -currentSpeed;
    } else if (keys['ArrowRight']) {
        player.vx = currentSpeed;
    } else {
        player.vx *= 0.8;
    }

    // PHASE 2: Detect wall sliding
    player.wallSliding = false;
    player.wallDir = 0;

    if (player.canWallSlide && player.vy > 0 && !player.grounded) {
        // Check left wall
        if (player.x > 0) {
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
        if (player.wallSliding === false && player.x < canvas.width) {
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

    // PHASE 2: Wall jump
    const canWallJump = (keys['ArrowUp'] || keys[' '] || keys['Enter']) &&
                        player.wallSliding &&
                        player.jumpCount === 0;

    if (canWallJump) {
        player.vy = -14;
        player.vx = player.wallDir * 10;
        player.jumpCount = 1;
        player.wallSliding = false;
        player.grounded = false;
        playSound('wallJump');
        createParticles(player.x + (player.wallDir > 0 ? player.width : 0), player.y + player.height/2, '#00ffff', 8);
        triggerScreenShake(3, 5);
    }

    // Jump and double jump with power-up (enhanced with coyote time and jump buffer)
    // First jump requires being grounded (or coyote time), second jump can be done anywhere
    const canJump = (player.jumpBuffer > 0 || (keys[' '] || keys['Enter'] || keys['ArrowUp'])) &&
                     ((player.grounded || player.coyoteTime > 0 || player.jumpCount === 1) && player.jumpCount < 2);

    if (canJump && !canWallJump) {
        let jumpPower = player.jumpPower;
        if (player.powerUp === POWER_UPS.JUMP) {
            jumpPower = -20;
        }

        // PHASE 1: Set jump state properly
        if (player.grounded || player.coyoteTime > 0) {
            jumpState = 'jumping';
            player.jumpState = 'jumping';
            player.jumpCount = 1;
        } else if (player.jumpCount === 1) {
            jumpState = 'doubleJump';
            player.jumpState = 'doubleJump';
            player.jumpCount = 2;
            jumpPower *= 1.0; // Full power for double jump (enhanced for better gameplay)
        }

        player.vy = jumpPower;
        player.grounded = false;
        player.coyoteTime = 0;
        player.jumpBuffer = 0;
        player.jumpAnimationFrame = 0;
        playSound('jump');
        triggerScreenShake(2, 5);
    }

    // Physics with terminal velocity
    player.vy += 0.8;

    // Cap fall speed to prevent tunneling through platforms
    const TERMINAL_VELOCITY = 20;
    if (player.vy > TERMINAL_VELOCITY) {
        player.vy = TERMINAL_VELOCITY;
    }

    player.x += player.vx;
    player.y += player.vy;

    // PHASE 1: Update jump state based on velocity and ground status
    if (player.grounded) {
        jumpState = 'grounded';
        player.jumpState = 'grounded';
        player.jumpCount = 0;
    } else if (player.vy < 0) {
        // Jumping up
        if (player.jumpCount === 0) {
            jumpState = 'jumping';
            player.jumpState = 'jumping';
        } else {
            jumpState = 'doubleJump';
            player.jumpState = 'doubleJump';
        }
    } else if (player.vy > 0) {
        // Falling
        jumpState = 'falling';
        player.jumpState = 'falling';
    }

    // Update animation variables
    if (Math.abs(player.vx) > 0.1) {
        player.legAnimation += 0.3;
        player.armAnimation += 0.3;
    } else {
        player.legAnimation *= 0.8;
        player.armAnimation *= 0.8;
    }

    // Body bounce when moving
    player.bodyBounce = Math.sin(player.legAnimation) * 2;

    // Jump animation frame counter
    if (jumpState !== 'grounded') {
        player.jumpAnimationFrame++;
    }

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Platform collision with continuous collision detection for fast-moving player
    player.grounded = false;
    player.currentPlatform = null;

    // Continuous collision detection helper
    function checkPlatformCollision(px, py, platform) {
        return px < platform.x + platform.width &&
               px + player.width > platform.x &&
               py < platform.y + platform.height &&
               py + player.height > platform.y;
    }

    // Update moving platforms first
    currentLevelData.platforms.forEach(platform => {
        if (platform.moving) {
            const prevX = platform.x;
            platform.x = platform.startX + Math.sin(animationFrame * 0.02) * platform.range;
            platform.dx = platform.x - prevX;
        } else {
            platform.dx = 0;
        }
    });

    // Check for platform collisions with CCD for vertical movement
    currentLevelData.platforms.forEach(platform => {
        // If moving down fast, check intermediate positions
        if (player.vy > 10) {
            const steps = Math.ceil(player.vy / 10);
            const stepSize = player.vy / steps;

            for (let i = 0; i <= steps; i++) {
                const checkY = player.y - player.vy + (stepSize * i);

                if (checkPlatformCollision(player.x, checkY, platform)) {
                    if (player.vy > 0 && (player.y - player.vy) < platform.y) {
                        player.y = platform.y - player.height;
                        player.vy = 0;
                        player.grounded = true;
                        jumpState = 'grounded';
                        player.jumpState = 'grounded';
                        player.jumpCount = 0;
                        player.currentPlatform = platform;
                        triggerScreenShake(1, 3);
                        break;
                    }
                }
            }
        } else {
            // Standard collision for normal movement
            if (checkPlatformCollision(player.x, player.y, platform)) {
                if (player.vy > 0 && player.y < platform.y) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                    jumpState = 'grounded';
                    player.jumpState = 'grounded';
                    player.jumpCount = 0;
                    player.currentPlatform = platform;
                    triggerScreenShake(1, 3);
                }
            }
        }
    });

    // Move player with platform if standing on one
    if (player.grounded && player.currentPlatform && player.currentPlatform.dx) {
        player.x += player.currentPlatform.dx;
    }

    // Disappearing platforms update and collision
    currentLevelData.disappearingPlatforms.forEach(platform => {
        // Update platform visibility
        platform.timer++;
        if (platform.timer >= platform.cycleTime) {
            platform.visible = !platform.visible;
            platform.timer = 0;
        }
        platform.dx = 0;

        // Only check collision if platform is visible
        if (platform.visible &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            if (player.vy > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
                jumpState = 'grounded';
                player.jumpState = 'grounded';
                player.jumpCount = 0;
                player.currentPlatform = platform;

                triggerScreenShake(1, 3);
            }
        }
    });

    // PHASE 2: Collect checkpoints
    currentLevelData.checkpoints.forEach(cp => {
        if (!cp.collected &&
            player.x < cp.x + 30 && player.x + player.width > cp.x &&
            player.y < cp.y + 30 && player.y + player.height > cp.y) {

            cp.collected = true;
            player.lives = 3; // Full heal at checkpoint
            playSound('checkpoint');
            createExplosion(cp.x + 15, cp.y + 15, '#00ff00', 15);
            triggerScreenShake(6, 10);
        }
    });

    // Collect candies
    currentLevelData.candies.forEach(candy => {
        if (!candy.collected &&
            player.x < candy.x + 20 &&
            player.x + player.width > candy.x &&
            player.y < candy.y + 20 &&
            player.y + player.height > candy.y) {

            candy.collected = true;

            // PHASE 1: Fixed combo system with validation
            if (comboTimer > 0) {
                combo = Math.min(combo + 1, 100);
                comboTimer = SETTINGS.comboTimer;
                if (combo % 5 === 0) {
                    playSound('combo');
                    triggerScreenShake(2, 5);
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
            // Ensure points is a valid number
            points = Math.max(0, Math.floor(points));
            score += points;

            // Time bonus for quick collection
            if (combo >= 3) {
                timeBonus += combo * 5;
                score += timeBonus;
                createParticles(candy.x + 10, candy.y + 10, '#00ff00', 5);
            }

            playSound('collect');
            triggerScreenShake(1, 3);
            createParticles(candy.x + 10, candy.y + 10, '#ffd700', 12);
        }
    });

    // SPRINT 2: Collect secret collectibles
    if (currentLevelData.secrets) {
        currentLevelData.secrets.forEach(secret => {
            if (!secret.collected &&
                player.x < secret.x + 25 &&
                player.x + player.width > secret.x &&
                player.y < secret.y + 25 &&
                player.y + player.height > secret.y) {

                secret.collected = true;
                score += 500; // Bonus points for secret

                // Update secrets found count
                levelProgress.secretsFound[currentLevel] = currentLevelData.secrets.filter(s => s.collected).length;
                saveLevelProgress();

                playSound('powerup');
                triggerScreenShake(8, 12);
                createExplosion(secret.x + 12, secret.y + 12, '#9370db', 25);
                createParticles(secret.x + 12, secret.y + 12, '#ffd700', 15, {
                    spread: 10, gravity: 0.1, life: 1.5, size: { min: 4, max: 8 }, fade: 0.05, shape: 'star'
                });
            }
        });
    }

    // Collect power-ups
    powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected &&
            player.x < powerUp.x + 20 &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + 20 &&
            player.y + player.height > powerUp.y) {

            powerUp.collected = true;
            player.powerUp = powerUp.type;
            player.powerUpTimer = 300; // 5 seconds at 60fps
            playSound('powerup');
            triggerScreenShake(4, 6);
            createExplosion(powerUp.x + 10, powerUp.y + 10, '#00ff00', 15);
        }
    });

    // Update and check enemies
    enemies.forEach((enemy, enemyIndex) => {
        // Move enemy
        enemy.x += enemy.vx;

        // Reverse at range
        if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
            enemy.vx *= -1;
        }

        // Check collision with player
        if (!player.invincible &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            // Check if this is a stomp (player jumping on top of enemy)
            const playerBottom = player.y + player.height;
            const enemyTop = enemy.y;
            const enemyCenter = enemy.y + enemy.height / 2;

            // Player must be falling and landing on top of enemy
            const isStomp = player.vy > 0 && playerBottom < enemyCenter;

            if (isStomp) {
                // STOMP KILL - Player kills enemy by jumping on it
                playSound('enemyHit');
                triggerScreenShake(5, 8);

                // Create explosion effect at enemy position
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600', 25);

                // Create star burst particles for successful stomp
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffff00', 15, {
                    spread: 12,
                    gravity: 0.1,
                    life: 1.5,
                    size: { min: 3, max: 8 },
                    fade: 0.015,
                    shape: 'star'
                });

                // Award points for killing enemy
                const enemyPoints = 50;
                score += enemyPoints;

                // Add to combo if active
                if (comboTimer > 0) {
                    combo++;
                    comboTimer = SETTINGS.comboTimer;
                    comboMultiplier = Math.min(combo, 5);
                } else {
                    combo = 1;
                    comboTimer = SETTINGS.comboTimer;
                    comboMultiplier = 1;
                }

                // Bounce player upward slightly
                player.vy = -10;
                player.grounded = false;

                // Remove the enemy
                enemies.splice(enemyIndex, 1);

                // Play combo sound if high combo
                if (combo >= 3 && combo % 3 === 0) {
                    playSound('combo');
                    triggerScreenShake(3, 5);
                }

            } else if (player.powerUp === POWER_UPS.SHIELD) {
                // Shield protects, but deactivates power-up
                player.powerUp = null;
                player.invincible = true;
                player.invincibleTimer = 60; // 1 second
                playSound('shield');
                triggerScreenShake(5, 8);
            } else {
                // Take damage (hit from side or bottom)
                player.lives--;
                playSound('hit');
                triggerScreenShake(10, 15);

                if (player.lives <= 0) {
                    gameState = 'gameover';
                    stopBackgroundMusic();
                    playSound('gameOver');

                    // Update high score
                    if (score > highScore) {
                        highScore = score;
                        safeLocalStorage('set', 'candyLandyHighScore', highScore.toString());
                    }
                } else {
                    // PHASE 2: Respawn at last checkpoint if available
                    const lastCheckpoint = currentLevelData.checkpoints.filter(cp => cp.collected).pop();
                    if (lastCheckpoint) {
                        player.x = lastCheckpoint.x + 15 - player.width / 2;
                        player.y = lastCheckpoint.y - player.height;
                    } else {
                        player.x = 100;
                        player.y = 400;
                    }
                    player.vx = 0;
                    player.vy = 0;
                    player.invincible = true;
                    player.invincibleTimer = 60; // 1 second (60 frames at 60fps)
                    console.log('✅ Checkpoint respawn: 1-second invincibility activated');
                }
            }
        }
    });

    // Check goal (level complete)
    const goal = currentLevelData.goal;
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {

        // Check if all candies collected
        const allCollected = currentLevelData.candies.every(c => c.collected);

        if (allCollected) {
            // SPRINT 2: Save level progress
            if (score > levelProgress.bestScores[currentLevel]) {
                levelProgress.bestScores[currentLevel] = score;
            }

            // Unlock next level
            if (currentLevel + 1 < levels.length) {
                levelProgress.unlocked[currentLevel + 1] = true;
            }

            saveLevelProgress();

            playSound('levelComplete');
            loadLevel(currentLevel + 1);
        }
    }

    // Reset if fall off screen
    if (player.y > 600) {
        player.lives--;
        playSound('hit');

        if (player.lives <= 0) {
            gameState = 'gameover';
            stopBackgroundMusic();
            playSound('gameOver');

            if (score > highScore) {
                highScore = score;
                safeLocalStorage('set', 'candyLandyHighScore', highScore.toString());
            }
        } else {
            // PHASE 2: Respawn at last checkpoint if available
            const lastCheckpoint = currentLevelData.checkpoints.filter(cp => cp.collected).pop();
            if (lastCheckpoint) {
                player.x = lastCheckpoint.x + 15 - player.width / 2;
                player.y = lastCheckpoint.y - player.height;
            } else {
                player.x = 100;
                player.y = 400;
            }
            player.vx = 0;
            player.vy = 0;
            player.invincible = true;
            player.invincibleTimer = 60; // 1 second (60 frames at 60fps)
            console.log('✅ Fall respawn: 1-second invincibility activated');
        }
    }

    // Update particles
    updateParticles();

    // Update player trail
    updatePlayerTrail();

    // Update screen shake
    updateScreenShake();
}

function resetGame() {
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.lives = 3;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;
    // PHASE 2: Reset dash state
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.isDashing = false;
    // PHASE 2: Reset wall slide state
    player.wallSliding = false;
    player.wallDir = 0;
    // PHASE 1: Reset jump state
    jumpState = 'grounded';
    player.jumpState = 'grounded';
    player.jumpCount = 0;
    score = 0;
    currentLevel = 0;
    particles = [];
    playerTrail = [];
    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;
    stopBackgroundMusic();
}

// Drawing functions
function drawStartScreen() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(100 + cloudOffset, 80, 60);
    drawCloud(400 - cloudOffset, 120, 80);
    drawCloud(650 + cloudOffset, 60, 70);

    // Title with shadow
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 10;
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, 150);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#ff69b4';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Enhanced Edition v5!', canvas.width / 2, 190);

    // Princess name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Comic Sans MS';
    ctx.fillText('Princess Emmaline', canvas.width / 2, 230);

    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '22px Comic Sans MS';
    ctx.fillText('Press SPACE, ENTER, or UP ARROW to Start!', canvas.width / 2, 280);

    // Controls box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(200, 320, 400, 200);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 320, 400, 200);

    ctx.fillStyle = '#333';
    ctx.font = '18px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('⬅️ ➡️ Arrow Keys - Move', 230, 355);
    ctx.fillText('⬆️ SPACE - Jump (Double tap for double jump!)', 230, 385);
    ctx.fillText('⇧ SHIFT - Dash (invincible, double speed)', 230, 415);
    ctx.fillText('🔽+⬆️ Ground Pound (while airborne)', 230, 445);
    ctx.fillText('🍬 Collect all candies to advance', 230, 475);
    ctx.fillText('⚠️ Avoid enemies and don\'t fall!', 230, 505);

    // High score
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff1493';
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('🏆 High Score: ' + highScore, canvas.width / 2, 540);

    // Animated character
    const bounce = Math.sin(animationFrame * 0.1) * 10;
    drawCharacter(canvas.width / 2, 500 + bounce);
}

// SPRINT 2: Level Select Screen
function drawLevelSelectScreen() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(100 + cloudOffset, 80, 60);
    drawCloud(400 - cloudOffset, 120, 80);
    drawCloud(650 + cloudOffset, 60, 70);

    // Title
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 10;
    ctx.fillText('🍭 Select Level 🍭', canvas.width / 2, 80);
    ctx.shadowBlur = 0;

    // Draw level cards
    const cardWidth = 200;
    const cardHeight = 280;
    const cardSpacing = 50;
    const startX = (canvas.width - (3 * cardWidth + 2 * cardSpacing)) / 2;

    levels.forEach((level, index) => {
        const x = startX + index * (cardWidth + cardSpacing);
        const y = 150;
        const isUnlocked = levelProgress.unlocked[index];
        const isSelected = index === 0; // Default selection

        // Card background
        ctx.fillStyle = isUnlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(100, 100, 100, 0.6)';
        ctx.strokeStyle = isUnlocked ? '#ff69b4' : '#666';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 15);
        ctx.fill();
        ctx.stroke();

        // Lock icon for locked levels
        if (!isUnlocked) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x, y, cardWidth, cardHeight);

            ctx.fillStyle = '#666';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', x + cardWidth / 2, y + cardHeight / 2);

            ctx.font = '16px Comic Sans MS';
            ctx.fillStyle = '#888';
            ctx.fillText('Locked', x + cardWidth / 2, y + cardHeight - 30);
        } else {
            // Level thumbnail/icon
            ctx.font = 'bold 50px Arial';
            ctx.fillText(level.thumbnail, x + cardWidth / 2, y + 50);

            // Level name
            ctx.fillStyle = '#ff1493';
            ctx.font = 'bold 20px Comic Sans MS';
            ctx.fillText(level.name, x + cardWidth / 2, y + 90);

            // Level description
            ctx.fillStyle = '#666';
            ctx.font = '14px Comic Sans MS';
            ctx.fillText(level.description, x + cardWidth / 2, y + 115);

            // Best score
            const bestScore = levelProgress.bestScores[index];
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Comic Sans MS';
            ctx.fillText('🏆 Best: ' + bestScore, x + cardWidth / 2, y + 150);

            // Secrets found
            const secretsFound = levelProgress.secretsFound[index];
            const totalSecrets = levelProgress.totalSecrets[index];
            ctx.fillStyle = '#9370db';
            ctx.font = '14px Comic Sans MS';
            ctx.fillText('💎 Secrets: ' + secretsFound + '/' + totalSecrets, x + cardWidth / 2, y + 180);

            // Play button
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(x + 50, y + 200, 100, 40);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Comic Sans MS';
            ctx.fillText('▶ PLAY', x + cardWidth / 2, y + 228);

            // Key hint
            ctx.fillStyle = '#888';
            ctx.font = '12px Comic Sans MS';
            ctx.fillText('Press ' + (index + 1), x + cardWidth / 2, y + 265);
        }
    });

    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '20px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('Press 1-3 to select level or SPACE to start!', canvas.width / 2, 480);

    // High score
    ctx.fillStyle = '#ff1493';
    ctx.font = '18px Comic Sans MS';
    ctx.fillText('🏆 Total High Score: ' + highScore, canvas.width / 2, 520);

    // Back instruction
    ctx.fillStyle = '#666';
    ctx.font = '16px Comic Sans MS';
    ctx.fillText('ESC to return', canvas.width / 2, 560);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawCharacter(x, y) {
    // Hair animation for start screen
    const hairWaveSpeed = animationFrame * 0.08;
    const hairColor = '#ffd700';
    const hairHighlight = '#ffed4e';

    // Hair base position - at the top of the head
    const hairBaseX = x;
    const hairBaseY = y - 10;

    // Draw upward-flowing golden hair (visible on top of head)
    for (let i = 0; i < 10; i++) {
        const strandOffset = (i - 4.5) * 5;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.4) * 2;
        const upwardLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 8;

        // Main upward hair strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY - 10); // Start from near top of head
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 0.5, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 0.5 + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset - 0.5 + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset - 1 + waveOffset, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Golden crown/headband
    ctx.beginPath();
    ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairColor;
    ctx.fill();
    ctx.strokeStyle = '#e6b800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw flowing hair strands (behind the character)
    for (let i = 0; i < 6; i++) {
        const strandOffset = (i - 2.5) * 8;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.5) * 2;
        const strandLength = 30 + Math.sin(hairWaveSpeed + i * 0.3) * 5;

        // Main flowing hair strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset, hairBaseY + 10,
            hairBaseX + strandOffset + waveOffset * 2, hairBaseY + 20,
            hairBaseX + strandOffset, hairBaseY + strandLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 1, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 1 + waveOffset, hairBaseY + 10,
            hairBaseX + strandOffset - 1 + waveOffset * 2, hairBaseY + 20,
            hairBaseX + strandOffset - 2, hairBaseY + strandLength - 5
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Body
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(x - 20, y, 40, 60);

    // Hat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 25, y - 10, 50, 10);

    // Head with animation
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(x, y - 20, 18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 6, y - 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 22, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

// SPRINT 2: Draw HUD (separate function for clarity)
function drawHUD() {
    // HUD background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(10, 10, 280, 280);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 280);

    // Score
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('🍬 Score: ' + score, 20, 40);

    // Lives
    ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

    // Jump indicator (shows how many jumps are available)
    const jumpsRemaining = 2 - player.jumpCount;
    ctx.fillStyle = jumpsRemaining > 0 ? '#00ffff' : '#888';
    ctx.font = 'bold 16px Comic Sans MS';
    ctx.fillText('🦘 Jumps: ' + '⬆️'.repeat(jumpsRemaining), 20, 90);

    // Princess name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Comic Sans MS';
    ctx.fillText('👑 Princess Emmaline', 20, 110);

    // Level
    ctx.fillText('🎮 Level: ' + (currentLevel + 1) + '/' + levels.length, 20, 130);

    // Candies remaining
    const collected = currentLevelData.candies.filter(c => c.collected).length;
    const total = currentLevelData.candies.length;
    ctx.fillText('🍭 Candies: ' + collected + '/' + total, 20, 150);

    // PHASE 2: Checkpoints indicator
    const collectedCheckpoints = currentLevelData.checkpoints.filter(cp => cp.collected).length;
    const totalCheckpoints = currentLevelData.checkpoints.length;
    ctx.fillStyle = '#00ff00';
    ctx.fillText('🚩 Checkpoints: ' + collectedCheckpoints + '/' + totalCheckpoints, 20, 170);

    // SPRINT 2: Secrets indicator
    if (currentLevelData.secrets) {
        const collectedSecrets = currentLevelData.secrets.filter(s => s.collected).length;
        const totalSecrets = currentLevelData.secrets.length;
        ctx.fillStyle = '#9370db';
        ctx.font = 'bold 16px Comic Sans MS';
        ctx.fillText('💎 Secrets: ' + collectedSecrets + '/' + totalSecrets, 20, 190);
    }

    // PHASE 2: Timer display
    if (levels[currentLevel].timeLimit) {
        const timeRemaining = levels[currentLevel].timeLimit - Math.floor((animationFrame - levelStartTime) / 60);
        const timePercent = timeRemaining / levels[currentLevel].timeLimit;

        // Color gradient
        let timeColor = '#00ff00';
        if (timePercent < 0.5) timeColor = '#ffff00';
        if (timePercent < 0.25) timeColor = '#ff0000';

        ctx.fillStyle = timeColor;
        ctx.font = '16px Comic Sans MS';
        ctx.fillText(`⏱️ Time: ${Math.max(0, Math.ceil(timeRemaining))}s`, 20, 210);
    }

    // Combo display
    if (combo > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 230);
    }

    // Time bonus
    if (timeBonus > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 250);
    }

    // PHASE 2: Dash cooldown indicator
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText(`⚡ Dash: ${Math.ceil(player.dashCooldown / 60)}s`, 20, 270);
    } else {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('⚡ Dash: Ready!', 20, 270);
    }

    // SPRINT 2: Ground Pound cooldown indicator
    if (groundPound.cooldown > 0) {
        ctx.fillStyle = '#ff8800';
        ctx.font = '14px Comic Sans MS';
        ctx.fillText(`💥 Pound: ${Math.ceil(groundPound.cooldown / 60)}s`, 20, 285);
    }

    // Power-up indicator
    if (player.powerUp) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.fillRect(canvas.width - 120, 10, 110, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), canvas.width - 65, 35);
    }

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 55, 110, 25);
    ctx.fillStyle = '#333';
    ctx.font = '12px Comic Sans MS';
    ctx.fillText('🔊 ' + Math.round(SETTINGS.volume * 100) + '% (0-5)', canvas.width - 65, 72);

    // High score
    ctx.fillStyle = '#ff1493';
    ctx.font = '16px Comic Sans MS';
    ctx.textAlign = 'right';
    ctx.fillText('🏆 Best: ' + highScore, canvas.width - 20, 590);
}

function drawGame() {
    // Draw HUD first (before screen shake - this will stay stable)
    drawHUD();

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Gradient sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    drawCloud(80 + cloudOffset, 50, 50);
    drawCloud(350 - cloudOffset, 80, 60);
    drawCloud(600 + cloudOffset, 40, 55);

    // Draw platforms with gradient
    currentLevelData.platforms.forEach(platform => {
        const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platGradient.addColorStop(0, '#ff69b4');
        platGradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = platGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Platform highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
    });

    // Draw disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        if (platform.visible) {
            // Calculate fade effect based on timer
            const fadeProgress = platform.timer / platform.cycleTime;
            const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

            const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
            platGradient.addColorStop(1, `rgba(200, 50, 50, ${alpha})`);
            ctx.fillStyle = platGradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Platform warning border
            if (fadeProgress > 0.7) {

                ctx.strokeStyle = `rgba(255, 0, 0, ${1 - fadeProgress})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }

            // Platform highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
        }
    });

    // PHASE 2: Draw checkpoints
    currentLevelData.checkpoints.forEach(cp => {
        if (!cp.collected) {
            // Checkpoint flag
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(cp.x + 12, cp.y, 6, 30);

            // Flag
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(cp.x + 18, cp.y);
            ctx.lineTo(cp.x + 30, cp.y + 7);
            ctx.lineTo(cp.x + 18, cp.y + 14);
            ctx.fill();

            // Checkpoint glow
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(cp.x + 15, cp.y + 15, 20, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Collected checkpoint (grayed out)
            ctx.fillStyle = '#666666';
            ctx.fillRect(cp.x + 12, cp.y, 6, 30);

            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.moveTo(cp.x + 18, cp.y);
            ctx.lineTo(cp.x + 30, cp.y + 7);
            ctx.lineTo(cp.x + 18, cp.y + 14);
            ctx.fill();
        }
    });

    // Draw candies with animation
    currentLevelData.candies.forEach((candy, index) => {
        if (!candy.collected) {
            const bounce = Math.sin(animationFrame * 0.05 + index) * 3;

            // Candy glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 15, 0, Math.PI * 2);
            ctx.fill();

            // Candy
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.fill();

            // Candy shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();

            // Candy wrapper
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    // SPRINT 2: Draw secret collectibles with sparkle/glow
    if (currentLevelData.secrets) {
        currentLevelData.secrets.forEach((secret, index) => {
            if (!secret.collected) {
                const sparkle = Math.sin(animationFrame * 0.1 + index * 2) * 5;
                const glowSize = 20 + Math.sin(animationFrame * 0.15) * 5;

                // Secret glow (purple/magic)
                ctx.fillStyle = 'rgba(147, 112, 219, 0.4)';
                ctx.beginPath();
                ctx.arc(secret.x + 12, secret.y + 12 + sparkle, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Inner glow
                ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(secret.x + 12, secret.y + 12 + sparkle, 15, 0, Math.PI * 2);
                ctx.fill();

                // Secret gem (diamond shape)
                ctx.fillStyle = '#9370db';
                ctx.save();
                ctx.translate(secret.x + 12, secret.y + 12 + sparkle);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-8, -8, 16, 16);
                ctx.restore();

                // Gem shine
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(secret.x + 9, secret.y + 9 + sparkle, 3, 0, Math.PI * 2);
                ctx.fill();

                // Sparkle particles
                if (animationFrame % 20 === 0) {
                    createParticles(secret.x + 12, secret.y + 12, '#ffd700', 3, {
                        spread: 5, gravity: 0.05, life: 0.8, size: { min: 2, max: 5 }, fade: 0.08, shape: 'star'
                    });
                }
            }
        });
    }

    // Draw power-ups
    powerUps.forEach(powerUp => {
        if (!powerUp.collected) {
            const bounce = Math.sin(animationFrame * 0.08) * 5;

            // Power-up glow
            let glowColor;
            switch(powerUp.type) {
                case POWER_UPS.JUMP: glowColor = 'rgba(0, 255, 255, 0.3)'; break;
                case POWER_UPS.SPEED: glowColor = 'rgba(255, 255, 0, 0.3)'; break;
                case POWER_UPS.SHIELD: glowColor = 'rgba(0, 255, 0, 0.3)'; break;
                case POWER_UPS.DOUBLE_POINTS: glowColor = 'rgba(255, 0, 255, 0.3)'; break;
                case POWER_UPS.DASH: glowColor = 'rgba(255, 128, 0, 0.3)'; break;
            }
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 18, 0, Math.PI * 2);
            ctx.fill();

            // Power-up icon
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 12, 0, Math.PI * 2);
            ctx.fill();

            // Power-up symbol
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            let symbol = '⚡';
            if (powerUp.type === POWER_UPS.DASH) symbol = '💨';
            ctx.fillText(symbol, powerUp.x + 10, powerUp.y + 15 + bounce);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Enemy angry mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 20, 6, 0, Math.PI);
        ctx.stroke();
    });

    // Draw goal
    const goal = currentLevelData.goal;
    const goalBounce = Math.sin(animationFrame * 0.03) * 5;

    // Goal glow
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(goal.x - 5, goal.y - 5 + goalBounce, goal.width + 10, goal.height + 10);

    // Goal box
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(goal.x, goal.y + goalBounce, goal.width, goal.height);

    // Goal star
    ctx.fillStyle = '#ffff00';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', goal.x + goal.width / 2, goal.y + 35 + goalBounce);

    // Draw particles
    drawParticles();

    // Draw player trail
    drawPlayerTrail();

    // Draw player with power-up effects
    drawPlayer();

    // HUD
    drawHUD();

    // PHASE 3: Draw mini-map
    drawMiniMap();

    ctx.restore();
}

function drawPlayer() {
    let playerColor = '#ff69b4';
    let hasGlow = false;

    // PHASE 3: Invincibility visual effect with transparency pulsing
    if (player.invincible && !player.isDashing) {
        const alpha = 0.5 + Math.sin(animationFrame * 0.3) * 0.3;
        ctx.globalAlpha = alpha;
    }

    // PHASE 2: Dash trail effect
    if (player.isDashing) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(player.x - 20, player.y, 40, player.height);
    }

    // PHASE 2: Wall slide effect
    if (player.wallSliding) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(player.x - 5, player.y, player.width + 10, player.height);
    }

    // Calculate hair animation based on movement
    const isRunning = Math.abs(player.vx) > 0.1;
    const isJumping = jumpState !== 'grounded';

    // Hair flow animation parameters
    let hairFlowOffset = 0;
    let hairWaveAmplitude = 0;
    let hairWaveSpeed = 0;

    if (isRunning) {
        // Hair flows back when running
        hairFlowOffset = -Math.abs(player.vx) * 2;
        hairWaveAmplitude = 3;
        hairWaveSpeed = animationFrame * 0.2;
    } else if (isJumping) {
        // Hair flows up and back when jumping
        hairFlowOffset = -5;
        hairWaveAmplitude = 5;
        hairWaveSpeed = animationFrame * 0.15;
    } else {
        // Gentle swaying when standing
        hairWaveAmplitude = 2;
        hairWaveSpeed = animationFrame * 0.08;
    }

    // Draw golden hair on top of head
    const hairColor = '#ffd700'; // Gold color
    const hairHighlight = '#ffed4e'; // Lighter gold for highlights

    // Hair base position - at the top of the head
    const hairBaseX = player.x + 20;
    const hairBaseY = player.y - 15; // Center of head, hair will extend upward

    // Draw upward-flowing golden hair (visible on top of head)
    for (let i = 0; i < 10; i++) {
        const strandOffset = (i - 4.5) * 5;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.4) * hairWaveAmplitude;
        const upwardLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 8;

        // Main upward hair strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY - 10); // Start from near top of head
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.2, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset + waveOffset * 1.5 + hairFlowOffset * 0.4, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.5, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 0.5, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 0.5 + waveOffset + hairFlowOffset * 0.2, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset - 0.5 + waveOffset * 1.5 + hairFlowOffset * 0.4, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset - 1 + waveOffset + hairFlowOffset * 0.5, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Golden crown/headband
    ctx.beginPath();
    ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairColor;
    ctx.fill();
    ctx.strokeStyle = '#e6b800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw flowing hair strands (behind the character)
    for (let i = 0; i < 6; i++) {
        const strandOffset = (i - 2.5) * 8;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.5) * hairWaveAmplitude;
        const strandLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 5;

        // Main flowing hair strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.3, hairBaseY + 10,
            hairBaseX + strandOffset + waveOffset * 2 + hairFlowOffset * 0.6, hairBaseY + 20,
            hairBaseX + strandOffset + hairFlowOffset, hairBaseY + strandLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight strand
        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 1, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 1 + waveOffset + hairFlowOffset * 0.3, hairBaseY + 10,
            hairBaseX + strandOffset - 1 + waveOffset * 2 + hairFlowOffset * 0.6, hairBaseY + 20,
            hairBaseX + strandOffset - 2 + hairFlowOffset, hairBaseY + strandLength - 5
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Body
    const bodyGradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y);
    bodyGradient.addColorStop(0, '#ff69b4');
    bodyGradient.addColorStop(1, '#ff1493');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Body highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(player.x, player.y, 10, player.height);

    // Legs animation (when moving)
    const legAnimation = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 3 : 0;

    // Left leg
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 10, player.y + player.height - 5 + legAnimation, 8, 10);

    // Right leg
    ctx.fillRect(player.x + 22, player.y + player.height - 5 - legAnimation, 8, 10);

    // Arms animation (swing with movement)
    const armSwing = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 10 : 0;

    // Left arm
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(player.x - 5 + armSwing, player.y + 10, 8, 20);

    // Right arm
    ctx.fillRect(player.x + player.width - 3 - armSwing, player.y + 10, 8, 20);

    // Hat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(player.x - 5, player.y - 10, 50, 10);
    ctx.fillRect(player.x + 15, player.y - 25, 15, 20);

    // Head
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 15, 15, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y - 17, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y - 17, 3, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // PHASE 3: Reset alpha after invincibility effect
    ctx.globalAlpha = 1.0;
}

// PHASE 3: Mini-map function
function drawMiniMap() {
    // Don't draw if not playing
    if (gameState !== 'playing') return;

    const mapSize = 100;
    const mapX = canvas.width - mapSize - 10;
    const mapY = canvas.height - mapSize - 20;
    const scale = mapSize / canvas.width;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize * (canvas.height / canvas.width));

    // Platforms (dark pink)
    ctx.fillStyle = 'rgba(255, 105, 180, 0.8)';
    currentLevelData.platforms.forEach(p => {
        ctx.fillRect(mapX + p.x * scale, mapY + p.y * scale, p.width * scale, Math.max(2, p.height * scale));
    });

    // Disappearing platforms (lighter pink)
    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
    currentLevelData.disappearingPlatforms.forEach(p => {
        if (p.visible) {
            ctx.fillRect(mapX + p.x * scale, mapY + p.y * scale, p.width * scale, Math.max(2, p.height * scale));
        }
    });

    // Checkpoints (green flags)
    currentLevelData.checkpoints.forEach(cp => {
        if (!cp.collected) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(mapX + cp.x * scale, mapY + cp.y * scale, 3, 5);
        }
    });

    // Goal (green)
    const goal = currentLevelData.goal;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(mapX + goal.x * scale, mapY + goal.y * scale, goal.width * scale, goal.height * scale);

    // Player (cyan)
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(mapX + player.x * scale, mapY + player.y * scale, Math.max(3, player.width * scale), Math.max(3, player.height * scale));

    // Border
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize * (canvas.height / canvas.width));
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 20;
    ctx.fillText('⏸️ PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;

    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('Keys 0-5 to Adjust Volume', canvas.width / 2, canvas.height / 2 + 90);

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText('💀 GAME OVER', canvas.width / 2, 200);
    ctx.shadowBlur = 0;

    // Final score
    ctx.fillStyle = '#fff';
    ctx.font = '32px Comic Sans MS';
    ctx.fillText('Score: ' + score, canvas.width / 2, 280);

    // Combo stats
    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('🔥 Max Combo: ' + combo + 'x', canvas.width / 2, 320);

    if (timeBonus > 0) {
        ctx.fillText('⏱️ Time Bonus: ' + timeBonus, canvas.width / 2, 350);
    }

    // High score message
    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🎉 NEW HIGH SCORE! 🎉', canvas.width / 2, 400);
    }

    // Restart instruction
    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Restart', canvas.width / 2, 460);

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

function drawVictoryScreen() {
    // Enhanced confetti particles
    if (animationFrame % 2 === 0) {
        // Create confetti bursts from multiple positions
        if (animationFrame % 30 === 0) {
            createConfetti(Math.random() * canvas.width, -10, 15);
            triggerScreenShake(2, 5);
        }

        // Regular confetti particles
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700'];
        for (let i = 0; i < 3; i++) {
            createParticles(
                Math.random() * canvas.width,
                -10,
                colors[Math.floor(Math.random() * colors.length)],
                Math.floor(Math.random() * 2) + 1,
                { spread: 12, gravity: 0.03, life: 2.0, shape: 'square' }
            );
        }
    }
    updateParticles();
    drawParticles();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Victory glow effect
    const glowSize = 50 + Math.sin(animationFrame * 0.05) * 10;
    const glowGradient = ctx.createRadialGradient(canvas.width / 2, 150, 0, canvas.width / 2, 150, glowSize);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.fillText('🎊 YOU WIN! 🎊', canvas.width / 2, 200);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '28px Comic Sans MS';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, 280);

    // Show combo stats if achieved
    if (combo > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Comic Sans MS';
        ctx.fillText('Best Combo: ' + combo + 'x', canvas.width / 2, 320);
    }

    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🏆 NEW HIGH SCORE! 🏆', canvas.width / 2, 360);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Play Again', canvas.width / 2, 420);

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

// Game loop
function gameLoop() {
    animationFrame++;

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'levelSelect') {
        drawLevelSelectScreen();
    } else if (gameState === 'playing') {
        updatePlayer();
        updateTutorialHints(); // SPRINT 2: Update tutorial hints
        drawGame();
        drawTutorialHint(); // SPRINT 2: Draw tutorial hints
    } else if (gameState === 'paused') {
        drawGame();
        drawPauseScreen();
    } else if (gameState === 'gameover') {
        drawGame();
        drawGameOverScreen();
    } else if (gameState === 'victory') {
        drawGame();
        drawVictoryScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
