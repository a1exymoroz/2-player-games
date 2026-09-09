import Matter from 'matter-js';

export interface Point {
  x: number;
  y: number;
}

/** A dynamic plank pinned at `pivot`, tipping freely under the cars' weight. */
export interface SeesawSpec {
  pivot: Point;
  length: number;
  thickness: number;
}

export interface LevelDefinition {
  name: string;
  /** Independent ground polylines — flat platforms, ramps, valley dips, loop arcs. Always drawn (chrome/platform visuals) and built into physics at TERRAIN_THICKNESS. */
  paths: Point[][];
  car1Start: Point;
  car2Start: Point;
  seesaw?: SeesawSpec;
  /** Extra closed physics-only path with no visual of its own — used for tracks that reuse the viewport frame's own outline as their road (see FRAME_TRACK_THICKNESS). */
  frameTrackPath?: Point[];
  /** Thickness of whatever surface car1Start/car2Start actually rest on, for spawn-height math. Defaults to TERRAIN_THICKNESS; override with FRAME_TRACK_THICKNESS when cars start on frameTrackPath. */
  spawnSurfaceThickness?: number;
  /** Skip both the rounded-pill viewport clip and its outline stroke — for levels whose own terrain already reaches the canvas edges, where the frame would just double up the line. */
  hideViewportFrame?: boolean;
}

/** One point in a height-map curve: x as a fraction of canvas width, y in canvas pixels. */
export interface HeightKeyPoint {
  xFrac: number;
  y: number;
}

/** A single silhouette rectangle in the background skyline. */
export interface Building {
  x: number;
  w: number;
  h: number;
}

export interface PlayerCar {
  composite: Matter.Composite;
  chassis: Matter.Body;
  wheelA: Matter.Body;
  wheelB: Matter.Body;
  /** Sensor body standing in for the driver's head — see spawnCar() for why. */
  headBody: Matter.Body;
  /** +1 = faces +x (right), -1 = faces -x (left). Mirrors both the sprite and the drive/flip direction so "accelerate" always means "toward the opponent". */
  facingSign: 1 | -1;
  color: string;
  darkColor: string;
  stripeColor: string;
  headColor: string;
  label: string;
  leftKey: string;
  rightKey: string;
  leftHeld: boolean;
  rightHeld: boolean;
  /** Testing only (HIDE_SECOND_CAR): frozen, non-colliding, and skipped by the renderer. */
  hidden: boolean;
}
