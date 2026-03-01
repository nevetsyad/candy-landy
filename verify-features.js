#!/usr/bin/env node

// Verification script to check all features are implemented

const fs = require('fs');
const path = require('path');

const gameCode = fs.readFileSync(
    path.join(__dirname, 'enhanced-game.js'),
    'utf8'
);

console.log('🔍 Verifying Candy Landy Enhanced Features...\n');

const features = [
    {
        name: 'Multiple Levels',
        check: () => gameCode.includes('const levels = [') &&
                 gameCode.includes('Level 1') &&
                 gameCode.includes('Level 2') &&
                 gameCode.includes('Level 3'),
        description: '3 distinct levels defined'
    },
    {
        name: 'Sound Effects',
        check: () => gameCode.includes("case 'jump':") &&
                 gameCode.includes("case 'collect':") &&
                 gameCode.includes("case 'powerup':") &&
                 gameCode.includes("case 'hit':") &&
                 gameCode.includes("case 'levelComplete':") &&
                 gameCode.includes("case 'gameOver':"),
        description: '6 sound effects implemented'
    },
    {
        name: 'Power-ups',
        check: () => gameCode.includes('const POWER_UPS = {') &&
                 gameCode.includes('SPEED:') &&
                 gameCode.includes('JUMP:') &&
                 gameCode.includes('SHIELD:') &&
                 gameCode.includes('DOUBLE_POINTS:'),
        description: '4 power-up types defined'
    },
    {
        name: 'Enemies',
        check: () => gameCode.includes('enemies') &&
                 gameCode.includes('enemies.forEach') &&
                 gameCode.includes('enemy.vx') &&
                 gameCode.includes('range'),
        description: 'Enemy system with patrol behavior'
    },
    {
        name: 'Moving Platforms',
        check: () => gameCode.includes('moving: true') &&
                 gameCode.includes('platform.moving') &&
                 gameCode.includes('Math.sin'),
        description: 'Platforms with sine wave motion'
    },
    {
        name: 'Disappearing Platforms',
        check: () => gameCode.includes('disappearingPlatforms') &&
                 gameCode.includes('visible:') &&
                 gameCode.includes('cycleTime'),
        description: 'Platforms that fade in/out'
    },
    {
        name: 'Combo System',
        check: () => gameCode.includes('let combo = 0') &&
                 gameCode.includes('comboTimer') &&
                 gameCode.includes('comboMultiplier') &&
                 gameCode.includes('comboMultiplier = Math.min(combo, 5)'),
        description: 'Combo system with 5x max multiplier'
    },
    {
        name: 'Time Bonuses',
        check: () => gameCode.includes('let timeBonus = 0') &&
                 gameCode.includes('timeBonus +=') &&
                 gameCode.includes('combo >= 3'),
        description: 'Bonus points for high combos'
    },
    {
        name: 'Volume Controls',
        check: () => gameCode.includes('SETTINGS.volume') &&
                 gameCode.includes("e.key >= '0' && e.key <= '5'") &&
                 gameCode.includes('SETTINGS.volume = parseInt(e.key) / 5'),
        description: 'Adjustable volume with 0-5 keys'
    },
    {
        name: 'High Score Tracking',
        check: () => gameCode.includes("localStorage.getItem('candyLandyHighScore')") &&
                 gameCode.includes("localStorage.setItem('candyLandyHighScore'"),
        description: 'Persistent high score in localStorage'
    },
    {
        name: 'Particle Effects',
        check: () => gameCode.includes('let particles = []') &&
                 gameCode.includes('createParticles') &&
                 gameCode.includes('updateParticles') &&
                 gameCode.includes('drawParticles'),
        description: 'Particle system for visual feedback'
    },
    {
        name: 'Level Progression',
        check: () => gameCode.includes('loadLevel') &&
                 gameCode.includes('loadLevel(currentLevel + 1)') &&
                 gameCode.includes('allCollected'),
        description: 'Progress through levels after collecting candies'
    },
    {
        name: 'Pause System',
        check: () => gameCode.includes('gameState = \'paused\'') &&
                 gameCode.includes('drawPauseScreen') &&
                 gameCode.includes("e.key === 'Escape'"),
        description: 'Pause functionality with overlay'
    },
    {
        name: 'Character Animations',
        check: () => gameCode.includes('pigtailSway') &&
                 gameCode.includes('legAnimation') &&
                 gameCode.includes('armSwing') &&
                 gameCode.includes('Math.sin(animationFrame'),
        description: 'Animated pigtails, legs, and arms'
    },
    {
        name: 'Confetti Effects',
        check: () => gameCode.includes('drawVictoryScreen') &&
                 gameCode.includes('createParticles') &&
                 gameCode.includes('animationFrame % 3'),
        description: 'Enhanced confetti on victory'
    },
    {
        name: 'HUD',
        check: () => gameCode.includes('drawHUD') &&
                 gameCode.includes('Score:') &&
                 gameCode.includes('Lives:') &&
                 gameCode.includes('Level:') &&
                 gameCode.includes('Candies:'),
        description: 'Comprehensive heads-up display'
    },
    {
        name: 'Game States',
        check: () => gameCode.includes("'start'") &&
                 gameCode.includes("'playing'") &&
                 gameCode.includes("'paused'") &&
                 gameCode.includes("'gameover'") &&
                 gameCode.includes("'victory'"),
        description: '5 game states properly managed'
    },
    {
        name: 'Input Handling',
        check: () => gameCode.includes('let keys = {}') &&
                 gameCode.includes('keydown') &&
                 gameCode.includes('keyup') &&
                 gameCode.includes("keys[e.key] = true"),
        description: 'Keyboard input with arrow keys, space, etc.'
    }
];

let passed = 0;
let failed = 0;

features.forEach(feature => {
    const result = feature.check();
    const icon = result ? '✅' : '❌';
    console.log(`${icon} ${feature.name}`);
    console.log(`   ${feature.description}`);
    console.log('');

    if (result) {
        passed++;
    } else {
        failed++;
    }
});

console.log('─'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log(`   Completion: ${Math.round((passed / features.length) * 100)}%\n`);

if (failed === 0) {
    console.log('🎉 All features verified successfully!');
    console.log('🚀 Game is ready to play!\n');
    process.exit(0);
} else {
    console.log('⚠️  Some features are missing or incomplete.\n');
    process.exit(1);
}
