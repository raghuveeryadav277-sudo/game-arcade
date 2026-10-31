/* Snake — classic snake. Arrows/WASD + on-screen d-pad. Speeds up every 5 foods. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "snake";
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var pauseBtn = document.getElementById("pause-btn");

  var CELL = 20, COLS = 24, ROWS = 24;
  var snake = [], dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
  var food = null, score = 0, running = false, paused = false;
  var timer = null, stepMs = 140;
  // Speed options (ms per step): Slow 200, Medium 140, Fast 90.
  var SPEEDS = { slow: 200, medium: 140, fast: 90 };
  var speed = localStorage.getItem("gamezone_snake_speed") || "medium";
  if (!SPEEDS[speed]) speed = "medium";

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
  }

  function randomFood() {
    while (true) {
      var f = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      var onSnake = snake.some(function (s) { return s.x === f.x && s.y === f.y; });
      if (!onSnake) return f;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Food
    ctx.fillStyle = "#ff5c7a";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Snake
    snake.forEach(function (seg, i) {
      ctx.fillStyle = i === 0 ? "#7CFC9A" : "#3ddc84";
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    if (paused) {
      ctx.fillStyle = "rgba(11,14,34,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⏸ Paused", canvas.width / 2, canvas.height / 2);
    }
  }

  function step() {
    if (!running || paused) return;
    dir = nextDir;
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(); return; }
    // Self collision (ignore the tail cell that will move away this step,
    // unless the snake just ate and the tail stays — handled by checking
    // against all segments except the tail when not eating)
    var eating = head.x === food.x && head.y === food.y;
    var body = eating ? snake : snake.slice(0, snake.length - 1);
    var hitSelf = body.some(function (s) { return s.x === head.x && s.y === head.y; });
    if (hitSelf) { endGame(); return; }
    snake.unshift(head);
    if (eating) {
      score++;
      GZ.beep(880, 0.06);
      updateHUD();
      food = randomFood();
      if (score % 5 === 0) {
        stepMs = Math.max(70, stepMs - 12);
        clearInterval(timer);
        timer = setInterval(step, stepMs);
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function setDir(x, y) {
    // No 180-degree reversals
    if (x === -dir.x && y === -dir.y) return;
    if (x === -nextDir.x && y === -nextDir.y) return;
    nextDir = { x: x, y: y };
  }

  document.addEventListener("keydown", function (e) {
    if (!running) return;
    var k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") { setDir(0, -1); e.preventDefault(); }
    else if (k === "arrowdown" || k === "s") { setDir(0, 1); e.preventDefault(); }
    else if (k === "arrowleft" || k === "a") { setDir(-1, 0); e.preventDefault(); }
    else if (k === "arrowright" || k === "d") { setDir(1, 0); e.preventDefault(); }
  });

  // Speed picker on the start screen (remembered in localStorage).
  var speedBtns = document.querySelectorAll("#speed-picker .chip[data-speed]");
  function paintSpeed() {
    speedBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-speed") === speed);
    });
  }
  speedBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      speed = b.getAttribute("data-speed");
      localStorage.setItem("gamezone_snake_speed", speed);
      paintSpeed();
      GZ.beep(660, 0.06);
    });
  });
  paintSpeed();

  document.querySelectorAll("#dpad button[data-dir]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var d = btn.getAttribute("data-dir");
      if (d === "up") setDir(0, -1);
      else if (d === "down") setDir(0, 1);
      else if (d === "left") setDir(-1, 0);
      else if (d === "right") setDir(1, 0);
    });
  });

  function startGame() {
    snake = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }];
    dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
    score = 0; running = true; paused = false; stepMs = SPEEDS[speed];
    food = randomFood();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    draw();
    if (timer) clearInterval(timer);
    timer = setInterval(step, stepMs);
  }

  function endGame() {
    running = false;
    if (timer) clearInterval(timer);
    GZ.beep(140, 0.3);
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
    draw();
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
