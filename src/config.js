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
