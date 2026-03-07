/**
 * ui.js - HUD, Menus, Level Select, Start Screens, Transitions, Achievements
 * Sprint 4: Added screen transitions, achievement system, enhanced visual effects
 */

import { SETTINGS, CANVAS, COLORS, HINT_DURATION } from './config.js';
import { levels, levelManager } from './levels.js';
import { Player } from './player.js';
import { particleSystem } from './particles.js';

/**
 * Achievement System - Tracks and displays player achievements
 */
export class AchievementSystem {
    constructor() {
        this.achievements = {
            firstJump: { 
                id: 'firstJump', 
                name: 'First Hop', 
                desc: 'Jump for the first time', 
                icon: '🦘',
                unlocked: false 
            },
            firstStomp: { 
                id: 'firstStomp', 
                name: 'Stomper', 
                desc: 'Defeat an enemy by stomping', 
                icon: '👣',
                unlocked: false 
            },
            firstDoubleJump: { 
                id: 'firstDoubleJump', 
                name: 'Sky High', 
                desc: 'Perform a double jump', 
                icon: '⬆️',
                unlocked: false 
            },
            firstDash: { 
                id: 'firstDash', 
                name: 'Speedster', 
                desc: 'Use the dash ability', 
                icon: '💨',
                unlocked: false 
            },
            firstGroundPound: { 
                id: 'firstGroundPound', 
                name: 'Ground Pounder', 
                desc: 'Perform a ground pound', 
                icon: '🔨',
                unlocked: false 
            },
            perfectLevel: { 
                id: 'perfectLevel', 
                name: 'Perfect Run', 
                desc: 'Complete a level without taking damage', 
                icon: '⭐',
                unlocked: false 
            },
            allSecrets: { 
                id: 'allSecrets', 
                name: 'Treasure Hunter', 
                desc: 'Find all secrets in a level', 
                icon: '💎',
                unlocked: false 
            },
            combo5: { 
                id: 'combo5', 
                name: 'Combo Master', 
                desc: 'Reach a 5x combo', 
                icon: '🔥',
                unlocked: false 
            },
            combo10: { 
                id: 'combo10', 
                name: 'Combo Legend', 
                desc: 'Reach a 10x combo', 
                icon: '💥',
                unlocked: false 
            },
            speedrun: { 
                id: 'speedrun', 
                name: 'Speed Runner', 
                desc: 'Complete a level in under 30 seconds', 
                icon: '⚡',
                unlocked: false 
            },
            noDamage: { 
                id: 'noDamage', 
                name: 'Untouchable', 
                desc: 'Complete all levels without dying', 
                icon: '🛡️',
                unlocked: false 
            },
            collectAllCandies: { 
                id: 'collectAllCandies', 
                name: 'Candy Collector', 
                desc: 'Collect 100 candies total', 
                icon: '🍬',
                unlocked: false 
            },
            gameComplete: { 
                id: 'gameComplete', 
                name: 'Champion', 
                desc: 'Complete the entire game', 
                icon: '🏆',
                unlocked: false 
            }
        };
        
        this.stats = {
            totalCandies: 0,
            totalEnemies: 0,
            deaths: 0,
            levelsCompleted: 0,
            perfectLevels: 0
        };
        
        this.notificationQueue = [];
        this.currentNotification = null;
        this.notificationTimer = 0;
        this.notificationDuration = 180; // 3 seconds at 60fps
        
        this.loadProgress();
    }
    
    /**
     * Load achievement progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('candyLandyAchievements');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.achievements) {
                    Object.keys(data.achievements).forEach(key => {
                        if (this.achievements[key]) {
                            this.achievements[key].unlocked = data.achievements[key].unlocked;
                        }
                    });
                }
                if (data.stats) {
                    this.stats = { ...this.stats, ...data.stats };
                }
            }
        } catch (e) {
            console.warn('Could not load achievements:', e.message);
        }
    }
    
    /**
     * Save achievement progress to localStorage
     */
    saveProgress() {
        try {
            const data = {
                achievements: {},
                stats: this.stats
            };
            Object.keys(this.achievements).forEach(key => {
                data.achievements[key] = { unlocked: this.achievements[key].unlocked };
            });
            localStorage.setItem('candyLandyAchievements', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save achievements:', e.message);
        }
    }
    
    /**
     * Unlock an achievement
     */
    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.notificationQueue.push(achievement);
            this.saveProgress();
            return true;
        }
        return false;
    }
    
    /**
     * Update notification display
     */
    updateNotification() {
        if (this.currentNotification) {
            this.notificationTimer--;
            if (this.notificationTimer <= 0) {
                this.currentNotification = null;
            }
        } else if (this.notificationQueue.length > 0) {
            this.currentNotification = this.notificationQueue.shift();
            this.notificationTimer = this.notificationDuration;
        }
    }
    
    /**
     * Draw achievement notification
     */
    drawNotification(ctx, canvasWidth, animationFrame) {
        if (!this.currentNotification) return;
        
        const notification = this.currentNotification;
        const slideIn = Math.min(1, (this.notificationDuration - this.notificationTimer) / 20);
        const slideOut = this.notificationTimer < 30 ? this.notificationTimer / 30 : 1;
        const alpha = slideIn * slideOut;
        
        const boxWidth = 320;
        const boxHeight = 80;
        const boxX = canvasWidth - boxWidth - 20 + (1 - alpha) * (boxWidth + 40);
        const boxY = 100;
        
        // Background
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
        ctx.fill();
        ctx.stroke();
        
        // Glow effect
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20 + Math.sin(animationFrame * 0.2) * 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Icon
        ctx.globalAlpha = alpha;
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.icon, boxX + 40, boxY + 50);
        
        // Title
        ctx.fillStyle = '#8b4513';
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.textAlign = 'left';
        ctx.fillText('Achievement Unlocked!', boxX + 70, boxY + 28);
        
        // Achievement name
        ctx.fillStyle = '#ff1493';
        ctx.font = 'bold 16px Comic Sans MS';
        ctx.fillText(notification.name, boxX + 70, boxY + 50);
        
        // Description
        ctx.fillStyle = '#666';
        ctx.font = '12px Comic Sans MS';
        ctx.fillText(notification.desc, boxX + 70, boxY + 68);
        
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * Draw achievements menu
     */
    drawAchievementsMenu(ctx, canvasWidth, canvasHeight, animationFrame) {
        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 15;
        ctx.fillText('🏆 Achievements 🏆', canvasWidth / 2, 60);
        ctx.shadowBlur = 0;
        
        // Achievement grid
        const achievementList = Object.values(this.achievements);
        const cols = 3;
        const cardWidth = 220;
        const cardHeight = 90;
        const startX = (canvasWidth - (cols * cardWidth + (cols - 1) * 15)) / 2;
        const startY = 100;
        
        achievementList.forEach((achievement, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + 15);
            const y = startY + row * (cardHeight + 10);
            
            // Card background
            if (achievement.unlocked) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.strokeStyle = '#ffd700';
            } else {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
                ctx.strokeStyle = '#666';
            }
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, cardWidth, cardHeight, 10);
            ctx.fill();
            ctx.stroke();
            
            // Icon
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.globalAlpha = achievement.unlocked ? 1 : 0.4;
            ctx.fillText(achievement.icon, x + 30, y + 45);
            
            // Name
            ctx.textAlign = 'left';
            ctx.fillStyle = achievement.unlocked ? '#fff' : '#888';
            ctx.font = 'bold 14px Comic Sans MS';
            ctx.fillText(achievement.name, x + 55, y + 35);
            
            // Description
            ctx.fillStyle = achievement.unlocked ? '#ccc' : '#666';
            ctx.font = '11px Comic Sans MS';
            ctx.fillText(achievement.desc, x + 55, y + 55);
            
            // Status
            if (achievement.unlocked) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 12px Comic Sans MS';
                ctx.fillText('✓ Unlocked', x + 55, y + 75);
            } else {
                ctx.fillStyle = '#888';
                ctx.font = '12px Comic Sans MS';
                ctx.fillText('🔒 Locked', x + 55, y + 75);
            }
            
            ctx.globalAlpha = 1;
        });
        
        // Stats section
        const statsY = startY + Math.ceil(achievementList.length / cols) * (cardHeight + 10) + 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(startX, statsY, cols * cardWidth + (cols - 1) * 15, 60);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText(
            `📊 Stats: Candies: ${this.stats.totalCandies} | Enemies: ${this.stats.totalEnemies} | Deaths: ${this.stats.deaths}`,
            canvasWidth / 2, statsY + 25
        );
        
        const unlockedCount = achievementList.filter(a => a.unlocked).length;
        ctx.fillText(
            `🏆 Progress: ${unlockedCount}/${achievementList.length} achievements unlocked`,
            canvasWidth / 2, statsY + 45
        );
        
        // Back instruction
        ctx.fillStyle = '#ff69b4';
        ctx.font = '20px Comic Sans MS';
        ctx.fillText('Press ESC or A to close', canvasWidth / 2, canvasHeight - 30);
    }
}

/**
 * Screen Transition System - Manages smooth transitions between game states
 */
export class TransitionManager {
    constructor() {
        this.active = false;
        this.type = 'fade'; // 'fade', 'swipe', 'zoom', 'candy'
        this.phase = 'out'; // 'out', 'hold', 'in'
        this.progress = 0;
        this.duration = 60; // frames for each phase
        this.holdDuration = 10;
        this.callback = null;
        this.candyParticles = [];
    }
    
    /**
     * Start a transition
     */
    start(type = 'fade', callback = null, duration = 60) {
        this.active = true;
        this.type = type;
        this.phase = 'out';
        this.progress = 0;
        this.duration = duration;
        this.holdDuration = 10;
        this.callback = callback;
        
        // Generate candy particles for candy transition
        if (type === 'candy') {
            this.candyParticles = [];
            for (let i = 0; i < 30; i++) {
                this.candyParticles.push({
                    x: Math.random() * CANVAS.WIDTH,
                    y: -50 - Math.random() * 200,
                    size: Math.random() * 20 + 10,
                    speed: Math.random() * 5 + 3,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    type: Math.floor(Math.random() * 4)
                });
            }
        }
    }
    
    /**
     * Update transition state
     */
    update() {
        if (!this.active) return false;
        
        this.progress++;
        
        if (this.phase === 'out' && this.progress >= this.duration) {
            this.phase = 'hold';
            this.progress = 0;
            if (this.callback) {
                this.callback();
            }
        } else if (this.phase === 'hold' && this.progress >= this.holdDuration) {
            this.phase = 'in';
            this.progress = 0;
        } else if (this.phase === 'in' && this.progress >= this.duration) {
            this.active = false;
            return false;
        }
        
        // Update candy particles
        if (this.type === 'candy') {
            this.candyParticles.forEach(p => {
                p.y += p.speed;
                p.rotation += p.rotationSpeed;
            });
        }
        
        return true;
    }
    
    /**
     * Draw transition overlay
     */
    draw(ctx, canvasWidth, canvasHeight, animationFrame) {
        if (!this.active) return;
        
        const getProgress = () => {
            if (this.phase === 'out') {
                return this.progress / this.duration;
            } else if (this.phase === 'hold') {
                return 1;
            } else {
                return 1 - (this.progress / this.duration);
            }
        };
        
        const p = getProgress();
        
        switch (this.type) {
            case 'fade':
                this.drawFade(ctx, canvasWidth, canvasHeight, p);
                break;
            case 'swipe':
                this.drawSwipe(ctx, canvasWidth, canvasHeight, p);
                break;
            case 'zoom':
                this.drawZoom(ctx, canvasWidth, canvasHeight, p);
                break;
            case 'candy':
                this.drawCandy(ctx, canvasWidth, canvasHeight, p, animationFrame);
                break;
            default:
                this.drawFade(ctx, canvasWidth, canvasHeight, p);
        }
    }
    
    /**
     * Draw fade transition
     */
    drawFade(ctx, width, height, progress) {
        ctx.globalAlpha = progress;
        
        // Gradient overlay with candy colors
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, `rgba(255, 105, 180, ${progress})`);
        gradient.addColorStop(0.5, `rgba(255, 182, 193, ${progress})`);
        gradient.addColorStop(1, `rgba(255, 105, 180, ${progress})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add sparkle overlay
        if (progress > 0.5) {
            const sparkleAlpha = (progress - 0.5) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
            for (let i = 0; i < 20; i++) {
                const x = (Math.sin(i * 1.5 + progress * 5) * 0.5 + 0.5) * width;
                const y = (Math.cos(i * 1.3 + progress * 5) * 0.5 + 0.5) * height;
                const size = 3 + Math.sin(progress * 10 + i) * 2;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw swipe transition
     */
    drawSwipe(ctx, width, height, progress) {
        const swipeWidth = width * progress * 1.5;
        
        // Main swipe bar
        const gradient = ctx.createLinearGradient(
            width - swipeWidth, 0,
            width, 0
        );
        gradient.addColorStop(0, 'rgba(255, 105, 180, 0)');
        gradient.addColorStop(0.3, 'rgba(255, 105, 180, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 182, 193, 1)');
        gradient.addColorStop(1, 'rgba(255, 105, 180, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(width - swipeWidth, 0, swipeWidth, height);
        
        // Candy stripes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 10; i++) {
            const stripeX = width - swipeWidth + (i * swipeWidth / 10);
            ctx.fillRect(stripeX, 0, 3, height);
        }
    }
    
    /**
     * Draw zoom transition
     */
    drawZoom(ctx, width, height, progress) {
        const scale = 1 + progress * 2;
        const alpha = progress;
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(0, 0, width, height);
        
        // Radial gradient in center
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw candy transition
     */
    drawCandy(ctx, width, height, progress, animationFrame) {
        // Falling candies overlay
        ctx.globalAlpha = progress;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(255, 105, 180, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 182, 193, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw falling candies
        const candyColors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d'];
        
        this.candyParticles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            ctx.fillStyle = candyColors[p.type];
            
            switch (p.type) {
                case 0: // Circle candy
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 1: // Star
                    this.drawStar(ctx, 0, 0, p.size / 2, p.size / 4, 5);
                    break;
                case 2: // Diamond
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size / 2);
                    ctx.lineTo(p.size / 3, 0);
                    ctx.lineTo(0, p.size / 2);
                    ctx.lineTo(-p.size / 3, 0);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 3: // Heart
                    ctx.beginPath();
                    ctx.moveTo(0, p.size / 4);
                    ctx.bezierCurveTo(-p.size / 2, -p.size / 4, -p.size / 2, -p.size / 2, 0, -p.size / 4);
                    ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size / 2, -p.size / 4, 0, p.size / 4);
                    ctx.fill();
                    break;
            }
            
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(-p.size / 6, -p.size / 6, p.size / 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw star shape helper
     */
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
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
}

/**
 * UIManager class - Manages all UI rendering with enhanced effects
 */
export class UIManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Tutorial system
        this.tutorialHints = {
            jump: { shown: false, text: "Press SPACE or UP to jump!", trigger: 'firstGrounded' },
            doubleJump: { shown: false, text: "Press jump again in the air for DOUBLE JUMP!", trigger: 'firstAirJump' },
            stomp: { shown: false, text: "Jump on enemies from above to defeat them!", trigger: 'firstEnemyNearby' },
            checkpoint: { shown: false, text: "Collect checkpoints to heal and respawn there!", trigger: 'firstCheckpointNearby' },
            dash: { shown: false, text: "Press SHIFT while grounded to DASH (invincible)!", trigger: 'firstDashAvailable' },
            groundPound: { shown: false, text: "Press DOWN + JUMP in the air for GROUND POUND!", trigger: 'firstAirborne' },
            achievements: { shown: false, text: "Press A to view your achievements!", trigger: 'firstAchievement' },
            powerUp: { shown: false, text: "Collect power-ups for special abilities! Watch the aura!", trigger: 'firstPowerUp' }
        };
        this.activeHint = null;
        this.hintTimer = 0;
        
        // Enhanced screen shake with different intensities
        this.screenShake = {
            x: 0,
            y: 0,
            intensity: 0,
            duration: 0,
            type: 'default' // 'default', 'explosion', 'stomp', 'collect', 'hit'
        };
        
        // Screen shake presets
        this.shakePresets = {
            light: { intensity: 3, duration: 5 },
            medium: { intensity: 8, duration: 10 },
            heavy: { intensity: 15, duration: 15 },
            explosion: { intensity: 20, duration: 20 },
            stomp: { intensity: 12, duration: 12 },
            collect: { intensity: 2, duration: 3 },
            hit: { intensity: 10, duration: 8 }
        };
        
        // Achievement system
        this.achievements = new AchievementSystem();
        
        // Transition system
        this.transitions = new TransitionManager();
        
        // Show achievements menu
        this.showAchievementsMenu = false;
    }

    /**
     * Trigger screen shake effect with preset
     */
    triggerScreenShake(intensity = SETTINGS.screenShakeIntensity, duration = 10, type = 'default') {
        // Use preset if available
        if (typeof intensity === 'string' && this.shakePresets[intensity]) {
            const preset = this.shakePresets[intensity];
            intensity = preset.intensity;
            duration = preset.duration;
        }
        
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        this.screenShake.type = type;
        this.screenShake.x = (Math.random() - 0.5) * intensity;
        this.screenShake.y = (Math.random() - 0.5) * intensity;
    }

    /**
     * Update screen shake with enhanced decay
     */
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            // Different shake patterns based on type
            const decay = this.screenShake.duration / 20;
            
            switch (this.screenShake.type) {
                case 'explosion':
                    // Violent, random shake
                    this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * decay;
                    this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * decay;
                    break;
                case 'stomp':
                    // Vertical emphasis
                    this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 0.3 * decay;
                    this.screenShake.y = Math.abs(Math.random() - 0.5) * this.screenShake.intensity * decay;
                    break;
                case 'collect':
                    // Gentle, wobble shake
                    this.screenShake.x = Math.sin(this.screenShake.duration * 0.5) * this.screenShake.intensity * decay;
                    this.screenShake.y = Math.cos(this.screenShake.duration * 0.7) * this.screenShake.intensity * 0.5 * decay;
                    break;
                default:
                    // Standard random shake
                    this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * decay;
                    this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * decay;
            }
            
            this.screenShake.duration--;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
            this.screenShake.type = 'default';
        }
    }
    
    /**
     * Start a screen transition
     */
    startTransition(type, callback, duration) {
        this.transitions.start(type, callback, duration);
    }
    
    /**
     * Check if transition is active
     */
    isTransitioning() {
        return this.transitions.active;
    }
    
    /**
     * Update UI systems
     */
    update() {
        this.updateScreenShake();
        this.transitions.update();
        this.achievements.updateNotification();
    }

    /**
     * Show tutorial hint
     */
    showTutorialHint(hintKey) {
        if (this.tutorialHints[hintKey] && !this.tutorialHints[hintKey].shown) {
            this.tutorialHints[hintKey].shown = true;
            this.activeHint = this.tutorialHints[hintKey].text;
            this.hintTimer = HINT_DURATION;
        }
    }

    /**
     * Update tutorial hints based on game state
     */
    updateTutorialHints(player, level, enemies) {
        // Show jump hint when first grounded
        if (player.grounded && !this.tutorialHints.jump.shown) {
            this.showTutorialHint('jump');
        }

        // Show double jump hint when first in air
        if (!player.grounded && player.jumpCount === 1 && !this.tutorialHints.doubleJump.shown) {
            this.showTutorialHint('doubleJump');
        }

        // Show ground pound hint when airborne
        if (!player.grounded && player.jumpCount > 0 && !this.tutorialHints.groundPound.shown) {
            this.showTutorialHint('groundPound');
        }

        // Show stomp hint when enemy is nearby
        const enemyNearby = enemies.some(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            return Math.sqrt(dx * dx + dy * dy) < 150;
        });
        if (enemyNearby && !this.tutorialHints.stomp.shown) {
            this.showTutorialHint('stomp');
        }

        // Show checkpoint hint when checkpoint is nearby
        if (level.checkpoints) {
            const checkpointNearby = level.checkpoints.some(cp => {
                if (cp.collected) return false;
                const dx = cp.x - player.x;
                const dy = cp.y - player.y;
                return Math.sqrt(dx * dx + dy * dy) < 150;
            });
            if (checkpointNearby && !this.tutorialHints.checkpoint.shown) {
                this.showTutorialHint('checkpoint');
            }
        }

        // Show dash hint when grounded and dash is available
        if (player.grounded && player.dashCooldown <= 0 && !this.tutorialHints.dash.shown) {
            this.showTutorialHint('dash');
        }
        
        // Show achievements hint after first achievement
        const hasAchievement = Object.values(this.achievements.achievements).some(a => a.unlocked);
        if (hasAchievement && !this.tutorialHints.achievements.shown) {
            this.showTutorialHint('achievements');
        }

        // Update hint timer
        if (this.hintTimer > 0) {
            this.hintTimer--;
            if (this.hintTimer <= 0) {
                this.activeHint = null;
            }
        }
    }

    /**
     * Draw tutorial hint with enhanced styling
     */
    drawTutorialHint(animationFrame) {
        if (!this.activeHint) return;

        const hintWidth = 400;
        const hintHeight = 60;
        const hintX = (this.canvas.width - hintWidth) / 2;
        const hintY = 100;
        
        // Pulsing effect
        const pulse = 1 + Math.sin(animationFrame * 0.1) * 0.05;

        // Hint background with glow
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, hintY + hintHeight / 2);
        this.ctx.scale(pulse, pulse);
        this.ctx.translate(-this.canvas.width / 2, -(hintY + hintHeight / 2));
        
        // Glow effect
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 15 + Math.sin(animationFrame * 0.15) * 5;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.roundRect(hintX, hintY, hintWidth, hintHeight, 15);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();

        // Hint text
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 18px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.activeHint, this.canvas.width / 2, hintY + hintHeight / 2);

        // Sparkle effect
        if (animationFrame % 10 === 0) {
            particleSystem.createParticles(hintX + Math.random() * hintWidth, hintY, '#ffd700', 2, {
                spread: 3, gravity: 0.05, life: 0.5, size: { min: 2, max: 4 }, fade: 0.1, shape: 'star'
            });
        }
    }

    /**
     * Draw start screen with enhanced animations
     */
    drawStartScreen(animationFrame, highScore) {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated clouds
        const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(100 + cloudOffset, 80, 60);
        this.drawCloud(400 - cloudOffset, 120, 80);
        this.drawCloud(650 + cloudOffset, 60, 70);

        // Title with glow effect
        this.ctx.save();
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 20 + Math.sin(animationFrame * 0.05) * 5;
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍬 Candy Landy 🍬', this.canvas.width / 2, 150);
        this.ctx.shadowBlur = 0;
        this.ctx.restore();

        // Subtitle
        this.ctx.fillStyle = '#ff69b4';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Enhanced Edition v5!', this.canvas.width / 2, 190);

        // Princess name
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 28px Comic Sans MS';
        this.ctx.fillText('Princess Emmaline', this.canvas.width / 2, 230);

        // Instructions with pulsing effect
        const pulseAlpha = 0.7 + Math.sin(animationFrame * 0.08) * 0.3;
        this.ctx.fillStyle = `rgba(51, 51, 51, ${pulseAlpha})`;
        this.ctx.font = '22px Comic Sans MS';
        this.ctx.fillText('Press SPACE, ENTER, or UP ARROW to Start!', this.canvas.width / 2, 280);

        // Controls box
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(200, 320, 400, 200);
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(200, 320, 400, 200);

        this.ctx.fillStyle = '#333';
        this.ctx.font = '18px Comic Sans MS';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('⬅️ ➡️ Arrow Keys - Move', 230, 355);
        this.ctx.fillText('⬆️ SPACE - Jump (Double tap for double jump!)', 230, 385);
        this.ctx.fillText('⇧ SHIFT - Dash (invincible, double speed)', 230, 415);
        this.ctx.fillText('🔽+⬆️ Ground Pound (while airborne)', 230, 445);
        this.ctx.fillText('🍬 Collect all candies to advance', 230, 475);
        this.ctx.fillText('⚠️ Avoid enemies and don\'t fall!', 230, 505);

        // High score with trophy animation
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = '20px Comic Sans MS';
        const trophyBounce = Math.sin(animationFrame * 0.1) * 3;
        this.ctx.fillText('🏆 High Score: ' + highScore + ' 🏆', this.canvas.width / 2, 540 + trophyBounce);
        
        // Achievement count
        const achievementCount = Object.values(this.achievements.achievements).filter(a => a.unlocked).length;
        if (achievementCount > 0) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText(`Press A for Achievements (${achievementCount}/${Object.keys(this.achievements.achievements).length})`, this.canvas.width / 2, 570);
        }

        // Animated character
        const bounce = Math.sin(animationFrame * 0.1) * 10;
        this.drawCharacter(this.canvas.width / 2, 500 + bounce, animationFrame);
    }

    /**
     * Draw level select screen with enhanced cards
     */
    drawLevelSelectScreen(levelProgress) {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 48px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🍭 Select Level 🍭', this.canvas.width / 2, 80);
        this.ctx.shadowBlur = 0;

        // Draw level cards
        const cardWidth = 200;
        const cardHeight = 280;
        const cardSpacing = 50;
        const startX = (this.canvas.width - (3 * cardWidth + 2 * cardSpacing)) / 2;

        levels.forEach((level, index) => {
            const x = startX + index * (cardWidth + cardSpacing);
            const y = 150;
            const isUnlocked = levelProgress.unlocked[index];

            // Card background
            this.ctx.fillStyle = isUnlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(100, 100, 100, 0.6)';
            this.ctx.strokeStyle = isUnlocked ? '#ff69b4' : '#666';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, cardWidth, cardHeight, 15);
            this.ctx.fill();
            this.ctx.stroke();

            if (!isUnlocked) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(x, y, cardWidth, cardHeight);

                this.ctx.fillStyle = '#666';
                this.ctx.font = 'bold 60px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🔒', x + cardWidth / 2, y + cardHeight / 2);

                this.ctx.font = '16px Comic Sans MS';
                this.ctx.fillStyle = '#888';
                this.ctx.fillText('Locked', x + cardWidth / 2, y + cardHeight - 30);
            } else {
                // Level thumbnail
                this.ctx.font = 'bold 50px Arial';
                this.ctx.fillText(level.thumbnail, x + cardWidth / 2, y + 50);

                // Level name
                this.ctx.fillStyle = '#ff1493';
                this.ctx.font = 'bold 20px Comic Sans MS';
                this.ctx.fillText(level.name, x + cardWidth / 2, y + 90);

                // Level description
                this.ctx.fillStyle = '#666';
                this.ctx.font = '14px Comic Sans MS';
                this.ctx.fillText(level.description, x + cardWidth / 2, y + 115);

                // Best score
                const bestScore = levelProgress.bestScores[index];
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 16px Comic Sans MS';
                this.ctx.fillText('🏆 Best: ' + bestScore, x + cardWidth / 2, y + 150);

                // Secrets found
                const secretsFound = levelProgress.secretsFound[index];
                const totalSecrets = levelProgress.totalSecrets[index];
                this.ctx.fillStyle = '#9370db';
                this.ctx.font = '14px Comic Sans MS';
                this.ctx.fillText('💎 Secrets: ' + secretsFound + '/' + totalSecrets, x + cardWidth / 2, y + 180);

                // Play button
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(x + 50, y + 200, 100, 40);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 18px Comic Sans MS';
                this.ctx.fillText('▶ PLAY', x + cardWidth / 2, y + 228);

                // Key hint
                this.ctx.fillStyle = '#888';
                this.ctx.font = '12px Comic Sans MS';
                this.ctx.fillText('Press ' + (index + 1), x + cardWidth / 2, y + 265);
            }
        });

        // Instructions
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1-3 to select level or SPACE to start!', this.canvas.width / 2, 480);

        // High score
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = '18px Comic Sans MS';
        this.ctx.fillText('🏆 Total High Score: ' + (levelProgress.bestScores.reduce((a, b) => a + b, 0)), this.canvas.width / 2, 520);

        // Back instruction
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Comic Sans MS';
        this.ctx.fillText('ESC to return | A for Achievements', this.canvas.width / 2, 560);
    }

    /**
     * Draw cloud shape
     */
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw character for start screen
     */
    drawCharacter(x, y, animationFrame) {
        const hairWaveSpeed = animationFrame * 0.08;
        const hairColor = '#ffd700';
        const hairHighlight = '#ffed4e';

        const hairBaseX = x;
        const hairBaseY = y - 10;

        // Upward hair
        for (let i = 0; i < 10; i++) {
            const strandOffset = (i - 4.5) * 5;
            const waveOffset = Math.sin(hairWaveSpeed + i * 0.4) * 2;
            const upwardLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 8;

            this.ctx.beginPath();
            this.ctx.moveTo(hairBaseX + strandOffset, hairBaseY - 10);
            this.ctx.bezierCurveTo(
                hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
                hairBaseX + strandOffset + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
                hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength
            );
            this.ctx.strokeStyle = hairColor;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(hairBaseX + strandOffset - 0.5, hairBaseY - 10);
            this.ctx.bezierCurveTo(
                hairBaseX + strandOffset - 0.5 + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
                hairBaseX + strandOffset - 0.5 + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
                hairBaseX + strandOffset - 1 + waveOffset, hairBaseY - 15 - upwardLength
            );
            this.ctx.strokeStyle = hairHighlight;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }

        // Crown
        this.ctx.beginPath();
        this.ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = hairColor;
        this.ctx.fill();
        this.ctx.strokeStyle = '#e6b800';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Flowing hair
        for (let i = 0; i < 6; i++) {
            const strandOffset = (i - 2.5) * 8;
            const waveOffset = Math.sin(hairWaveSpeed + i * 0.5) * 2;
            const strandLength = 30 + Math.sin(hairWaveSpeed + i * 0.3) * 5;

            this.ctx.beginPath();
            this.ctx.moveTo(hairBaseX + strandOffset, hairBaseY);
            this.ctx.bezierCurveTo(
                hairBaseX + strandOffset + waveOffset, hairBaseY + 10,
                hairBaseX + strandOffset + waveOffset * 2, hairBaseY + 20,
                hairBaseX + strandOffset, hairBaseY + strandLength
            );
            this.ctx.strokeStyle = hairColor;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(hairBaseX + strandOffset - 1, hairBaseY);
            this.ctx.bezierCurveTo(
                hairBaseX + strandOffset - 1 + waveOffset, hairBaseY + 10,
                hairBaseX + strandOffset - 1 + waveOffset * 2, hairBaseY + 20,
                hairBaseX + strandOffset - 2, hairBaseY + strandLength - 5
            );
            this.ctx.strokeStyle = hairHighlight;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Body
        this.ctx.fillStyle = '#ff69b4';
        this.ctx.fillRect(x - 20, y, 40, 60);

        // Hat
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(x - 25, y - 10, 50, 10);

        // Head
        this.ctx.fillStyle = '#ffd699';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 20, 18, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(x - 6, y - 22, 4, 0, Math.PI * 2);
        this.ctx.arc(x + 6, y - 22, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Smile
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 18, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * Draw HUD with enhanced visuals
     */
    drawHUD(player, level, currentLevel, score, combo, timeBonus, levels, levelStartTime, animationFrame) {
        // HUD background with gradient
        const hudGradient = this.ctx.createLinearGradient(10, 10, 10, 290);
        hudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        hudGradient.addColorStop(1, 'rgba(255, 240, 245, 0.9)');
        this.ctx.fillStyle = hudGradient;
        this.ctx.fillRect(10, 10, 280, 280);
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, 280, 280);

        // Score with glow
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 20px Comic Sans MS';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🍬 Score: ' + score, 20, 40);

        // Lives with hearts
        this.ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

        // Jump indicator with enhanced visual
        const jumpsRemaining = 2 - player.jumpCount;
        this.ctx.fillStyle = jumpsRemaining > 0 ? '#00ffff' : '#888';
        this.ctx.font = 'bold 16px Comic Sans MS';
        this.ctx.fillText('🦘 Jumps: ' + '⬆️'.repeat(jumpsRemaining), 20, 90);

        // Princess name
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 16px Comic Sans MS';
        this.ctx.fillText('👑 Princess Emmaline', 20, 110);

        // Level
        this.ctx.fillText('🎮 Level: ' + (currentLevel + 1) + '/' + levels.length, 20, 130);

        // Candies
        const collected = level.candies.filter(c => c.collected).length;
        const total = level.candies.length;
        this.ctx.fillText('🍭 Candies: ' + collected + '/' + total, 20, 150);

        // Checkpoints
        const collectedCheckpoints = level.checkpoints.filter(cp => cp.collected).length;
        const totalCheckpoints = level.checkpoints.length;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('🚩 Checkpoints: ' + collectedCheckpoints + '/' + totalCheckpoints, 20, 170);

        // Secrets
        if (level.secrets) {
            const collectedSecrets = level.secrets.filter(s => s.collected).length;
            const totalSecrets = level.secrets.length;
            this.ctx.fillStyle = '#9370db';
            this.ctx.font = 'bold 16px Comic Sans MS';
            this.ctx.fillText('💎 Secrets: ' + collectedSecrets + '/' + totalSecrets, 20, 190);
        }

        // Timer
        if (levels[currentLevel].timeLimit) {
            const timeRemaining = levels[currentLevel].timeLimit - Math.floor((animationFrame - levelStartTime) / 60);
            const timePercent = timeRemaining / levels[currentLevel].timeLimit;

            let timeColor = '#00ff00';
            if (timePercent < 0.5) timeColor = '#ffff00';
            if (timePercent < 0.25) timeColor = '#ff0000';

            this.ctx.fillStyle = timeColor;
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText(`⏱️ Time: ${Math.max(0, Math.ceil(timeRemaining))}s`, 20, 210);
        }

        // Combo with enhanced effect
        if (combo > 1) {
            this.ctx.save();
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 18px Comic Sans MS';
            this.ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 230);
            this.ctx.restore();
        }

        // Time bonus
        if (timeBonus > 0) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 250);
        }

        // Dash cooldown with visual indicator
        if (player.dashCooldown > 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText(`⚡ Dash: ${Math.ceil(player.dashCooldown / 60)}s`, 20, 270);
        } else {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText('⚡ Dash: Ready!', 20, 270);
        }

        // Power-up indicator with glow
        if (player.powerUp) {
            this.ctx.save();
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            this.ctx.fillRect(this.canvas.width - 120, 10, 110, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Comic Sans MS';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), this.canvas.width - 65, 35);
            this.ctx.restore();
        }

        // Volume
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(this.canvas.width - 120, 55, 110, 25);
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Comic Sans MS';
        this.ctx.fillText('🔊 ' + Math.round(SETTINGS.volume * 100) + '% (0-5)', this.canvas.width - 65, 72);

        // High score
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = '16px Comic Sans MS';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('🏆 Best: ' + (levelManager.levelProgress.bestScores[currentLevel] || 0), this.canvas.width - 20, 590);
    }

    /**
     * Draw pause screen with enhanced styling
     */
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⏸️ PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();

        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press ESC to Resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.fillText('Keys 0-5 to Adjust Volume', this.canvas.width / 2, this.canvas.height / 2 + 90);
        this.ctx.fillText('Press A for Achievements', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }

    /**
     * Draw game over screen with enhanced effects
     */
    drawGameOverScreen(score, combo, timeBonus, highScore) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💀 GAME OVER', this.canvas.width / 2, 200);
        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Comic Sans MS';
        this.ctx.fillText('Score: ' + score, this.canvas.width / 2, 280);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('🔥 Max Combo: ' + combo + 'x', this.canvas.width / 2, 320);

        if (timeBonus > 0) {
            this.ctx.fillText('⏱️ Time Bonus: ' + timeBonus, this.canvas.width / 2, 350);
        }

        if (score >= highScore) {
            this.ctx.save();
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.canvas.width / 2, 400);
            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, 460);
    }

    /**
     * Draw victory screen with enhanced celebration
     */
    drawVictoryScreen(score, combo, highScore, animationFrame) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Victory glow
        const glowSize = 50 + Math.sin(animationFrame * 0.05) * 10;
        const glowGradient = this.ctx.createRadialGradient(this.canvas.width / 2, 150, 0, this.canvas.width / 2, 150, glowSize);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎊 YOU WIN! 🎊', this.canvas.width / 2, 200);
        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '28px Comic Sans MS';
        this.ctx.fillText('Final Score: ' + score, this.canvas.width / 2, 280);

        if (combo > 0) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '24px Comic Sans MS';
            this.ctx.fillText('Best Combo: ' + combo + 'x', this.canvas.width / 2, 320);
        }

        if (score >= highScore) {
            this.ctx.save();
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🏆 NEW HIGH SCORE! 🏆', this.canvas.width / 2, 360);
            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press R to Play Again', this.canvas.width / 2, 420);
    }

    /**
     * Draw mini-map with enhanced visuals
     */
    drawMiniMap(level, player) {
        const mapSize = 100;
        const mapX = this.canvas.width - mapSize - 10;
        const mapY = this.canvas.height - mapSize - 20;
        const scale = mapSize / this.canvas.width;

        // Background with gradient
        const mapGradient = this.ctx.createLinearGradient(mapX, mapY, mapX, mapY + mapSize);
        mapGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        mapGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        this.ctx.fillStyle = mapGradient;
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize * (this.canvas.height / this.canvas.width));

        // Platforms
        this.ctx.fillStyle = 'rgba(255, 105, 180, 0.8)';
        level.platforms.forEach(p => {
            this.ctx.fillRect(mapX + p.x * scale, mapY + p.y * scale, p.width * scale, Math.max(2, p.height * scale));
        });

        // Disappearing platforms
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
        level.disappearingPlatforms.forEach(p => {
            if (p.visible) {
                this.ctx.fillRect(mapX + p.x * scale, mapY + p.y * scale, p.width * scale, Math.max(2, p.height * scale));
            }
        });

        // Checkpoints
        level.checkpoints.forEach(cp => {
            if (!cp.collected) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(mapX + cp.x * scale, mapY + cp.y * scale, 3, 5);
            }
        });

        // Goal
        const goal = level.goal;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(mapX + goal.x * scale, mapY + goal.y * scale, goal.width * scale, goal.height * scale);

        // Player with glow
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(mapX + player.x * scale, mapY + player.y * scale, Math.max(3, player.width * scale), Math.max(3, player.height * scale));
        this.ctx.restore();

        // Border
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize * (this.canvas.height / this.canvas.width));
    }
    
    /**
     * Draw all overlays (transitions, notifications, achievements menu)
     */
    drawOverlays(animationFrame) {
        // Draw transition
        this.transitions.draw(this.ctx, this.canvas.width, this.canvas.height, animationFrame);
        
        // Draw achievement notification
        this.achievements.drawNotification(this.ctx, this.canvas.width, animationFrame);
        
        // Draw achievements menu if open
        if (this.showAchievementsMenu) {
            this.achievements.drawAchievementsMenu(this.ctx, this.canvas.width, this.canvas.height, animationFrame);
        }
    }
}
