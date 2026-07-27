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
  /** Independent ground polylines — flat platforms, ramps, valley dips, loop arcs. */
  paths: Point[][];
  car1Start: Point;
  car2Start: Point;
  seesaw?: SeesawSpec;
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
  color: string;
  darkColor: string;
  stripeColor: string;
  headColor: string;
  label: string;
  leftKey: string;
  rightKey: string;
  leftHeld: boolean;
  rightHeld: boolean;
}
