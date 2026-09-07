# Circuit keyboard drawing

The previous implementation summed held cardinal keys and chose the closest immediate OSM edge. Overlapping key presses became an unintended diagonal; minor edge tangents and dense intersections could change the selected branch. Repeated keydown events also needed to be distinguished from a new directional intention.

## Design basis

- [Norm Nazaroff, Dealing With Designer Input Latency](https://www.gamedeveloper.com/design/opinion-dealing-with-designer-input-latency): react promptly, preserve an early input with a short buffer where appropriate, and avoid long invisible buffers that later produce surprising actions.
- [MDN: KeyboardEvent.repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat): held keys generate repeat events. Repeated presses do not represent a new steering decision.
- [Xbox Accessibility Guideline 107: Input](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107): avoid unnecessarily demanding control interactions. Both arrow keys and WASD remain available; no chord is required for a turn. This is not a claim of full remapping/accessibility conformance.

## Applied rules

Newest distinct held direction wins. Existing held-key repeats cannot steal priority. A turn entered before its junction can retain the previous road for at most 600 ms and 65 screen pixels while the new direction remains held. A small chevron shows requested direction; amber means pending. Releasing all keys stops immediately and clears the buffer. There is no auto-driving avatar or trailing movement queue.

Selection looks through degree-two road bends (up to 28 screen pixels / 120 m), but not through a junction. Holding a direction favors continuity and the current named road (or original OSM way), so gentle bends do not require repeated corrections. A fresh direction takes priority over this assistance. Close forks use continuity plus a weak local Euclidean endpoint-progress tie-break; this is not an optimal-route search and does not steer through future junctions. Explicit reverse retraces and erases. Dead ends stop with feedback. A single held-key stroke is one Undo operation. Browser modifier shortcuts are ignored by game movement.

Keyboard drawing ramps from 70 toward 170 screen pixels/second over a 90 ms response constant, easing toward 110 at junctions. These are initial tuning choices, not research-prescribed universal values. Direct tap/trace drawing is not rate-limited by this keyboard repeat cadence. Four-direction steering cannot resolve every skewed OSM junction; tapping remains available.

Tests cover WASD and arrows, newest-key priority, repeat handling, release/pause, early-turn acceptance, expired turns, real junction connectivity, fork tie-breaking, same-road bends, reversal and grouped undo. Physical desktop/mobile feel still benefits from user testing.

Finished player routes retain the Classic palette and animated dash-dot identity but use a 4.2-pixel optical base instead of the live path's 9 pixels, with smaller dashes and subdued glow. A* stays on short dashes in the owning player's fixed color.
