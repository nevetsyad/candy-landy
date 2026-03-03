// Candy Landy v4 - Enhanced with Side Scroller Features
// Phase 1 Implementation: Dash, Checkpoints, Visible Timer, Screen Transitions, Enhanced Parallax

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas settings
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start';
let score = 0;
let highScore = 0;
let currentLevel = 0;
let animationFrame = 0;

// Screen transition system
let screenTransition = {
    active: false,
    phase: 'out', // 'out' or 'in'
    alpha: 0,
    callback: null
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
    checkpoint: null
};

// Game settings
const SETTINGS = {
    volume: 0.5,
    levelTime: 90, // seconds for time bonus
    dashCooldown: 60, // frames
    dashDuration: 15, // frames
    dashSpeed: 20, // pixels per frame
    parallaxLayers: 3
};

// Level timer
let levelTimer = 0;
let maxLevelTime = SETTINGS.levelTime;
let timerWarningPlayed = false;

// Initialize audio with graceful degradation
function initAudio() {
    if (audioContext) {
        if (audioContext.state === 'suspended') {
            resumeAudio();
        }
        return audioContext.state === 'running';
    }

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn('Web Audio API not supported - audio disabled');
            audioSupported = false;
            return false;
        }

        audioContext = new AudioContextClass();

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

// Resume audio context
function resumeAudio() {
    if (!audioContext) {
        initAudio();
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            audioContextSuspended = false;
            console.log('Audio context resumed successfully');
        }).catch(e => {
            console.warn('Failed to resume audio context:', e.message);
            audioSupported = false;
        });
    }
}

// Play sound with proper validation
function playSound(type) {
    if (!audioSupported) return;
    if (!initAudio()) return;

    resumeAudio();

    if (!audioContext || audioContext.state !== 'running') return;

    if (!audioContext.currentTime && audioContext.currentTime !== 0) {
        console.warn('Audio context not ready');
        return;
    }

    const volumeGain = (SETTINGS && SETTINGS.volume !== undefined) ? SETTINGS.volume : 0.5;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'jump':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;

            case 'collect':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;

            case 'powerup':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.15);
                oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.25 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.35);
                break;

            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.4 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.25);
                break;

            case 'levelComplete':
                const melody = [523, 659, 784, 1047];
                melody.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
                    gain.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.2);
                    osc.start(audioContext.currentTime + i * 0.15);
                    osc.stop(audioContext.currentTime + i * 0.15 + 0.2);
                });
                break;

            case 'gameOver':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
                oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.6);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.7);
                break;

            case 'combo':
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
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;

            case 'checkpoint':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.25 * volumeGain, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.warn('Error playing sound:', e.message);
    }
}

// Background music
let musicInterval = null;
let musicNoteIndex = 0;
const melody = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047];
const melodyDurations = [0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.25, 0.25, 0.3, 0.3, 0.5];
const chordProgression = [
    [262, 330, 392],
    [294, 369, 440],
    [330, 415, 494],
    [349, 440, 523],
    [392, 494, 588],
    [440, 554, 659],
    [494, 622, 740],
    [523, 659, 784]
];

function startBackgroundMusic() {
    if (isMusicPlaying) return;
    if (!audioSupported) return;
    if (!initAudio()) return;

    resumeAudio();

    if (audioContext && audioContext.state === 'suspended') {
        return;
    }

    isMusicPlaying = true;

    function playNextNote() {
        if (!isMusicPlaying) return;

        const chordIndex = Math.floor(musicNoteIndex / 2) % chordProgression.length;
        const chord = chordProgression[chordIndex];
        const noteIndex = musicNoteIndex % chord.length;

        chord.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.type = 'sine';
            const noteDelay = i * 0.02;
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + noteDelay);
            gain.gain.setValueAtTime(0.08 * SETTINGS.volume, audioContext.currentTime + noteDelay);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + melodyDurations[musicNoteIndex]);

            osc.start(audioContext.currentTime + noteDelay);
            osc.stop(audioContext.currentTime + melodyDurations[musicNoteIndex] + noteDelay);
        });

        if (musicNoteIndex % 4 === 0) {
            const bassOsc = audioContext.createOscillator();
            const bassGain = audioContext.createGain();
            bassOsc.connect(bassGain);
            bassGain.connect(audioContext.destination);

            bassOsc.type = 'sine';
            const bassFreq = chord[0] / 2;
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

// Player object with enhanced features
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

    // Animation states
    jumpState: 'grounded',
    jumpCount: 0,
    legAnimation: 0,
    armAnimation: 0,
    bodyBounce: 0,
    jumpAnimationFrame: 0,

    // Platform tracking
    currentPlatform: null,
    previousPlatformX: 0,

    // Jump mechanics
    coyoteTime: 0,
    jumpBuffer: 0,
    canDoubleJump: true,

    // DASH MECHANIC (NEW)
    dashCooldown: 0,
    dashTimer: 0,
    dashing: false,
    dashDirection: 1,
    dashTrail: []
};

// Combo and scoring system
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;
let timeBonus = 0;

// Power-up types
const POWER_UPS = {
    SPEED: 'speed',
    JUMP: 'jump',
    SHIELD: 'shield',
    DOUBLE_POINTS: 'double'
};

// Particle system for effects
let particles = [];

// Player trail system for visual feedback
let playerTrail = [];

// CHECKPOINT SYSTEM (NEW)
let checkpoints = [];
let activeCheckpoint = null;

// Screen shake
let screenShake = { x: 0, y: 0 };

// Parallax background layers (ENHANCED)
let parallaxLayers = [
    { speed: 0.1, elements: [], type: 'distantMountains' },
    { speed: 0.2, elements: [], type: 'hills' },
    { speed: 0.5, elements: [], type: 'trees' }
];

function createParticles(x, y, color, count = 10, options = {}) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('Invalid particle position');
        return;
    }
    if (typeof count !== 'number' || count <= 0) {
        count = 10;
    }
    count = Math.min(count, 100);

    const defaultOptions = {
        spread: 8,
        gravity: 0.1,
        life: 1.0,
        size: { min: 2, max: 8 },
        fade: 0.02,
        shape: 'circle'
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

function createExplosion(x, y, color, count = 30) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('Invalid explosion position');
        return;
    }
    if (typeof count !== 'number' || count <= 0) {
        count = 30;
    }
    count = Math.min(count, 150);

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 10 + 5;

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.5,
            maxLife: 1.5,
            color: color || '#ff6600',
            size: Math.random() * 6 + 3,
            gravity: 0.15,
            fade: 0.015,
            shape: Math.random() > 0.5 ? 'star' : 'circle',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }
}

// DASH TRAIL PARTICLES (NEW)
function createDashTrail() {
    if (animationFrame % 2 !== 0) return;

    const trailColor = player.dashing ? '#00ffff' : '#ffd700';
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;

    player.dashTrail.push({
        x: x,
        y: y,
        alpha: 0.6,
        size: player.width * 0.8
    });

    // Limit trail length
    if (player.dashTrail.length > 10) {
        player.dashTrail.shift();
    }

    createParticles(x, y, trailColor, 2, {
        spread: 5,
        gravity: 0.02,
        life: 0.3,
        size: { min: 3, max: 6 },
        fade: 0.03,
        shape: 'circle'
    });
}

// Screen shake effect
function triggerScreenShake(intensity) {
    screenShake.x = (Math.random() - 0.5) * intensity;
    screenShake.y = (Math.random() - 0.5) * intensity;
}

// SCREEN TRANSITION SYSTEM (NEW)
function startScreenTransition(callback) {
    screenTransition.active = true;
    screenTransition.phase = 'out';
    screenTransition.alpha = 0;
    screenTransition.callback = callback;
}

function updateScreenTransition() {
    if (!screenTransition.active) return;

    const transitionSpeed = 0.05;

    if (screenTransition.phase === 'out') {
        screenTransition.alpha += transitionSpeed;
        if (screenTransition.alpha >= 1) {
            screenTransition.alpha = 1;
            screenTransition.phase = 'in';
            if (screenTransition.callback) {
                screenTransition.callback();
                screenTransition.callback = null;
            }
        }
    } else if (screenTransition.phase === 'in') {
        screenTransition.alpha -= transitionSpeed;
        if (screenTransition.alpha <= 0) {
            screenTransition.alpha = 0;
            screenTransition.active = false;
        }
    }
}

function drawScreenTransition() {
    if (!screenTransition.active) return;

    ctx.fillStyle = `rgba(0, 0, 0, ${screenTransition.alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// INITIALIZE PARALLAX LAYERS (NEW)
function initializeParallaxLayers() {
    // Layer 1: Distant mountains
    for (let i = 0; i < 3; i++) {
        parallaxLayers[0].elements.push({
            x: i * 300,
            y: 200,
            width: 350,
            height: 250,
            color: '#5c6bc0'
        });
    }

    // Layer 2: Hills
    for (let i = 0; i < 5; i++) {
        parallaxLayers[1].elements.push({
            x: i * 200,
            y: 350,
            width: 250,
            height: 150,
            color: '#7cb342'
        });
    }

    // Layer 3: Trees/bushes
    for (let i = 0; i < 8; i++) {
        parallaxLayers[2].elements.push({
            x: i * 120,
            y: 450,
            width: 60,
            height: 80,
            type: 'tree',
            color: '#388e3c'
        });
    }
}

// DRAW PARALLAX BACKGROUND (ENHANCED)
function drawParallaxBackground() {
    parallaxLayers.forEach((layer, layerIndex) => {
        const parallaxOffset = (player.x * layer.speed) % (canvas.width + 100) - 50;

        layer.elements.forEach(element => {
            let drawX = element.x - parallaxOffset;

            // Wrap elements for seamless scrolling
            if (drawX < -element.width) {
                drawX += (canvas.width + 100) * Math.ceil((element.width - drawX) / (canvas.width + 100));
            }

            const opacity = 1 - (layerIndex * 0.2);

            if (layer.type === 'distantMountains') {
                ctx.fillStyle = `rgba(${hexToRgb(element.color)}, ${opacity * 0.3})`;
                ctx.beginPath();
                ctx.moveTo(drawX, element.y + element.height);
                ctx.lineTo(drawX + element.width / 2, element.y);
                ctx.lineTo(drawX + element.width, element.y + element.height);
                ctx.fill();
            } else if (layer.type === 'hills') {
                ctx.fillStyle = `rgba(${hexToRgb(element.color)}, ${opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(drawX + element.width / 2, element.y + element.height, element.width / 2, Math.PI, 0);
                ctx.fill();
            } else if (layer.type === 'trees') {
                ctx.fillStyle = `rgba(${hexToRgb(element.color)}, ${opacity * 0.7})`;
                // Tree trunk
                ctx.fillRect(drawX + 25, element.y + 40, 10, 40);
                // Tree top
                ctx.beginPath();
                ctx.moveTo(drawX, element.y + 60);
                ctx.lineTo(drawX + 30, element.y);
                ctx.lineTo(drawX + 60, element.y + 60);
                ctx.fill();
            }
        });
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 0, 0';
}

// Level definitions with checkpoints (ENHANCED)
const levels = [
    // Level 1: Tutorial with checkpoints
    {
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
        powerUps: [
            { x: 450, y: 290, type: POWER_UPS.SPEED, collected: false }
        ],
        enemies: [
            { x: 240, y: 420, width: 30, height: 30, vx: 2, range: 80, startX: 240 },
            { x: 440, y: 320, width: 30, height: 30, vx: -1, range: 60, startX: 440 },
            { x: 640, y: 220, width: 30, height: 30, vx: 3, range: 100, startX: 640 }
        ],
        disappearingPlatforms: [],
        checkpoints: [
            { x: 450, y: 320, activated: false, id: 1 } // Mid-level checkpoint
        ],
        goal: { x: 750, y: 200, width: 50, height: 50 }
    },
    // Level 2: Moving elements with checkpoints
    {
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
        powerUps: [
            { x: 280, y: 420, type: POWER_UPS.JUMP, collected: false },
            { x: 680, y: 520, type: POWER_UPS.SHIELD, collected: false }
        ],
        enemies: [
            { x: 450, y: 310, width: 30, height: 30, vx: 2, range: 100, startX: 450 }
        ],
        disappearingPlatforms: [
            { x: 300, y: 150, width: 100, height: 20, visible: true, timer: 0, cycleTime: 180 }
        ],
        checkpoints: [
            { x: 280, y: 420, activated: false, id: 1 },
            { x: 680, y: 520, activated: false, id: 2 }
        ],
        goal: { x: 730, y: 200, width: 50, height: 50 }
    },
    // Level 3: Challenging with multiple checkpoints
    {
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
        powerUps: [
            { x: 270, y: 320, type: POWER_UPS.SPEED, collected: false },
            { x: 750, y: 120, type: POWER_UPS.SHIELD, collected: false },
            { x: 350, y: 520, type: POWER_UPS.DOUBLE_POINTS, collected: false }
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
        checkpoints: [
            { x: 270, y: 320, activated: false, id: 1 },
            { x: 750, y: 120, activated: false, id: 2 }
        ],
        goal: { x: 730, y: 100, width: 50, height: 50 }
    }
];

let currentLevelData = null;
let enemies = [];
let powerUps = [];

// Input handling
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Start game
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (gameState === 'start') {
            gameState = 'playing';
            startBackgroundMusic();
            loadLevel(0);
        }
    }

    // Pause
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
            stopBackgroundMusic();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            startBackgroundMusic();
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
            startBackgroundMusic();
        }
    }

    // DASH INPUT (NEW) - Shift key or double tap
    if ((e.key === 'Shift' || e.key === 'Z') && gameState === 'playing') {
        performDash();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// DASH MECHANIC (NEW)
function performDash() {
    if (player.dashCooldown > 0) return;

    // Determine dash direction based on input or facing direction
    if (keys['ArrowLeft']) {
        player.dashDirection = -1;
    } else if (keys['ArrowRight']) {
        player.dashDirection = 1;
    } else {
        player.dashDirection = player.facingRight !== undefined ? (player.facingRight ? 1 : -1) : 1;
    }

    player.dashing = true;
    player.dashTimer = SETTINGS.dashDuration;
    player.dashCooldown = SETTINGS.dashCooldown;
    player.invincible = true;
    player.invincibleTimer = SETTINGS.dashDuration + 10;

    playSound('dash');
    createDashTrail();
    triggerScreenShake(3);
}

function updateDash() {
    // Update cooldown
    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }

    // Handle active dash
    if (player.dashing) {
        player.dashTimer--;

        // Apply dash velocity
        player.vx = player.dashDirection * SETTINGS.dashSpeed;
        player.vy = 0; // No vertical movement during dash

        // Create trail particles
        createDashTrail();

        // End dash
        if (player.dashTimer <= 0) {
            player.dashing = false;
            player.vx = 0;
        }
    }
}

// CHECKPOINT SYSTEM (NEW)
function checkCheckpointCollision() {
    if (!currentLevelData.checkpoints) return;

    currentLevelData.checkpoints.forEach(checkpoint => {
        if (!checkpoint.activated) {
            const dx = player.x + player.width / 2 - checkpoint.x;
            const dy = player.y + player.height / 2 - checkpoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 40) {
                checkpoint.activated = true;
                activeCheckpoint = { ...checkpoint };
                playSound('checkpoint');

                // Create celebration particles
                createParticles(checkpoint.x, checkpoint.y, '#00ff00', 20, {
                    spread: 10,
                    gravity: 0.05,
                    life: 1.0,
                    size: { min: 4, max: 8 },
                    fade: 0.02,
                    shape: 'star'
                });

                triggerScreenShake(5);
            }
        }
    });
}

function respawnAtCheckpoint() {
    if (activeCheckpoint) {
        player.x = activeCheckpoint.x - player.width / 2;
        player.y = activeCheckpoint.y - player.height;
        player.vx = 0;
        player.vy = 0;
        player.powerUp = null;
        player.powerUpTimer = 0;
        player.dashCooldown = Math.floor(player.dashCooldown / 2); // Partial dash cooldown reset
    } else {
        // No checkpoint, respawn at start
        player.x = 100;
        player.y = 400;
        player.vx = 0;
        player.vy = 0;
    }
}

// Load level
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        gameState = 'victory';
        stopBackgroundMusic();
        playSound('levelComplete');
        triggerScreenShake(10);
        createConfetti(canvas.width / 2, canvas.height / 2, 50);
        return;
    }

    startScreenTransition(() => {
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
        player.dashCooldown = 0;
        player.dashing = false;
        player.dashTrail = [];

        // Clear particles
        particles = [];
        playerTrail = [];

        // Reset combo system
        combo = 0;
        comboTimer = 0;
        comboMultiplier = 1;
        timeBonus = 0;

        // Reset timer
        levelTimer = maxLevelTime;
        timerWarningPlayed = false;

        // Reset checkpoints
        activeCheckpoint = null;
        if (currentLevelData.checkpoints) {
            currentLevelData.checkpoints.forEach(cp => cp.activated = false);
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
    });
}

// Update player
function updatePlayer() {
    if (gameState !== 'playing') return;

    // Update dash
    updateDash();

    // Only apply normal movement if not dashing
    if (!player.dashing) {
        // Horizontal movement
        if (keys['ArrowLeft']) {
            player.vx = -player.speed;
            if (player.powerUp === POWER_UPS.SPEED) {
                player.vx *= 1.6;
            }
        } else if (keys['ArrowRight']) {
            player.vx = player.speed;
            if (player.powerUp === POWER_UPS.SPEED) {
                player.vx *= 1.6;
            }
        } else {
            player.vx = 0;
        }

        // Jump
        if (keys[' '] || keys['ArrowUp']) {
            if (!player.jumpBuffer) {
                player.jumpBuffer = 8;
            }
        }

        if (player.jumpBuffer > 0) {
            player.jumpBuffer--;
        }

        // Jump with coyote time
        if (player.grounded && player.jumpBuffer > 0) {
            player.vy = player.jumpPower;
            player.grounded = false;
            player.jumpCount = 1;
            player.jumpBuffer = 0;
            player.jumpState = 'jumping';
            playSound('jump');
            createParticles(player.x + player.width / 2, player.y + player.height, '#ffb6c1', 6, {
                spread: 5,
                gravity: 0.15,
                life: 0.5,
                size: { min: 3, max: 5 },
                fade: 0.04,
                shape: 'circle'
            });
        }

        // Double jump
        if ((keys[' '] || keys['ArrowUp']) && !player.grounded && player.jumpCount < 2 && player.canDoubleJump) {
            if (player.powerUp === POWER_UPS.JUMP) {
                if (player.jumpCount < 3) {
                    player.vy = player.jumpPower * 1.2;
                    player.jumpCount++;
                    player.jumpState = player.jumpCount === 2 ? 'doubleJump' : 'tripleJump';
                    playSound('jump');
                    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#00ffff', 8, {
                        spread: 8,
                        gravity: 0.1,
                        life: 0.6,
                        size: { min: 4, max: 7 },
                        fade: 0.03,
                        shape: 'star'
                    });
                }
            } else if (player.jumpCount === 1 && !keys[' ']) {
                player.vy = player.jumpPower * 0.9;
                player.jumpCount = 2;
                player.jumpState = 'doubleJump';
                playSound('jump');
                createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ffd700', 8, {
                    spread: 8,
                    gravity: 0.1,
                    life: 0.6,
                    size: { min: 4, max: 7 },
                    fade: 0.03,
                    shape: 'star'
                });
            }
        }
    }

    // Gravity
    player.vy += 0.6;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Fall detection
    if (player.y > canvas.height) {
        playerDie();
    }

    // Coyote time
    if (player.grounded) {
        player.coyoteTime = 6;
    } else if (player.coyoteTime > 0) {
        player.coyoteTime--;
    }

    // Platform collision
    player.grounded = false;
    currentLevelData.platforms.forEach(platform => {
        if (player.vy > 0 &&
            player.y + player.height <= platform.y + player.vy + 5 &&
            player.y + player.height >= platform.y - 5 &&
            player.x + player.width > platform.x + 5 &&
            player.x < platform.x + platform.width - 5) {

            player.y = platform.y - player.height;
            player.vy = 0;
            player.grounded = true;
            player.jumpCount = 0;
            player.jumpState = 'grounded';

            // Moving platform
            if (platform.moving) {
                const moveAmount = Math.sin(animationFrame * 0.02) * platform.range * 0.01;
                const newX = platform.startX + moveAmount;
                player.x += newX - platform.x;
                platform.x = newX;
            }
        }
    });

    // Disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        if (platform.visible) {
            if (player.vy > 0 &&
                player.y + player.height <= platform.y + player.vy + 5 &&
                player.y + player.height >= platform.y - 5 &&
                player.x + player.width > platform.x + 5 &&
                player.x < platform.x + platform.width - 5) {

                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
                player.jumpCount = 0;
                player.jumpState = 'grounded';
            }

            platform.timer++;
            if (platform.timer >= platform.cycleTime) {
                platform.visible = false;
                platform.timer = 0;
            }
        } else {
            platform.timer++;
            if (platform.timer >= 60) {
                platform.visible = true;
                platform.timer = 0;
            }
        }
    });

    // Candy collection
    currentLevelData.candies.forEach(candy => {
        if (!candy.collected) {
            const dx = player.x + player.width / 2 - candy.x - 10;
            const dy = player.y + player.height / 2 - candy.y - 10;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 25) {
                candy.collected = true;
                let points = 10;

                if (comboTimer > 0) {
                    combo = Math.min(combo + 1, 100);
                    comboTimer = 60;
                    comboMultiplier = Math.min(combo, 5);
                } else {
                    combo = 1;
                    comboTimer = 60;
                    comboMultiplier = 1;
                }

                if (player.powerUp === POWER_UPS.DOUBLE_POINTS) {
                    points *= 2;
                }

                points *= comboMultiplier;
                points = Math.max(0, Math.floor(points));
                score += points;

                playSound('collect');
                createParticles(candy.x + 10, candy.y + 10, '#ffd700', 10, {
                    spread: 8,
                    gravity: 0.1,
                    life: 1.0,
                    size: { min: 4, max: 8 },
                    fade: 0.02,
                    shape: 'star'
                });
            }
        }
    });

    // Power-up collection
    powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected) {
            if (player.x < powerUp.x + 30 &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + 30 &&
                player.y + player.height > powerUp.y) {

                powerUp.collected = true;
                player.powerUp = powerUp.type;
                player.powerUpTimer = 300;

                score += 25;
                playSound('powerup');
                createParticles(powerUp.x + 15, powerUp.y + 15, '#00ff00', 15, {
                    spread: 10,
                    gravity: 0.08,
                    life: 1.2,
                    size: { min: 5, max: 10 },
                    fade: 0.015,
                    shape: 'star'
                });
            }
        }
    });

    // Power-up timer
    if (player.powerUpTimer > 0) {
        player.powerUpTimer--;
        if (player.powerUpTimer <= 0) {
            player.powerUp = null;
        }
    }

    // Combo timer
    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
        comboMultiplier = 1;
    }

    // Invincibility timer
    if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // ENEMY COLLISION with stomp mechanic
    enemies.forEach((enemy, index) => {
        // Patrol movement
        if (!enemy.dead) {
            enemy.x += enemy.vx;
            if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX - enemy.range) {
                enemy.vx *= -1;
            }
        }

        // Collision detection
        if (!enemy.dead && !player.invincible) {
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {

                // Check if stomping (falling from above)
                if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                    // Stomp the enemy
                    enemy.dead = true;
                    player.vy = -10;
                    score += 50;

                    playSound('enemyHit');
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000', 20);
                    triggerScreenShake(5);

                    // Build combo
                    if (comboTimer > 0) {
                        combo = Math.min(combo + 1, 100);
                        comboTimer = 60;
                        comboMultiplier = Math.min(combo, 5);
                    }
                } else {
                    // Take damage
                    playerDie();
                }
            }
        }
    });

    // Check checkpoint collision
    checkCheckpointCollision();

    // Goal collision
    const goal = currentLevelData.goal;
    const allCandiesCollected = currentLevelData.candies.every(c => c.collected);

    if (allCandiesCollected &&
        player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {

        // Calculate time bonus
        timeBonus = Math.floor(levelTimer * 3.33); // Max 300 points
        score += timeBonus;

        playSound('levelComplete');
        createConfetti(goal.x + goal.width / 2, goal.y + goal.height / 2, 30);
        triggerScreenShake(8);

        loadLevel(currentLevel + 1);
    }

    // Update animations
    player.legAnimation = Math.abs(player.vx) > 0 ? player.legAnimation + 0.3 : 0;
    player.armAnimation = Math.abs(player.vx) > 0 ? player.armAnimation + 0.25 : 0;
    player.jumpAnimationFrame = !player.grounded ? player.jumpAnimationFrame + 0.1 : 0;
}

// Player death
function playerDie() {
    if (player.invincible && !player.dashing) return;

    player.lives--;
    player.invincible = true;
    player.invincibleTimer = 120;

    playSound('hit');
    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 20, {
        spread: 12,
        gravity: 0.15,
        life: 1.0,
        size: { min: 5, max: 10 },
        fade: 0.02,
        shape: 'circle'
    });
    triggerScreenShake(8);

    if (player.lives <= 0) {
        gameState = 'gameover';
        stopBackgroundMusic();
        playSound('gameOver');

        if (score > highScore) {
            highScore = score;
            safeLocalStorage('set', 'candyLandyHighScore', highScore.toString());
        }
    } else {
        respawnAtCheckpoint();
    }
}

// Reset game
function resetGame() {
    score = 0;
    currentLevel = 0;
    player.lives = 3;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;
    activeCheckpoint = null;
    levelTimer = maxLevelTime;
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= p.fade;
        p.rotation += p.rotationSpeed;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update dash trail
    for (let i = player.dashTrail.length - 1; i >= 0; i--) {
        player.dashTrail[i].alpha -= 0.06;
        if (player.dashTrail[i].alpha <= 0) {
            player.dashTrail.splice(i, 1);
        }
    }
}

// UPDATE LEVEL TIMER (NEW)
function updateLevelTimer() {
    if (gameState !== 'playing') return;

    levelTimer -= 1/60; // Assuming 60fps

    // Timer warning sound
    if (levelTimer <= 10 && !timerWarningPlayed) {
        playSound('combo'); // Reuse combo sound as warning
        timerWarningPlayed = true;
    }

    if (levelTimer <= 0) {
        levelTimer = 0;
        playerDie();
    }
}

// Update screen shake
function updateScreenShake() {
    if (screenShake.x !== 0 || screenShake.y !== 0) {
        screenShake.x *= 0.9;
        screenShake.y *= 0.9;

        if (Math.abs(screenShake.x) < 0.1) screenShake.x = 0;
        if (Math.abs(screenShake.y) < 0.1) screenShake.y = 0;
    }
}

// Draw functions
function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayer() {
    const x = player.x + player.width / 2;
    const y = player.y + player.height / 2;

    // Dash trail
    player.dashTrail.forEach(trail => {
        ctx.fillStyle = `rgba(0, 255, 255, ${trail.alpha * 0.5})`;
        ctx.fillRect(
            trail.x - trail.size / 2,
            trail.y - trail.size / 2,
            trail.size,
            trail.size
        );
    });

    // Invincibility flash
    if (player.invincible && Math.floor(animationFrame / 5) % 2 === 0) {
        return;
    }

    // Determine character color based on power-up
    let bodyColor = '#ff69b4';
    if (player.powerUp === POWER_UPS.SPEED) bodyColor = '#ff9800';
    if (player.powerUp === POWER_UPS.SHIELD) bodyColor = '#ffd700';
    if (player.powerUp === POWER_UPS.JUMP) bodyColor = '#00bcd4';
    if (player.dashing) bodyColor = '#00ffff';

    // Dress
    ctx.fillStyle = bodyColor;
    ctx.fillRect(player.x, player.y + 20, 40, 40);

    // Head
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 10, 18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 8, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 12, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

function drawHUD() {
    // HUD background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(10, 10, 300, 220);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 300, 220);

    // Score
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('🍬 Score: ' + score, 20, 40);

    // Lives
    ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

    // Level
    ctx.fillText('🎮 Level: ' + (currentLevel + 1) + '/' + levels.length, 20, 90);

    // Candies remaining
    const collected = currentLevelData.candies.filter(c => c.collected).length;
    const total = currentLevelData.candies.length;
    ctx.fillText('🍭 Candies: ' + collected + '/' + total, 20, 115);

    // VISIBLE TIMER (NEW)
    const timerColor = levelTimer > 30 ? '#00ff00' : (levelTimer > 10 ? '#ffff00' : '#ff0000');
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.fillText('⏱️ Time: ' + Math.ceil(levelTimer) + 's', 20, 140);

    // Combo display
    if (combo > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 165);
    }

    // Time bonus
    if (timeBonus > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 185);
    }

    // Jump indicator
    const jumpsRemaining = 2 - player.jumpCount;
    ctx.fillStyle = jumpsRemaining > 0 ? '#00ffff' : '#888';
    ctx.font = '16px Comic Sans MS';
    ctx.fillText('🦘 Jumps: ' + '⬆️'.repeat(jumpsRemaining), 20, 205);

    // Power-up indicator
    if (player.powerUp) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.fillRect(canvas.width - 120, 10, 110, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), canvas.width - 65, 35);
    }

    // DASH COOLDOWN INDICATOR (NEW)
    if (player.dashCooldown > 0) {
        const cooldownPercent = player.dashCooldown / SETTINGS.dashCooldown;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(canvas.width - 120, 55, 110, 25);
        ctx.fillStyle = '#333';
        ctx.font = '12px Comic Sans MS';
        ctx.fillText('Dash: ' + Math.ceil(player.dashCooldown / 60) + 's', canvas.width - 65, 72);
    } else {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(canvas.width - 120, 55, 110, 25);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Comic Sans MS';
        ctx.fillText('💨 DASH READY (Shift)', canvas.width - 65, 72);
    }

    // High score
    ctx.fillStyle = '#ff1493';
    ctx.font = '16px Comic Sans MS';
    ctx.textAlign = 'right';
    ctx.fillText('🏆 Best: ' + highScore, canvas.width - 20, 590);
}

function drawCheckpoints() {
    if (!currentLevelData.checkpoints) return;

    currentLevelData.checkpoints.forEach(checkpoint => {
        if (checkpoint.activated) {
            // Activated checkpoint - flag
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(checkpoint.x - 3, checkpoint.y - 40, 6, 40);

            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(checkpoint.x + 3, checkpoint.y - 40);
            ctx.lineTo(checkpoint.x + 30, checkpoint.y - 30);
            ctx.lineTo(checkpoint.x + 3, checkpoint.y - 20);
            ctx.fill();
        } else {
            // Inactive checkpoint
            ctx.fillStyle = '#888';
            ctx.fillRect(checkpoint.x - 3, checkpoint.y - 40, 6, 40);

            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(checkpoint.x + 3, checkpoint.y - 40);
            ctx.lineTo(checkpoint.x + 30, checkpoint.y - 30);
            ctx.lineTo(checkpoint.x + 3, checkpoint.y - 20);
            ctx.fill();
        }
    });
}

function drawGame() {
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Enhanced parallax background
    drawParallaxBackground();

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    drawCloud(80 + cloudOffset, 50, 50);
    drawCloud(350 - cloudOffset, 80, 60);
    drawCloud(600 + cloudOffset, 40, 55);

    // Draw platforms
    currentLevelData.platforms.forEach(platform => {
        const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platGradient.addColorStop(0, '#ff69b4');
        platGradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = platGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
    });

    // Draw disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        if (platform.visible) {
            const fadeProgress = platform.timer / platform.cycleTime;
            const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

            const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
            platGradient.addColorStop(1, `rgba(200, 50, 50, ${alpha})`);
            ctx.fillStyle = platGradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            if (fadeProgress > 0.7) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${1 - fadeProgress})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
        }
    });

    // Draw candies
    currentLevelData.candies.forEach((candy, index) => {
        if (!candy.collected) {
            const bounce = Math.sin(animationFrame * 0.05 + index) * 3;

            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
        if (!powerUp.collected) {
            const bounce = Math.sin(animationFrame * 0.08) * 5;
            const glowSize = 20 + Math.sin(animationFrame * 0.1) * 5;

            let color;
            switch (powerUp.type) {
                case POWER_UPS.SPEED: color = '#ff9800'; break;
                case POWER_UPS.JUMP: color = '#00bcd4'; break;
                case POWER_UPS.SHIELD: color = '#ffd700'; break;
                case POWER_UPS.DOUBLE_POINTS: color = '#9c27b0'; break;
            }

            ctx.fillStyle = `rgba(${hexToRgb(color)}, 0.3)`;
            ctx.beginPath();
            ctx.arc(powerUp.x + 15, powerUp.y + 15 + bounce, glowSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(powerUp.x + 15, powerUp.y + 15 + bounce, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            const icon = powerUp.type === POWER_UPS.SPEED ? '⚡' :
                         powerUp.type === POWER_UPS.JUMP ? '↑' :
                         powerUp.type === POWER_UPS.SHIELD ? '🛡️' : '×2';
            ctx.fillText(icon, powerUp.x + 15, powerUp.y + 20 + bounce);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.dead) {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2 - 5, enemy.y + enemy.height / 2 - 3, 4, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width / 2 + 5, enemy.y + enemy.height / 2 - 3, 4, 0, Math.PI * 2);
            ctx.fill();

            // Angry eyebrows
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width / 2 - 10, enemy.y + enemy.height / 2 - 10);
            ctx.lineTo(enemy.x + enemy.width / 2 - 2, enemy.y + enemy.height / 2 - 7);
            ctx.moveTo(enemy.x + enemy.width / 2 + 10, enemy.y + enemy.height / 2 - 10);
            ctx.lineTo(enemy.x + enemy.width / 2 + 2, enemy.y + enemy.height / 2 - 7);
            ctx.stroke();
        }
    });

    // Draw checkpoints
    drawCheckpoints();

    // Draw goal
    const goal = currentLevelData.goal;
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(goal.x + goal.width / 2 - 3, goal.y, 6, goal.height);

    const goalBounce = Math.sin(animationFrame * 0.05) * 3;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(goal.x + goal.width / 2, goal.y + goalBounce, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', goal.x + goal.width / 2, goal.y + 8 + goalBounce);

    // Draw particles
    updateParticles();
    drawParticles();

    // Draw player
    drawPlayer();

    ctx.restore();

    // Draw screen transition
    drawScreenTransition();
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;

        if (p.shape === 'star') {
            drawStar(0, 0, 5, p.size, p.size / 2);
        } else if (p.shape === 'square') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawStartScreen() {
    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    drawCloud(80 + cloudOffset, 80, 60);
    drawCloud(400 - cloudOffset, 120, 70);
    drawCloud(650 + cloudOffset, 60, 55);

    // Title
    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 64px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 15;
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, 150);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 28px Comic Sans MS';
    ctx.fillText('Enhanced Edition v4', canvas.width / 2, 200);

    // New features list
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    const features = [
        '✨ NEW: Dash Mechanic (Shift Key)',
        '🚩 NEW: Checkpoints',
        '⏱️ NEW: Visible Timer',
        '🎬 NEW: Screen Transitions',
        '🏔️ NEW: Enhanced Parallax Backgrounds',
        'Double Jump & Stomp Enemies',
        'Collect Candies & Power-Ups',
        'Beat All 3 Levels!'
    ];

    features.forEach((feature, i) => {
        ctx.fillText(feature, canvas.width / 2, 260 + i * 30);
    });

    // High score
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillText('🏆 High Score: ' + highScore, canvas.width / 2, 520);

    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('Press SPACE or ENTER to Start', canvas.width / 2, 560);
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
    ctx.fillText('Shift or Z to Dash', canvas.width / 2, canvas.height / 2 + 90);
    ctx.fillText('Keys 0-5 to Adjust Volume', canvas.width / 2, canvas.height / 2 + 120);
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

    ctx.fillStyle = '#fff';
    ctx.font = '32px Comic Sans MS';
    ctx.fillText('Score: ' + score, canvas.width / 2, 280);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('🔥 Max Combo: ' + combo + 'x', canvas.width / 2, 320);

    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🎉 NEW HIGH SCORE! 🎉', canvas.width / 2, 380);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Restart', canvas.width / 2, 440);
}

function drawVictoryScreen() {
    // Confetti
    if (animationFrame % 2 === 0) {
        if (animationFrame % 30 === 0) {
            createConfetti(Math.random() * canvas.width, -10, 15);
            triggerScreenShake(2);
        }

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
}

// Game loop
function gameLoop() {
    animationFrame++;

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        updatePlayer();
        updateLevelTimer();
        updateScreenShake();
        updateScreenTransition();
        drawGame();
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

// Initialize parallax layers
initializeParallaxLayers();

// Start the game
gameLoop();
