/**
 * levels.js - Level Data and Loading Logic
 * Contains all level definitions and level management
 */

import { POWER_UPS } from './config.js';

/**
 * Level class - Represents a single game level
 */
export class Level {
    constructor(data) {
        this.name = data.name || 'Untitled';
        this.description = data.description || '';
        this.thumbnail = data.thumbnail || '🎮';
        this.platforms = data.platforms || [];
        this.candies = data.candies || [];
        this.secrets = data.secrets || [];
        this.powerUps = data.powerUps || [];
        this.enemies = data.enemies || [];
        this.disappearingPlatforms = data.disappearingPlatforms || [];
        this.goal = data.goal || { x: 700, y: 100, width: 50, height: 50 };
        this.checkpoints = data.checkpoints || [];
        this.timeLimit = data.timeLimit || 120;
        this.timeBonusMultiplier = data.timeBonusMultiplier || 2;
    }

    /**
     * Create a deep copy of the level data
     * @returns {Level} - Cloned level
     */
    clone() {
        return new Level(JSON.parse(JSON.stringify(this)));
    }

    /**
     * Validate level data
     * @returns {boolean} - True if level is valid
     */
    validate() {
        // Validate enemy spawn positions
        this.enemies.forEach(e => {
            const onPlatform = this.platforms.some(p =>
                e.x >= p.x && e.x <= p.x + p.width &&
                e.y >= p.y && e.y <= p.y + p.height
            );
            if (!onPlatform) {
                console.warn(`Warning: Enemy spawned off-platform at (${e.x}, ${e.y})`);
            }
        });

        // Validate disappearing platforms have floor underneath
        this.disappearingPlatforms.forEach(dp => {
            const hasFloor = this.platforms.some(p =>
                p.y >= dp.y - 5 && p.y <= dp.y + 5 &&
                dp.x >= p.x && dp.x <= p.x + p.width
            );
            if (!hasFloor) {
                console.warn(`Warning: Disappearing platform has no floor at (${dp.x}, ${dp.y})`);
            }
        });

        return true;
    }

    /**
     * Reset level state (uncollect items, reset enemies)
     */
    reset() {
        this.candies.forEach(c => c.collected = false);
        this.secrets.forEach(s => s.collected = false);
        this.powerUps.forEach(p => p.collected = false);
        this.checkpoints.forEach(cp => cp.collected = false);
        
        // Reset enemy positions
        this.enemies.forEach(e => {
            e.x = e.startX || e.x;
        });

        // Reset disappearing platforms
        this.disappearingPlatforms.forEach(dp => {
            dp.visible = true;
            dp.timer = 0;
        });
    }
}

/**
 * Level definitions
 */
export const levelData = [
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
        secrets: [
            { x: 50, y: 520, collected: false, id: 'secret1_1' },
            { x: 750, y: 150, collected: false, id: 'secret1_2' }
        ],
        powerUps: [],
        enemies: [
            { x: 240, y: 420, width: 30, height: 30, vx: 2, range: 80, startX: 240 },
            { x: 440, y: 320, width: 30, height: 30, vx: -1, range: 60, startX: 440 },
            { x: 640, y: 220, width: 30, height: 30, vx: 3, range: 100, startX: 640 }
        ],
        disappearingPlatforms: [],
        goal: { x: 750, y: 200, width: 50, height: 50 },
        checkpoints: [
            { x: 400, y: 500, collected: false },
            { x: 650, y: 400, collected: false }
        ],
        timeLimit: 120,
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
        checkpoints: [
            { x: 300, y: 450, collected: false },
            { x: 600, y: 350, collected: false }
        ],
        timeLimit: 180,
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
        checkpoints: [
            { x: 200, y: 500, collected: false },
            { x: 400, y: 450, collected: false },
            { x: 600, y: 400, collected: false }
        ],
        timeLimit: 240,
        timeBonusMultiplier: 3
    }
];

/**
 * Create Level instances from data
 */
export const levels = levelData.map(data => new Level(data));

/**
 * LevelManager class - Manages level loading and progress
 */
export class LevelManager {
    constructor() {
        this.levels = levels;
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        this.levelProgress = {
            unlocked: [true, false, false],
            bestScores: [0, 0, 0],
            secretsFound: [0, 0, 0],
            totalSecrets: [2, 2, 2]
        };
        this.loadLevelProgress();
    }

    /**
     * Load level progress from localStorage
     */
    loadLevelProgress() {
        try {
            const saved = localStorage.getItem('candyLandyProgress');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.levelProgress = { ...this.levelProgress, ...parsed };
            }
        } catch (e) {
            console.warn('Could not load level progress:', e.message);
        }
    }

    /**
     * Save level progress to localStorage
     */
    saveLevelProgress() {
        try {
            localStorage.setItem('candyLandyProgress', JSON.stringify(this.levelProgress));
        } catch (e) {
            console.warn('Could not save level progress:', e.message);
        }
    }

    /**
     * Load a level by index
     * @param {number} index - Level index
     * @returns {Level} - Loaded level
     */
    loadLevel(index) {
        if (index >= this.levels.length) {
            return null; // Game complete
        }

        this.currentLevelIndex = index;
        this.currentLevel = this.levels[index].clone();
        this.currentLevel.validate();
        
        return this.currentLevel;
    }

    /**
     * Get current level data
     * @returns {Level} - Current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }

    /**
     * Check if level is unlocked
     * @param {number} index - Level index
     * @returns {boolean} - True if unlocked
     */
    isLevelUnlocked(index) {
        return this.levelProgress.unlocked[index] === true;
    }

    /**
     * Unlock next level
     */
    unlockNextLevel() {
        const nextIndex = this.currentLevelIndex + 1;
        if (nextIndex < this.levels.length) {
            this.levelProgress.unlocked[nextIndex] = true;
            this.saveLevelProgress();
        }
    }

    /**
     * Update best score for current level
     * @param {number} score - Score to record
     */
    updateBestScore(score) {
        if (score > this.levelProgress.bestScores[this.currentLevelIndex]) {
            this.levelProgress.bestScores[this.currentLevelIndex] = score;
            this.saveLevelProgress();
        }
    }

    /**
     * Update secrets found for current level
     */
    updateSecretsFound() {
        if (this.currentLevel && this.currentLevel.secrets) {
            this.levelProgress.secretsFound[this.currentLevelIndex] = 
                this.currentLevel.secrets.filter(s => s.collected).length;
            this.saveLevelProgress();
        }
    }

    /**
     * Get total number of levels
     * @returns {number} - Total levels
     */
    getTotalLevels() {
        return this.levels.length;
    }

    /**
     * Check if current level is the last level
     * @returns {boolean} - True if last level
     */
    isLastLevel() {
        return this.currentLevelIndex >= this.levels.length - 1;
    }
}

// Create singleton instance
export const levelManager = new LevelManager();
