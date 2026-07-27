import { GROUND_Y, LOOP_RADIUS, TERRAIN_SEGMENT_LENGTH, TERRAIN_THICKNESS, WIDTH } from './car-game.constants';
import { HeightKeyPoint, LevelDefinition, Point } from './car-game.types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

export const LEVELS: LevelDefinition[] = [
  {
    name: 'Flat Ground',
    paths: [flat(0, 1, GROUND_Y)],
    car1Start: { x: 120, y: GROUND_Y },
    car2Start: { x: WIDTH - 120, y: GROUND_Y }
  },
  {
    name: 'Floating Islands',
    paths: [
      flat(0.04, 0.34, GROUND_Y - 30),
      flat(0.62, 0.96, GROUND_Y - 140)
    ],
    car1Start: { x: WIDTH * 0.1, y: GROUND_Y - 30 },
    car2Start: { x: WIDTH * 0.9, y: GROUND_Y - 140 }
  },
  {
    name: 'Valley',
    paths: [heightMapPath([
      { xFrac: 0, y: GROUND_Y - 90 },
      { xFrac: 0.5, y: GROUND_Y + 60 },
      { xFrac: 1, y: GROUND_Y - 90 }
    ])],
    car1Start: { x: 90, y: GROUND_Y - 90 },
    car2Start: { x: WIDTH - 90, y: GROUND_Y - 90 }
  },
  {
    name: 'Loop de Loop',
    paths: buildLoopLevelPaths(),
    car1Start: { x: 60, y: GROUND_Y },
    car2Start: { x: WIDTH - 60, y: GROUND_Y }
  },
  {
    name: 'See-Saw',
    paths: [],
    car1Start: { x: WIDTH / 2 - 110, y: GROUND_Y - 60 },
    car2Start: { x: WIDTH / 2 + 110, y: GROUND_Y - 60 },
    seesaw: { pivot: { x: WIDTH / 2, y: GROUND_Y - 40 }, length: 340, thickness: TERRAIN_THICKNESS }
  }
];
