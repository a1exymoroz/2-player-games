export const WIDTH = 900;
export const HEIGHT = 450;
/** Baseline ground height used by every level's terrain math. */
export const GROUND_Y = 380;

export const CHASSIS_WIDTH = 90;
export const CHASSIS_HEIGHT = 26;
export const WHEEL_RADIUS = 17;

/** Force applied directly to the chassis center of mass, moving the car. */
export const DRIVE_FORCE = 0.003;
export const MAX_DRIVE_SPEED = 20;

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

/** Starts below the visible canvas so the hazard isn't immediately in view. */
export const WATER_START_Y = HEIGHT + 60;
export const WATER_RISE_SPEED = 4; // pixels per second — tune this to adjust time pressure

/** Outer "device frame" color the pill-shaped viewport is clipped from. */
export const CHROME_COLOR = '#374151';
export const VIEWPORT_MARGIN = 22;
export const VIEWPORT_OUTLINE_WIDTH = 6;
