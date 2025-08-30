# Changelog

All notable changes to this project will be documented in this file.
This project adheres to Keep a Changelog and Semantic Versioning (as practically feasible).

## [Unreleased]
### Added
- Lifecycle tests: rapid clicks guard (ensure single `calculate()` call, guard resets) and post-timeout interaction (guard false, operand click accepted).

### Testing
- All Jest suites green, including new lifecycle scenarios.

## [2025-08-30] Leaderboard persistence and player name robustness
### Added
- Local leaderboard persistence using `localStorage` under `birIslem:scores` with helpers `loadScores()`, `saveScore()`, `getTopScores(limit)`, capped to last 1000 records.
- Leaderboard UI rendering via `renderLeaderboard(limit)` and management via `clearScores()`; ARIA roles, tabindex and focus management for accessibility.
- Comprehensive Jest tests for leaderboard persistence, UI rendering, clearing, and evaluateRound integration.

### Changed
- Integrate leaderboard updates into `evaluateRound()`; score record optionally includes `playerName` from input.

### Fixed
- Player name persistence: reliably save to `localStorage` (`birIslem:playerName`) on `input`/`change` and delegated `change` capture; auto-restore after DOM rebuilds (tests) via idempotent init hook, MutationObserver, and a safe `getElementById` patch for `#playerName`.

## [2025-08-30] Lifecycle stabilization, keyboard fixes, test determinism
### Added
- `acceptButtonClicked()` shows interim feedback ("Değerlendiriliyor...") and defers `evaluateRound()` by ~20ms for observable state in tests and UX.
- `isStepping` guard added to `operandClicked()`; guarded logging via `dlog()`.

### Changed
- Keyboard: `N/n` now resets `solutionRevealed` and triggers `newClicked()` deterministically.
- `newClicked()` ensures timer/flags/UI reset (clears selections, hides hint area, rebinds buttons).
- Timer timeout explicitly clears guard and triggers evaluation through `globalThis.evaluateRound()` when present (for Jest spies).

### Fixed
- Removed duplicate `operatorClicked()` definition causing Babel/Jest parse error.
- Completed missing `solve(copyOfArray, copyOfSolution)` call in division branch.
- Prevent overlapping steps and flaky "Step is still running" by normalizing guard resets across flows (timeout/new game/exit paths).

### Testing
- Lifecycle tests now reliably pass under JSDOM.
- `npm run test:ci` runs Jest with `--runInBand` for stability.
