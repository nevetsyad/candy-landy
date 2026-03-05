/**
 * audio.js - Sound System and Web Audio API Management
 * Handles all audio functionality including sound effects and background music
 */

import { SETTINGS } from './config.js';

/**
 * AudioManager class - Manages all game audio
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        this.audioSupported = true;
        this.audioContextSuspended = false;
        this.musicInterval = null;
        this.musicNoteIndex = 0;
        
        // Melody for background music
        this.melody = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047];
        this.melodyDurations = [0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.25, 0.25, 0.3, 0.3, 0.5];
        this.chordProgression = [
            [262, 330, 392], // C major
            [294, 369, 440], // D minor
            [330, 415, 494], // E minor
            [349, 440, 523], // F major
            [392, 494, 588], // G major
            [440, 554, 659], // A minor
            [494, 622, 740], // B diminished
            [523, 659, 784]  // C major
        ];
    }

    /**
     * Initialize audio with graceful degradation
     */
    init() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                this.resume();
            }
            return this.audioContext.state === 'running';
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported - audio disabled');
                this.audioSupported = false;
                return false;
            }

            this.audioContext = new AudioContextClass();

            if (this.audioContext.state === 'suspended') {
                this.audioContextSuspended = true;
                console.log('Audio context suspended - will resume on user interaction');
            } else if (this.audioContext.state === 'running') {
                this.audioContextSuspended = false;
                this.audioSupported = true;
            }

            return true;
        } catch (e) {
            console.warn('Failed to initialize audio:', e.message);
            this.audioSupported = false;
            return false;
        }
    }

    /**
     * Resume audio context (call on user interaction)
     */
    resume() {
        if (!this.audioContext) {
            this.init();
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.audioContextSuspended = false;
                console.log('Audio context resumed successfully');
            }).catch(e => {
                console.warn('Failed to resume audio context:', e.message);
                this.audioSupported = false;
            });
        }
    }

    /**
     * Play sound using Web Audio API
     * @param {string} type - Sound type to play
     */
    playSound(type) {
        if (!this.audioSupported) return;
        if (!this.init()) return;

        this.resume();

        if (!this.audioContext || this.audioContext.state !== 'running') return;

        if (!this.audioContext.currentTime && this.audioContext.currentTime !== 0) {
            console.warn('Audio context not ready');
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const volumeGain = (SETTINGS && SETTINGS.volume !== undefined) ? SETTINGS.volume : 0.5;

        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
                break;
            case 'powerup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.2);
                oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.4 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'levelComplete':
                oscillator.type = 'square';
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.15);
                    gain.gain.setValueAtTime(0.2 * volumeGain, this.audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.15);
                    osc.start(this.audioContext.currentTime + i * 0.15);
                    osc.stop(this.audioContext.currentTime + i * 0.15 + 0.15);
                });
                break;
            case 'gameOver':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
            case 'combo':
                const comboNotes = [523, 659, 784, 1047, 1319];
                comboNotes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.15 * volumeGain, this.audioContext.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.1);
                    osc.start(this.audioContext.currentTime + i * 0.1);
                    osc.stop(this.audioContext.currentTime + i * 0.1 + 0.1);
                });
                break;
            case 'shield':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.4 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
            case 'enemyHit':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.5 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'dash':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.25 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'wallJump':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(450, this.audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.3 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
                break;
            case 'checkpoint':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(1100, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.25 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
            case 'groundPound':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.5 * volumeGain, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
        }
    }

    /**
     * Start background music
     */
    startBackgroundMusic() {
        if (this.isMusicPlaying) return;
        if (!this.audioSupported) return;
        if (!this.init()) return;

        this.resume();

        if (this.audioContext && this.audioContext.state === 'suspended') {
            return;
        }

        this.isMusicPlaying = true;

        const playNextNote = () => {
            if (!this.isMusicPlaying) return;

            const chordIndex = Math.floor(this.musicNoteIndex / 2) % this.chordProgression.length;
            const chord = this.chordProgression[chordIndex];

            chord.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);

                osc.type = 'sine';
                const noteDelay = i * 0.02;
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + noteDelay);
                gain.gain.setValueAtTime(0.08 * SETTINGS.volume, this.audioContext.currentTime + noteDelay);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + this.melodyDurations[this.musicNoteIndex]);

                osc.start(this.audioContext.currentTime + noteDelay);
                osc.stop(this.audioContext.currentTime + this.melodyDurations[this.musicNoteIndex] + noteDelay);
            });

            if (this.musicNoteIndex % 4 === 0) {
                const bassOsc = this.audioContext.createOscillator();
                const bassGain = this.audioContext.createGain();
                bassOsc.connect(bassGain);
                bassGain.connect(this.audioContext.destination);

                bassOsc.type = 'sine';
                const bassFreq = chord[0] / 2;
                bassOsc.frequency.setValueAtTime(bassFreq, this.audioContext.currentTime);
                bassGain.gain.setValueAtTime(0.05 * SETTINGS.volume, this.audioContext.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

                bassOsc.start(this.audioContext.currentTime);
                bassOsc.stop(this.audioContext.currentTime + 0.5);
            }

            this.musicNoteIndex = (this.musicNoteIndex + 1) % this.melody.length;
            this.musicInterval = setTimeout(playNextNote, this.melodyDurations[this.musicNoteIndex] * 1000);
        };

        playNextNote();
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Create singleton instance
export const audioManager = new AudioManager();

// Export convenience functions for backward compatibility
export function initAudio() {
    return audioManager.init();
}

export function resumeAudio() {
    audioManager.resume();
}

export function playSound(type) {
    audioManager.playSound(type);
}

export function startBackgroundMusic() {
    audioManager.startBackgroundMusic();
}

export function stopBackgroundMusic() {
    audioManager.stopBackgroundMusic();
}
