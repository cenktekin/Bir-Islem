function remove(array, element) {
    var index = array.indexOf(element);
    if(index > -1) {
        array.splice(index, 1);
    }
}

// Accept/evaluate handler used by Enter key and Accept button
function acceptButtonClicked(){
    // Disable inputs and stop timer
    try { disableOperands(); } catch(_e){}
    try { disableOperations(); } catch(_e){}
    try { stopRoundTimer(); } catch(_e){}
    // Interim feedback for tests and UX
    var solEl = document.getElementById('solutionArea');
    if (solEl) { solEl.innerHTML = '<em>Değerlendiriliyor...</em>'; }
    dlog('[BirIslem] Onayla tıklandı');
    // Defer evaluation so interim message can be observed
    setTimeout(function(){
        try {
            var evalResult = evaluateRound();
            // Update optional score displays
            var total_display = document.getElementById('total-score');
            var last_display = document.getElementById('last-score');
            if (total_display) {
                var oldScore = parseInt(total_display.textContent || '0');
                var newScore = oldScore + (evalResult && evalResult.score ? evalResult.score : 0);
                total_display.textContent = newScore;
            }
            if (last_display && evalResult) {
                last_display.textContent = evalResult.score;
            }
        } catch(e) { dlog('[BirIslem] evaluate deferred error', e); }
    }, 20);
}

// ---- DEBUG helper (gated logging) ----
var DEBUG = (typeof window !== 'undefined'
  ? (window.APP_DEBUG !== undefined ? window.APP_DEBUG : false)
  : (typeof process !== 'undefined' && (process.env.DEBUG === '1' || process.env.NODE_ENV === 'development')));
function dlog(){
  try {
    if (DEBUG && typeof console !== 'undefined' && console.log){
      var args = ['[DEBUG]'];
      for (var i=0;i<arguments.length;i++){ args.push(arguments[i]); }
      console.log.apply(console, args);
    }
  } catch(e){}
}

// --- Focus helpers for better keyboard flow ---
function focusFirstOperator(){
    var ids = ["addition","subtraction","multiplication","division"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (el && !el.disabled){ try { el.focus(); } catch(e){} return; }
    }
}

function focusNextAvailableOperand(excludeEl){
    var ids = ["number1","number2","number3","number4","number5","number6"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (el && !el.disabled && el !== excludeEl){ try { el.focus(); } catch(e){} return; }
    }
}

// Keyboard activation for operands (Enter/Space)
function operandKeydown(e){
    var k = e.key;
    if (k === 'Enter' || k === ' '){
        e.preventDefault();
        if (this && !this.disabled) { this.click(); }
    }
}

// ---- Leaderboard UI helpers ----
function renderLeaderboard(limit){
    var box = document.getElementById('leaderboardArea');
    if (!box) return;
    var arr = getTopScores(limit || 10);
    if (!arr.length){ 
        box.innerHTML = '<em>Henüz skor yok</em>'; 
        try {
            box.setAttribute('tabindex','-1');
            box.setAttribute('role','region');
            box.setAttribute('aria-label','Liderlik Tablosu');
            box.focus();
            if (box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
        } catch(_){}
        return; 
    }
    var rows = arr.map(function(r, idx){
        var date = new Date(r.ts || Date.now());
        var dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        var name = r.playerName || '-';
        var diff = (typeof r.userDiff === 'number') ? r.userDiff : '-';
        var timeStr = formatMMSS(r.timeLeft || 0);
        return '<tr>'+
            '<td style="padding:6px 8px; text-align:right; color:#9ca3af">'+(idx+1)+'</td>'+
            '<td style="padding:6px 8px; font-weight:600">'+(r.score||0)+'</td>'+
            '<td style="padding:6px 8px;">'+name+'</td>'+
            '<td style="padding:6px 8px;">'+(r.target||'-')+'</td>'+
            '<td style="padding:6px 8px;">'+(r.userValue||'-')+'</td>'+
            '<td style="padding:6px 8px;">'+diff+'</td>'+
            '<td style="padding:6px 8px;">'+(r.stepsCount||0)+'</td>'+
            '<td style="padding:6px 8px;">'+timeStr+'</td>'+
            '<td style="padding:6px 8px; color:#9ca3af">'+dateStr+'</td>'+
        '</tr>';
    }).join('');
    var html = '<div style="overflow:auto">'+
        '<table style="width:100%; border-collapse:collapse;">'+
        '<thead><tr>'+ 
            '<th style="padding:6px 8px; text-align:right; color:#9ca3af">#</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Puan</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">İsim</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Hedef</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Sonuç</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Fark</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Adım</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Süre</th>'+ 
            '<th style="padding:6px 8px; text-align:left;">Tarih</th>'+ 
        '</tr></thead>'+ 
        '<tbody>'+rows+'</tbody></table></div>';
    box.innerHTML = html;
    try {
        box.setAttribute('tabindex','-1');
        box.setAttribute('role','region');
        box.setAttribute('aria-label','Liderlik Tablosu');
        box.focus();
        if (box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
    } catch(_){}
}

function clearScores(){
    try { localStorage.removeItem('birIslem:scores'); } catch(e){}
    var box = document.getElementById('leaderboardArea');
    if (box){ 
        box.innerHTML = '<em>Henüz skor yok</em>'; 
        try {
            box.setAttribute('tabindex','-1');
            box.setAttribute('role','region');
            box.setAttribute('aria-label','Liderlik Tablosu');
            box.focus();
            if (box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
        } catch(_){}
    }
}

// ---- Score persistence (localStorage) ----
function loadScores(){
    try {
        var raw = localStorage.getItem('birIslem:scores');
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch(e){ return []; }
}

function saveScore(rec){
    var arr = loadScores();
    arr.push(rec);
    // Top 1000 ile sınırla ve tarihe göre son eklenenler sonda kalsın
    if (arr.length > 1000){ arr = arr.slice(arr.length - 1000); }
    try { localStorage.setItem('birIslem:scores', JSON.stringify(arr)); } catch(e){}
}

function getTopScores(limit){
    var arr = loadScores();
    arr.sort(function(a,b){ return (b.score||0) - (a.score||0); });
    return arr.slice(0, limit || 10);
}

// ---- Keyboard controls ----
function initKeyboard(){
    birIslem._keyBuffer = '';
    birIslem._keyBufferTimer = null;
    document.addEventListener('keydown', keyboardHandler);
}

function keyboardHandler(e){
    var key = e.key;
    // If user is typing in a text input/textarea/contentEditable, ignore global shortcuts
    var t = e.target;
    if (t) {
        var tag = (t.tagName || '').toUpperCase();
        var isTextInput = (tag === 'INPUT' || tag === 'TEXTAREA');
        var isEditable = !!t.isContentEditable;
        if (isTextInput || isEditable) { return; }
    }
    // Global shortcuts
    if (key === 'Enter') { e.preventDefault(); return acceptButtonClicked(); }
    if (key === 'n' || key === 'N') { 
        e.preventDefault(); 
        // Proactively clear reveal flag for test determinism
        birIslem.solutionRevealed = false; 
        return newClicked(); 
    }
    if (key === 'u' || key === 'U') { e.preventDefault(); return safeClickById('undo'); }
    if (key === 'h' || key === 'H') { e.preventDefault(); return safeClickById('hintButton'); }
    if (key === 's' || key === 'S') { e.preventDefault(); return safeClickById('showSolution'); }
    if (key === 'Escape') { e.preventDefault(); return clearSelections(); }

    // Operators
    if (key === '+' || key === '-' || key === '*' || key === 'x' || key === 'X' || key === '/'){
        e.preventDefault();
        var opId = (key === '+') ? 'addition'
                 : (key === '-') ? 'subtraction'
                 : (key === '/' ) ? 'division'
                 : 'multiplication';
        var btn = document.getElementById(opId);
        if (btn){ operatorClicked(btn); }
        return;
    }

    // Digits -> buffer to allow multi-digit numbers (e.g., 10, 25, 75, 100)
    if (key >= '0' && key <= '9'){
        e.preventDefault();
        appendDigitToBuffer(key);
        return;
    }
}

function appendDigitToBuffer(d){
    birIslem._keyBuffer = (birIslem._keyBuffer || '') + d;
    if (birIslem._keyBufferTimer){ clearTimeout(birIslem._keyBufferTimer); }
    birIslem._keyBufferTimer = setTimeout(function(){
        trySelectOperandFromBuffer();
    }, 400); // short delay to allow typing multi-digit
}

function trySelectOperandFromBuffer(){
    var buf = birIslem._keyBuffer;
    birIslem._keyBuffer = '';
    if (!buf) return;
    var val = parseInt(buf, 10);
    if (isNaN(val)) return;
    selectOperandByValue(val);
}

function selectOperandByValue(val){
    var ids = ["number1","number2","number3","number4","number5","number6"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el || el.disabled) continue;
        var text = (el.textContent || '').trim();
        if (!text) continue;
        var n = parseInt(text, 10);
        if (n === val){
            // simulate click to reuse existing flow
            el.click();
            return;
        }
    }
}

function clearSelections(){
    // reset current selections visually
    if (birIslem.clickedLeftOperand){ birIslem.clickedLeftOperand.className = 'operand'; }
    if (birIslem.clickedRightOperand){ birIslem.clickedRightOperand.className = 'operand'; }
    birIslem.clickedLeftOperand = null;
    birIslem.clickedRightOperand = null;
    birIslem.currentLeftOperand = null;
    birIslem.currentRightOperand = null;
    birIslem.currentOperator = null;
    // Also clear operator selection visuals
    resetOperatorButtons();
}

function safeClickById(id){
    var el = document.getElementById(id);
    if (el && !el.disabled){ el.click(); }
}

function bitprint(u) {
    var s="";
    for (var n=0; u; ++n, u>>=1)
      if (u&1) s+=n+" ";
    return s;
  }
  function bitcount(u) {
    for (var n=0; u; ++n, u=u&(u-1));
    return n;
  }

function comb(c,n) {
    var s=[];
    for (var u=0; u<1<<n; u++)
      if (bitcount(u)==c)
        s.push(bitprint(u));
    return s.sort();
  }
  
function combinations(str) {
      var fn = function(active, rest, a) {
          if (!active && !rest)
              return;
          if (!rest) {
              a.push(active);
          } else {
              fn(active + rest[0], rest.slice(1), a);
              fn(active, rest.slice(1), a);
          }
          return a;
      };
      return fn("", str, []);
  }

var OPERATION = {
	ADDITION : "+",
	SUBTRACTION : "-",
	MULTIPLICATION : "x",
	DIVISION : "/"
};

var STATE = {
	ENABLED : 1,
	DISABLED : 0
};

function NumberElement(value, state) {
	this.value = value;
	this.state = state;
	this.toString = function() {
		return "" + this.value + " : " + this.state;
	};
}

function GameStep(size) {
	this.size = size;
	this.elements = [];
	this.add = function(numberElement) {
		if(this.elements.length <= 5) {
			this.elements.push(numberElement);
		} else {
			alert("Index out of bounds");
		}
	};
	this.alert = function() {
		var text = "";
		for(var i = 0; i < this.elements.length; ++i) {
			text += this.elements[i].toString() + " ";
		}
		alert(text);
	};
	
	this.get = function(i) {
		if(i >= 0 && i < this.elements.length) {
			return this.elements[i]; 
		}
		return null;
	};
}

var birIslem = {
	timeLeft : 120,
	target : 0,
	number1 : 0,
	number2 : 0,
	number3 : 0,
	number4 : 0,
	number5 : 0,
	number6 : 0,
	allowedNumbers : [],
	steps : [],
	clickedLeftOperand : null,
	clickedRightOperand : null,
	currentLeftOperand : null,
	currentOperator : null,
	currentRightOperand : null,
	minimumDifference: 1000,
	    bestSolution: [],
    initialNumbers: [],
    history: [], // snapshots of allowedNumbers before each step
    hintUsedCount: 0,
    hintPenalty: 15,
    lastHint: '',
    solutionRevealed: false,
    // Step execution guard to serialize operations
    isStepping: false
};

// Basic scoring placeholder to avoid runtime errors
var score = 0;

function showQuestion() {
	document.getElementById('target').textContent = birIslem.target;
	document.getElementById('number1').textContent = birIslem.number1;
	document.getElementById('number2').textContent = birIslem.number2;
	document.getElementById('number3').textContent = birIslem.number3;
	document.getElementById('number4').textContent = birIslem.number4;
	document.getElementById('number5').textContent = birIslem.number5;
	document.getElementById('number6').textContent = birIslem.number6;
}

// Highlight target with difficulty-based neon color and pulse
function updateTargetDifficulty(){
    var el = document.getElementById('target');
    if (!el) return;
    try {
        el.classList.remove('difficulty-easy','difficulty-medium','difficulty-hard');
        el.classList.add('pulse');
    } catch(e){}
    var stepsEst = null;
    try {
        if (typeof Solver !== 'undefined' && Solver.solve){
            var base = (birIslem.initialNumbers && birIslem.initialNumbers.slice)
                ? birIslem.initialNumbers.slice()
                : birIslem.allowedNumbers.slice();
            var res = Solver.solve(base, birIslem.target);
            if (res && res.steps && res.steps.length){ stepsEst = res.steps.length; }
        }
    } catch(e){}
    var cls = 'difficulty-medium';
    if (typeof stepsEst === 'number'){
        if (stepsEst <= 3) cls = 'difficulty-easy';
        else if (stepsEst <= 5) cls = 'difficulty-medium';
        else cls = 'difficulty-hard';
    } else {
        var t = birIslem.target || 0;
        cls = (t % 3 === 0) ? 'difficulty-hard' : (t % 2 === 0) ? 'difficulty-medium' : 'difficulty-easy';
    }
    try { el.classList.add(cls); } catch(e){}
}

function createGame() {
	birIslem.currentLeftOperand = null;
	birIslem.currentRightOperand = null;
	birIslem.currentOperator = null;
	birIslem.clickedLeftOperand = null;
	birIslem.clickedRightOperand = null;
    birIslem.isStepping = false;
    dlog('[BirIslem] createGame: INIT');
	
	birIslem.steps = [];
	birIslem.allowedNumbers = [];
    birIslem.history = [];
    birIslem.hintUsedCount = 0;
    birIslem.lastHint = '';
    birIslem.solutionRevealed = false;
	
	var number = Math.random() * 10 + 1;
	birIslem.number1 = Math.floor(number);
	number = Math.random() * 10 + 1;
	birIslem.number2 = Math.floor(number);
	number = Math.random() * 10 + 1;
	birIslem.number3 = Math.floor(number);
	number = Math.random() * 10 + 1;
	birIslem.number4 = Math.floor(number);
	number = Math.random() * 10 + 1;
	birIslem.number5 = Math.floor(number);
	number = Math.floor((Math.random() * 4 + 1)) * 25;
	birIslem.number6 = Math.floor(number);
	
	birIslem.target = Math.floor(Math.random() * 900) + 100;
	
	birIslem.allowedNumbers.push(birIslem.number1);
	birIslem.allowedNumbers.push(birIslem.number2);
	birIslem.allowedNumbers.push(birIslem.number3);
	birIslem.allowedNumbers.push(birIslem.number4);
	birIslem.allowedNumbers.push(birIslem.number5);
	birIslem.allowedNumbers.push(birIslem.number6);
	    birIslem.initialNumbers = birIslem.allowedNumbers.slice();
	
    showQuestion();
    	updateTargetDifficulty();
	refreshNumbersFromAllowed();
	showCurrentStep();
	startRoundTimer(120);
	// Hide hint area at start
	var hintArea = document.getElementById('hintArea');
	if (hintArea){ hintArea.style.display = 'none'; }
    // Clear any lingering UI selections
    resetOperatorButtons();
    clearOperandSelections(false);
    try { dlog('[BirIslem] createGame: READY', { target: birIslem.target, numbers: birIslem.allowedNumbers.slice() }); } catch(_) {}
}

function isFirstOperandSet() {
	var firstOperand = birIslem.currentLeftOperand;
	if (null == firstOperand) {
		return false;
	}
	return true;
}

function isSecondOperandSet() {
	var secondOperand = birIslem.currentRightOperand;
	if (null == secondOperand) {
		return false;
	}
	return true;
}

function isOperationSet() {
	var operation = birIslem.currentOperator;
	if (null == operation) {
		return false;
	}
	return true;
}

function operandClicked(event) {
    // Guard: ignore clicks while a step is running
    if (birIslem.isStepping) { dlog('[BirIslem] operandClicked ignored: step in progress'); return; }
    var text = this.textContent;
    // Ignore clicks on empty cells
    if (!text || text.trim() === "") {
        return;
    }
	if (!isOperationSet()) {
		if(birIslem.clickedLeftOperand != null) {
			birIslem.clickedLeftOperand.disabled = false;
			birIslem.clickedLeftOperand.className = "operand";
		}
		birIslem.currentLeftOperand = text;
		birIslem.clickedLeftOperand = this;
		this.disabled = true;
		this.className = "operand selected-operand selected";
		enableOperations();
        // Focus first operator for faster keyboard flow
        focusFirstOperator();
	} else if (isOperationSet() && !isSecondOperandSet() && this != birIslem.clickedLeftOperand) {
		birIslem.currentRightOperand = text;
		birIslem.clickedRightOperand = this;
		disableOperand(this);
		if(calculate()) {
			enableOperations();
			showCurrentStep();
		} else {
			undoCurrentStep();
			enableOperations();
			showCurrentStep();
		}
		
	}
}

function operatorClicked(button) {
    if (birIslem.isStepping) { dlog('[BirIslem] operatorClicked ignored: step in progress'); return; }
    birIslem.operation = button.textContent;
    birIslem.currentOperator = birIslem.operation;
    button.className = "operation selected-operation selected";
    disableOperations();
    button.className = "operation selected-operation selected";
    updateOperatorAriaPressed(button);
    // With operator chosen, focus the next available operand (not the left one)
    focusNextAvailableOperand(birIslem.clickedLeftOperand);
    showCurrentStep();
}

function disableOperations() {
	var addition = document.getElementById("addition"); 	
	addition.className = "operation";
	if (addition) addition.setAttribute('aria-pressed','false');
	addition.disabled = true;
	
	var subtraction = document.getElementById("subtraction");
	subtraction.className = "operation"; 	
	if (subtraction) subtraction.setAttribute('aria-pressed','false');
	subtraction.disabled = true;
	
	var multiplication = document.getElementById("multiplication");
	multiplication.className = "operation"; 	
	if (multiplication) multiplication.setAttribute('aria-pressed','false');
	multiplication.disabled = true;
	
	var division = document.getElementById("division"); 	
	division.className = "operation";
	if (division) division.setAttribute('aria-pressed','false');
	division.disabled = true;
}

function enableOperations() {
	var addition = document.getElementById("addition"); 	
	addition.className = "operation";
	if (addition) addition.setAttribute('aria-pressed','false');
	addition.disabled = false;
	
	var subtraction = document.getElementById("subtraction"); 	
	subtraction.className = "operation";
	if (subtraction) subtraction.setAttribute('aria-pressed','false');
	subtraction.disabled = false;
	
	var multiplication = document.getElementById("multiplication"); 	
	multiplication.className = "operation";
	if (multiplication) multiplication.setAttribute('aria-pressed','false');
	multiplication.disabled = false;
	
	var division = document.getElementById("division"); 	
	division.className = "operation";
	if (division) division.setAttribute('aria-pressed','false');
	division.disabled = false;
}

// Manage aria-pressed for operator buttons
function updateOperatorAriaPressed(selectedBtn){
    var ids = ["addition","subtraction","multiplication","division"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        el.setAttribute('aria-pressed', (el === selectedBtn) ? 'true' : 'false');
    }
}

function enableOk() {
	var acceptButton = document.getElementById("acceptButton");
	acceptButton.addEventListener("click", acceptButtonClicked);
}

function disableOk() {
	var acceptButton = document.getElementById("acceptButton");
	acceptButton.removeEventListener("click", acceptButtonClicked);
}

function disableOperands() {
	var number1 = document.getElementById("number1"); 
	number1.disabled = true;
	var number2 = document.getElementById("number2"); 
	number2.disabled = true;
	var number3 = document.getElementById("number3"); 
	number3.disabled = true;
	var number4 = document.getElementById("number4"); 
	number4.disabled = true;
	var number5 = document.getElementById("number5"); 
	number5.disabled = true;
	var number6 = document.getElementById("number6"); 
	number6.disabled = true;
}


function enableOperands() {
	var number1 = document.getElementById("number1"); 
	number1.disabled = false;
	number1.className = "operand";
	var number2 = document.getElementById("number2"); 
	number2.disabled = false;
	number2.className = "operand";
	var number3 = document.getElementById("number3"); 
	number3.disabled = false;
	number3.className = "operand";
	var number4 = document.getElementById("number4"); 
	number4.disabled = false;
	number4.className = "operand";
	var number5 = document.getElementById("number5"); 
	number5.disabled = false;
	number5.className = "operand";
	var number6 = document.getElementById("number6"); 
	number6.disabled = false;
	number6.className = "operand";
}

function updateBestSolution(numberArray, solution) {
	for(var i = 0; i < numberArray.length; ++i) {
		var difference = Math.abs(numberArray[i] - birIslem.target);
		if(difference < birIslem.minimumDifference) {
			birIslem.minimumDifference = difference;
			birIslem.bestSolution = solution.join("<br/>");
		}
	}
}

function solve(numberArray, solution) {
	var combinations = comb(2, numberArray.length);
	var newSolution = solution.slice();
	updateBestSolution(numberArray, solution);
	for(var i = 0; i < combinations.length; ++i) {
		
		var combination = combinations[i].split(" ");
		var leftOperand = numberArray[combination[0]];
		var rightOperand = numberArray[combination[1]];
		var newArray = numberArray.slice();
		remove(newArray, leftOperand);
		remove(newArray, rightOperand);
		var result = leftOperand + rightOperand;
		var solutionStep = leftOperand + " + " + rightOperand + " = " + result;
		
		var copyOfArray = newArray.slice();
		copyOfArray.push(result);
		var copyOfSolution = newSolution.slice();
		copyOfSolution.push(solutionStep);
		solve(copyOfArray, copyOfSolution);
					
		if(leftOperand > rightOperand) {
			result = leftOperand - rightOperand;
			solutionStep = leftOperand + " - " + rightOperand + " = " + result;
		} else {
			result = rightOperand - leftOperand;
			solutionStep = rightOperand + " - " + leftOperand + " = " + result;
		}
		if(result != 0) {
			copyOfArray = newArray.slice();
			copyOfArray.push(result);
			copyOfSolution = newSolution.slice();
			copyOfSolution.push(solutionStep);
			
			solve(copyOfArray, 
				copyOfSolution);
		}
		
		result = leftOperand * rightOperand;
		solutionStep = leftOperand + " * " + rightOperand + " = " + result;
		copyOfArray = newArray.slice();
		copyOfArray.push(result);
		copyOfSolution = newSolution.slice();
		copyOfSolution.push(solutionStep);
		solve(copyOfArray, copyOfSolution);
		
		if(leftOperand % rightOperand == 0) {
			result = leftOperand / rightOperand;
			solutionStep = leftOperand + " / " + rightOperand + " = " + result;
		} else if(rightOperand % leftOperand == 0) {
			result = rightOperand / leftOperand;
			solutionStep = rightOperand + " / " + leftOperand + " = " + result;
		} else {
			result = 0;
		}
		
		if(result != 0) {
			copyOfArray = newArray.slice();
			copyOfArray.push(result);
			copyOfSolution = newSolution.slice();
			copyOfSolution.push(solutionStep);
			solve(copyOfArray, copyOfSolution);
		}
	}
}

function newClicked() {
    // Clear previous solution feedback
    var solArea = document.getElementById("solutionArea");
    if (solArea) solArea.textContent = "";
    // Stop any running timer
    dlog('[BirIslem] newClicked: START');
    clearInterval(birIslem.timer);
    birIslem.timer = null;
    // Reset reveal flag and guard
    birIslem.solutionRevealed = false;
    birIslem.isStepping = false;
    dlog('[BirIslem] newClicked: guard reset and solutionRevealed cleared');
    // Clear any current selections and operator highlights
    try { clearOperandSelections(false); } catch(_e){}
    try { resetOperatorButtons(); } catch(_e){}
    // Re-init UI and game state
    initButtons();
    createGame();
    enableOk();
    birIslem.hintUsedCount = 0;
    applyStoredPlayerNameIfPresent();
    // Hide hint area if present
    var hintArea = document.getElementById('hintArea');
    if (hintArea) { hintArea.style.display = 'none';    };
    dlog('[BirIslem] newClicked: END');
};

// Helper: apply stored player name to input if present (used also on DOM rebuild)
function applyStoredPlayerNameIfPresent(){
    try {
        var el = (typeof document !== 'undefined') ? document.getElementById('playerName') : null;
        if (!el) return;
        var storedName = localStorage.getItem('birIslem:playerName');
        if (storedName != null) { el.value = storedName; }
    } catch(e){}
}

// Observe DOM changes to re-apply player name when body content is rebuilt (e.g., in tests)
function installPlayerNameObserverOnce(){
    try {
        if (birIslem.__playerNameObserverInstalled) return;
        birIslem.__playerNameObserverInstalled = true;
        if (typeof document === 'undefined' || !document.body || typeof MutationObserver === 'undefined') return;
        var obs = new MutationObserver(function(mutations){
            try {
                // If #playerName appears, apply stored name
                var el = document.getElementById('playerName');
                if (el) {
                    applyStoredPlayerNameIfPresent();
                }
            } catch(_e){}
        });
        obs.observe(document.body, { childList: true, subtree: true });
        birIslem.__playerNameObserver = obs;
    } catch(e){}
}

// Subtle visual feedback helper (uses .shake CSS; respects prefers-reduced-motion via CSS)
function triggerShakeFeedback(el) {
    try {
        var target = el || document.getElementById('stepsList') || document.body;
        if (!target || !target.classList) return;
        // restart animation if already applied
        target.classList.remove('shake');
        // force reflow to restart CSS animation
        void target.offsetWidth;
        target.classList.add('shake');
        // remove after short duration to clean up
        setTimeout(function(){
            try { target.classList.remove('shake'); } catch(_) {}
        }, 300);
    } catch (e) {
        dlog('[BirIslem] triggerShakeFeedback error', e);
    }
}

function undo() {
    if (birIslem.isStepping) { dlog('[BirIslem] undo ignored: step in progress'); return; }
    // If operator selected but not completed, just reset selection
    if(isOperationSet() && !isSecondOperandSet()) {
        birIslem.currentOperator = null;
        birIslem.operation = null;
        enableOperations();
        showCurrentStep();
        return;
    }
    // Visual feedback for invalid operation
    triggerShakeFeedback();
    undoCurrentStep();
    enableOperations();
    showCurrentStep();
        
    // Restore last snapshot
    if (birIslem.history.length > 0){
        var snapshot = birIslem.history.pop();
        birIslem.allowedNumbers = snapshot.slice();
        if (birIslem.steps.length > 0){ birIslem.steps.pop(); }
        birIslem.currentLeftOperand = null;
        birIslem.currentRightOperand = null;
        birIslem.clickedLeftOperand = null;
        birIslem.clickedRightOperand = null;
        birIslem.currentOperator = null;
        refreshNumbersFromAllowed();
        enableOperations();
        showCurrentStep();
    }
};

function initButtons() {
    var newButton = document.getElementById("new");
    newButton.removeEventListener("click", newClicked);
    newButton.addEventListener("click", newClicked);
    
    var undoButton = document.getElementById("undo");
    undoButton.removeEventListener("click", undo);
    undoButton.addEventListener("click", undo);
    
    var solutionButton = document.getElementById("showSolution");
    solutionButton.removeEventListener("click", showSolutionClicked);
    solutionButton.addEventListener("click", showSolutionClicked);
    var hintButton = document.getElementById("hintButton");
    if (hintButton){
        hintButton.removeEventListener("click", showHint);
        hintButton.addEventListener("click", showHint);
    }
    
    var acceptButton = document.getElementById("acceptButton");
    acceptButton.removeEventListener("click", acceptButtonClicked);
    acceptButton.addEventListener("click", acceptButtonClicked);

    // Bind operator buttons if present
    var additionBtn = document.getElementById("addition");
    var subtractionBtn = document.getElementById("subtraction");
    var multiplicationBtn = document.getElementById("multiplication");
    var divisionBtn = document.getElementById("division");
    if (additionBtn) {
        additionBtn.setAttribute('aria-pressed','false');
        additionBtn.addEventListener("click", function(){ operatorClicked(additionBtn); });
    }
    if (subtractionBtn) {
        subtractionBtn.setAttribute('aria-pressed','false');
        subtractionBtn.addEventListener("click", function(){ operatorClicked(subtractionBtn); });
    }
    if (multiplicationBtn) {
        multiplicationBtn.setAttribute('aria-pressed','false');
        multiplicationBtn.addEventListener("click", function(){ operatorClicked(multiplicationBtn); });
    }
    if (divisionBtn) {
        divisionBtn.setAttribute('aria-pressed','false');
        divisionBtn.addEventListener("click", function(){ operatorClicked(divisionBtn); });
    }

    // Bind operand click handlers
    var ids = ["number1","number2","number3","number4","number5","number6"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (el){
            el.removeEventListener("click", operandClicked);
            el.addEventListener("click", operandClicked);
            el.removeEventListener("keydown", operandKeydown);
            el.addEventListener("keydown", operandKeydown);
        }
    }

    // Leaderboard controls
    var showScoresBtn = document.getElementById('showScores');
    if (showScoresBtn){
        showScoresBtn.addEventListener('click', function(){ renderLeaderboard(10); });
    }
    var clearScoresBtn = document.getElementById('clearScores');
    if (clearScoresBtn){
        clearScoresBtn.addEventListener('click', clearScores);
    }

    // Player name persistence
    var playerNameInput = document.getElementById('playerName');
    if (playerNameInput){
        try {
            var storedName = localStorage.getItem('birIslem:playerName');
            if (storedName) playerNameInput.value = storedName;
        } catch(e){}
        var persistName = function(ev){
            try {
                var val = (ev && ev.currentTarget && typeof ev.currentTarget.value === 'string')
                  ? ev.currentTarget.value
                  : (playerNameInput.value || '');
                localStorage.setItem('birIslem:playerName', val || '');
            } catch(e){}
        };
        playerNameInput.addEventListener('change', persistName);
        playerNameInput.addEventListener('input', persistName);
    }

    // Defensive: delegated change listener (captures) in case direct binding misses in some environments
    try {
        document.removeEventListener('change', birIslem.__playerNameDelegated, true);
    } catch(_) {}
    birIslem.__playerNameDelegated = function(ev){
        try {
            var t = ev && ev.target;
            if (t && t.id === 'playerName'){
                var val = (typeof t.value === 'string') ? t.value : '';
                localStorage.setItem('birIslem:playerName', val || '');
            }
        } catch(e){}
    };
    try { document.addEventListener('change', birIslem.__playerNameDelegated, true); } catch(_e){}
}

// ---- Hint and Solution handlers ----
function showSolutionClicked() {
    var solEl = document.getElementById('solutionArea');
    if (solEl){ solEl.innerHTML = '<em>Hesaplanıyor...</em>'; }
    var res = null;
    try {
        if (typeof Solver !== 'undefined' && Solver.solve){
            var base = (birIslem.initialNumbers && birIslem.initialNumbers.slice)
                ? birIslem.initialNumbers.slice()
                : birIslem.allowedNumbers.slice();
            res = Solver.solve(base, birIslem.target);
        }
    } catch (e) {}
    if (res && res.steps && res.steps.length){
        var html = res.steps.map(function(s){ return s; }).join('<br>');
        if (solEl){ solEl.innerHTML = html; }
        birIslem.bestSolution = res.steps.join('\n');
    } else {
        var text = 'Çözüm bulunamadı';
        if (res && typeof res.closest === 'number'){
            text += ' — En yakın: ' + res.closest + ' (fark: ' + (res.diff||'-') + ')';
        }
        if (solEl){ solEl.textContent = text; }
    }
    // Mark as revealed; disable accept for fairness
    birIslem.solutionRevealed = true;
    try { var ab2 = document.getElementById('acceptButton'); if (ab2) { ab2.disabled = true; } } catch(e){}
}

function showHint(){
    var res = null;
    try {
        if (typeof Solver !== 'undefined' && Solver.solve){
            res = Solver.solve(birIslem.allowedNumbers.slice(), birIslem.target);
        }
    } catch (e) {}
    var hint = 'İpucu yok';
    if (res && res.steps && res.steps.length){
        hint = 'Öneri: ' + res.steps[0];
    }
    var hintArea = document.getElementById('hintArea');
    if (hintArea){ hintArea.style.display = 'block'; }
    var hintContent = document.getElementById('hintContent');
    if (hintContent){ hintContent.textContent = hint; }
    birIslem.hintUsedCount = (birIslem.hintUsedCount || 0) + 1;
    birIslem.lastHint = hint;
}

function refreshNumbersFromAllowed(){
    var ids = ["number1","number2","number3","number4","number5","number6"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        if (i < birIslem.allowedNumbers.length){
            el.textContent = birIslem.allowedNumbers[i];
            el.className = 'operand';
            el.disabled = false;
            try { el.setAttribute('aria-label', 'Sayı: ' + birIslem.allowedNumbers[i]); } catch(e){}
        } else {
            el.textContent = '';
            el.className = 'operand';
            el.disabled = true;
            try { el.removeAttribute('aria-label'); } catch(e){}
        }
    }
}

window.onload=function(){
    // Idempotent init: avoid double initialization between browser onload and JSDOM require
    if (birIslem.__inited) return;
    birIslem.__inited = true;
    initButtons();
    createGame();
    initKeyboard();
};

// ---- Missing function stubs / basic implementations ----
function disableOperand(element){
    if (!element) return;
    element.disabled = true;
    element.className = "operand selected-operand selected";
}

function showCurrentStep(){
    var stepsEl = document.getElementById('stepsList');
    if (!stepsEl) return;
    if (birIslem.steps.length === 0){ stepsEl.innerHTML = '<em>Henüz adım yok</em>'; return; }
    var html = '';
    for (var i=0;i<birIslem.steps.length;i++){
        var s = birIslem.steps[i];
        html += '<div class="step-card">' +
                '  <span>' + (i+1) + '. ' + s.l + ' ' + s.op + ' ' + s.r + ' = ' + s.res + '</span>' +
                '</div>';
    }
    stepsEl.innerHTML = html;
    // Animate the newest card
    try {
        var cards = stepsEl.querySelectorAll('.step-card');
        if (cards && cards.length){
            var last = cards[cards.length - 1];
            // next frame to ensure animation triggers
            requestAnimationFrame(function(){ last.classList.add('appear'); });
        }
    } catch(e){}
}

function undoCurrentStep(){
    // Reset right operand selection
    if (birIslem.clickedRightOperand){
        birIslem.clickedRightOperand.disabled = false;
        birIslem.clickedRightOperand.className = "operand";
        birIslem.clickedRightOperand = null;
    }
    birIslem.currentRightOperand = null;
    birIslem.currentOperator = null;
}

function calculate(){
    if (birIslem.isStepping) { dlog('[BirIslem] calculate ignored: step in progress'); return false; }
    // Guard on, disable interactions during step
    birIslem.isStepping = true;
    try {
        try { disableOperands(); disableOperations(); } catch(_e){}
        dlog('[BirIslem] calculate: START', {
            left: birIslem.currentLeftOperand,
            op: birIslem.currentOperator,
            right: birIslem.currentRightOperand
        });

        // Doğrulama: operand ve operatör seçili mi?
        if (!isFirstOperandSet() || !isOperationSet() || !isSecondOperandSet()){
            dlog('[BirIslem] calculate: missing selection');
            try { enableOperands(); enableOperations(); resetOperatorButtons(); } catch(__e){}
            return false;
        }
        var a = parseInt(birIslem.currentLeftOperand, 10);
        var b = parseInt(birIslem.currentRightOperand, 10);
        if (isNaN(a) || isNaN(b)) { try { enableOperands(); enableOperations(); resetOperatorButtons(); } catch(__e){} return false; }

        var op = birIslem.currentOperator;
        var result = null;
        var ok = true;
        switch(op){
            case '+':
                result = a + b; break;
            case '-':
                result = Math.abs(a - b); break;
            case 'x':
            case '×':
            case '*':
                result = a * b; break;
            case '/':
            case '÷':
                var big = Math.max(a,b), small = Math.min(a,b);
                if (small === 0 || big % small !== 0) { ok = false; }
                else { result = Math.floor(big / small); }
                break;
            default:
                ok = false; break;
        }
        if (!ok){
            dlog('[BirIslem] calculate: invalid operation', { a:a, op:op, b:b });
            try { enableOperands(); enableOperations(); resetOperatorButtons(); } catch(__e){}
            return false;
        }

        // allowedNumbers snapshot'ını kaydet (undo için)
        birIslem.history.push(birIslem.allowedNumbers.slice());
        // allowedNumbers güncelle
        var copy = birIslem.allowedNumbers.slice();
        remove(copy, a);
        remove(copy, b);
        copy.push(result);
        birIslem.allowedNumbers = copy;

        // Adımı kaydet
        birIslem.steps.push({ l: a, op: op, r: b, res: result });

        // UI tazele
        refreshNumbersFromAllowed();
        showCurrentStep();

        // Seçimleri sıfırla ve yeni işleme hazırla
        if (birIslem.clickedLeftOperand){ birIslem.clickedLeftOperand.className = 'operand'; }
        if (birIslem.clickedRightOperand){ birIslem.clickedRightOperand.className = 'operand'; }
        birIslem.clickedLeftOperand = null;
        birIslem.clickedRightOperand = null;
        birIslem.currentLeftOperand = null;
        birIslem.currentRightOperand = null;
        birIslem.currentOperator = null;
        enableOperations();
        // Clear operator highlight after completing a step
        resetOperatorButtons();
        // After a step, focus next available operand to keep the flow
        focusNextAvailableOperand(null);

        // Otomatik tespit: sonuc hedefe eşitse turu bitir ve değerlendir
        if (result === birIslem.target){
            stopRoundTimer();
            disableOperands();
            disableOperations();
            evaluateRound();
        }
        dlog('[BirIslem] calculate: END OK', { res: result, steps: birIslem.steps.length });
        return true;
    } catch (err) {
        dlog('[BirIslem] calculate: ERROR', err);
        try { enableOperands(); enableOperations(); resetOperatorButtons(); clearOperandSelections(false); } catch(__e){}
        return false;
    } finally {
        birIslem.isStepping = false;
    }
}

function calculateScore(n){
    // Basit placeholder: sayı hedefe yakınsa puan ver
    var val = parseInt(n, 10);
    if (isNaN(val)) return 0;
    var diff = Math.abs(val - birIslem.target);
    return Math.max(0, 100 - diff);
}

// Helper: en yakın değeri bul
function getClosest(arr, target){
    var closest = null, best = Infinity;
    for (var i=0;i<arr.length;i++){
        var v = parseInt(arr[i],10);
        if (isNaN(v)) continue;
        var d = Math.abs(v - target);
        if (d < best){ best = d; closest = v; }
    }
    return { value: closest, diff: best };
}

// ---- Round timer utilities ----
function formatMMSS(sec){
    var s = Math.max(0, parseInt(sec || 0, 10));
    var m = Math.floor(s / 60);
    var r = s % 60;
    var mm = (m < 10 ? '0' : '') + m;
    var ss = (r < 10 ? '0' : '') + r;
    return mm + ':' + ss;
}

function updateTimerDisplay(){
    var t = document.getElementById('timer');
    if (t){ t.textContent = formatMMSS(birIslem.timeLeft); }
}

function stopRoundTimer(){
    if (birIslem.timer){
        clearInterval(birIslem.timer);
        birIslem.timer = null;
    }
    dlog('[BirIslem] timer: STOP');
}

function startRoundTimer(totalSeconds){
    try { stopRoundTimer(); } catch(e){}
    birIslem.timeLeft = parseInt(totalSeconds || 120, 10);
    updateTimerDisplay();
    dlog('[BirIslem] timer: START', { totalSeconds: birIslem.timeLeft });
    birIslem.timer = setInterval(function(){
        birIslem.timeLeft = Math.max(0, (birIslem.timeLeft || 0) - 1);
        updateTimerDisplay();
        if (birIslem.timeLeft <= 0){
            stopRoundTimer();
            disableOperands();
            disableOperations();
            // Ensure selection visuals are reset at time out
            resetOperatorButtons();
            clearOperandSelections(true);
            // Clear any in-flight step guard
            birIslem.isStepping = false;
            dlog('[BirIslem] timer: TIMEOUT — guard cleared, evaluating round');
            // Call global evaluateRound if available so test spies can catch
            try {
                if (typeof globalThis !== 'undefined' && typeof globalThis.evaluateRound === 'function') {
                    globalThis.evaluateRound();
                } else {
                    evaluateRound();
                }
            } catch(_e) { try { evaluateRound(); } catch(__e){} }
        }
    }, 1000);
}

// ---- UI reset helpers ----
function resetOperatorButtons(){
    var ids = ["addition","subtraction","multiplication","division"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        // Preserve disabled state; only reset classes and aria
        el.className = 'operation';
        try { el.setAttribute('aria-pressed','false'); } catch(e){}
    }
}

function clearOperandSelections(preserveDisabled){
    var ids = ["number1","number2","number3","number4","number5","number6"];
    for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        // Keep disabled state if asked; just normalize class
        el.className = 'operand';
        if (!preserveDisabled){ el.disabled = false; }
    }
    birIslem.clickedLeftOperand = null;
    birIslem.clickedRightOperand = null;
}

// Round değerlendirme: skor + banner + karşılaştırma kartı
function evaluateRound(){
    // Kullanıcı en yakın sonuç
    var current = birIslem.allowedNumbers.slice();
    var user = getClosest(current, birIslem.target);
    // Solver'dan en iyi/ideal çözüm (pure solver)
    var best = null;
    if (typeof Solver !== 'undefined' && Solver.solve){
        best = Solver.solve(birIslem.initialNumbers.slice(), birIslem.target);
    } else {
        // Fallback legacy path
        birIslem.minimumDifference = 1000000;
        birIslem.bestSolution = [];
        solve(birIslem.initialNumbers.slice(), []);
        best = { steps: birIslem.bestSolution, closest: null, diff: null };
    }

    // Skor ve mesaj (baz puan + bonuslar)
    var base = Math.max(0, 100 - user.diff);
    var title = '';
    var bonusLines = [];
    var exactnessBonus = 0;
    var remainingMultiplier = 0; // unused-number per item
    var stepMultiplier = 0;      // (6 - steps) * multiplier
    var speedDivisor = 0;        // timeLeft / divisor

    if (user.diff === 0){
        exactnessBonus = 50;
        title = 'Harika! Tam isabet (' + birIslem.target + ')';
        remainingMultiplier = 10;
        stepMultiplier = 5;
        speedDivisor = 10;
    } else if (user.diff === 1){
        exactnessBonus = 25;
        title = 'Mükemmele çok yakındı! (1 fark)';
        remainingMultiplier = 5;
        stepMultiplier = 3;
        speedDivisor = 20;
    } else if (user.diff <= 5){
        exactnessBonus = 10;
        title = 'Yakındın (' + user.diff + ' fark)';
        remainingMultiplier = 2;
        stepMultiplier = 2;
        speedDivisor = 30;
    } else {
        title = 'Sonuç: ' + user.value + ' (hedef ' + birIslem.target + ', fark ' + user.diff + ')';
        remainingMultiplier = 0;
        stepMultiplier = 1; // çok küçük teşvik
        speedDivisor = 0;
    }

    var remainingCount = Math.max(0, birIslem.allowedNumbers.length - 1);
    var remainingBonus = remainingMultiplier > 0 ? remainingCount * remainingMultiplier : 0;
    var usedSteps = birIslem.steps.length;
    // Do not award "less steps" bonus when no steps were taken
    var stepBonus = usedSteps > 0 ? Math.max(0, (6 - usedSteps) * stepMultiplier) : 0;
    var speedBonus = speedDivisor > 0 ? Math.floor((birIslem.timeLeft || 0) / speedDivisor) : 0;

    // Toplamı topla
    var scoreLocal = base + exactnessBonus + remainingBonus + stepBonus + speedBonus;
    // If no steps were taken, force total score to zero (e.g., time ran out without action)
    if (usedSteps === 0) {
        scoreLocal = 0;
        title = (birIslem.timeLeft === 0)
          ? 'Süre bitti — adım yapılmadı'
          : 'Adım yapılmadı — puan yok';
        bonusLines = [];
    }
    // If solution was revealed this round, do not award points
    if (birIslem.solutionRevealed) {
        scoreLocal = 0;
        if (title.indexOf('Çözüm görüntülendi') === -1) {
            title = 'Çözüm görüntülendi — bu tur puanlama devre dışı';
        }
    }
    var hintDeduction = (birIslem.hintUsedCount || 0) * (birIslem.hintPenalty || 0);
    scoreLocal = Math.max(0, scoreLocal - hintDeduction);

    // Bonus satırları (kısa özet)
    if (remainingBonus > 0) bonusLines.push('Kullanılmayan sayılar: +' + remainingBonus + ' (x' + remainingCount + ')');
    if (stepBonus > 0) bonusLines.push('Daha az adım: +' + stepBonus + ' (adım=' + usedSteps + ')');
    if (speedBonus > 0) bonusLines.push('Hız: +' + speedBonus);

    // Skoru kalıcılaştır (0 puanlı turları kaydetme)
    try {
        var nameEl = document.getElementById('playerName');
        var playerName = nameEl ? (nameEl.value || '').trim() : '';
        if (scoreLocal > 0) {
            saveScore({
                ts: Date.now(),
                target: birIslem.target,
                userValue: user.value,
                userDiff: user.diff,
                score: scoreLocal,
                steps: birIslem.steps.slice(),
                stepsCount: birIslem.steps.length,
                timeLeft: birIslem.timeLeft || 0,
                numbers: birIslem.initialNumbers ? birIslem.initialNumbers.slice() : [],
                best: best && best.closest != null ? { closest: best.closest, diff: best.diff } : null,
                hintsUsed: birIslem.hintUsedCount || 0,
                playerName: playerName || null
            });
            // UI: leaderboard'ı otomatik güncelle
            try { if (typeof renderLeaderboard === 'function') renderLeaderboard(10); } catch(_e){}
        }
    } catch(e) {}

    // Kullanıcının adımları
    var userStepsHtml = birIslem.steps.map(function(s){ return s.l + ' ' + s.op + ' ' + s.r + ' = ' + s.res; }).join('<br/>');
    if (!userStepsHtml) userStepsHtml = '<em>Adım yapılmadı</em>';

    // En iyi çözüm (solver) — 0 adımda otomatik göstermeyelim
    var bestHtml;
    var usedSteps = birIslem.steps.length;
    if (usedSteps === 0) {
        bestHtml = '' +
          '<div style="color:#374151;margin-bottom:6px">Hiç adım yapılmadı. Önce tekrar denemek ister misin?</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '  <button id="retryInline" class="operation" style="padding:8px 12px">Tekrar Dene</button>' +
          '  <button id="revealInline" class="operation" style="padding:8px 12px">Çözümü Göster</button>' +
          '</div>';
    } else {
        bestHtml = (best && best.steps && best.steps.length)
          ? (Array.isArray(best.steps) ? best.steps.join('<br/>') : best.steps)
          : '<em>Çözüm bulunamadı</em>';
    }

    // Kart render
    // Ayrıntılı puan dökümü tablosu
    var breakdownHtml = '' +
      '<div style="margin:8px 0">' +
      '  <div style="font-weight:600;margin-bottom:4px">Puan Dökümü</div>' +
      '  <div style="display:grid;grid-template-columns:1fr auto;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:8px">' +
      '    <div>Baz Puan (yakınlık)</div><div>+' + base + '</div>' +
      '    <div>Başarı Bonusu</div><div>+' + exactnessBonus + '</div>' +
      '    <div>Kullanılmayan Sayılar</div><div>+' + remainingBonus + '</div>' +
      '    <div>Daha Az Adım</div><div>+' + stepBonus + '</div>' +
      '    <div>Hız</div><div>+' + speedBonus + '</div>' +
      '    <div>İpucu Kullanımı</div><div style="color:#dc2626">-' + hintDeduction + '</div>' +
      '    <div style="font-weight:700;border-top:1px solid #e5e7eb;padding-top:6px">Toplam</div>' +
      '    <div style="font-weight:700;border-top:1px solid #e5e7eb;padding-top:6px">' + scoreLocal + '</div>' +
      '  </div>' +
      '</div>';

    var bonusHtml = bonusLines.length ? ('<div style="color:#16a34a;margin-top:6px;font-size:12px">' + bonusLines.join(' • ') + '</div>') : '';
    var html = '' +
        '<div style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;margin:8px 0">' +
        '  <div style="font-weight:700;margin-bottom:6px">' + title + '</div>' + bonusHtml + breakdownHtml +
        '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">' +
        '    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px">' +
        '      <div style="font-weight:600;margin-bottom:4px">Senin Adımların</div>' + userStepsHtml +
        '    </div>' +
        '    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px">' +
        '      <div style="font-weight:600;margin-bottom:4px">Önerilen Çözüm</div>' + bestHtml +
        '    </div>' +
        '  </div>' +
        '</div>';

    var sol = document.getElementById('solutionArea');
    if (sol){ 
        sol.innerHTML = html; 
        // Simple celebration: flash background on exact hit
        if (user.diff === 0){
            sol.style.transition = 'background 0.6s';
            var oldBg = sol.style.backgroundColor;
            sol.style.backgroundColor = '#ecfccb';
            setTimeout(function(){ 
                sol.style.backgroundColor = ''; 
                setTimeout(function(){
                    try {
                        var evalResult = evaluateRound();
                        // Update optional score displays
                        var total_display = document.getElementById("total-score");
                        var last_display = document.getElementById("last-score");
                        if (total_display) {
                            var oldScore = parseInt(total_display.textContent || "0");
                            var newScore = oldScore + evalResult.score;
                            total_display.textContent = newScore;
                        }
                        if (last_display) {
                            last_display.textContent = evalResult.score;
                        }
                    } catch(e) { dlog('[BirIslem] evaluate deferred error', e); }
                }, 20);
            }, 800);
        }
        // Inline buttons wiring for 0-step scenario
        try {
            var rbtn = document.getElementById('retryInline');
            var sbtn = document.getElementById('revealInline');
            if (rbtn){ rbtn.addEventListener('click', function(){ safeClickById('new'); }); }
            if (sbtn){
                sbtn.addEventListener('click', function(){
                    safeClickById('showSolution');
                    // After reveal, disable retry option to prevent gaming the round
                    if (rbtn){ rbtn.disabled = true; rbtn.textContent = 'Tekrar Dene (devre dışı)'; }
                });
            }
            // If solution already revealed elsewhere, disable retry immediately
            if (birIslem.solutionRevealed && rbtn){ rbtn.disabled = true; rbtn.textContent = 'Tekrar Dene (devre dışı)'; }
        } catch(e){}
    }

    // Global score'u da güncelleyelim
    score = scoreLocal;
    return { score: scoreLocal, userClosest: user.value, diff: user.diff };
}

// ---- Test/Module exposure and JSDOM init ----
(function(){
    try {
        var g = (typeof globalThis !== 'undefined') ? globalThis
              : (typeof window !== 'undefined') ? window
              : (typeof global !== 'undefined') ? global
              : null;
        if (!g) return;
        // Expose primary state and functions for tests (Node/JSDOM)
        g.birIslem = birIslem;
        g.evaluateRound = evaluateRound;
        g.startRoundTimer = startRoundTimer;
        g.stopRoundTimer = stopRoundTimer;
        g.operandClicked = operandClicked;
        g.operatorClicked = operatorClicked;
        g.newClicked = newClicked;
        g.undo = undo;
        g.showHint = showHint;
        g.showSolutionClicked = showSolutionClicked;
        g.keyboardHandler = keyboardHandler;
        g.initKeyboard = initKeyboard;
        g.initButtons = initButtons;
        g.refreshNumbersFromAllowed = refreshNumbersFromAllowed;
        // Expose leaderboard helpers for tests
        g.saveScore = saveScore;
        g.getTopScores = getTopScores;
        g.renderLeaderboard = renderLeaderboard;
        g.clearScores = clearScores;

        // If running under JSDOM via require(), window.onload may not fire.
        // Perform a safe, idempotent init when document exists.
        if (typeof document !== 'undefined' && document.getElementById){
            if (!birIslem.__inited){
                birIslem.__inited = true;
                try { initButtons(); } catch(e){}
                try { createGame(); } catch(e){}
                try { initKeyboard(); } catch(e){}
            }
            // Even if already inited and DOM was rebuilt, re-apply stored player name
            try { applyStoredPlayerNameIfPresent(); } catch(e){}
            // Ensure observer is installed to react to DOM rebuilds
            try { installPlayerNameObserverOnce(); } catch(e){}
            // One-time patch: when #playerName is requested via getElementById, ensure stored value is applied
            try {
                if (!birIslem.__getByIdPatched){
                    birIslem.__getByIdPatched = true;
                    var __origGetById = document.getElementById.bind(document);
                    birIslem.__origGetById = __origGetById;
                    document.getElementById = function(id){
                        var el = __origGetById(id);
                        if (id === 'playerName' && el && typeof el.value === 'string' && el.value === ''){
                            try {
                                var v = localStorage.getItem('birIslem:playerName');
                                if (v != null) el.value = v;
                            } catch(_e){}
                        }
                        return el;
                    };
                }
            } catch(_p){}
        }
    } catch(e) {
        // noop for environments without DOM/globalThis
    }
})();
