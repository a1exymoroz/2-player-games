import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import Matter from 'matter-js';

import {
  CHASSIS_HEIGHT,
  CHASSIS_WIDTH,
  DRIVE_FORCE,
  FLIP_TORQUE,
  HEAD_OFFSET,
  HEAD_RADIUS,
  HEIGHT,
  MAX_ANGULAR_VELOCITY,
  MAX_DRIVE_SPEED,
  ROUND_ADVANCE_DELAY_MS,
  WHEEL_MOTOR_RESPONSE,
  TERRAIN_THICKNESS,
  WATER_RISE_SPEED,
  WATER_START_Y,
  WHEEL_RADIUS,
  WIDTH,
  FRAME_TRACK_THICKNESS
} from './car-game.constants';
import { LEVELS } from './car-game.levels';
import { renderFrame } from './car-game.renderer';
import { LevelDefinition, PlayerCar, Point } from './car-game.types';

@Component({
  selector: 'app-car-game',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './car-game.component.html',
  styleUrl: './car-game.component.scss'
})
export class CarGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private engine!: Matter.Engine;
  private world!: Matter.World;
  private cars: PlayerCar[] = [];
  private seesawPlank: Matter.Body | null = null;

  // Maps a car's physics bodies back to the PlayerCar that owns them, so the
  // collision handler (which only ever sees raw Matter bodies) can look up
  // who's involved without stashing extra properties on the Matter body.
  private chassisOwners = new WeakMap<Matter.Body, PlayerCar>();
  private headOwners = new WeakMap<Matter.Body, PlayerCar>();
  private wheelOwners = new WeakMap<Matter.Body, PlayerCar>();

  private animationFrameId = 0;
  private waterY = WATER_START_Y;

  // Pending "load the next round" timer set by endGame() once a round is
  // decided — so play advances on its own after a short results pause. Cleared
  // by loadLevel() (which every replay/advance/new-match path runs through), so
  // a player who skips ahead with Space/button never double-advances.
  private roundAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  currentLevelIndex = 0;
  currentLevel: LevelDefinition = LEVELS[0];

  gameOverMessage: string | null = null;
  gameOverGradient: string | null = null;

  // A match is best-of-`totalRounds`, so winsToClinch is a strict majority —
  // this only guarantees an unambiguous, tie-free finish while totalRounds
  // stays odd.
  readonly totalRounds = 11;
  private readonly winsToClinch = Math.floor(this.totalRounds / 2) + 1;
  roundNumber = 1;

  private levelBag: number[] = [];
  private bagCursor = 0;

  // Reset to 0 at the start of every match by startNewMatch().
  player1Score = 0;
  player2Score = 0;

  get isMatchOver(): boolean {
    return this.player1Score >= this.winsToClinch || this.player2Score >= this.winsToClinch;
  }

  // Only the Fullscreen API can hide the browser's own tab/address bar —
  // no amount of CSS sizing reaches that chrome, which is the whole point
  // of this button on mobile.
  readonly fullscreenSupported = !!document.documentElement.requestFullscreen;
  isFullscreen = false;

  // iOS Safari has no Fullscreen API at all, so fullscreenSupported is
  // always false there — but launching from a Home Screen icon gets a
  // chrome-free view by a different route, which is what this steers
  // unsupported browsers toward instead. Suppressed once already installed
  // that way (both the iOS-specific flag and the standard PWA media query).
  readonly showInstallHint =
    !this.fullscreenSupported &&
    !(navigator as Navigator & { standalone?: boolean }).standalone &&
    !window.matchMedia('(display-mode: standalone)').matches;

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    if (!this.isFullscreen) {
      // Undo the lock from toggleFullscreen() so the phone can rotate freely
      // again once the player backs out of fullscreen — "locked until you go
      // back", not locked forever.
      this.unlockOrientation();
    }
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement
        .requestFullscreen()
        .then(() => this.lockLandscape())
        .catch(() => {});
    }
  }

  /**
   * Best-effort: the Orientation Lock API only exists on Chromium/Android
   * (never on Safari/iOS), and even there it requires an active fullscreen
   * element — hence chaining this off requestFullscreen()'s success rather
   * than calling it standalone. Where it's unsupported, the rotate-hint's
   * fallback instruction ("turn your device sideways") is what carries the
   * player through instead.
   */
  private lockLandscape(): void {
    (screen.orientation as ScreenOrientation & { lock?(orientation: string): Promise<void> })
      ?.lock?.('landscape')
      .catch(() => {});
  }

  private unlockOrientation(): void {
    (screen.orientation as ScreenOrientation & { unlock?(): void })?.unlock?.();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault();
      this.primaryAction();
      return;
    }
    for (const car of this.cars) {
      if (event.key === car.leftKey || event.code === car.leftKey) {
        car.leftHeld = true;
      } else if (event.key === car.rightKey || event.code === car.rightKey) {
        car.rightHeld = true;
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    for (const car of this.cars) {
      if (event.key === car.leftKey || event.code === car.leftKey) {
        car.leftHeld = false;
      } else if (event.key === car.rightKey || event.code === car.rightKey) {
        car.rightHeld = false;
      }
    }
  }

  /**
   * Drives the same leftHeld/rightHeld flags as the keyboard handlers, so the
   * on-screen touch buttons (shown on mobile) and physical keys are
   * interchangeable from update()'s point of view.
   */
  setControlHeld(carIndex: number, direction: 'left' | 'right', held: boolean, event?: Event): void {
    event?.preventDefault();
    const car = this.cars[carIndex];
    if (!car) {
      return;
    }
    if (direction === 'left') {
      car.leftHeld = held;
    } else {
      car.rightHeld = held;
    }
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.ctx = canvas.getContext('2d')!;

    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = 1.1;

    // Win/lose-by-crash is driven by real collisions rather than an
    // analytical "ground height at x" check, since that wouldn't generalize
    // to loops, disconnected platforms, or the moving see-saw. Registered
    // once — it survives World.clear() on every level change because the
    // engine itself is never recreated, only its contents.
    Matter.Events.on(this.engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        this.trackWheelContact(pair.bodyA, pair.bodyB, 1);
      }
      if (this.gameOverMessage) {
        return;
      }
      for (const pair of event.pairs) {
        if (this.resolveCollision(pair.bodyA, pair.bodyB) || this.resolveCollision(pair.bodyB, pair.bodyA)) {
          break;
        }
      }
    });

    // Wheel↔terrain contact count per car — a car is "grounded" while it's > 0.
    // Only used to decide when to apply the calm-driving angular-velocity clamp:
    // once airborne we stop fighting the car's spin so a flip actually launches
    // it far enough to land back on a platform.
    Matter.Events.on(this.engine, 'collisionEnd', (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        this.trackWheelContact(pair.bodyA, pair.bodyB, -1);
      }
    });

    this.startNewMatch();
    this.loop();

    // Lets the global Tech Stack FAB (declared outside this component, in
    // AppComponent) hide itself only while this full-screen mobile layout is
    // active — see app.component.scss's :host-context rule.
    document.body.classList.add('car-duel-active');
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.clearRoundAdvanceTimer();
    if (this.engine) {
      Matter.World.clear(this.world, false);
      Matter.Engine.clear(this.engine);
    }
    document.body.classList.remove('car-duel-active');
  }

  /**
   * The single entry point bound to Space and both reset/next buttons — what
   * it does depends entirely on the current round/match state, since all
   * three actions (replay this round, advance to the next round, start a
   * fresh match) share the same input.
   */
  primaryAction(): void {
    if (!this.gameOverMessage) {
      this.resetCurrentRound();
    } else if (this.isMatchOver) {
      this.startNewMatch();
    } else {
      this.advanceRound();
    }
  }

  private resetCurrentRound(): void {
    this.loadLevel(this.currentLevelIndex);
  }

  private clearRoundAdvanceTimer(): void {
    if (this.roundAdvanceTimer !== null) {
      clearTimeout(this.roundAdvanceTimer);
      this.roundAdvanceTimer = null;
    }
  }

  private advanceRound(): void {
    this.roundNumber++;
    this.loadLevel(this.nextLevelIndex());
  }

  private startNewMatch(): void {
    this.player1Score = 0;
    this.player2Score = 0;
    this.roundNumber = 1;
    this.levelBag = [];
    this.bagCursor = 0;
    this.loadLevel(this.nextLevelIndex());
  }

  /**
   * Draws from a shuffled bag of every level index, reshuffling once
   * exhausted — so no level repeats before every other level has appeared,
   * while still scaling automatically to however many levels LEVELS holds.
   */
  private nextLevelIndex(): number {
    if (this.bagCursor >= this.levelBag.length) {
      this.levelBag = this.buildShuffledBag();
      this.bagCursor = 0;
    }
    return this.levelBag[this.bagCursor++];
  }

  private buildShuffledBag(): number[] {
    const bag = LEVELS.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  /**
   * Tears down every body in the world and rebuilds terrain + cars from
   * scratch for the given level — simpler and safer than diffing the
   * previous level's bodies out individually.
   */
  private loadLevel(index: number): void {
    this.clearRoundAdvanceTimer();
    this.currentLevelIndex = index;
    this.currentLevel = LEVELS[index];

    Matter.World.clear(this.world, false);
    this.seesawPlank = null;

    const terrainBodies: Matter.Body[] = [];
    for (const path of this.currentLevel.paths) {
      terrainBodies.push(...this.buildSegments(path, TERRAIN_THICKNESS));
    }
    if (this.currentLevel.frameTrackPath) {
      terrainBodies.push(...this.buildSegments(this.currentLevel.frameTrackPath, FRAME_TRACK_THICKNESS));
    }
    Matter.Composite.add(this.world, terrainBodies);

    if (this.currentLevel.seesaw) {
      const { pivot, length, thickness } = this.currentLevel.seesaw;
      // A real dynamic body pinned at one point (not a static ramp), so it
      // tips under the cars' weight like an actual see-saw.
      this.seesawPlank = Matter.Bodies.rectangle(pivot.x, pivot.y, length, thickness, {
        friction: 1,
        density: 0.001,
        label: 'terrain'
      });
      const pin = Matter.Constraint.create({
        pointA: pivot,
        bodyB: this.seesawPlank,
        stiffness: 1,
        length: 0
      });
      Matter.Composite.add(this.world, [this.seesawPlank, pin]);
    }

    const spawnThickness = this.currentLevel.spawnSurfaceThickness ?? TERRAIN_THICKNESS;
    // Keys are passed as (reverseKey, accelerateKey): accelerate always drives
    // the car toward its opponent. Player 2 faces left, so its natural "toward
    // the enemy" key is A and its "back away" key is D — hence the swapped order.
    this.cars = [
      this.spawnCar(this.currentLevel.car1Start, spawnThickness, 1, '#ef4444', '#b91c1c', '#fbbf24', '#fb923c', 'Player 1', 'ArrowLeft', 'ArrowRight'),
      this.spawnCar(this.currentLevel.car2Start, spawnThickness, -1, '#3b82f6', '#1d4ed8', '#fbbf24', '#93c5fd', 'Player 2', 'KeyD', 'KeyA')
    ];

    this.waterY = WATER_START_Y;
    this.gameOverMessage = null;
    this.gameOverGradient = null;
  }

  /**
   * Converts a polyline into a chain of static rectangle bodies, one per
   * segment, each rotated to match the local tangent and CENTERED on the
   * path (not offset "down" from it). Centering is what lets this same
   * builder produce flat ground, ramps, valley dips, and full vertical loops
   * uniformly — a "below the line" offset only makes sense while the path
   * stays roughly horizontal.
   */
  private buildSegments(points: Point[], thickness: number): Matter.Body[] {
    const bodies: Matter.Body[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      bodies.push(
        Matter.Bodies.rectangle(midX, midY, length + 2, thickness, {
          isStatic: true,
          angle,
          friction: 1,
          label: 'terrain',
          render: { visible: false }
        })
      );
    }
    return bodies;
  }

  /**
   * Builds a car as chassis + 2 wheels (Matter's built-in car factory) plus a
   * third body: a sensor circle standing in for the driver's head, rigidly
   * pinned above the chassis. Making the head a real physics body — rather
   * than a position computed from chassis angle each frame — is what lets
   * `collisionStart` detect ground/opponent contact correctly on ANY terrain
   * shape, including loops and the moving see-saw, where "ground height at
   * this x" doesn't even make sense.
   */
  private spawnCar(
    start: Point,
    thickness: number,
    facingSign: 1 | -1,
    color: string,
    darkColor: string,
    stripeColor: string,
    headColor: string,
    label: string,
    leftKey: string,
    rightKey: string
  ): PlayerCar {
    const startY = start.y - thickness / 2 - WHEEL_RADIUS - CHASSIS_HEIGHT / 2 - 4;

    const composite = Matter.Composites.car(start.x, startY, CHASSIS_WIDTH, CHASSIS_HEIGHT, WHEEL_RADIUS);
    const [chassis, wheelA, wheelB] = composite.bodies;
    chassis.label = 'chassis';
    chassis.friction = 0.05;
    wheelA.friction = 0.95;
    wheelB.friction = 0.95;

    const headBody = Matter.Bodies.circle(start.x, startY - HEAD_OFFSET, HEAD_RADIUS, {
      isSensor: true,
      label: 'head',
      // Same collision group as this car's chassis/wheels, so the head never
      // registers a "collision" against its own car.
      collisionFilter: { group: chassis.collisionFilter.group }
    });
    const headPin = Matter.Constraint.create({
      bodyA: headBody,
      bodyB: chassis,
      pointB: { x: 0, y: -HEAD_OFFSET },
      stiffness: 1,
      length: 0
    });
    Matter.Composite.add(composite, [headBody, headPin]);

    Matter.Composite.add(this.world, composite);

    const car: PlayerCar = {
      composite,
      chassis,
      wheelA,
      wheelB,
      headBody,
      facingSign,
      color,
      darkColor,
      stripeColor,
      headColor,
      label,
      leftKey,
      rightKey,
      leftHeld: false,
      rightHeld: false,
      groundContacts: 0
    };

    this.chassisOwners.set(chassis, car);
    this.headOwners.set(headBody, car);
    this.wheelOwners.set(wheelA, car);
    this.wheelOwners.set(wheelB, car);

    return car;
  }

  /**
   * head+terrain => that car loses; head+opponent's chassis => opponent wins.
   * A defender's head can only physically reach an opponent's chassis once
   * the car has tipped/flipped enough for the head to drop to chassis
   * height, so a real flip is required naturally — no separate "is the head
   * exposed" angle check needed.
   */
  private resolveCollision(a: Matter.Body, b: Matter.Body): boolean {
    if (a.label === 'head' && b.label === 'terrain') {
      const car = this.headOwners.get(a);
      if (car) {
        this.endGame(`💥 ${car.label} Loses`, this.otherCar(car));
        return true;
      }
    }

    if (a.label === 'head' && b.label === 'chassis') {
      const defender = this.headOwners.get(a);
      const attacker = this.chassisOwners.get(b);
      if (defender && attacker && defender !== attacker) {
        this.endGame(`🏆 ${attacker.label} Wins!`, attacker);
        return true;
      }
    }

    return false;
  }

  private otherCar(car: PlayerCar): PlayerCar {
    return this.cars.find(c => c !== car)!;
  }

  /** Keeps each car's wheel↔terrain contact tally current from collisionStart/End. */
  private trackWheelContact(a: Matter.Body, b: Matter.Body, delta: number): void {
    const carA = this.wheelOwners.get(a);
    if (carA && b.label === 'terrain') {
      carA.groundContacts = Math.max(0, carA.groundContacts + delta);
    }
    const carB = this.wheelOwners.get(b);
    if (carB && a.label === 'terrain') {
      carB.groundContacts = Math.max(0, carB.groundContacts + delta);
    }
  }

  private loop = (): void => {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    if (this.gameOverMessage) {
      return;
    }

    // Propulsion is a motor on the WHEELS (spin them, let friction carry the
    // car along whatever surface it's on — flat ground, a ramp, the curved
    // walls, a full loop) plus a slow wheel-lift torque on the CHASSIS on top:
    // holding "accelerate" long enough still rolls the car into a full flip.
    // `along` folds together which key is held (+1 accelerate / -1 reverse)
    // and which way the car faces (`facingSign`), so "accelerate" always
    // drives toward the opponent.
    for (const car of this.cars) {
      const fwd = car.facingSign;
      const along = car.rightHeld ? fwd : car.leftHeld ? -fwd : 0;
      if (along !== 0) {
        // Ease each wheel toward the motor's target spin rather than snapping,
        // so there's a short acceleration ramp and the wheels can still be
        // back-driven (skid) by a hard landing or a shove.
        const targetSpin = along * (MAX_DRIVE_SPEED / WHEEL_RADIUS);
        for (const wheel of [car.wheelA, car.wheelB]) {
          const spin = wheel.angularVelocity + (targetSpin - wheel.angularVelocity) * WHEEL_MOTOR_RESPONSE;
          Matter.Body.setAngularVelocity(wheel, spin);
        }
        // Also nudge the chassis forward a little so acceleration feels
        // immediate even before the wheels bite.
        const hx = Math.cos(car.chassis.angle);
        const hy = Math.sin(car.chassis.angle);
        Matter.Body.applyForce(car.chassis, car.chassis.position, {
          x: along * DRIVE_FORCE * hx,
          y: along * DRIVE_FORCE * hy
        });
      }
      if (car.rightHeld) {
        if (fwd * car.chassis.angularVelocity > -MAX_ANGULAR_VELOCITY) {
          car.chassis.torque -= fwd * FLIP_TORQUE;
        }
      } else if (car.leftHeld) {
        if (fwd * car.chassis.angularVelocity < MAX_ANGULAR_VELOCITY) {
          car.chassis.torque += fwd * FLIP_TORQUE;
        }
      }
    }

    Matter.Engine.update(this.engine, 1000 / 60);

    // Once a car tips past its balance point, gravity keeps rotating it on
    // its own — our torque above no longer has anything to do with the
    // resulting speed. Clamping the actual post-step angularVelocity (not
    // just gating whether we add more torque) is what keeps every flip, however
    // it started, rolling over at the same slow, controlled pace.
    //
    // ...but only while the car is on the ground. In the air we let the spin
    // run free, so a wheel that catches an edge can genuinely launch the car
    // into a jump — that's the intended way to hop between (or back onto) the
    // floating platforms. The clamp re-engages the moment it lands.
    for (const car of this.cars) {
      if (car.groundContacts === 0) {
        continue;
      }
      if (car.chassis.angularVelocity > MAX_ANGULAR_VELOCITY) {
        Matter.Body.setAngularVelocity(car.chassis, MAX_ANGULAR_VELOCITY);
      } else if (car.chassis.angularVelocity < -MAX_ANGULAR_VELOCITY) {
        Matter.Body.setAngularVelocity(car.chassis, -MAX_ANGULAR_VELOCITY);
      }
    }

    // A collision during the step above may already have ended the game —
    // don't let the water/off-map checks below override that this frame.
    if (this.gameOverMessage) {
      return;
    }

    this.waterY -= WATER_RISE_SPEED / 60;

    // Water overrides every other outcome, so it's checked before anything else.
    for (const car of this.cars) {
      const submergedDepth = Math.max(
        car.chassis.position.y + CHASSIS_HEIGHT / 2,
        car.wheelA.position.y + WHEEL_RADIUS,
        car.wheelB.position.y + WHEEL_RADIUS,
        car.headBody.position.y + HEAD_RADIUS
      );
      if (submergedDepth >= this.waterY) {
        this.endGame(`💦 ${car.label} Fell in Water`, this.otherCar(car));
        return;
      }
    }

    // Safety net: a car that flies far off the level (e.g. off a see-saw
    // with nothing below it yet) gets a silent reset rather than falling forever.
    if (this.cars.some(car => car.chassis.position.y > HEIGHT + 250)) {
      this.resetCurrentRound();
    }
  }

  private endGame(message: string, winner: PlayerCar): void {
    this.gameOverGradient = `linear-gradient(135deg, ${winner.color} 0%, ${winner.darkColor} 100%)`;
    if (winner === this.cars[0]) {
      this.player1Score++;
    } else {
      this.player2Score++;
    }

    if (this.isMatchOver) {
      const winnerScore = winner === this.cars[0] ? this.player1Score : this.player2Score;
      const loserScore = winner === this.cars[0] ? this.player2Score : this.player1Score;
      this.gameOverMessage = `🏆 ${winner.label} Wins the Match ${winnerScore}-${loserScore}!`;
    } else {
      this.gameOverMessage = message;
      // Hold the result on screen briefly, then roll into the next round on
      // our own — no click needed. loadLevel() clears this timer, so a player
      // who hits Space/the button during the pause just advances early.
      this.roundAdvanceTimer = setTimeout(() => {
        this.roundAdvanceTimer = null;
        this.advanceRound();
      }, ROUND_ADVANCE_DELAY_MS);
    }
  }

  private draw(): void {
    renderFrame(this.ctx, {
      currentLevel: this.currentLevel,
      cars: this.cars,
      seesawPlank: this.seesawPlank,
      waterY: this.waterY
    });
  }
}
