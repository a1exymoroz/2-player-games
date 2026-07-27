# 2D Car Game — Staged Development Plan

## Game Concept
A 2D physics-based game with two cars on a track. A player loses if their car falls into water, or if the driver's head (visible in the car) touches the ground/an obstacle from a crash/flip. A player wins if their car bumps the other car's visible head. Rising water at the bottom adds time pressure.

Build and test each stage independently before moving to the next. Below is a copy-pasteable prompt for each stage.

---

## Stage 1 — Single car, flat road, keyboard drive
**Prompt:**
"Create a 2D game (HTML5 Canvas or simple JS game engine). One car on a flat, straight road. The camera/scene does not move — the car simply drives left and right within the visible area using arrow keys (Left = reverse/move left, Right = accelerate/move forward). Include basic acceleration and friction so movement feels natural, not instant. No physics engine needed yet — simple velocity/position math is fine."

**What to verify:**
- Left/Right keys move the car smoothly in both directions.
- Car doesn't move automatically when idle (except gradual friction stop).
- Scene stays static (no scrolling/camera movement).

---

## Stage 2 — Curved/hilly road with car rotation & flipping physics
**Prompt:**
"Extend the game from Stage 1: replace the flat road with a road that curves upward (like a ramp or hill). Add real 2D physics (use Matter.js or a similar lightweight physics engine) so the car's body rotates realistically based on the road surface angle, gravity, and momentum — including the ability to flip/roll over (rotate fully) if it goes too fast over a bump or off the ramp. The car should still be controlled with Left/Right (or Up/Down) for gas/reverse."

**What to verify:**
- Car follows the road's slope and rotates realistically.
- Car can flip/rotate a full 360° under the right conditions (speed + ramp).
- Physics feels stable (no jitter, no falling through the road).

---

## Stage 3 — Add second car, two-player controls
**Prompt:**
"Add a second car to the scene, positioned separately on the road. Assign separate keyboard controls: e.g., Player 1 uses Arrow keys, Player 2 uses A/D (or W/S). Both cars should have independent physics, movement, and rotation, and should be able to collide with each other realistically using the physics engine."

**What to verify:**
- Both cars respond independently to their own key sets.
- Cars can physically collide/bump into one another without glitching.
- No control cross-talk between the two players.

---

## Stage 4 — Head visible in car; losing condition (head hits ground)
**Prompt:**
"Add a visible 'head' element inside/on top of each car (a simple circle or sprite representing the driver's head). Detect when a car flips or crashes such that the head makes contact with the ground/road surface. When this happens, that player loses — show a 'Player X Loses' message and stop the game (or that car)."

**What to verify:**
- Head is visibly attached to the car and moves/rotates with it.
- Head-to-ground collision is correctly detected only in genuine crash/flip scenarios (not false positives on normal driving).
- Lose state triggers correctly and displays clearly.

---

## Stage 5 — Winning condition (car touches opponent's head)
**Prompt:**
"Add a winning condition: if one car's body physically touches/bumps the other car's exposed head (e.g., after that car has flipped and its head is exposed/vulnerable), the attacking player wins. Show a 'Player X Wins' message and stop the game."

**What to verify:**
- Win detection triggers only when a car makes contact with the opponent's head specifically (not just any car-to-car collision).
- Win and lose conditions don't conflict or trigger simultaneously in confusing ways.
- Game correctly ends and displays the result.

---

## Stage 6 — Rising water hazard
**Prompt:**
"Add a water zone at the bottom of the scene, represented as a rising blue rectangle/area. It should rise very slowly and continuously over time. If a car (or the head) touches/falls into the water, that player loses immediately, overriding other outcomes. Display a clear 'Player X Fell in Water' message."

**What to verify:**
- Water visibly and smoothly rises over time at a slow, tunable rate.
- Car-water collision correctly triggers a loss.
- Water rising speed is easy to adjust (expose as a variable/constant for tuning).

---

## Suggested Tech Stack
- **Rendering:** HTML5 Canvas (simple) or a lightweight framework like Phaser.
- **Physics:** Matter.js (2D physics with rotation, gravity, and collision detection built in) — recommended starting Stage 2.
- **No build tools needed:** a single HTML file with embedded JS is enough for prototyping each stage.

## General Workflow
1. Build the stage.
2. Test it in isolation against the checklist above.
3. Only then move to the next stage's prompt.
4. Keep each stage's code in a working, playable state before adding the next feature — this makes debugging much easier since you'll always know which stage introduced a bug.
