/**
 * ui.js - HUD, Menus, Level Select, Start Screens
 * Contains all UI drawing and management functions
 */

import { SETTINGS, CANVAS, COLORS, HINT_DURATION } from './config.js';
import { levels, levelManager } from './levels.js';
import { Player } from './player.js';
import { particleSystem } from './particles.js';

/**
 * UIManager class - Manages all UI rendering
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
            groundPound: { shown: false, text: "Press DOWN + JUMP in the air for GROUND POUND!", trigger: 'firstAirborne' }
        };
        this.activeHint = null;
        this.hintTimer = 0;
        
        // Screen shake
        this.screenShake = {
            x: 0,
            y: 0,
            intensity: 0,
            duration: 0
        };
    }

    /**
     * Trigger screen shake effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration in frames
     */
    triggerScreenShake(intensity = SETTINGS.screenShakeIntensity, duration = 10) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        this.screenShake.x = (Math.random() - 0.5) * intensity;
        this.screenShake.y = (Math.random() - 0.5) * intensity;
    }

    /**
     * Update screen shake
     */
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration--;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
            this.screenShake.duration = 0;
        }
    }

    /**
     * Show tutorial hint
     * @param {string} hintKey - Key of hint to show
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
     * @param {Player} player - Player instance
     * @param {Level} level - Current level
     * @param {Array} enemies - Array of enemies
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

        // Update hint timer
        if (this.hintTimer > 0) {
            this.hintTimer--;
            if (this.hintTimer <= 0) {
                this.activeHint = null;
            }
        }
    }

    /**
     * Draw tutorial hint
     * @param {number} animationFrame - Current animation frame
     */
    drawTutorialHint(animationFrame) {
        if (!this.activeHint) return;

        const hintWidth = 400;
        const hintHeight = 60;
        const hintX = (this.canvas.width - hintWidth) / 2;
        const hintY = 100;

        // Hint background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.roundRect(hintX, hintY, hintWidth, hintHeight, 15);
        this.ctx.fill();
        this.ctx.stroke();

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
     * Draw start screen
     * @param {number} animationFrame - Current animation frame
     * @param {number} highScore - Current high score
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

        // Title
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🍬 Candy Landy 🍬', this.canvas.width / 2, 150);
        this.ctx.shadowBlur = 0;

        // Subtitle
        this.ctx.fillStyle = '#ff69b4';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Enhanced Edition v5!', this.canvas.width / 2, 190);

        // Princess name
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 28px Comic Sans MS';
        this.ctx.fillText('Princess Emmaline', this.canvas.width / 2, 230);

        // Instructions
        this.ctx.fillStyle = '#333';
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

        // High score
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = '20px Comic Sans MS';
        this.ctx.fillText('🏆 High Score: ' + highScore, this.canvas.width / 2, 540);

        // Animated character
        const bounce = Math.sin(animationFrame * 0.1) * 10;
        this.drawCharacter(this.canvas.width / 2, 500 + bounce, animationFrame);
    }

    /**
     * Draw level select screen
     * @param {Object} levelProgress - Level progress data
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
        this.ctx.fillText('ESC to return', this.canvas.width / 2, 560);
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
     * Draw HUD
     */
    drawHUD(player, level, currentLevel, score, combo, timeBonus, levels, levelStartTime, animationFrame) {
        // HUD background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(10, 10, 280, 280);
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 280, 280);

        // Score
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 20px Comic Sans MS';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🍬 Score: ' + score, 20, 40);

        // Lives
        this.ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

        // Jump indicator
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

        // Combo
        if (combo > 1) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 18px Comic Sans MS';
            this.ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 230);
        }

        // Time bonus
        if (timeBonus > 0) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 250);
        }

        // Dash cooldown
        if (player.dashCooldown > 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText(`⚡ Dash: ${Math.ceil(player.dashCooldown / 60)}s`, 20, 270);
        } else {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '16px Comic Sans MS';
            this.ctx.fillText('⚡ Dash: Ready!', 20, 270);
        }

        // Power-up indicator
        if (player.powerUp) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            this.ctx.fillRect(this.canvas.width - 120, 10, 110, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Comic Sans MS';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), this.canvas.width - 65, 35);
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
     * Draw pause screen
     */
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('⏸️ PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press ESC to Resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.fillText('Keys 0-5 to Adjust Volume', this.canvas.width / 2, this.canvas.height / 2 + 90);
    }

    /**
     * Draw game over screen
     */
    drawGameOverScreen(score, combo, timeBonus, highScore) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('💀 GAME OVER', this.canvas.width / 2, 200);
        this.ctx.shadowBlur = 0;

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
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.canvas.width / 2, 400);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, 460);
    }

    /**
     * Draw victory screen
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

        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 56px Comic Sans MS';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('🎊 YOU WIN! 🎊', this.canvas.width / 2, 200);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '28px Comic Sans MS';
        this.ctx.fillText('Final Score: ' + score, this.canvas.width / 2, 280);

        if (combo > 0) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '24px Comic Sans MS';
            this.ctx.fillText('Best Combo: ' + combo + 'x', this.canvas.width / 2, 320);
        }

        if (score >= highScore) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🏆 NEW HIGH SCORE! 🏆', this.canvas.width / 2, 360);
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Comic Sans MS';
        this.ctx.fillText('Press R to Play Again', this.canvas.width / 2, 420);
    }

    /**
     * Draw mini-map
     */
    drawMiniMap(level, player) {
        const mapSize = 100;
        const mapX = this.canvas.width - mapSize - 10;
        const mapY = this.canvas.height - mapSize - 20;
        const scale = mapSize / this.canvas.width;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
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

        // Player
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(mapX + player.x * scale, mapY + player.y * scale, Math.max(3, player.width * scale), Math.max(3, player.height * scale));

        // Border
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize * (this.canvas.height / this.canvas.width));
    }
}
