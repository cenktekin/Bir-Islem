/**
 * @jest-environment jsdom
 */

const path = require('path');

function setupDOM() {
  document.body.innerHTML = `
    <div id="target"></div>
    <div id="timer"></div>
    <div id="solutionArea"></div>
    <input id="playerName" />
    <button id="acceptButton"></button>
    <button id="new"></button>
    <button id="undo"></button>
    <button id="showSolution"></button>
    <button id="hintButton"></button>
    <button id="addition">+</button>
    <button id="subtraction">-</button>
    <button id="multiplication">*</button>
    <button id="division">/</button>
    <div id="leaderboardArea"></div>
    <button id="showScores"></button>
    <button id="clearScores"></button>
    <div id="stepsList"></div>
    <div id="hintArea"></div>
    <div id="hintContent"></div>
    <button id="number1"></button>
    <button id="number2"></button>
    <button id="number3"></button>
    <button id="number4"></button>
    <button id="number5"></button>
    <button id="number6"></button>
  `;
}

function installDummySolver() {
  global.Solver = {
    solve: () => ({ steps: [], closest: null, diff: null })
  };
}

describe('Leaderboard persistence and UI', () => {
  let scriptPath;
  beforeEach(() => {
    // fresh DOM and script
    setupDOM();
    installDummySolver();
    scriptPath = path.join(__dirname, '..', 'js', 'bir_islem.js');
    delete require.cache[require.resolve(scriptPath)];
    require(scriptPath);
    // ensure storage is clean per test
    localStorage.removeItem('birIslem:scores');
    localStorage.removeItem('birIslem:playerName');
  });

  test('saveScore/loadScores/getTopScores: saves, sorts, caps at 1000', () => {
    expect(global.birIslem).toBeDefined();

    // Create 1100 fake records with ascending scores
    const now = Date.now();
    for (let i = 0; i < 1100; i++) {
      global.saveScore({ ts: now + i, score: i, target: 100, userValue: 100, userDiff: 0, steps: [], stepsCount: 1, timeLeft: 10 });
    }

    // loadScores returns array (but not exposed). We can infer via getTopScores
    const top10 = global.getTopScores(10);
    expect(top10.length).toBe(10);
    // sorted desc by score
    const scores = top10.map(r => r.score);
    const sorted = [...scores].sort((a,b)=>b-a);
    expect(scores).toEqual(sorted);

    // Cap at last 1000 entries overall in storage
    const allTop = global.getTopScores(2000);
    expect(allTop.length).toBe(1000);
    // Highest score should be 1099 (even after cap we kept last 1000, which includes highest)
    expect(allTop[0].score).toBe(1099);
  });

  test('renderLeaderboard: empty state renders message and focuses region', () => {
    const area = document.getElementById('leaderboardArea');
    expect(area).toBeTruthy();

    global.renderLeaderboard(10);
    expect(area.innerHTML).toMatch(/Henüz skor yok/);
    // ARIA/focus
    expect(area.getAttribute('role')).toBe('region');
    expect(area.getAttribute('aria-label')).toBe('Liderlik Tablosu');
    // focus() effect in jsdom: document.activeElement becomes area (jsdom sets body usually; we can simulate)
    // We at least confirm tabindex is set
    expect(area.getAttribute('tabindex')).toBe('-1');
  });

  test('renderLeaderboard: filled state renders table rows', () => {
    // Save two scores
    global.saveScore({ ts: Date.now(), score: 10, target: 100, userValue: 95, userDiff: 5, steps: [], stepsCount: 1, timeLeft: 12 });
    global.saveScore({ ts: Date.now(), score: 50, target: 200, userValue: 200, userDiff: 0, steps: [], stepsCount: 2, timeLeft: 30, playerName: 'Ada' });

    global.renderLeaderboard(10);
    const area = document.getElementById('leaderboardArea');
    expect(area.innerHTML).toMatch(/<table/);
    // two rows in tbody
    const rows = area.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    // highest score first
    expect(rows[0].innerHTML).toMatch(/50/);
    expect(rows[0].innerHTML).toMatch(/Ada/);
  });

  test('clearScores: removes storage and updates/focuses UI', () => {
    // seed one score and render first to ensure non-empty
    global.saveScore({ ts: Date.now(), score: 30, target: 123, userValue: 120, userDiff: 3, steps: [], stepsCount: 1, timeLeft: 5 });
    global.renderLeaderboard(10);

    global.clearScores();
    const area = document.getElementById('leaderboardArea');
    expect(area.innerHTML).toMatch(/Henüz skor yok/);
    expect(localStorage.getItem('birIslem:scores')).toBeNull();
    expect(area.getAttribute('role')).toBe('region');
    expect(area.getAttribute('aria-label')).toBe('Liderlik Tablosu');
  });

  test('evaluateRound persists positive score with optional playerName and updates leaderboard', () => {
    // Prepare a simple state that yields positive score
    const nameInput = document.getElementById('playerName');
    nameInput.value = 'Lin';

    // Make allowedNumbers and target for a decent base
    birIslem.initialNumbers = [1,2,3,4,5,6];
    birIslem.allowedNumbers = [98];
    birIslem.target = 100;
    birIslem.steps = [{ l: 3, op: '+', r: 95, res: 98 }];
    birIslem.timeLeft = 60;
    birIslem.solutionRevealed = false;

    const res = global.evaluateRound();
    expect(res.score).toBeGreaterThan(0);

    const raw = localStorage.getItem('birIslem:scores');
    expect(raw).not.toBeNull();
    const list = JSON.parse(raw);
    expect(list.length).toBeGreaterThan(0);
    const last = list[list.length - 1];
    expect(last.playerName).toBe('Lin');

    // Rendered leaderboard should show at least one row
    global.renderLeaderboard(10);
    const area = document.getElementById('leaderboardArea');
    expect(area.innerHTML).toMatch(/<table/);
  });

  test('player name persistence: input change stores birIslem:playerName', () => {
    const input = document.getElementById('playerName');
    input.value = 'Zed';
    input.dispatchEvent(new Event('change'));
    expect(localStorage.getItem('birIslem:playerName')).toBe('Zed');

    // Reload script and ensure initial value restored
    setupDOM();
    installDummySolver();
    require(scriptPath);
    const input2 = document.getElementById('playerName');
    expect(input2.value).toBe('Zed');
  });
});
