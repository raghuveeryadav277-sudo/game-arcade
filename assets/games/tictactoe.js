/* Tic-Tac-Toe — vs Computer (blocks/wins, else random) or 2 Players. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var WINS_KEY = "gamezone_best_tictactoe";
  var grid = document.getElementById("grid");
  var statusEl = document.getElementById("status");
  var scoreEl = document.getElementById("score");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var endTitle = document.getElementById("end-title");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var modeCpuBtn = document.getElementById("mode-cpu");
  var mode2pBtn = document.getElementById("mode-2p");

  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  var board = new Array(9).fill("");
  var turn = "X", mode = "cpu", over = false, playing = false;
  var cells = [];

  function getWins() {
    var v = parseInt(localStorage.getItem(WINS_KEY), 10);
    return isNaN(v) ? 0 : v;
  }

  function updateHUD() {
    scoreEl.textContent = getWins();
  }

  // Build the 9 cells once
  for (var i = 0; i < 9; i++) {
    (function (idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ttt-cell";
      btn.setAttribute("aria-label", "Square " + (idx + 1));
      btn.addEventListener("click", function () { play(idx); });
      grid.appendChild(btn);
      cells.push(btn);
    })(i);
  }

  function render() {
    for (var i = 0; i < 9; i++) cells[i].textContent = board[i];
  }

  function winner() {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      if (board[l[0]] && board[l[0]] === board[l[1]] && board[l[1]] === board[l[2]]) {
        return board[l[0]];
      }
    }
    return null;
  }

  function isFull() { return board.every(function (v) { return v !== ""; }); }

  function setStatus(msg) { statusEl.textContent = msg; }

  function endRound(resultText, titleText) {
    over = true;
    playing = false;
    var w = winner();
    if (w === "X") {
      var wins = getWins() + 1;
      localStorage.setItem(WINS_KEY, String(wins));
      updateHUD();
    }
    endTitle.textContent = titleText;
    finalScore.textContent = resultText;
    bestLine.textContent = "Total X wins: " + getWins();
    overScreen.classList.remove("hidden");
  }

  function afterMove() {
    var w = winner();
    if (w) {
      var title = mode === "cpu"
        ? (w === "X" ? "🎉 You Win!" : "💻 Computer Wins")
        : (w === "X" ? "🎉 X Wins!" : "🎉 O Wins!");
      var text = mode === "cpu"
        ? (w === "X" ? "Three in a row — nicely done!" : "The computer got three in a row. Try again!")
        : ("Player " + w + " got three in a row!");
      endRound(text, title);
      return true;
    }
    if (isFull()) {
      endRound("Nobody got three in a row — it’s a draw!", "🤝 Draw!");
      return true;
    }
    return false;
  }

  function play(i) {
    if (!playing || over || board[i] !== "") return;
    board[i] = turn;
    GZ.beep(turn === "X" ? 700 : 500, 0.05);
    render();
    if (afterMove()) return;
    if (mode === "cpu") {
      turn = "O";
      setStatus("Computer thinking…");
      setTimeout(cpuMove, 450);
    } else {
      turn = turn === "X" ? "O" : "X";
      setStatus("Player " + turn + "’s turn");
    }
  }

  // Computer: win if it can, block if it must, else random empty square.
  function findMove(mark) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      var marks = l.map(function (j) { return board[j]; });
      var countMark = marks.filter(function (v) { return v === mark; }).length;
      var countEmpty = marks.filter(function (v) { return v === ""; }).length;
      if (countMark === 2 && countEmpty === 1) {
        return l[marks.indexOf("")];
      }
    }
    return -1;
  }

  function cpuMove() {
    if (over) return;
    var move = findMove("O"); // win
    if (move === -1) move = findMove("X"); // block
    if (move === -1) {
      var empty = [];
      for (var i = 0; i < 9; i++) if (board[i] === "") empty.push(i);
      move = empty[Math.floor(Math.random() * empty.length)];
    }
    board[move] = "O";
    GZ.beep(500, 0.05);
    render();
    if (afterMove()) return;
    turn = "X";
    setStatus("Your turn (X)");
  }

  function resetBoard() {
    board = new Array(9).fill("");
    turn = "X"; over = false; playing = true;
    render();
    setStatus(mode === "cpu" ? "Your turn (X)" : "Player X’s turn");
    overScreen.classList.add("hidden");
  }

  function setMode(m) {
    mode = m;
    modeCpuBtn.classList.toggle("active", m === "cpu");
    mode2pBtn.classList.toggle("active", m === "2p");
    resetBoard();
  }

  modeCpuBtn.addEventListener("click", function () { setMode("cpu"); });
  mode2pBtn.addEventListener("click", function () { setMode("2p"); });

  document.getElementById("start-btn").addEventListener("click", function () {
    startScreen.classList.add("hidden");
    resetBoard();
  });
  document.getElementById("again-btn").addEventListener("click", resetBoard);
  updateHUD();
})();
