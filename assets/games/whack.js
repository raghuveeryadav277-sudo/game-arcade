/* Whack-a-Mole — 3x3 grid, 30-second round. +1 per hit, -1 per miss. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "whack";
  var grid = document.getElementById("grid");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var timeEl = document.getElementById("time");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var pauseBtn = document.getElementById("pause-btn");

  var holes = [], score = 0, timeLeft = 30, running = false, paused = false;
  var timer = null, spawnTimer = null, moleTimer = null, activeHole = -1;

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
    timeEl.textContent = timeLeft;
  }

  // Build the 9 holes once
  for (var i = 0; i < 9; i++) {
    (function (idx) {
      var hole = document.createElement("button");
      hole.type = "button";
      hole.className = "hole";
      hole.setAttribute("aria-label", "Hole " + (idx + 1));
      hole.addEventListener("click", function () { whack(idx); });
      grid.appendChild(hole);
      holes.push(hole);
    })(i);
  }

  function hideMole() {
    if (activeHole >= 0) {
      holes[activeHole].classList.remove("up");
      holes[activeHole].textContent = "";
      activeHole = -1;
    }
    if (moleTimer) { clearTimeout(moleTimer); moleTimer = null; }
  }

  function showMole() {
    if (!running || paused) return;
    hideMole();
    activeHole = Math.floor(Math.random() * 9);
    holes[activeHole].classList.add("up");
    holes[activeHole].textContent = "🐹";
    moleTimer = setTimeout(function () {
      hideMole();
      scheduleSpawn();
    }, 850);
  }

  function scheduleSpawn() {
    if (!running || paused) return;
    if (spawnTimer) clearTimeout(spawnTimer);
    spawnTimer = setTimeout(showMole, 550);
  }

  function whack(idx) {
    if (!running || paused) return;
    if (idx === activeHole) {
      score++;
      GZ.beep(990, 0.08);
      hideMole();
      scheduleSpawn();
    } else {
      score = Math.max(0, score - 1); // miss costs a point, never below 0
      GZ.beep(180, 0.1);
    }
    updateHUD();
  }

  function tick() {
    if (!running || paused) return;
    timeLeft--;
    updateHUD();
    if (timeLeft <= 0) endGame();
  }

  function startGame() {
    score = 0; timeLeft = 30; running = true; paused = false;
    hideMole();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    if (timer) clearInterval(timer);
    if (spawnTimer) clearTimeout(spawnTimer);
    timer = setInterval(tick, 1000);
    scheduleSpawn();
  }

  function endGame() {
    running = false;
    if (timer) clearInterval(timer);
    if (spawnTimer) clearTimeout(spawnTimer);
    hideMole();
    var isBest = GZ.saveBest(KEY, score);
    finalScore.textContent = "Your score: " + score;
    bestLine.textContent = isBest
      ? "🎉 New best score!"
      : "Best score: " + GZ.getBest(KEY);
    updateHUD();
    overScreen.classList.remove("hidden");
  }

  pauseBtn.addEventListener("click", function () {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    if (!paused) scheduleSpawn();
    else {
      if (spawnTimer) clearTimeout(spawnTimer);
      if (moleTimer) clearTimeout(moleTimer);
    }
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
