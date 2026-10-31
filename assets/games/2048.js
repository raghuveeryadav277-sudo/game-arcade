/* 2048 — 4x4 grid. Arrow keys + swipe. Tiles merge once per move. Win at 2048. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "2048";
  var grid = document.getElementById("grid");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var endTitle = document.getElementById("end-title");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");

  var SIZE = 4;
  var board = [], score = 0, running = false, won = false;
  var cells = [];

  // Build the 16 cell elements once
  for (var i = 0; i < SIZE * SIZE; i++) {
    var cell = document.createElement("div");
    cell.className = "t2048-cell";
    grid.appendChild(cell);
    cells.push(cell);
  }

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
  }

  function render() {
    for (var i = 0; i < SIZE * SIZE; i++) {
      var v = board[i];
      cells[i].textContent = v === 0 ? "" : v;
      cells[i].className = "t2048-cell" + (v > 0 ? " t" + v : "");
    }
  }

  function addRandomTile() {
    var empty = [];
    for (var i = 0; i < SIZE * SIZE; i++) if (board[i] === 0) empty.push(i);
    if (empty.length === 0) return;
    var idx = empty[Math.floor(Math.random() * empty.length)];
    board[idx] = Math.random() < 0.9 ? 2 : 4;
  }

  // Slide one line (array of 4) left, merging equal neighbours once.
  function slideLine(line) {
    var compact = line.filter(function (v) { return v !== 0; });
    var out = [], gained = 0;
    for (var i = 0; i < compact.length; i++) {
      if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
        var merged = compact[i] * 2;
        out.push(merged);
        gained += merged;
        i++; // skip the merged partner — each tile merges at most once
      } else {
        out.push(compact[i]);
      }
    }
    while (out.length < SIZE) out.push(0);
    return { line: out, gained: gained };
  }

  function arraysEqual(a, b) {
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function move(dir) {
    if (!running) return;
    var before = board.slice();
    var gained = 0;
    for (var n = 0; n < SIZE; n++) {
      var line = [], result;
      if (dir === "left" || dir === "right") {
        for (var c = 0; c < SIZE; c++) line.push(board[n * SIZE + c]);
        if (dir === "right") line.reverse();
        result = slideLine(line);
        if (dir === "right") result.line.reverse();
        for (var c2 = 0; c2 < SIZE; c2++) board[n * SIZE + c2] = result.line[c2];
      } else {
        for (var r = 0; r < SIZE; r++) line.push(board[r * SIZE + n]);
        if (dir === "down") line.reverse();
        result = slideLine(line);
        if (dir === "down") result.line.reverse();
        for (var r2 = 0; r2 < SIZE; r2++) board[r2 * SIZE + n] = result.line[r2];
      }
      gained += result.gained;
    }
    if (!arraysEqual(before, board)) {
      score += gained;
      GZ.beep(600, 0.04);
      addRandomTile();
      render();
      updateHUD();
      checkEnd();
    }
  }

  function canMove() {
    for (var i = 0; i < SIZE * SIZE; i++) {
      if (board[i] === 0) return true;
      var r = Math.floor(i / SIZE), c = i % SIZE;
      if (c + 1 < SIZE && board[i] === board[i + 1]) return true;
      if (r + 1 < SIZE && board[i] === board[i + SIZE]) return true;
    }
    return false;
  }

  function checkEnd() {
    if (!won && board.indexOf(2048) !== -1) {
      won = true;
      endGame(true);
      return;
    }
    if (!canMove()) endGame(false);
  }

  function endGame(isWin) {
    running = false;
    GZ.beep(isWin ? 880 : 140, isWin ? 0.15 : 0.3);
    var isBest = GZ.saveBest(KEY, score);
    endTitle.textContent = isWin ? "🎉 You Win!" : "Game Over";
    finalScore.textContent = isWin
      ? "You reached 2048! Your score: " + score
      : "No moves left. Your score: " + score;
    bestLine.textContent = isBest
      ? "🎉 New best score!"
      : "Best score: " + GZ.getBest(KEY);
    updateHUD();
    overScreen.classList.remove("hidden");
  }

  function startGame() {
    board = new Array(SIZE * SIZE).fill(0);
    score = 0; running = true; won = false;
    addRandomTile();
    addRandomTile();
    render();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
  }

  document.addEventListener("keydown", function (e) {
    if (!running) return;
    var k = e.key;
    if (k === "ArrowLeft") { move("left"); e.preventDefault(); }
    else if (k === "ArrowRight") { move("right"); e.preventDefault(); }
    else if (k === "ArrowUp") { move("up"); e.preventDefault(); }
    else if (k === "ArrowDown") { move("down"); e.preventDefault(); }
  });

  // Touch swipe
  var touchStart = null;
  grid.addEventListener("touchstart", function (e) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }, { passive: false });
  grid.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var dx = e.changedTouches[0].clientX - touchStart.x;
    var dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
    e.preventDefault();
  }, { passive: false });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
