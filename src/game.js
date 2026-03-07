/**
 * game.js - Main Game Loop, State Machine, and Initialization
 * Sprint 4: Added screen transitions, achievement tracking, enhanced visuals
 */

import { 
    SETTINGS, 
    POWER_UPS, 
    CANVAS, 
    GROUND_POUND,
    PARTICLES
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
        this.previousGameState = 'start';
        this.score = 0;
        this.highScore = 0;
        this.animationFrame = 0;
        
        // Track damage taken for perfect level achievement
        this.damageTakenThisLevel = false;
        this.levelStartTime = 0;
        
        // Track jumps for achievements
        this.previousJumpCount = 0;
        this.hasJumped = false;
        this.hasDoubleJumped = false;

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.timeBonus = 0;
        this.maxCombo = 0;

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

        // Power-up cooldown (to prevent rapid re-collection)
        this.powerUpCooldown = 0;

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
     * Handle keyboard input with enhanced state transitions
     */
    handleKeyDown(e) {
        // Achievements menu toggle (works in most states)
        if (e.key === 'a' || e.key === 'A') {
            if (this.gameState !== 'playing' || this.ui.showAchievementsMenu) {
                this.ui.showAchievementsMenu = !this.ui.showAchievementsMenu;
            }
            return;
        }
        
        // Close achievements menu
        if (this.ui.showAchievementsMenu) {
            if (e.key === 'Escape') {
                this.ui.showAchievementsMenu = false;
            }
            return;
        }
        
        // Don't process other inputs during transition
        if (this.ui.isTransitioning()) return;

        // Start game or level select with transition
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
            if (this.gameState === 'start') {
                this.ui.startTransition('candy', () => {
                    this.gameState = 'levelSelect';
                }, 45);
            } else if (this.gameState === 'levelSelect') {
                const firstUnlocked = levelManager.levelProgress.unlocked.findIndex(u => u);
                if (firstUnlocked !== -1) {
                    this.startLevelWithTransition(firstUnlocked);
                }
            }
        }

        // Level select navigation
        if (this.gameState === 'levelSelect') {
            if (e.key >= '1' && e.key <= '3') {
                const levelNum = parseInt(e.key) - 1;
                if (levelManager.isLevelUnlocked(levelNum)) {
                    this.startLevelWithTransition(levelNum);
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

        // Pause with transition
        if (e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.ui.startTransition('fade', () => {
                    this.gameState = 'paused';
                    audioManager.stopBackgroundMusic();
                }, 30);
            } else if (this.gameState === 'paused') {
                this.ui.startTransition('fade', () => {
                    this.gameState = 'playing';
                    audioManager.startBackgroundMusic();
                }, 30);
            } else if (this.gameState === 'levelSelect') {
                this.ui.startTransition('fade', () => {
                    this.gameState = 'start';
                }, 30);
            }
        }

        // Restart with transition
        if (e.key === 'r' || e.key === 'R') {
            if (this.gameState === 'gameover') {
                this.ui.startTransition('zoom', () => {
                    this.gameState = 'start';
                    this.resetGame();
                }, 45);
            } else if (this.gameState === 'victory') {
                this.ui.startTransition('candy', () => {
                    this.gameState = 'start';
                    this.resetGame();
                }, 60);
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
     * Start a level with transition effect
     */
    startLevelWithTransition(levelIndex) {
        this.ui.startTransition('swipe', () => {
            this.startLevel(levelIndex);
        }, 40);
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
            this.ui.triggerScreenShake('explosion');
            particleSystem.createConfetti(this.canvas.width / 2, this.canvas.height / 2, PARTICLES.CONFETTI);
            
            // Unlock game complete achievement
            this.ui.achievements.unlock('gameComplete');

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
        this.maxCombo = 0;

        // Reset level tracking
        this.levelStartTime = this.animationFrame;
        this.damageTakenThisLevel = false;
        this.previousJumpCount = 0;

        // Initialize enemies
        this.enemies = level.enemies.map(e => new Enemy({
            ...e,
            startX: e.startX || e.x
        }));

        // Copy power-ups
        this.powerUps = [...level.powerUps];

        // Reset power-up cooldown
        this.powerUpCooldown = 0;

        // Reset ground pound
        this.groundPound.active = false;
        this.groundPound.cooldown = 0;
        this.groundPound.canGroundPound = true;
    }

    /**
     * Activate ground pound with enhanced effects
     */
    activateGroundPound() {
        this.groundPound.active = true;
        this.groundPound.cooldown = this.groundPound.cooldownTime;
        this.groundPound.canGroundPound = false;
        player.vy = this.groundPound.velocity;
        
        // Unlock achievement
        this.ui.achievements.unlock('firstGroundPound');
        
        audioManager.playSound('groundPound');
        particleSystem.createExplosion(player.x + player.width/2, player.y + player.height, '#ff8800', PARTICLES.GROUND_POUND, {
            spread: 8, gravity: 0.2, life: 1.0, size: { min: 4, max: 10 }, fade: 0.12, 
            glow: true, glowSize: 12
        });
        this.ui.triggerScreenShake('stomp');
    }

    /**
     * Activate dash with enhanced trail effect
     */
    activateDash() {
        if (player.startDash()) {
            // Unlock achievement
            this.ui.achievements.unlock('firstDash');
            
            audioManager.playSound('dash');
            
            // Enhanced dash particles
            particleSystem.createParticles(player.x, player.y + player.height/2, '#ffff00', 10, {
                spread: 10, gravity: 0.05, life: 1.0, size: { min: 4, max: 8 }, 
                fade: 0.08, shape: 'diamond', glow: true, glowColor: '#ff8800', glowSize: 10
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
        this.maxCombo = 0;
        this.damageTakenThisLevel = false;
        particleSystem.clear();
        audioManager.stopBackgroundMusic();
    }

    /**
     * Update game state with enhanced effects
     */
    update() {
        // Update UI systems
        this.ui.update();
        
        // Don't update game logic during transitions or achievements menu
        if (this.ui.isTransitioning() || this.ui.showAchievementsMenu) return;
        
        if (this.gameState !== 'playing') return;

        // Update ground pound cooldown
        if (this.groundPound.cooldown > 0) {
            this.groundPound.cooldown--;
        }

        // Update power-up cooldown
        if (this.powerUpCooldown > 0) {
            this.powerUpCooldown--;
        }

        // Reset ground pound ability when grounded
        if (player.grounded) {
            this.groundPound.canGroundPound = true;
            if (this.groundPound.active) {
                this.handleGroundPoundImpact();
            }
        }

        // Ground pound active with enhanced particles
        if (this.groundPound.active) {
            player.vy = this.groundPound.velocity;
            if (this.animationFrame % 2 === 0) {
                particleSystem.createParticles(player.x + player.width/2, player.y, '#ff6600', 4, {
                    spread: 6, gravity: 0.08, life: 0.6, size: { min: 4, max: 8 }, 
                    fade: 0.08, shape: 'circle', glow: true, glowColor: '#ff4400', glowSize: 8
                });
            }
        }
        
        // Create invincibility aura particles
        if (player.invincible && this.animationFrame % 3 === 0) {
            particleSystem.createInvincibilityAura(player.x, player.y, player.width, player.height);
        }
        
        // Create dash trail
        if (player.isDashing && this.animationFrame % 2 === 0) {
            particleSystem.createDashTrail(player.x, player.y, player.width, player.height, player.facing);
        }

        // Update player
        const onScreen = player.update(this.currentLevelData, this.animationFrame, this.groundPound);
        
        // Track jumps for achievements
        if (player.jumpCount > this.previousJumpCount) {
            // Player just jumped
            if (!this.hasJumped) {
                this.ui.achievements.unlock('firstJump');
                this.hasJumped = true;
            }
            // Check for double jump
            if (player.jumpCount === 2 && !this.hasDoubleJumped) {
                this.ui.achievements.unlock('firstDoubleJump');
                this.hasDoubleJumped = true;
            }
        }
        this.previousJumpCount = player.jumpCount;

        // Update enemies
        this.enemies.forEach(enemy => enemy.update());

        // Update particles
        particleSystem.update();

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

        // If timer has expired and combo is 0, set it to 1 (fresh combo start)
        if (this.combo === 0 && this.comboTimer === 0) {
            this.combo = 1;
        }
        
        // Track max combo for achievements
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            
            // Combo achievements
            if (this.combo >= 5) {
                this.ui.achievements.unlock('combo5');
            }
            if (this.combo >= 10) {
                this.ui.achievements.unlock('combo10');
            }
        }
    }

    /**
     * Handle ground pound impact with enhanced effects
     */
    handleGroundPoundImpact() {
        this.groundPound.active = false;
        audioManager.playSound('enemyHit');
        this.ui.triggerScreenShake('explosion');

        // Enhanced explosion effect (optimized particle count: 40 → 20)
        particleSystem.createExplosion(player.x + player.width/2, player.y + player.height, '#ff4400', 20, {
            spread: 12, gravity: 0.25, life: 1.2, size: { min: 5, max: 12 }, 
            fade: 0.02, glow: true, glowSize: 15
        });
        
        // Ring burst (optimized: 20 → 12)
        particleSystem.createRingBurst(player.x + player.width/2, player.y + player.height, '#ff8800', 12);

        // Damage enemies in radius
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = (enemy.x + enemy.width/2) - (player.x + player.width/2);
            const dy = (enemy.y + enemy.height/2) - (player.y + player.height);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.groundPound.radius) {
                particleSystem.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff6600', PARTICLES.ENEMY_EXPLOSION, {
                    glow: true, glowSize: 12
                });
                this.score += 75;
                this.enemies.splice(i, 1);
                
                // Track enemy kills
                this.ui.achievements.stats.totalEnemies++;
            }
        }
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        this.damageTakenThisLevel = true;
        const died = player.takeDamage();
        
        // Track deaths
        this.ui.achievements.stats.deaths++;
        
        if (died) {
            this.ui.startTransition('fade', () => {
                this.gameState = 'gameover';
                audioManager.stopBackgroundMusic();
                audioManager.playSound('gameOver');

                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.saveHighScore();
                }
                
                // Save achievement progress
                this.ui.achievements.saveProgress();
            }, 45);
        } else {
            audioManager.playSound('hit');
            this.ui.triggerScreenShake('hit');
            
            // Enhanced hit effect
            particleSystem.createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', PARTICLES.PLAYER_HIT, {
                spread: 8, gravity: 0.15, life: 0.8, glow: true, glowSize: 10
            });
            
            // Respawn at checkpoint
            const lastCheckpoint = this.currentLevelData.checkpoints.filter(cp => cp.collected).pop();
            player.respawn(lastCheckpoint);
        }
    }

    /**
     * Check all collisions with enhanced effects
     */
    checkCollisions() {
        if (!this.currentLevelData) return;

        // Collect checkpoints
        if (this.currentLevelData.checkpoints) {
            this.currentLevelData.checkpoints.forEach(cp => {
            if (!cp.collected &&
                player.x < cp.x + 30 && player.x + player.width > cp.x &&
                player.y < cp.y + 30 && player.y + player.height > cp.y) {

                cp.collected = true;
                player.lives = 3;
                audioManager.playSound('checkpoint');
                
                // Enhanced checkpoint effect
                particleSystem.createPowerUpEffect(cp.x + 15, cp.y + 15, '#00ff00');
                this.ui.triggerScreenShake('medium');
            }
            });
        }

        // Collect candies with enhanced effects
        if (this.currentLevelData.candies) {
            this.currentLevelData.candies.forEach((candy, index) => {
            if (!candy.collected &&
                player.x < candy.x + 20 &&
                player.x + player.width > candy.x &&
                player.y < candy.y + 20 &&
                player.y + player.height > candy.y) {

                candy.collected = true;
                
                // Track candy collection
                this.ui.achievements.stats.totalCandies++;
                if (this.ui.achievements.stats.totalCandies >= 100) {
                    this.ui.achievements.unlock('collectAllCandies');
                }

                // Update combo
                if (this.comboTimer > 0) {
                    this.combo = Math.min(this.combo + 1, 100);
                    this.comboTimer = SETTINGS.comboTimer;
                    if (this.combo % 5 === 0) {
                        audioManager.playSound('combo');
                        this.ui.triggerScreenShake('light');
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
                    particleSystem.createSparkles(candy.x + 10, candy.y + 10, '#00ff00', PARTICLES.SPARKLE_SMALL);
                }

                audioManager.playSound('collect');
                this.ui.triggerScreenShake('collect');
                
                // Enhanced candy collection effect
                particleSystem.createSparkles(candy.x + 10, candy.y + 10, '#ffd700', PARTICLES.SPARKLE_MEDIUM);
            }
            });
        }

        // Collect secrets with enhanced effects
        if (this.currentLevelData.secrets && this.currentLevelData.secrets.length > 0) {
            this.currentLevelData.secrets.forEach((secret, index) => {
                if (!secret.collected &&
                    player.x < secret.x + 25 &&
                    player.x + player.width > secret.x &&
                    player.y < secret.y + 25 &&
                    player.y + player.height > secret.y) {

                    secret.collected = true;
                    this.score += 500;

                    levelManager.updateSecretsFound();

                    audioManager.playSound('powerup');
                    this.ui.triggerScreenShake('heavy');
                    
                    // Enhanced secret collection effect
                    particleSystem.createSecretEffect(secret.x + 12, secret.y + 12);
                }
            });
            
            // Check for all secrets achievement
            const allSecretsCollected = this.currentLevelData.secrets.every(s => s.collected);
            if (allSecretsCollected && this.currentLevelData.secrets.length > 0) {
                this.ui.achievements.unlock('allSecrets');
            }
        }

        // Collect power-ups with enhanced effects
        this.powerUps.forEach((powerUp, index) => {
            // Check for power-up cooldown first
            if (this.powerUpCooldown > 0) {
                this.powerUpCooldown--;
                return;
            }

            if (!powerUp.collected &&
                player.x < powerUp.x + 20 &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + 20 &&
                player.y + player.height > powerUp.y) {

                powerUp.collected = true;
                player.powerUp = powerUp.type;
                player.powerUpTimer = 300;

                // Set 2-second cooldown (120 frames at 60fps) to prevent rapid re-collection
                this.powerUpCooldown = 120;

                audioManager.playSound('powerup');
                this.ui.triggerScreenShake('medium');
                
                // Enhanced power-up collection effect
                let powerUpColor = '#00ffff';
                switch(powerUp.type) {
                    case POWER_UPS.JUMP: powerUpColor = '#00ffff'; break;
                    case POWER_UPS.SPEED: powerUpColor = '#ffff00'; break;
                    case POWER_UPS.SHIELD: powerUpColor = '#00ff00'; break;
                    case POWER_UPS.DOUBLE_POINTS: powerUpColor = '#ff00ff'; break;
                    case POWER_UPS.DASH: powerUpColor = '#ff8800'; break;
                }
                particleSystem.createPowerUpEffect(powerUp.x + 10, powerUp.y + 10, powerUpColor);
            }
        });

        // Check enemy collisions with enhanced effects
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
                    // Stomp kill with enhanced effects
                    audioManager.playSound('enemyHit');
                    this.ui.triggerScreenShake('stomp');
                    
                    // Unlock stomp achievement
                    this.ui.achievements.unlock('firstStomp');
                    this.ui.achievements.stats.totalEnemies++;

                    // Enhanced explosion (optimized particle count: 30 → 18)
                    particleSystem.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600', 18, {
                        spread: 12, gravity: 0.15, life: 1.2, size: { min: 4, max: 10 },
                        fade: 0.015, glow: true, glowSize: 14
                    });
                    // Optimized sparkles: 10 → 6
                    particleSystem.createSparkles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffd700', 6);

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
                        this.ui.triggerScreenShake('light');
                    }
                } else if (player.powerUp === POWER_UPS.SHIELD) {
                    player.powerUp = null;
                    player.invincible = true;
                    player.invincibleTimer = 60;
                    audioManager.playSound('shield');
                    this.ui.triggerScreenShake('medium');
                    
                    // Shield break effect
                    particleSystem.createRingBurst(player.x + player.width/2, player.y + player.height/2, '#00ff00', PARTICLES.RING_BURST);
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
                // Check for perfect level (no damage)
                if (!this.damageTakenThisLevel) {
                    this.ui.achievements.unlock('perfectLevel');
                    this.ui.achievements.stats.perfectLevels++;
                }
                
                // Check for speedrun (under 30 seconds)
                const levelTime = (this.animationFrame - this.levelStartTime) / 60;
                if (levelTime < 30) {
                    this.ui.achievements.unlock('speedrun');
                }
                
                // Update stats
                this.ui.achievements.stats.levelsCompleted++;

                // Save progress
                levelManager.updateBestScore(this.score);
                levelManager.unlockNextLevel();

                audioManager.playSound('levelComplete');
                
                // Transition to next level
                this.ui.startTransition('candy', () => {
                    this.loadLevel(levelManager.currentLevelIndex + 1);
                }, 50);
            }
        }
    }

    /**
     * Draw the game
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw achievements menu if open
        if (this.ui.showAchievementsMenu) {
            this.ui.achievements.drawAchievementsMenu(this.ctx, this.canvas.width, this.canvas.height, this.animationFrame);
            this.ui.drawOverlays(this.animationFrame);
            return;
        }

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
                this.ui.drawGameOverScreen(this.score, this.maxCombo, this.timeBonus, this.highScore);
                break;

            case 'victory':
                this.drawGame();
                this.ui.drawVictoryScreen(this.score, this.maxCombo, this.highScore, this.animationFrame);
                break;
        }
        
        // Draw overlays (transitions, notifications)
        this.ui.drawOverlays(this.animationFrame);
    }

    /**
     * Draw the game world with enhanced visuals
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

        // Draw background with gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B0E0E6');
        skyGradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds with enhanced animation
        const cloudOffset = Math.sin(this.animationFrame * 0.01) * 20;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ui.drawCloud(80 + cloudOffset, 50, 50);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ui.drawCloud(350 - cloudOffset, 80, 60);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ui.drawCloud(600 + cloudOffset, 40, 55);

        // Draw platforms
        this.drawPlatforms();

        // Draw disappearing platforms
        this.drawDisappearingPlatforms();

        // Draw checkpoints
        this.drawCheckpoints();

        // Draw candies with enhanced glow
        this.drawCandies();

        // Draw secrets with enhanced glow
        this.drawSecrets();

        // Draw power-ups with enhanced glow
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
     * Draw platforms with enhanced visuals
     */
    drawPlatforms() {
        this.currentLevelData.platforms.forEach(platform => {
            // Platform gradient
            const platGradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, '#ff69b4');
            platGradient.addColorStop(0.5, '#ff1493');
            platGradient.addColorStop(1, '#db7093');
            this.ctx.fillStyle = platGradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Top highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 4);

            // Bottom shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
            
            // Candy dots decoration
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < platform.width; i += 30) {
                this.ctx.beginPath();
                this.ctx.arc(platform.x + i + 15, platform.y + platform.height / 2, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    /**
     * Draw disappearing platforms with enhanced visuals
     */
    drawDisappearingPlatforms() {
        if (!this.currentLevelData || !this.currentLevelData.disappearingPlatforms) return;
        
        this.currentLevelData.disappearingPlatforms.forEach(platform => {
            if (platform.visible) {
                const fadeProgress = platform.timer / platform.cycleTime;
                const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

                const platGradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
                platGradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
                platGradient.addColorStop(1, `rgba(200, 50, 50, ${alpha})`);
                this.ctx.fillStyle = platGradient;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                // Warning glow when about to disappear
                if (fadeProgress > 0.7) {
                    this.ctx.save();
                    this.ctx.shadowColor = '#ff0000';
                    this.ctx.shadowBlur = 10 + Math.sin(this.animationFrame * 0.3) * 5;
                    this.ctx.strokeStyle = `rgba(255, 0, 0, ${(1 - fadeProgress) * 3})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.restore();
                }

                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
                this.ctx.fillRect(platform.x, platform.y, platform.width, 4);
            }
        });
    }

    /**
     * Draw checkpoints with enhanced visuals
     */
    drawCheckpoints() {
        this.currentLevelData.checkpoints.forEach(cp => {
            if (!cp.collected) {
                // Glow effect
                this.ctx.save();
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 15 + Math.sin(this.animationFrame * 0.1) * 5;
                
                // Flag pole
                this.ctx.fillStyle = '#00cc00';
                this.ctx.fillRect(cp.x + 12, cp.y, 6, 30);

                // Flag
                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.moveTo(cp.x + 18, cp.y);
                this.ctx.lineTo(cp.x + 30, cp.y + 7);
                this.ctx.lineTo(cp.x + 18, cp.y + 14);
                this.ctx.fill();
                
                this.ctx.restore();

                // Aura effect
                const auraAlpha = 0.15 + Math.sin(this.animationFrame * 0.08) * 0.1;
                this.ctx.fillStyle = `rgba(0, 255, 0, ${auraAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(cp.x + 15, cp.y + 15, 25, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Collected checkpoint (dimmed)
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
     * Draw candies with enhanced glow effects
     */
    drawCandies() {
        this.currentLevelData.candies.forEach((candy, index) => {
            if (!candy.collected) {
                const bounce = Math.sin(this.animationFrame * 0.05 + index) * 3;

                // Outer glow
                this.ctx.save();
                this.ctx.shadowColor = '#ffd700';
                this.ctx.shadowBlur = 15 + Math.sin(this.animationFrame * 0.1 + index) * 5;
                
                // Aura
                const auraAlpha = 0.25 + Math.sin(this.animationFrame * 0.08 + index) * 0.1;
                this.ctx.fillStyle = `rgba(255, 215, 0, ${auraAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 18, 0, Math.PI * 2);
                this.ctx.fill();

                // Main candy
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
                this.ctx.fill();

                // Highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Border
                this.ctx.strokeStyle = '#ff69b4';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        });
    }

    /**
     * Draw secrets with enhanced glow effects
     */
    drawSecrets() {
        if (!this.currentLevelData || !this.currentLevelData.secrets) return;

        this.currentLevelData.secrets.forEach((secret, index) => {
            if (!secret.collected) {
                const sparkle = Math.sin(this.animationFrame * 0.1 + index * 2) * 5;
                const glowSize = 22 + Math.sin(this.animationFrame * 0.15) * 6;
                const pulseAlpha = 0.3 + Math.sin(this.animationFrame * 0.12) * 0.15;

                // Outer glow
                this.ctx.save();
                this.ctx.shadowColor = '#9370db';
                this.ctx.shadowBlur = 20 + Math.sin(this.animationFrame * 0.1) * 8;
                
                this.ctx.fillStyle = `rgba(147, 112, 219, ${pulseAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 12, secret.y + 12 + sparkle, glowSize, 0, Math.PI * 2);
                this.ctx.fill();

                // Inner glow
                this.ctx.fillStyle = `rgba(255, 215, 0, ${pulseAlpha + 0.2})`;
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 12, secret.y + 12 + sparkle, 15, 0, Math.PI * 2);
                this.ctx.fill();

                // Diamond shape
                this.ctx.fillStyle = '#9370db';
                this.ctx.save();
                this.ctx.translate(secret.x + 12, secret.y + 12 + sparkle);
                this.ctx.rotate(Math.PI / 4 + this.animationFrame * 0.02);
                this.ctx.fillRect(-8, -8, 16, 16);
                this.ctx.restore();

                // Highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(secret.x + 9, secret.y + 9 + sparkle, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();

                // Periodic sparkle particles
                if (this.animationFrame % 15 === 0) {
                    particleSystem.createSparkles(secret.x + 12, secret.y + 12, '#ffd700', 2);
                }
            }
        });
    }

    /**
     * Draw power-ups with enhanced glow effects
     */
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const bounce = Math.sin(this.animationFrame * 0.08) * 5;

                let glowColor, glowRgba;
                switch(powerUp.type) {
                    case POWER_UPS.JUMP: 
                        glowColor = '#00ffff'; 
                        glowRgba = 'rgba(0, 255, 255, 0.4)';
                        break;
                    case POWER_UPS.SPEED: 
                        glowColor = '#ffff00'; 
                        glowRgba = 'rgba(255, 255, 0, 0.4)';
                        break;
                    case POWER_UPS.SHIELD: 
                        glowColor = '#00ff00'; 
                        glowRgba = 'rgba(0, 255, 0, 0.4)';
                        break;
                    case POWER_UPS.DOUBLE_POINTS: 
                        glowColor = '#ff00ff'; 
                        glowRgba = 'rgba(255, 0, 255, 0.4)';
                        break;
                    case POWER_UPS.DASH: 
                        glowColor = '#ff8800'; 
                        glowRgba = 'rgba(255, 128, 0, 0.4)';
                        break;
                }

                // Glow effect
                this.ctx.save();
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 18 + Math.sin(this.animationFrame * 0.15) * 5;
                
                this.ctx.fillStyle = glowRgba;
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 20, 0, Math.PI * 2);
                this.ctx.fill();

                // White background
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 12, 0, Math.PI * 2);
                this.ctx.fill();

                // Symbol
                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                let symbol = '⚡';
                if (powerUp.type === POWER_UPS.DASH) symbol = '💨';
                this.ctx.fillText(symbol, powerUp.x + 10, powerUp.y + 15 + bounce);
                
                this.ctx.restore();
            }
        });
    }

    /**
     * Draw goal with enhanced effects
     */
    drawGoal() {
        const goal = this.currentLevelData.goal;
        const goalBounce = Math.sin(this.animationFrame * 0.03) * 5;

        // Glow effect
        this.ctx.save();
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 20 + Math.sin(this.animationFrame * 0.1) * 8;
        
        // Aura
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.25)';
        this.ctx.fillRect(goal.x - 8, goal.y - 8 + goalBounce, goal.width + 16, goal.height + 16);

        // Main goal
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(goal.x, goal.y + goalBounce, goal.width, goal.height);

        // Star
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⭐', goal.x + goal.width / 2, goal.y + 35 + goalBounce);
        
        this.ctx.restore();
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
