/* Minesweeper — 9x9, 10 mines. First click never a mine. Right-click / long-press flags. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var BEST_KEY = "gamezone_best_minesweeper";
  var ROWS = 9, COLS = 9, MINES = 10;
  var grid = document.getElementById("grid");
  var minesEl = document.getElementById("mines");
  var timeEl = document.getElementById("time");
  var bestEl = document.getElementById("best");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var endTitle = document.getElementById("end-title");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");

  var NUM_COLORS = ["", "#4dabf7", "#3ddc84", "#ff5c7a", "#7c5cff", "#ffa94d", "#00d4ff", "#f783ac", "#adb5bd"];
  var mines = [], revealed = [], flagged = [], adj = [];
  var cells = [], started = false, over = false, revealedCount = 0;
  var flags = 0, seconds = 0, timer = null;

  function fmt(s) {
    var m = Math.floor(s / 60), sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function getBestTime() {
    var v = parseInt(localStorage.getItem(BEST_KEY), 10);
    return isNaN(v) ? null : v;
  }

  function updateHUD() {
    minesEl.textContent = MINES - flags;
    timeEl.textContent = fmt(seconds);
    var b = getBestTime();
    bestEl.textContent = b === null ? "—" : fmt(b);
  }

  function idx(r, c) { return r * COLS + c; }

  function neighbours(r, c) {
    var list = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) list.push({ r: nr, c: nc });
      }
    }
    return list;
  }

  function buildBoard() {
    grid.innerHTML = "";
    cells = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        (function (rr, cc) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "ms-cell";
          btn.setAttribute("aria-label", "Cell " + (rr + 1) + "," + (cc + 1));
          btn.addEventListener("click", function () { reveal(rr, cc); });
          btn.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            toggleFlag(rr, cc);
          });
          // Long-press to flag on touch
          var pressTimer = null;
          btn.addEventListener("touchstart", function () {
            pressTimer = setTimeout(function () { toggleFlag(rr, cc); }, 500);
          }, { passive: true });
          btn.addEventListener("touchend", function () {
            if (pressTimer) clearTimeout(pressTimer);
          });
          btn.addEventListener("touchmove", function () {
            if (pressTimer) clearTimeout(pressTimer);
          });
          grid.appendChild(btn);
          cells.push(btn);
        })(r, c);
      }
    }
  }

  function placeMines(safeIdx) {
    mines = new Array(ROWS * COLS).fill(false);
    var placed = 0;
    while (placed < MINES) {
      var i = Math.floor(Math.random() * ROWS * COLS);
      if (i === safeIdx || mines[i]) continue;
      mines[i] = true;
      placed++;
    }
    // Count adjacent mines per cell
    adj = new Array(ROWS * COLS).fill(0);
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (mines[idx(r, c)]) continue;
        adj[idx(r, c)] = neighbours(r, c).filter(function (n) {
          return mines[idx(n.r, n.c)];
        }).length;
      }
    }
  }

  function startTimer() {
    if (timer) return;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  function reveal(r, c) {
    if (over) return;
    if (!started) {
      started = true;
      placeMines(idx(r, c));
      startTimer();
    }
    var i = idx(r, c);
    if (revealed[i] || flagged[i] || over) return;
    if (mines[i]) { loseGame(i); return; }
    flood(r, c);
    GZ.beep(600, 0.03);
    if (revealedCount === ROWS * COLS - MINES) winGame();
  }

  function flood(r, c) {
    var stack = [{ r: r, c: c }];
    while (stack.length) {
      var n = stack.pop();
      var i = idx(n.r, n.c);
      if (revealed[i] || flagged[i] || mines[i]) continue;
      revealed[i] = true;
      revealedCount++;
      var cell = cells[i];
      cell.classList.add("open");
      var count = adj[i];
      if (count > 0) {
        cell.textContent = count;
        cell.style.color = NUM_COLORS[count];
      } else {
        neighbours(n.r, n.c).forEach(function (m) { stack.push(m); });
      }
    }
  }

  function toggleFlag(r, c) {
    if (over) return;
    var i = idx(r, c);
    if (revealed[i]) return;
    flagged[i] = !flagged[i];
    flags += flagged[i] ? 1 : -1;
    var cell = cells[i];
    cell.textContent = flagged[i] ? "🚩" : "";
    cell.classList.toggle("flagged", flagged[i]);
    GZ.beep(flagged[i] ? 500 : 300, 0.04);
    updateHUD();
  }

  function revealAllMines(hitIdx) {
    for (var i = 0; i < ROWS * COLS; i++) {
      if (mines[i]) {
        cells[i].classList.add("open");
        cells[i].textContent = "💣";
        if (i === hitIdx) cells[i].style.background = "#8c1d2f";
      }
    }
  }

  function loseGame(hitIdx) {
    over = true;
    if (timer) clearInterval(timer);
    GZ.beep(120, 0.4);
    revealAllMines(hitIdx);
    endTitle.textContent = "💥 Boom!";
    finalScore.textContent = "You hit a mine after " + fmt(seconds) + ".";
    bestLine.textContent = "Reveal all 71 safe squares to win!";
    overScreen.classList.remove("hidden");
  }

  function winGame() {
    over = true;
    if (timer) clearInterval(timer);
    GZ.beep(880, 0.12);
    setTimeout(function () { GZ.beep(1170, 0.15); }, 130);
    var prev = getBestTime();
    var isBest = prev === null || seconds < prev;
    if (isBest) localStorage.setItem(BEST_KEY, String(seconds));
    endTitle.textContent = "🎉 You Win!";
    finalScore.textContent = "Field cleared in " + fmt(seconds) + "!";
    bestLine.textContent = isBest
      ? "🎉 New best time!"
      : "Best time: " + fmt(prev);
    updateHUD();
    overScreen.classList.remove("hidden");
  }

  function startGame() {
    mines = []; revealed = new Array(ROWS * COLS).fill(false);
    flagged = new Array(ROWS * COLS).fill(false);
    adj = new Array(ROWS * COLS).fill(0);
    started = false; over = false; revealedCount = 0;
    flags = 0; seconds = 0;
    if (timer) { clearInterval(timer); timer = null; }
    buildBoard();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
  }

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
