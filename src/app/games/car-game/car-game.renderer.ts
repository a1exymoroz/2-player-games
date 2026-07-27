import Matter from 'matter-js';

import {
  CHASSIS_HEIGHT,
  CHASSIS_WIDTH,
  CHROME_COLOR,
  HEAD_OFFSET,
  HEAD_RADIUS,
  HEIGHT,
  OUTLINE_COLOR,
  OUTLINE_WIDTH,
  TERRAIN_THICKNESS,
  VIEWPORT_MARGIN,
  VIEWPORT_OUTLINE_WIDTH,
  WHEEL_RADIUS,
  WIDTH
} from './car-game.constants';
import { Building, LevelDefinition, PlayerCar, Point } from './car-game.types';

export interface RenderState {
  currentLevel: LevelDefinition;
  cars: PlayerCar[];
  seesawPlank: Matter.Body | null;
  waterY: number;
}

/**
 * Deterministic (not Math.random) so the skyline layout is stable across
 * renders — heights vary via a fixed sine pattern instead.
 */
function buildSkyline(): Building[] {
  const buildings: Building[] = [];
  let x = -20;
  let i = 0;
  while (x < WIDTH + 20) {
    const w = 55 + ((i * 37) % 55);
    const h = 110 + Math.abs(Math.sin(i * 1.7)) * 170;
    buildings.push({ x, w, h });
    x += w + 10;
    i++;
  }
  return buildings;
}

const SKYLINE = buildSkyline();

/** The rounded "pill" every level is clipped into — the capsule device frame from the reference art. */
function traceViewport(ctx: CanvasRenderingContext2D): void {
  const m = VIEWPORT_MARGIN;
  ctx.beginPath();
  ctx.roundRect(m, m, WIDTH - m * 2, HEIGHT - m * 2, (HEIGHT - m * 2) / 2);
}

function drawSkyline(ctx: CanvasRenderingContext2D): void {
  const baseline = HEIGHT * 0.62;
  for (const b of SKYLINE) {
    ctx.fillStyle = '#b39cc4';
    ctx.fillRect(b.x, baseline - b.h, b.w, b.h + HEIGHT);

    ctx.fillStyle = 'rgba(255, 244, 230, 0.35)';
    for (let wy = baseline - b.h + 16; wy < baseline - 16; wy += 24) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 18) {
        ctx.fillRect(wx, wy, 8, 12);
      }
    }
  }
}

/**
 * A straight floating platform, drawn as a plain flat slab (small corner
 * radius, no pill/capsule ends) so it reads as a standalone ledge rather
 * than a cut of continuous road.
 */
function drawFlatPlatform(ctx: CanvasRenderingContext2D, p1: Point, p2: Point): void {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.roundRect(-length / 2, -TERRAIN_THICKNESS / 2, length, TERRAIN_THICKNESS, 8);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.stroke();
  ctx.restore();
}

/**
 * Curved terrain (loop arcs, valley dips) can't be a single pill shape, so
 * it's stroked instead: a wide black stroke underneath a slightly narrower
 * chrome-colored stroke gives the same outlined look on any curve.
 */
function drawCurvedPath(ctx: CanvasRenderingContext2D, path: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.lineWidth = TERRAIN_THICKNESS + OUTLINE_WIDTH * 2;
  ctx.strokeStyle = '#000000';
  ctx.stroke();
  ctx.lineWidth = TERRAIN_THICKNESS;
  ctx.strokeStyle = CHROME_COLOR;
  ctx.stroke();
}

function drawSeesaw(ctx: CanvasRenderingContext2D, plank: Matter.Body, spec: NonNullable<LevelDefinition['seesaw']>): void {
  // Static fulcrum triangle under the pivot point.
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.beginPath();
  ctx.moveTo(spec.pivot.x - 18, spec.pivot.y + 46);
  ctx.lineTo(spec.pivot.x + 18, spec.pivot.y + 46);
  ctx.lineTo(spec.pivot.x, spec.pivot.y);
  ctx.closePath();
  ctx.fill();

  // The plank itself is dynamic, so it's drawn at its live physics position/angle.
  ctx.save();
  ctx.translate(plank.position.x, plank.position.y);
  ctx.rotate(plank.angle);
  ctx.beginPath();
  ctx.roundRect(-spec.length / 2, -spec.thickness / 2, spec.length, spec.thickness, 8);
  ctx.fillStyle = '#92400e';
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.stroke();
  ctx.restore();
}

function drawTerrain(ctx: CanvasRenderingContext2D, state: RenderState): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const path of state.currentLevel.paths) {
    if (path.length < 2) {
      continue;
    }
    if (path.length === 2) {
      drawFlatPlatform(ctx, path[0], path[1]);
    } else {
      drawCurvedPath(ctx, path);
    }
  }

  if (state.seesawPlank && state.currentLevel.seesaw) {
    drawSeesaw(ctx, state.seesawPlank, state.currentLevel.seesaw);
  }
}

/**
 * The functional rising-water hazard (not the decorative chrome wave) —
 * drawn last and unclipped, on top of the viewport outline and chrome frame,
 * so it visibly climbs over everything as `waterY` decreases each frame.
 */
function drawWater(ctx: CanvasRenderingContext2D, waterY: number): void {
  if (waterY >= HEIGHT) {
    return;
  }

  const y = Math.max(0, waterY);
  const waveLength = 36;

  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= WIDTH; x += waveLength) {
    ctx.quadraticCurveTo(x + waveLength / 2, y - 8, x + waveLength, y);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = 'rgba(37, 99, 235, 0.6)';
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** Body, stripe, and faceless head — all drawn in the chassis's rotated local frame so they tilt/flip together. */
function drawCarBody(ctx: CanvasRenderingContext2D, car: PlayerCar): void {
  ctx.save();
  ctx.translate(car.chassis.position.x, car.chassis.position.y);
  ctx.rotate(car.chassis.angle);

  const w = CHASSIS_WIDTH;
  const h = CHASSIS_HEIGHT;
  const r = 10;

  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  ctx.lineTo(w / 2, h / 2 - r);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  ctx.lineTo(-w / 2, -h / 2 + r);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  ctx.closePath();
  ctx.fillStyle = car.color;
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.stroke();

  const stripeH = h * 0.32;
  const stripeInset = 10;
  ctx.beginPath();
  ctx.roundRect(-w / 2 + stripeInset, -stripeH / 2, w - stripeInset * 2, stripeH, stripeH / 2);
  ctx.fillStyle = car.stripeColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -HEAD_OFFSET, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = car.headColor;
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH - 1;
  ctx.stroke();

  // Nose bump — the only facial feature, toward the car's front.
  ctx.beginPath();
  ctx.arc(HEAD_RADIUS * 0.75, -HEAD_OFFSET + HEAD_RADIUS * 0.15, HEAD_RADIUS * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fill();

  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, wheel: Matter.Body, color: string): void {
  ctx.save();
  ctx.translate(wheel.position.x, wheel.position.y);
  ctx.rotate(wheel.angle);

  ctx.beginPath();
  ctx.arc(0, 0, WHEEL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fill();
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, WHEEL_RADIUS * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Spin indicator, rotating with the wheel's own physics angle.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(WHEEL_RADIUS * 0.5, 0);
  ctx.stroke();

  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, car: PlayerCar): void {
  drawCarBody(ctx, car);
  drawWheel(ctx, car.wheelA, car.color);
  drawWheel(ctx, car.wheelB, car.color);
}

/**
 * Single entry point, called once per frame from the component. Draws, in
 * order: outer chrome -> clipped viewport (sky, skyline, terrain, cars) ->
 * viewport outline -> rising water on top, unclipped.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, state: RenderState): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = CHROME_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const clipToFrame = !state.currentLevel.hideViewportFrame;
  if (clipToFrame) {
    ctx.save();
    traceViewport(ctx);
    ctx.clip();
  }

  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#fbd3c8');
  sky.addColorStop(1, '#fcebd0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawSkyline(ctx);
  drawTerrain(ctx, state);

  for (const car of state.cars) {
    drawCar(ctx, car);
  }

  if (clipToFrame) {
    ctx.restore();
  }

  if (!state.currentLevel.hideViewportFrame) {
    traceViewport(ctx);
    ctx.lineWidth = VIEWPORT_OUTLINE_WIDTH;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }

  drawWater(ctx, state.waterY);
}
