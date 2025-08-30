/**
 * @jest-environment jsdom
 */

// Lifecycle and guard behavior tests for Bir İşlem UI script

const path = require('path');

// Minimal DOM setup helper
function setupMinimalDOM() {
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
    <button id="addition"></button>
    <button id="subtraction"></button>
    <button id="multiplication"></button>
    <button id="division"></button>
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

// Provide a minimal Solver to avoid heavy computation
function installDummySolver() {
  global.Solver = {
    solve: (arr, target) => ({ steps: [], closest: null, diff: null })
  };
}

describe('Bir Islem lifecycle', () => {
  beforeEach(() => {
    setupMinimalDOM();
    installDummySolver();
    // Load the script under test after DOM exists
    const scriptPath = path.join(__dirname, '..', 'js', 'bir_islem.js');
    delete require.cache[require.resolve(scriptPath)];
    require(scriptPath);
  });

  test('rapid clicks: calculate is invoked only once; guard resets after completion', () => {
    // Arrange numbers and operator
    const n1 = document.getElementById('number1');
    const n2 = document.getElementById('number2');
    const addBtn = document.getElementById('addition');
    n1.textContent = '3'; n1.disabled = false;
    n2.textContent = '4'; n2.disabled = false;
    addBtn.textContent = '+';

    // Spy on calculate
    const calcSpy = jest.spyOn(global, 'calculate');

    // Act: simulate a fast sequence twice
    global.operandClicked.call(n1, { preventDefault(){} });
    global.operatorClicked(addBtn);
    global.operandClicked.call(n2, { preventDefault(){} });
    // Attempt to trigger again immediately (should be ignored due to guard)
    global.operandClicked.call(n1, { preventDefault(){} });
    global.operatorClicked(addBtn);
    global.operandClicked.call(n2, { preventDefault(){} });

    // Assert: calculate called once, guard reset
    expect(calcSpy).toHaveBeenCalledTimes(1);
    expect(birIslem.isStepping).toBe(false);

    calcSpy.mockRestore();
  });

  test('after timer timeout, subsequent operand click is accepted (guard false)', (done) => {
    // Arrange: make sure guard may flip during timeout
    birIslem.isStepping = true;
    birIslem.initialNumbers = [1,2,3,4,5,6];
    birIslem.allowedNumbers = [1,2,3,4,5,6];
    birIslem.target = 999;
    birIslem.steps = [];

    // Act: start short timer
    global.startRoundTimer(1);

    setTimeout(() => {
      try {
        // Guard should be false now
        expect(birIslem.isStepping).toBe(false);
        const n1 = document.getElementById('number1');
        n1.textContent = '7'; n1.disabled = false;
        global.operandClicked.call(n1, { preventDefault(){} });
        expect(birIslem.clickedLeftOperand).toBe(n1);
        done();
      } catch (e) {
        done(e);
      } finally {
        try { global.stopRoundTimer(); } catch(_){}
      }
    }, 1200);
  });

  test('keyboard: S triggers solution reveal (solutionRevealed true, accept disabled)', () => {
    // Arrange
    const acceptBtn = document.getElementById('acceptButton');
    if (acceptBtn) acceptBtn.disabled = false;
    birIslem.solutionRevealed = false;

    // Act: dispatch keydown 'S'
    const evt = new KeyboardEvent('keydown', { key: 'S' });
    document.dispatchEvent(evt);

    // Assert
    expect(birIslem.solutionRevealed).toBe(true);
    expect(acceptBtn.disabled).toBe(true);
  });

  test('keyboard: N starts a new game and clears reveal flag', () => {
    // Arrange: set reveal flag true, then press N
    birIslem.solutionRevealed = true;
    const evt = new KeyboardEvent('keydown', { key: 'N' });
    document.dispatchEvent(evt);
    // Assert: new game should reset reveal flag
    expect(birIslem.solutionRevealed).toBe(false);
  });

  test('keyboard: Enter triggers evaluation feedback in solutionArea', () => {
    const solEl = document.getElementById('solutionArea');
    solEl.textContent = '';
    const evt = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(evt);
    expect(solEl.innerHTML || solEl.textContent).toMatch(/Değerlendiriliyor/);
  });

  test('leaderboard: 0-step and solution reveal do not persist scores', () => {
    // Arrange
    // Clean storage
    localStorage.removeItem('birIslem:scores');

    // Case 1: zero steps
    birIslem.steps = [];
    birIslem.solutionRevealed = false;
    evaluateRound();
    expect(localStorage.getItem('birIslem:scores')).toBeNull();

    // Case 2: solution revealed
    birIslem.steps = [{ l: 2, op: '+', r: 3, res: 5 }];
    birIslem.solutionRevealed = true;
    evaluateRound();
    expect(localStorage.getItem('birIslem:scores')).toBeNull();

    // And localStorage remains empty
    expect(localStorage.getItem('birIslem:scores')).toBeNull();
  });

  test('new game resets guard and UI selections', () => {
    // Arrange: set some state
    birIslem.isStepping = true;
    birIslem.currentOperator = '+';
    birIslem.clickedLeftOperand = document.getElementById('number1');
    birIslem.currentLeftOperand = '7';

    // Act
    global.newClicked();

    // Assert: guard cleared and selections reset
    expect(birIslem.isStepping).toBe(false);
    expect(birIslem.currentOperator).toBeNull();
    expect(birIslem.clickedLeftOperand).toBeNull();
    expect(birIslem.currentLeftOperand).toBeNull();
    // Hint area hidden
    const hintArea = document.getElementById('hintArea');
    expect(hintArea && hintArea.style.display).toBe('none');
  });
  test('solution reveal disables scoring', () => {
    // Arrange
    expect(global.birIslem).toBeDefined();
    // Set a simple state with at least 1 step to avoid zero-step zero-score rule dominating
    birIslem.initialNumbers = [1,2,3,4,5,6];
    birIslem.allowedNumbers = [10];
    birIslem.target = 100;
    birIslem.steps = [{ l: 5, op: '+', r: 5, res: 10 }];
    birIslem.timeLeft = 60;
    birIslem.solutionRevealed = true;

    // Act
    const res = global.evaluateRound();

    // Assert
    expect(res).toBeDefined();
    expect(res.score).toBe(0);
  });

  test('timer timeout clears guard and triggers evaluation without crashing', (done) => {
    // Arrange
    birIslem.initialNumbers = [1,2,3,4,5,6];
    birIslem.allowedNumbers = [1,2,3,4,5,6];
    birIslem.target = 999;
    birIslem.steps = []; // zero-step path

    // Spy on evaluateRound to confirm call
    const evalSpy = jest.spyOn(global, 'evaluateRound');

    // Act: start a very short timer
    global.startRoundTimer(1);

    setTimeout(() => {
      try {
        // Assert: timer should have stopped, guard should be false, evaluateRound called
        expect(birIslem.timer).toBeNull();
        expect(birIslem.isStepping).toBe(false);
        expect(evalSpy).toHaveBeenCalled();
        done();
      } catch (e) {
        done(e);
      } finally {
        try { global.stopRoundTimer(); } catch(_){}
        evalSpy.mockRestore();
      }
    }, 1200);
  });

  test('overlapping steps: clicks ignored when isStepping=true', () => {
    // Arrange
    const n1 = document.getElementById('number1');
    n1.textContent = '3';
    n1.disabled = false;
    const n2 = document.getElementById('number2');
    n2.textContent = '5';
    n2.disabled = false;
    const addBtn = document.getElementById('addition');
    addBtn.textContent = '+';
    birIslem.isStepping = true;

    // Act: attempt to select operand and operator while stepping
    global.operandClicked.call(n1, { preventDefault(){} });
    global.operatorClicked(addBtn);

    // Assert: no selection should be made
    expect(birIslem.clickedLeftOperand).toBeNull();
    expect(birIslem.currentLeftOperand).toBeNull();
    expect(birIslem.currentOperator).toBeNull();
  });

  test('undo is ignored while isStepping=true and does not mutate state', () => {
    // Arrange: set some transient state
    birIslem.currentOperator = '+';
    birIslem.currentLeftOperand = '8';
    birIslem.clickedLeftOperand = null;
    const prevOp = birIslem.currentOperator;
    const prevLeft = birIslem.currentLeftOperand;
    birIslem.isStepping = true;

    // Act
    global.undo();

    // Assert: state unchanged
    expect(birIslem.currentOperator).toBe(prevOp);
    expect(birIslem.currentLeftOperand).toBe(prevLeft);
  });
});
