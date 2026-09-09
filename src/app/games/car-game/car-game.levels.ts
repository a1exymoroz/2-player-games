import {
  FRAME_TRACK_THICKNESS,
  GROUND_Y,
  HEIGHT,
  LOOP_RADIUS,
  TERRAIN_SEGMENT_LENGTH,
  TERRAIN_THICKNESS,
  VIEWPORT_MARGIN,
  WIDTH
} from './car-game.constants';
import { HeightKeyPoint, LevelDefinition, Point } from './car-game.types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function deg(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function sampleHeightMap(keyPoints: HeightKeyPoint[], xFrac: number): number {
  for (let i = 0; i < keyPoints.length - 1; i++) {
    const a = keyPoints[i];
    const b = keyPoints[i + 1];
    if (xFrac >= a.xFrac && xFrac <= b.xFrac) {
      const span = b.xFrac - a.xFrac;
      const t = span === 0 ? 0 : smoothstep((xFrac - a.xFrac) / span);
      return lerp(a.y, b.y, t);
    }
  }
  return keyPoints[keyPoints.length - 1].y;
}

/**
 * Samples a smooth curve through key elevation points, spanning only their
 * own x-range — this is what keeps disconnected platforms (e.g. Floating
 * Islands) from bleeding across the whole canvas width.
 */
function heightMapPath(keyPoints: HeightKeyPoint[]): Point[] {
  const points: Point[] = [];
  const startX = keyPoints[0].xFrac * WIDTH;
  const endX = keyPoints[keyPoints.length - 1].xFrac * WIDTH;

  for (let x = startX; x <= endX; x += TERRAIN_SEGMENT_LENGTH) {
    points.push({ x, y: sampleHeightMap(keyPoints, x / WIDTH) });
  }
  if (points[points.length - 1].x < endX - 0.01) {
    points.push({ x: endX, y: sampleHeightMap(keyPoints, endX / WIDTH) });
  }
  return points;
}

/**
 * A straight platform, given as fraction-of-width endpoints. Kept to exactly
 * 2 points (unlike heightMapPath) so the renderer can recognize it and draw
 * a clean pill/stadium shape instead of a sampled curve.
 */
function flat(xFrac1: number, xFrac2: number, y: number): Point[] {
  return [{ x: xFrac1 * WIDTH, y }, { x: xFrac2 * WIDTH, y }];
}

/** A circular arc/loop path. A full loop is startAngle .. startAngle + 2*PI. */
function arcPath(center: Point, radius: number, startAngle: number, endAngle: number, segments: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = lerp(startAngle, endAngle, i / segments);
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  return points;
}

/**
 * Two full vertical loops connected by flat ground, with a flat section
 * between them. Each loop is entered/exited at its bottom point (angle
 * PI/2, i.e. straight down from center), which is also where flat ground's
 * "upward-facing" surface direction matches the loop's inner surface — so
 * the transition is seamless with no explicit joining logic needed.
 */
function buildLoopLevelPaths(): Point[][] {
  const loop1Center: Point = { x: 260, y: GROUND_Y - LOOP_RADIUS };
  const loop2Center: Point = { x: WIDTH - 260, y: GROUND_Y - LOOP_RADIUS };
  const fullTurn = Math.PI / 2 + Math.PI * 2;

  return [
    flat(0, loop1Center.x / WIDTH, GROUND_Y),
    arcPath(loop1Center, LOOP_RADIUS, Math.PI / 2, fullTurn, 56),
    flat(loop1Center.x / WIDTH, loop2Center.x / WIDTH, GROUND_Y),
    arcPath(loop2Center, LOOP_RADIUS, Math.PI / 2, fullTurn, 56),
    flat(loop2Center.x / WIDTH, 1, GROUND_Y)
  ];
}

/**
 * A single closed stadium-shaped track tracing EXACTLY the same rounded-pill
 * geometry as the outer viewport frame (traceViewport() in the renderer) —
 * the frame's own outline is the visible road, so this is assigned as a
 * level's frameTrackPath (physics-only, never drawn) rather than a regular
 * path. Built as one continuous polyline (straights + both semicircles)
 * rather than separate flat/arc path entries, so it forms a single unbroken
 * ring — and, since the last point comes back around to equal the first,
 * buildSegments() closes the ring automatically with no separate joining
 * logic (same technique the full-circle loops in "Loop de Loop" already
 * rely on).
 */
const OVAL_CENTER_Y = HEIGHT / 2;
const OVAL_STRAIGHT_HALF = (WIDTH - HEIGHT) / 2;
const OVAL_RADIUS = (HEIGHT - 2 * VIEWPORT_MARGIN) / 2;
const OVAL_GROUND_Y = OVAL_CENTER_Y + OVAL_RADIUS;

function buildOvalTrackPath(): Point[] {
  const leftCenter: Point = { x: WIDTH / 2 - OVAL_STRAIGHT_HALF, y: OVAL_CENTER_Y };
  const rightCenter: Point = { x: WIDTH / 2 + OVAL_STRAIGHT_HALF, y: OVAL_CENTER_Y };
  const segments = 48;

  return [
    { x: leftCenter.x, y: OVAL_CENTER_Y - OVAL_RADIUS },
    { x: rightCenter.x, y: OVAL_CENTER_Y - OVAL_RADIUS },
    ...arcPath(rightCenter, OVAL_RADIUS, -Math.PI / 2, Math.PI / 2, segments).slice(1),
    { x: leftCenter.x, y: OVAL_CENTER_Y + OVAL_RADIUS },
    ...arcPath(leftCenter, OVAL_RADIUS, Math.PI / 2, (3 * Math.PI) / 2, segments).slice(1)
  ];
}

/**
 * Two large hook-shaped scoops near the left/right edges — deep ~245° arcs
 * (more than a semicircle, less than a full loop) that curl a car in from a
 * near-flat lip rather than closing into a full loop. Cars start at each
 * hook's true bottom point (angle PI/2 straight down from center), the one
 * spot on any circle where the surface tangent is horizontal — matching how
 * every other level's spawn point sits on flat ground, so spawnCar()'s
 * simple vertical offset still places the car flush on the surface. A flat
 * platform floats between the two hooks, out of either one's reach without
 * built-up speed.
 */
const HOOK_RADIUS = 180;
const HOOK_LEFT_CENTER: Point = { x: 170, y: 215 };
const HOOK_RIGHT_CENTER: Point = { x: WIDTH - 170, y: 215 };

function buildHookArenaPaths(): Point[][] {
  const segments = 56;
  return [
    arcPath(HOOK_LEFT_CENTER, HOOK_RADIUS, deg(25), deg(270), segments),
    arcPath(HOOK_RIGHT_CENTER, HOOK_RADIUS, deg(155), deg(-90), segments),
    flat(0.3, 0.7, 200)
  ];
}

export const LEVELS: LevelDefinition[] = [
  {
    name: 'Oval Track',
    paths: [],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH / 2 - 120, y: OVAL_GROUND_Y },
    car2Start: { x: WIDTH / 2 + 120, y: OVAL_GROUND_Y },
    spawnSurfaceThickness: FRAME_TRACK_THICKNESS
  },
  {
    name: 'Floating Islands',
    // Both islands sit at the SAME height and are mirror images about the
    // centre — so neither car gets extra time before the rising water reaches
    // it, and there's no higher ledge to unfairly flip-launch onto. The gap is
    // meant to be crossed with a running flip; that's the (now symmetric) duel.
    paths: [
      flat(0.20, 0.40, GROUND_Y - 130),
      flat(0.60, 0.80, GROUND_Y - 130)
    ],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH * 0.3, y: GROUND_Y - 140 },
    car2Start: { x: WIDTH * 0.7, y: GROUND_Y - 140 }
  },
  {
    name: 'See-Saw',
    paths: [],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH / 2 - 110, y: GROUND_Y - 160 },
    car2Start: { x: WIDTH / 2 + 110, y: GROUND_Y - 160 },
    seesaw: { pivot: { x: WIDTH / 2, y: GROUND_Y - 150 }, length: 340, thickness: TERRAIN_THICKNESS }
  },
  {
    name: 'Sky Hooks',
    paths: buildHookArenaPaths(),
    car1Start: { x: HOOK_LEFT_CENTER.x, y: HOOK_LEFT_CENTER.y + HOOK_RADIUS },
    car2Start: { x: HOOK_RIGHT_CENTER.x, y: HOOK_RIGHT_CENTER.y + HOOK_RADIUS },
    hideViewportFrame: true
  },
  {
    // One smooth curve, symmetric about centre: a crest each side (a local
    // maximum, so the tangent is horizontal and spawnCar sits the car flush),
    // a valley in the middle where the two roll down to shove each other.
    name: 'Rolling Hills',
    paths: [
      heightMapPath([
        { xFrac: 0.03, y: GROUND_Y - 10 },
        { xFrac: 0.2, y: GROUND_Y - 95 },
        { xFrac: 0.5, y: GROUND_Y + 15 },
        { xFrac: 0.8, y: GROUND_Y - 95 },
        { xFrac: 0.97, y: GROUND_Y - 10 }
      ])
    ],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH * 0.2, y: GROUND_Y - 95 },
    car2Start: { x: WIDTH * 0.8, y: GROUND_Y - 95 }
  },
  {
    // Both cars spawn nose-to-nose on a narrow raised platform (~216px for two
    // 90px cars). A lower ledge each side catches whoever gets shoved off —
    // or they sail past it into the rising water.
    name: 'Pedestal',
    paths: [
      flat(0.04, 0.3, GROUND_Y - 10),
      flat(0.38, 0.62, GROUND_Y - 150),
      flat(0.7, 0.96, GROUND_Y - 10)
    ],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH * 0.45, y: GROUND_Y - 150 },
    car2Start: { x: WIDTH * 0.55, y: GROUND_Y - 150 }
  },
  {
    // Two ramps rising toward the centre with a ~108px gap between the lips.
    // Flat run-ups give a clean spawn and room to build speed; cars launch off
    // the lip and collide mid-air over the gap. Land on your head and you lose;
    // otherwise you clear to the far ramp. The ramp polylines are 3 near-
    // collinear points so the renderer draws them as road, not a flat slab.
    name: 'Ramp Duel',
    paths: [
      flat(0.02, 0.16, GROUND_Y),
      [
        { x: WIDTH * 0.16, y: GROUND_Y },
        { x: WIDTH * 0.3, y: GROUND_Y - 70 },
        { x: WIDTH * 0.44, y: GROUND_Y - 135 }
      ],
      [
        { x: WIDTH * 0.56, y: GROUND_Y - 135 },
        { x: WIDTH * 0.7, y: GROUND_Y - 70 },
        { x: WIDTH * 0.84, y: GROUND_Y }
      ],
      flat(0.84, 0.98, GROUND_Y)
    ],
    frameTrackPath: buildOvalTrackPath(),
    car1Start: { x: WIDTH * 0.09, y: GROUND_Y },
    car2Start: { x: WIDTH * 0.91, y: GROUND_Y }
  }
];
