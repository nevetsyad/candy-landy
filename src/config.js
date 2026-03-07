/**
 * config.js - Game Constants and Settings
 * Contains all game configuration, constants, and settings
 */

// Power-up types
export const POWER_UPS = {
    SPEED: 'speed',
    JUMP: 'jump',
    SHIELD: 'shield',
    DOUBLE_POINTS: 'double',
    DASH: 'dash'
};

// Game settings
export const SETTINGS = {
    volume: 0.5,
    comboTimer: 60, // frames to maintain combo
    screenShakeIntensity: 5,
    particleIntensity: 1.0
};

// Particle system configuration (Phase 2 optimization)
export const PARTICLES = {
    MAX_PARTICLES: 500,           // Maximum particles allowed
    POOL_SIZE: 250,               // Pre-allocated pool size
    
    // Particle counts for different effects (optimized for performance)
    CANDY_COLLECT: 10,            // Candy collection particles
    ENEMY_EXPLOSION: 18,          // Enemy defeat explosion (reduced from 30)
    GROUND_POUND: 20,             // Ground pound explosion (reduced from 40)
    PLAYER_HIT: 15,               // Player damage effect
    POWER_UP_COLLECT: 12,         // Power-up collection
    CONFETTI: 60,                 // Victory confetti (reduced from 80)
    SPARKLE_SMALL: 5,             // Small sparkle effects
    SPARKLE_MEDIUM: 8,            // Medium sparkle effects
    RING_BURST: 15,               // Ring burst effects
    
    // Particle defaults
    DEFAULT_SPREAD: 8,
    DEFAULT_GRAVITY: 0.1,
    DEFAULT_LIFE: 1.0,
    DEFAULT_FADE: 0.02,
    MIN_SIZE: 2,
    MAX_SIZE: 8,
    
    // Glow effect defaults
    DEFAULT_GLOW_SIZE: 12,
    ENABLE_GLOW_BY_DEFAULT: false
};

// Physics constants
export const PHYSICS = {
    GRAVITY: 0.8,
    TERMINAL_VELOCITY: 20,
    PLAYER_SPEED: 5,
    JUMP_POWER: -16,
    WALL_SLIDE_SPEED: 2,
    WALL_JUMP_POWER: -14,
    WALL_JUMP_HORIZONTAL: 10
};

// Player constants
export const PLAYER_CONFIG = {
    WIDTH: 40,
    HEIGHT: 60,
    START_X: 100,
    START_Y: 400,
    START_LIVES: 3,
    COYOTE_TIME: 6,      // frames to jump after leaving platform
    JUMP_BUFFER: 6,      // frames to remember jump input
    DASH_DURATION: 10,   // frames
    DASH_COOLDOWN: 60,   // frames (1 second at 60fps)
    DASH_SPEED_MULTIPLIER: 2,
    INVINCIBILITY_TIME: 60 // frames (1 second)
};

// Ground pound constants
export const GROUND_POUND = {
    VELOCITY: 25,
    RADIUS: 80,
    DAMAGE: 50,
    COOLDOWN_TIME: 60, // frames (1 second)
    BOUNCE_VELOCITY: -10
};

// Tutorial hint duration
export const HINT_DURATION = 300; // 5 seconds at 60fps

// Canvas dimensions
export const CANVAS = {
    WIDTH: 800,
    HEIGHT: 600
};

// Colors
export const COLORS = {
    PLAYER_PRIMARY: '#ff69b4',
    PLAYER_SECONDARY: '#ff1493',
    PLAYER_SKIN: '#ffd699',
    PLAYER_HAIR: '#ffd700',
    PLAYER_HAIR_HIGHLIGHT: '#ffed4e',
    ENEMY_BODY: '#ff4444',
    CANDY: '#ffd700',
    PLATFORM_PRIMARY: '#ff69b4',
    PLATFORM_SECONDARY: '#ff1493',
    CHECKPOINT: '#00ff00',
    SECRET: '#9370db',
    GOAL: '#00ff00'
};
