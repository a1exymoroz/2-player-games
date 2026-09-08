export const WIDTH = 900;
export const HEIGHT = 450;
/** Baseline ground height used by every level's terrain math. */
export const GROUND_Y = 380;

export const CHASSIS_WIDTH = 90;
export const CHASSIS_HEIGHT = 26;
export const WHEEL_RADIUS = 17;

/** Small chassis-center nudge on top of the wheel motor, so acceleration bites instantly. */
export const DRIVE_FORCE = 0.0014;
/** Ground-speed ceiling (px/step). The wheel motor targets this ÷ WHEEL_RADIUS as its spin. */
export const MAX_DRIVE_SPEED = 11;
/** How hard the wheel motor pulls each wheel toward its target spin per step (0-1): higher = snappier + grippier climbing, lower = more of a roll-up. */
export const WHEEL_MOTOR_RESPONSE = 0.05;

/** Angular impulse applied to the chassis each step while a direction is held, on top of the drive force — see update() for the wheel-lift/flip control. */
export const FLIP_TORQUE = 0.08;
/** Hard cap on angular velocity, enforced every step regardless of source (our torque or gravity once tipped past balance) — keeps every flip slow and controlled. */
export const MAX_ANGULAR_VELOCITY = 0.045;

export const HEAD_RADIUS = 13;
/** Vertical offset from chassis center to head center, when upright. */
export const HEAD_OFFSET = CHASSIS_HEIGHT / 2 + HEAD_RADIUS + 3;

export const OUTLINE_COLOR = '#1f2937';
export const OUTLINE_WIDTH = 3;

export const TERRAIN_THICKNESS = 40;
/** Sample spacing for curved (non-straight) terrain paths. */
export const TERRAIN_SEGMENT_LENGTH = 18;
export const LOOP_RADIUS = 130;
/** Physics thickness for a level's frameTrackPath — thin, to match the visible viewport outline it rides under. */
export const FRAME_TRACK_THICKNESS = OUTLINE_WIDTH + 10;

/** How long the round-result banner shows before the next round auto-loads. Space/button still skips it. */
export const ROUND_ADVANCE_DELAY_MS = 2000;

/** Starts below the visible canvas so the hazard isn't immediately in view. */
export const WATER_START_Y = HEIGHT + 60;
export const WATER_RISE_SPEED = 4; // pixels per second — tune this to adjust time pressure

/** Outer "device frame" color the pill-shaped viewport is clipped from. */
export const CHROME_COLOR = '#374151';
export const VIEWPORT_MARGIN = 22;
export const VIEWPORT_OUTLINE_WIDTH = 6;
