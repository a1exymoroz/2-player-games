export const WIDTH = 900;
export const HEIGHT = 450;
/** Baseline ground height used by every level's terrain math. */
export const GROUND_Y = 380;

export const CHASSIS_WIDTH = 90;
export const CHASSIS_HEIGHT = 26;
export const WHEEL_RADIUS = 17;

// ───────────────────────────────────────────────────────────────────────────
// GAMEPLAY FEEL — the knobs to play with. Just edit a value and reload the page.
// ───────────────────────────────────────────────────────────────────────────

/**
 * GLOBAL SLOW-MOTION for the whole physics sim (Matter's `engine.timing.timeScale`).
 * Below 1 = everything plays out slower — driving, falling, flips, jumps — but
 * every ratio between them is preserved, so a car still climbs the same walls
 * and clears the same gaps, just more gracefully. Reach for THIS when the action
 * feels too fast; lowering MAX_DRIVE_SPEED instead saps the momentum cars need
 * to climb.  1 = real time · 0.8 = barely slowed · 0.5 = proper slow-mo.
 */
export const SIM_TIME_SCALE = 0.6;

// ── SPEED ──────────────────────────────────────────────────────────────────
/** Top ground speed, px/step. The wheel motor targets this ÷ WHEEL_RADIUS as its spin. */
export const MAX_DRIVE_SPEED = 12;
/** Acceleration: how hard the wheel motor pulls each wheel toward target spin per step (0-1). Higher = snappier + grippier climbing, lower = a gentle roll-up. */
export const WHEEL_MOTOR_RESPONSE = 0.06;
/** Tiny chassis-center nudge on top of the wheel motor, so a standing start bites immediately. */
export const DRIVE_FORCE = 0.0014;

// ── ROTATION / FLIPS ───────────────────────────────────────────────────────
/** How hard "accelerate"/"reverse" also rotates the chassis each step (the wheel-lift that becomes a flip). Higher = tips over sooner. */
export const FLIP_TORQUE = 0.05;
/** Hard cap on how fast the chassis can spin, ground or air. Lower = slower, more controlled flips (and less pinwheeling off a jump). */
export const MAX_ANGULAR_VELOCITY = 0.08;

// ── FALLING ────────────────────────────────────────────────────────────────
/** Per-step drag applied to DOWNWARD velocity only, so drops float down gently without changing jump height, driving, or upward launches. 0 = normal gravity fall · 0.04 = gently floaty · 0.12 = moon-ish. */
export const FALL_SLOWING = 0.05;

// ── RISING-WATER HAZARD ────────────────────────────────────────────────────
/** Master switch for the rising water. false = no water at all. */
export const WATER_ENABLED = true;
/** Rise rate in px/sec once enabled — tune this for time pressure. */
export const WATER_RISE_SPEED = 4;
/** Starts below the visible canvas so the hazard isn't immediately in view. */
export const WATER_START_Y = HEIGHT + 60;

// ── ROUNDS ─────────────────────────────────────────────────────────────────
/** How long the round-result banner shows before the next round auto-loads. Space/button still skips it. */
export const ROUND_ADVANCE_DELAY_MS = 2000;

// ── TESTING ────────────────────────────────────────────────────────────────
/** true = Player 2 is frozen at spawn, collides with nothing, and isn't drawn — so you can test-drive Player 1 alone. Set back to false for real play. */
export const HIDE_SECOND_CAR = false;

// ───────────────────────────────────────────────────────────────────────────

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

/** Outer "device frame" color the pill-shaped viewport is clipped from. */
export const CHROME_COLOR = '#374151';
export const VIEWPORT_MARGIN = 22;
export const VIEWPORT_OUTLINE_WIDTH = 6;
