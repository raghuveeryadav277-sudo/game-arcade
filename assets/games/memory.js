/* Memory Match — 4x4 grid, 8 pairs. Moves + timer. Best = fewest moves. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var BEST_KEY = "gamezone_best_memory";
  var grid = document.getElementById("grid");
  var movesEl = document.getElementById("moves");
  var timeEl = document.getElementById("time");
  var bestEl = document.getElementById("best");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");

  var EMOJIS = ["🍎", "🚀", "🐶", "⚽", "🌈", "🎵", "🦁", "🍕"];
  var cards = [], first = null, second = null, lock = false;
  var moves = 0, matched = 0, seconds = 0, timer = null, started = false;

  function fmt(s) {
    var m = Math.floor(s / 60), sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function getBestMoves() {
    var v = parseInt(localStorage.getItem(BEST_KEY), 10);
    return isNaN(v) ? null : v;
  }

  function updateHUD() {
    movesEl.textContent = moves;
    timeEl.textContent = fmt(seconds);
    var b = getBestMoves();
    bestEl.textContent = b === null ? "—" : b + " moves";
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildBoard() {
    grid.innerHTML = "";
    cards = [];
    var deck = shuffle(EMOJIS.concat(EMOJIS));
    deck.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      btn.textContent = "❓";
      btn.setAttribute("data-emoji", emoji);
      btn.addEventListener("click", function () { flip(btn); });
      grid.appendChild(btn);
      cards.push(btn);
    });
  }

  function startTimer() {
    if (started) return;
    started = true;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  function flip(btn) {
    if (lock || btn.classList.contains("flipped") || btn.classList.contains("matched")) return;
    startTimer();
    btn.classList.add("flipped");
    btn.textContent = btn.getAttribute("data-emoji");
    GZ.beep(600, 0.05);
    if (!first) { first = btn; return; }
    second = btn;
    moves++;
    updateHUD();
    if (first.getAttribute("data-emoji") === second.getAttribute("data-emoji")) {
      first.classList.add("matched");
      second.classList.add("matched");
      GZ.beep(990, 0.1);
      matched += 2;
      first = null; second = null;
      if (matched === 16) winGame();
    } else {
      lock = true;
      var a = first, b = second;
      setTimeout(function () {
        a.classList.remove("flipped"); a.textContent = "❓";
        b.classList.remove("flipped"); b.textContent = "❓";
        first = null; second = null; lock = false;
      }, 650);
    }
  }

  function winGame() {
    if (timer) clearInterval(timer);
    GZ.beep(880, 0.12);
    setTimeout(function () { GZ.beep(1170, 0.15); }, 130);
    var prev = getBestMoves();
    var isBest = prev === null || moves < prev;
    if (isBest) localStorage.setItem(BEST_KEY, String(moves));
    finalScore.textContent = "Finished in " + moves + " moves and " + fmt(seconds) + "!";
    bestLine.textContent = isBest
      ? "🎉 New best — fewest moves yet!"
      : "Best: " + prev + " moves";
    overScreen.classList.remove("hidden");
  }

  function startGame() {
    moves = 0; matched = 0; seconds = 0; started = false;
    first = null; second = null; lock = false;
    if (timer) clearInterval(timer);
    buildBoard();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
  }

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
