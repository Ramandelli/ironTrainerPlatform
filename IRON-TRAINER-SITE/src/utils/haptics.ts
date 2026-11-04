/**
 * Haptic feedback utilities for workout micro-interactions
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [50, 30, 100],
  warning: [30, 20, 30],
  error: [100, 50, 100, 50, 100]
};

/**
 * Trigger haptic feedback if available
 */
export const triggerHaptic = (type: HapticType = 'medium'): void => {
  if (!navigator.vibrate) return;
  
  const pattern = HAPTIC_PATTERNS[type];
  navigator.vibrate(pattern);
};

/**
 * Trigger haptic for completing a set
 */
export const hapticSetComplete = (): void => {
  triggerHaptic('medium');
};

/**
 * Trigger haptic for completing an exercise
 */
export const hapticExerciseComplete = (): void => {
  triggerHaptic('success');
};

/**
 * Trigger haptic for skipping
 */
export const hapticSkip = (): void => {
  triggerHaptic('light');
};

/**
 * Trigger haptic for workout completion
 */
export const hapticWorkoutComplete = (): void => {
  triggerHaptic('success');
};

/**
 * Trigger haptic for timer end
 */
export const hapticTimerEnd = (): void => {
  triggerHaptic('heavy');
};
