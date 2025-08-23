/**
 * A simple haptic feedback service using the navigator.vibrate API.
 */

/**
 * Checks if the Vibration API is supported by the browser.
 * @returns {boolean} True if vibration is supported, false otherwise.
 */
export const canVibrate = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Pre-defined vibration patterns for consistent haptic feedback across the app.
 */
export const VIBRATION_PATTERNS = {
  // A short, sharp vibration for success feedback
  CORRECT: 50,
  // A double vibration to indicate an error or incorrect action
  INCORRECT: [75, 50, 75],
  // A very brief vibration for metronome ticks
  TICK: 25,
  // A stuttering vibration to sync with screen shake animations
  SHAKE: [80, 40, 80, 40, 80],
  // A slow, rhythmic pulse to warn the user of low health
  LOW_HEALTH_PULSE: [200, 150, 200],
  // A single strong vibration for important confirmations
  CONFIRM: 100,
  // A sharp, jarring vibration for when a note is sacrificed
  SACRIFICE: [150, 50, 50],
};


/**
 * Plays a vibration pattern if the device supports it.
 * @param {number | number[]} pattern - A single duration in ms, or a pattern of vibration and pause durations.
 */
export const playVibration = (pattern: number | number[]): void => {
  if (canVibrate()) {
    try {
      // Some browsers require a fresh call to stop any ongoing vibration
      navigator.vibrate(0); 
      navigator.vibrate(pattern);
    } catch (e) {
      // Some browsers might throw an error if the pattern is too long or complex.
      // We can safely ignore this.
      console.warn("Vibration failed. This can happen if the pattern is complex or the browser restricts it.", e);
    }
  }
};
