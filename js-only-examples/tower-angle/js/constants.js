/* eslint no-magic-numbers: "off" */
export const HALF = 0.5;
export const TWO_DECIMAL_POINTS = 2;
export const THREE_QUARTERS = 0.75;
export const INVERT = -1;
export const OFF_SET_TOWER_POSITION = 0.35;
export const MAX_LENGTH_OF_PREVIOUS_LEVELS_ARRAY = 2;

// Timer
export const FEEDBACK_SCREEN_TIME = 60;
export const TRANSITION_SCREEN_TIME = 100;
export const FADING_TIMER_DIVIDER = 40;

// Power Bar
export const FULL_POWER_BAR_VALUE = 100;
export const DEFAULT_POWER_BAR_REDUCTION_SPEED = 0.2;
export const WRONG_POWER_BAR_REDUCTION_SPEED_INCREMENT = 0.4;

// Tower Dimensions
export const TOWER_HEIGHT = 350;
export const TOWER_WIDTH = 96;
export const TOWER_HEIGHT_PADDING = 25;
export const TOWER_HEIGHT_DRAWING_PADDING = 20;
export const TOWER_SCREEN_POSITION = 0.73;

// Feedback Padding
export const PERFECT_PADDING = 0.03;
export const RIGHT_PADDING = 0.1;

// Level Up Banner
export const LEVEL_UP_BANNER_SIZE = 125;
export const FONT_SIZE = 66;
export const FONT_SIZE_PADDING = 25;

// Swing Motion of Tower
export const SWING_VELOCITY = 0.001;
export const INCREASED_SWING_VELOCITY_SPEED_INCREMENT = 0.004;

export const ACCESSIBLE_ANGLES = setStartEndAccessibleAngles(0.25, -0.25); //enter floats between 0.0-2.0
export const CENTER_ANGLE =
  (ACCESSIBLE_ANGLES.END_ACCESSIBLE_ANGLE -
    ACCESSIBLE_ANGLES.START_ACCESSIBLE_ANGLE) *
    HALF +
  ACCESSIBLE_ANGLES.START_ACCESSIBLE_ANGLE;

function setStartEndAccessibleAngles(startAngle, endAngle) {
  const smalledAngle = Math.min(startAngle, endAngle);
  const biggestAngle = Math.max(startAngle, endAngle);

  return {
    START_ACCESSIBLE_ANGLE: Math.max(smalledAngle, -2),
    END_ACCESSIBLE_ANGLE: Math.min(biggestAngle, 2.0)
  };
}
