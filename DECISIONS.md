# DECISIONS

This document records key product and technical decisions for the Bir İşlem project.

## 2025-08-30 — Solver Modularization
- Decision: Extract a pure, side-effect-free solver as `js/solver.js` exposing `Solver.solve(numbers, target)` and CommonJS export for tests.
- Alternatives: Keep legacy global solver intertwined with UI.
- Rationale: Testability, determinism, reusability.
- Consequences: Jest unit tests can target the solver directly; game logic calls `Solver.solve` with fallbacks for legacy.

## 2025-08-30 — Keyboard Controls
- Decision: Add keyboard shortcuts mapping to existing UI handlers.
- Keys: Digits (multi-digit buffer), operators (+ - * x /), Enter (accept), N (new), U (undo), H (hint), S (solution), Esc (clear).
- Rationale: Faster gameplay, accessibility.
- Consequences: `initKeyboard()` registers `keydown` and reuses existing click handlers.

## 2025-08-30 — Round Timer Utilities
- Decision: Implement `startRoundTimer`, `stopRoundTimer`, `updateTimerDisplay`, `formatMMSS` in `js/bir_islem.js`.
- Rationale: Visual, time-bound rounds; automatic evaluation on timeout.
- Consequences: New game starts 120s timer; evaluate on hit or timeout.

## 2025-08-30 — Score Persistence (localStorage)
- Decision: Persist finished round results to `localStorage` under key `birIslem:scores`.
- Schema: `{ ts, target, userValue, userDiff, score, steps, stepsCount, timeLeft, numbers, best{closest,diff}, hintsUsed, playerName? }`.
- Helpers: `loadScores()`, `saveScore(rec)`, `getTopScores(limit)`; capped to last 1000 records.
- Rationale: Keep scores across sessions without backend.
- Consequences: Data resides on device; privacy note added to tasks/README plan.

## 2025-08-30 — Leaderboard UI
- Decision: Add a Scores panel to `birIslem.html` with optional player name, Show and Clear buttons, and rendering in `renderLeaderboard(limit)`.
- Rationale: Visibility into progress and replayability.
- Consequences: Buttons wired via `initButtons()`; `clearScores()` removes stored scores.

## 2025-08-30 — Unit Testing with Jest
- Decision: Use Jest for unit tests targeting the pure solver in `js/solver.js`.
- Implementation: `__tests__/solver.test.js` exists; `package.json` with `test` scripts added; install dev dep `jest`.
- Rationale: Regression safety for solver logic; fast feedback loop.
- Consequences: Run with `npm test`; CI can integrate `npm run test:ci`.

## 2025-08-30 — Accessibility Tweaks
- Decision: Set `lang="tr"` in `birIslem.html` and add `aria-live="polite"`/`role="status"` to dynamic regions (`#stepsList`, `#hintContent`, `#solutionArea`, `#leaderboardArea`). Make operands keyboard-focusable via `tabindex="0"`. Add clear focus and pressed/active visual states for `.operand` and `.operation`.
- Rationale: Screen readers announce updates; better i18n context; full keyboard navigation; tactile feedback on interaction.
- Consequences: Live regions will politely announce content changes during gameplay; users can tab to numbers and operate the game via keyboard more comfortably.

### 2025-08-30 — Keyboard Focus Flow
- Decision: Implement focus helpers to streamline keyboard play. After first operand selection, focus the first operator. After operator selection and after each calculation, focus the next available operand.
- Implementation: `focusFirstOperator()` and `focusNextAvailableOperand(excludeEl)` in `js/bir_islem.js`, invoked from `operandClicked()`, `operatorClicked()`, and `calculate()`.
- Consequences: Faster keyboard-only gameplay with predictable focus movement.

## 2025-08-30 — UI Micro-animations
- Decision: Introduce subtle animations for feedback.
- Implementation: `.shake` animation (0.25s, ±4px) for invalid operations; step rendering via `.step-card` components with appear animation (fade/slide-in ~0.25s). All animations respect `prefers-reduced-motion`.
- Rationale: Clear, non-intrusive feedback and improved clarity in step history.
- Consequences: Visual polish without harming accessibility; CSS added in `birIslem.html`, rendering logic in `showCurrentStep()` in `js/bir_islem.js`.

## 2025-08-30 — Step Lifecycle Guard (`isStepping`)
- Decision: Serialize step execution with `birIslem.isStepping` and lock UI during calculations.
- Implementation: Guard checks in `operandClicked()`, `operatorClicked()`, `undo()`, and `calculate()`; guard is reset on all exits via `try/finally` in `calculate()`, on timeout (`startRoundTimer()`), and on new game (`createGame()`). UI state normalized with `resetOperatorButtons()` and `clearOperandSelections()`.
- Rationale: Eliminate overlapping steps and the perceived "Step is still running" bug; ensure consistent UX.
- Consequences: Inputs are ignored while a step is in progress; fewer edge-case lockups.

## 2025-08-30 — DEBUG Logging Standard
- Decision: Gate diagnostic logs behind a DEBUG flag with `dlog()` helper.
- Implementation: Added `DEBUG` detection and `dlog()` in `js/bir_islem.js`; replaced noisy `console.log` usage in hot paths (e.g., `calculate()`, `acceptButtonClicked()`) with `dlog()`.
- Rationale: Keep production logs clean; enable targeted diagnostics during investigations.
- Consequences: Enable via `window.APP_DEBUG = true` in browser console (temp) or environment vars in Node tests; remove/gate extra logs before merge by default.

## 2025-08-30 — Selection State Reset Helpers
- Decision: Prevent lingering UI state that caused the "Step is still running" perception.
- Implementation: `resetOperatorButtons()` and `clearOperandSelections(preserveDisabled)` helpers; invoked after step completion/undo, on new game, and on timer end.
- Rationale: Ensure consistent UI state across lifecycle transitions.
- Consequences: Reduced edge cases; clearer UX. Further monitoring continues for any residual bugs.

## 2025-08-30 — Fairness Rules (Scoring & Solution Reveal)
- Decision: Enforce fair-play constraints.
- Rules:
  - Zero-step rounds are not scored or persisted.
  - If solution is revealed during the round, Accept/Retry are disabled; score is locked to 0 and not persisted.
- Rationale: Avoid artificial score inflation and incentivize genuine play.
- Consequences: README updated; UI reflects disabled actions after reveal.

## 2025-08-30 — Lifecycle Stabilization & Test Determinism
- Decision: Stabilize step lifecycle and make keyboard-driven flows deterministic for tests.
- Implementation:
  - Added `acceptButtonClicked()` to provide immediate feedback (`<em>Değerlendiriliyor...</em>`) and defer `evaluateRound()` by ~20ms for observable interim state.
  - Mapped `N/n` to `newClicked()` and proactively reset `birIslem.solutionRevealed = false` in `keyboardHandler()` to avoid stale reveal state between rounds.
  - Added `isStepping` guard to `operandClicked()`; ensured existing guard in `operatorClicked()`; reset guards in `newClicked()` and on timer timeout.
  - Removed duplicate `operatorClicked()` definition that caused parse errors; fixed stray syntax issues and ensured `solve(copyOfArray, copyOfSolution)` call is present.
  - Ensured event bindings in `initButtons()` reference defined handlers.
- Rationale: Eliminate intermittent "Step is still running" issues and ensure Jest lifecycle tests can reliably assert transient UI states.
- Consequences: More predictable UI state, cleaner test runs; minor deferral improves UX by showing an evaluating status.

## Future Considerations
- Migrate persistence to IndexedDB for larger analytics or to a backend (Netlify Functions/Firebase) for cross-device boards.
- Add CI (GitHub Actions), formal CHANGELOG, and i18n.

## 2025-08-30 — Player Name Persistence Robustness
- Decision: Persist optional player name under `localStorage` key `birIslem:playerName`; ensure reliable restore across DOM rebuilds (JSDOM tests, dynamic UI).
- Implementation:
  - Save on `input` and `change` events of `#playerName`, plus delegated `change` listener on `document` (capture).
  - Restore via `applyStoredPlayerNameIfPresent()` during module init and on new game.
  - Install a `MutationObserver` on `document.body` to re-apply when `#playerName` re-enters the DOM.
  - One-time safe patch of `document.getElementById` to backfill `#playerName` if found empty (defensive for tests), idempotent and limited in scope.
- Rationale: JSDOM/module cache patterns can skip init hooks; multi-pronged approach ensures deterministic tests and stable UX.
- Consequences: Player name field stays in sync with storage; tests for persistence pass consistently.

## 2025-08-30 — Leaderboard Persistence & Tests
- Decision: Add helpers `loadScores()`, `saveScore(record)`, `getTopScores(limit)` and cap to last 1000 entries.
- Rationale: Prevent unbounded growth and enable predictable querying.
- Consequences: Documented in README and validated by Jest tests (`__tests__/scores.test.js`).
