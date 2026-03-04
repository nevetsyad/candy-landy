/**
 * game.js - Main Game Loop, State Machine, and Initialization
 * Contains the Game class and main game logic
 */

import { 
    SETTINGS, 
    POWER_UPS, 
    CANVAS, 
    GROUND_POUND 
} from './config.js';
import { AudioManager, audioManager } from './audio.js';
import { ParticleSystem, particleSystem } from './particles.js';
import { InputManager, inputManager } from './input.js';
import { LevelManager, levelManager, Level } from './levels.js';
import { Player, Enemy, player } from './player.js';
import { UIManager } from './ui.js';

/**
 * Game class - Main game controller
 */
export class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add roundRect polyfill for older browsers
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

        // Set canvas size
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;

        // Game state
        this.gameState = 'start'; // 'start', 'levelSelect', 'playing', 'paused', 'gameover', 'victory'
        this.score = 0;
        this.highScore = 0;
        this.animationFrame = 0;

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.timeBonus = 0;

        // Level timer
        this.levelStartTime = 0;

        // Ground pound state
        this.groundPound = {
            active: false,
            cooldown: 0,
            velocity: GROUND_POUND.VELOCITY,
            radius: GROUND_POUND.RADIUS,
            damage: GROUND_POUND.DAMAGE,
            cooldownTime: GROUND_POUND.COOLDOWN_TIME,
            canGroundPound: true
        };

        // Current level data
        this.currentLevelData = null;
        this.enemies = [];
        this.powerUps = [];

        // Initialize managers
        this.ui = new UIManager(this.canvas, this.ctx);
        
        // Load high score
        this.loadHighScore();
        
        // Initialize input
        inputManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem('candyLandyHighScore');
            if (saved) {
                this.highScore = parseInt(saved) || 0;
            }
        } catch (e) {
            console.warn('Could not load high score:', e.message);
        }
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('candyLandyHighScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score:', e.message);
        }
    }

    /**
     * Setup keyboard event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        // Start game or level select
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
            if (this.gameState === 'start') {
                this.gameState = 'levelSelect';
            } else if (this.gameState === 'levelSelect') {
                const firstUnlocked = levelManager.levelProgress.unlocked.findIndex(u => u);
                if (firstUnlocked !== -1) {
                    this.startLevel(firstUnlocked);
                }
            }
        }

        // Level select navigation
        if (this.gameState === 'levelSelect') {
            if (e.key >= '1' && e.key <= '3') {
                const levelNum = parseInt(e.key) - 1;
                if (levelManager.isLevelUnlocked(levelNum)) {
                    this.startLevel(levelNum);
                }
            }
        }

        // Ground Pound
        if (e.key === 'ArrowDown' && !player.grounded && this.groundPound.cooldown <= 0 && 
            this.groundPound.canGroundPound && this.gameState === 'playing') {
            if (inputManager.isJumpPressed()) {
                this.activateGroundPound();
            }
        }

        // Dash
        if (e.key === 'Shift' && player.dashCooldown <= 0 && player.grounded && this.gameState === 'playing') {
            this.activateDash();
        }

        // Pause
        if (e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.gameState = 'paused';
                audioManager.stopBackgroundMusic();
            } else if (this.gameState === 'paused') {
                this.gameState = 'playing';
                audioManager.startBackgroundMusic();
            } else if (this.gameState === 'levelSelect') {
                this.gameState = 'start';
            }
        }

        // Restart
        if (e.key === 'r' || e.key === 'R') {
            if (this.gameState === 'gameover') {
                this.gameState = 'start';
                this.resetGame();
            } else if (this.gameState === 'victory') {
                this.gameState = 'start';
                this.resetGame();
            }
        }

        // Volume control
        if (e.key >= '0' && e.key <= '5') {
            SETTINGS.volume = parseInt(e.key) / 5;
            if (this.gameState === 'playing') {
                audioManager.startBackgroundMusic();
            }
        }
    }

    /**
     * Start a level
     */
    startLevel(levelIndex) {
        this.gameState = 'playing';
        audioManager.startBackgroundMusic();
        this.loadLevel(levelIndex);
    }

    /**
     * Load a level
     */
    loadLevel(levelIndex) {
        const level = levelManager.loadLevel(levelIndex);
        
        if (!level) {
            // Game complete!
            this.gameState = 'victory';
            audioManager.stopBackgroundMusic();
            audioManager.playSound('levelComplete');
            this.ui.triggerScreenShake(10, 15);
            particleSystem.createConfetti(this.canvas.width / 2, this.canvas.height / 2, 50);

            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
            return;
        }

        this.currentLevelData = level;

        // Reset player
        player.reset();

        // Clear particles
        particleSystem.clear();

        // Reset combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.timeBonus = 0;

        // Reset level timer
        this.levelStartTime = this.animationFrame;

        // Initialize enemies
        this.enemies = level.enemies.map(e => new Enemy({
            ...e,
            startX: e.startX || e.x
        }));

        // Copy power-ups
        this.powerUps = [...level.powerUps];

        // Reset ground pound
        this.groundPound.active = false;
        this.groundPound.cooldown = 0;
        this.groundPound.canGroundPound = true;
    }

    /**
     * Activate ground pound
     */
    activateGroundPound() {
        this.groundPound.active = true;
        this.groundPound.cooldown = this.groundPound.cooldownTime;
        this.groundPound.canGroundPound = false;
        player.vy = this.groundPound.velocity;
        
        audioManager.playSound('groundPound');
        particleSystem.createParticles(player.x + player.width/2, player.y + player.height, '#ff8800', 10, {
            spread: 6, gravity: 0.2, life: 0.8, size: { min: 4, max: 8 }, fade: 0.15, shape: 'circle'
        });
        this.ui.triggerScreenShake(8, 12);
    }

    /**
     * Activate dash
     */
    activateDash() {
        if (player.startDash()) {
            audioManager.playSound('dash');
            particleSystem.createParticles(player.x, player.y + 30, '#ffff00', 5, {
                spread: 8, gravity: 0.1, life: 1.0, size: { min: 3, max: 6 }, fade: 0.1, shape: 'square'
            });
        }
    }

    /**
     * Reset game state
     */
    resetGame() {
        player.reset();
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.timeBonus = 0;
        particleSystem.clear();
        audioManager.stopBackgroundMusic();
    }

    /**
     * Update game state
     */
    update() {
        if (this.gameState !== 'playing') return;

        // Update ground pound cooldown
        if (this.groundPound.cooldown > 0) {
            this.groundPound.cooldown--;
        }

        // Reset ground pound ability when grounded
        if (player.grounded) {
            this.groundPound.canGroundPound = true;
            if (this.groundPound.active) {
                this.handleGroundPoundImpact();
            }
        }

        // Ground pound active
        if (this.groundPound.active) {
            player.vy = this.groundPound.velocity;
            if (this.animationFrame % 3 === 0) {
                particleSystem.createParticles(player.x + player.width/2, player.y, '#ff6600', 3, {
                    spread: 4, gravity: 0.05, life: 0.5, size: { min: 3, max: 6 }, fade: 0.1, shape: 'circle'
                });
            }
        }

        // Update player
        const onScreen = player.update(this.currentLevelData, this.animationFrame, this.groundPound);

        // Update enemies
        this.enemies.forEach(enemy => enemy.update());

        // Update particles
        particleSystem.update();

        // Update screen shake
        this.ui.updateScreenShake();

        // Update tutorial hints
        this.ui.updateTutorialHints(player, this.currentLevelData, this.enemies);

        // Check collisions
        this.checkCollisions();

        // Check if fell off screen
        if (!onScreen || player.y > CANVAS.HEIGHT) {
            this.handlePlayerDeath();
        }

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.combo = 0;
                this.comboMultiplier = 1;
            }
        }
    }

    /**
     * Handle ground pound impact
     */
    handleGroundPoundImpact() {
        this.groundPound.active = false;
        audioManager.playSound('enemyHit');
        this.ui.triggerScreenShake(15, 20);

        particleSystem.createExplosion(player.x + player.width/2, player.y + player.height, '#ff4400', 30);

        // Damage enemies in radius
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = (enemy.x + enemy.width/2) - (player.x + player.width/2);
            const dy = (enemy.y + enemy.height/2) - (player.y + player.height);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.groundPound.radius) {
                particleSystem.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff6600', 20);
                this.score += 75;
                this.enemies.splice(i, 1);
            }
        }
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        const died = player.takeDamage();
        
        if (died) {
            this.gameState = 'gameover';
            audioManager.stopBackgroundMusic();
            audioManager.playSound('gameOver');

            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }
        } else {
            audioManager.playSound('hit');
            
            // Respawn at checkpoint
            const lastCheckpoint = this.currentLevelData.checkpoints.filter(cp => cp.collected).pop();
            player.respawn(lastCheckpoint);
        }
    }

    /**
     * Check all collisions
     */
    checkCollisions() {
        // Collect checkpoints
        this.currentLevelData.checkpoints.forEach(cp => {
            if (!cp.collected &&
                player.x < cp.x + 30 && player.x + player.width > cp.x &&
                player.y < cp.y + 30 && player.y + player.height > cp.y) {

                cp.collected = true;
                player.lives = 3;
                audioManager.playSound('checkpoint');
                particleSystem.createExplosion(cp.x + 15, cp.y + 15, '#00ff00', 15);
                this.ui.triggerScreenShake(6, 10);
            }
        });

        // Collect candies
        this.currentLevelData.candies.forEach(candy => {
            if (!candy.collected &&
                player.x < candy.x + 20 &&
                player.x + player.width > candy.x &&
                player.y < candy.y + 20 &&
                player.y + player.height > candy.y) {

                candy.collected = true;

                // Update combo
                if (this.comboTimer > 0) {
                    this.combo = Math.min(this.combo + 1, 100);
                    this.comboTimer = SETTINGS.comboTimer;
                    if (this.combo % 5 === 0) {
                        audioManager.playSound('combo');
                        this.ui.triggerScreenShake(2, 5);
                    }
                    this.comboMultiplier = Math.min(this.combo, 5);
                } else {
                    this.combo = 1;
                    this.comboTimer = SETTINGS.comboTimer;
                    this.comboMultiplier = 1;
                }

                // Calculate points
                let points = 10 * this.comboMultiplier;
                if (player.powerUp === POWER_UPS.DOUBLE_POINTS) {
                    points = 20 * this.comboMultiplier;
                }
                points = Math.max(0, Math.floor(points));
                this.score += points;

                // Time bonus
                if (this.combo >= 3) {
                    this.timeBonus += this.combo * 5;
                    this.score += this.timeBonus;
                    particleSystem.createParticles(candy.x + 10, candy.y + 10, '#00ff00', 5);
                }

                audioManager.playSound('collect');
                this.ui.triggerScreenShake(1, 3);
                particleSystem.createParticles(candy.x + 10, candy.y + 10, '#ffd700', 12);
            }
        });

        // Collect secrets
        if (this.currentLevelData.secrets) {
            this.currentLevelData.secrets.forEach(secret => {
                if (!secret.collected &&
                    player.x < secret.x + 25 &&
                    player.x + player.width > secret.x &&
                    player.y < secret.y + 25 &&
                    player.y + player.height > secret.y) {

                    secret.collected = true;
                    this.score += 500;

                    levelManager.updateSecretsFound();

                    audioManager.playSound('powerup');
                    this.ui.triggerScreenShake(8, 12);
                    particleSystem.createExplosion(secret.x + 12, secret.y + 12, '#9370db', 25);
                    particleSystem.createParticles(secret.x + 12, secret.y + 12, '#ffd700', 15, {
                        spread: 10, gravity: 0.1, life: 1.5, size: { min: 4, max: 8 }, fade: 0.05, shape: 'star'
                    });
                }
            });
        }

        // Collect power-ups
        this.powerUps.forEach((powerUp, index) => {
            if (!powerUp.collected &&
                player.x < powerUp.x + 20 &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + 20 &&
                player.y + player.height > powerUp.y) {

                powerUp.collected = true;
                player.powerUp = powerUp.type;
                player.powerUpTimer = 300;
                audioManager.playSound('powerup');
                this.ui.triggerScreenShake(4, 6);
                particleSystem.createExplosion(powerUp.x + 10, powerUp.y + 10, '#00ff00', 15);
            }
        });

        // Check enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!player.invincible &&
                player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {

                const playerBottom = player.y + player.height;
                const enemyCenter = enemy.y + enemy.height / 2;
                const isStomp = player.vy > 0 && playerBottom < enemyCenter;

                if (isStomp) {
                    // Stomp kill
                    audioManager.playSound('enemyHit');
                    this.ui.triggerScreenShake(5, 8);

                    particleSystem.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600', 25);
                    particleSystem.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffff00', 15, {
                        spread: 12, gravity: 0.1, life: 1.5, size: { min: 3, max: 8 }, fade: 0.015, shape: 'star'
                    });

                    this.score += 50;

                    if (this.comboTimer > 0) {
                        this.combo++;
                        this.comboTimer = SETTINGS.comboTimer;
                        this.comboMultiplier = Math.min(this.combo, 5);
                    } else {
                        this.combo = 1;
                        this.comboTimer = SETTINGS.comboTimer;
                        this.comboMultiplier = 1;
                    }

                    player.vy = GROUND_POUND.BOUNCE_VELOCITY;
                    player.grounded = false;

                    this.enemies.splice(i, 1);

                    if (this.combo >= 3 && this.combo % 3 === 0) {
                        audioManager.playSound('combo');
                        this.ui.triggerScreenShake(3, 5);
                    }
                } else if (player.powerUp === POWER_UPS.SHIELD) {
                    player.powerUp = null;
                    player.invincible = true;
                    player.invincibleTimer = 60;
                    audioManager.playSound('shield');
                    this.ui.triggerScreenShake(5, 8);
                } else {
                    this.handlePlayerDeath();
                }
            }
        }

        // Check goal
        const goal = this.currentLevelData.goal;
        if (player.x < goal.x + goal.width &&
            player.x + player.width > goal.x &&
            player.y < goal.y + goal.height &&
            player.y + player.height > goal.y) {

            const allCollected = this.currentLevelData.candies.every(c => c.collected);

            if (allCollected) {
                // Save progress
                levelManager.updateBestScore(this.score);
                levelManager.unlockNextLevel();

                audioManager.playSound('levelComplete');
                this.loadLevel(levelManager.currentLevelIndex + 1);
            }
        }
    }

    /**
     * Draw the game
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.gameState) {
            case 'start':
                this.ui.drawStartScreen(this.animationFrame, this.highScore);
                break;

            case 'levelSelect':
                this.ui.drawLevelSelectScreen(levelManager.levelProgress);
                break;

            case 'playing':
                this.drawGame();
                break;

            case 'paused':
                this.drawGame();
                this.ui.drawPauseScreen();
                break;

            case 'gameover':
                this.drawGame();
                this.ui.drawGameOverScreen(this.score, this.combo, this.timeBonus, this.highScore);
                break;

            case 'victory':
                this.drawGame();
                this.ui.drawVictoryScreen(this.score, this.combo, this.highScore, this.animationFrame);
                break;
        }
    }

    /**
     * Draw the game world
     */
    drawGame() {
        // Draw HUD first
        this.ui.drawHUD(
            player, 
            this.currentLevelData, 
            levelManager.currentLevelIndex, 
            this.score, 
            this.combo, 
            this.timeBonus,
            levelManager.levels,
            this.levelStartTime,
            this.animationFrame
        );

        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.ui.screenShake.x, this.ui.screenShake.y);

        // Draw background
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        const cloudOffset = Math.sin(this.animationFrame * 0.01) * 20;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ui.drawCloud(80 + cloudOffset, 50, 50);
        this.ui.drawCloud(350 - cloudOffset, 80, 60);
        this.ui.drawCloud(600 + cloudOffset, 40, 55);

        // Draw platforms
        this.drawPlatforms();

        // Draw disappearing platforms
        this.drawDisappearingPlatforms();

        // Draw checkpoints
        this.drawCheckpoints();

        // Draw candies
        this.drawCandies();

        // Draw secrets
        this.drawSecrets();

        // Draw power-ups
        this.drawPowerUps();

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw goal
        this.drawGoal();

        // Draw particles
        particleSystem.draw(this.ctx, player.height);

        // Draw player
        player.draw(this.ctx, this.animationFrame);

        // Draw mini-map
        this.ui.drawMiniMap(this.currentLevelData, player);

        // Draw tutorial hint
        this.ui.drawTutorialHint(this.animationFrame);

        this.ctx.restore();
    }

    /**
     * Draw platforms
     */
    drawPlatforms() {
        this.currentLevelData.platforms.forEach(platform => {
            const platGradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, '#ff69b4');
            platGradient.addColorStop(1, '#ff1493');
            this.ctx.fillStyle = platGradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 5);

            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
        });
    }

    /**
     * Draw disappearing platforms
     */
    drawDisappearingPlatforms() {
        this.currentLevelData.disappearingPlatforms.forEach(platform => {
            if (platform.visible) {
                const fadeProgress = platform.timer / platform.cycleTime;
                const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

                const platGradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
                platGradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
                platGradient.addColorStop(1, `rgba(200, 50, 50, ${alpha})`);
                this.ctx.fillStyle = platGradient;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                if (fadeProgress > 0.7) {
                    this.ctx.strokeStyle = `rgba(255, 0, 0, ${1 - fadeProgress})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                }

                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
                this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
            }
        });
    }

    /**
     * Draw checkpoints
     */
    drawCheckpoints() {
        this.currentLevelData.checkpoints.forEach(cp => {
            if (!cp.collected) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(cp.x + 12, cp.y, 6, 30);

                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.moveTo(cp.x + 18, cp.y);
                this.ctx.lineTo(cp.x + 30, cp.y + 7);
                this.ctx.lineTo(cp.x + 18, cp.y + 14);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(cp.x + 15, cp.y + 15, 20, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#666666';
                this.ctx.fillRect(cp.x + 12, cp.y, 6, 30);

                this.ctx.fillStyle = '#666666';
                this.ctx.beginPath();
                this.ctx.moveTo(cp.x + 18, cp.y);
                this.ctx.lineTo(cp.x + 30, cp.y + 7);
                this.ctx.lineTo(cp.x + 18, cp.y + 14);
                this.ctx.fill();
            }
        });
    }

    /**
     * Draw candies
     */
    drawCandies() {
        this.currentLevelData.candies.forEach((candy, index) => {
            if (!candy.collected) {
                const bounce = Math.sin(this.animationFrame * 0.05 + index) * 3;

                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 15, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#ff69b4';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    /**
     * Draw secrets
     */
    drawSecrets() {
        if (!this.currentLevelData.secrets) return;

        this.currentLevelData.secrets.forEach((secret, index) => {
            if (!secret.collected) {
                const sparkle = Math.sin(this.animationFrame * 0.1 + index * 2) * 5;
                const glowSize = 20 + Math.sin(this.animationFrame * 0.15) * 5;

                this.ctx.fillStyle = 'rgba(147, 112, 219, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 12, secret.y + 12 + sparkle, glowSize, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 12, secret.y + 12 + sparkle, 15, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#9370db';
                this.ctx.save();
                this.ctx.translate(secret.x + 12, secret.y + 12 + sparkle);
                this.ctx.rotate(Math.PI / 4);
                this.ctx.fillRect(-8, -8, 16, 16);
                this.ctx.restore();

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 9, secret.y + 9 + sparkle, 3, 0, Math.PI * 2);
                this.ctx.fill();

                if (this.animationFrame % 20 === 0) {
                    particleSystem.createParticles(secret.x + 12, secret.y + 12, '#ffd700', 3, {
                        spread: 5, gravity: 0.05, life: 0.8, size: { min: 2, max: 5 }, fade: 0.08, shape: 'star'
                    });
                }
            }
        });
    }

    /**
     * Draw power-ups
     */
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const bounce = Math.sin(this.animationFrame * 0.08) * 5;

                let glowColor;
                switch(powerUp.type) {
                    case POWER_UPS.JUMP: glowColor = 'rgba(0, 255, 255, 0.3)'; break;
                    case POWER_UPS.SPEED: glowColor = 'rgba(255, 255, 0, 0.3)'; break;
                    case POWER_UPS.SHIELD: glowColor = 'rgba(0, 255, 0, 0.3)'; break;
                    case POWER_UPS.DOUBLE_POINTS: glowColor = 'rgba(255, 0, 255, 0.3)'; break;
                    case POWER_UPS.DASH: glowColor = 'rgba(255, 128, 0, 0.3)'; break;
                }

                this.ctx.fillStyle = glowColor;
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 18, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 12, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                let symbol = '⚡';
                if (powerUp.type === POWER_UPS.DASH) symbol = '💨';
                this.ctx.fillText(symbol, powerUp.x + 10, powerUp.y + 15 + bounce);
            }
        });
    }

    /**
     * Draw goal
     */
    drawGoal() {
        const goal = this.currentLevelData.goal;
        const goalBounce = Math.sin(this.animationFrame * 0.03) * 5;

        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.fillRect(goal.x - 5, goal.y - 5 + goalBounce, goal.width + 10, goal.height + 10);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(goal.x, goal.y + goalBounce, goal.width, goal.height);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⭐', goal.x + goal.width / 2, goal.y + 35 + goalBounce);
    }

    /**
     * Main game loop
     */
    gameLoop() {
        this.animationFrame++;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Start the game
     */
    start() {
        this.gameLoop();
    }
}

// Create and start game when DOM is ready
let game = null;

function initGame() {
    game = new Game();
    game.start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Export for debugging
window.game = game;
