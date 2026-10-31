/* Breakout — paddle (mouse/arrows/touch), 3 rows of bricks, 3 lives. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "breakout";
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var livesEl = document.getElementById("lives");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var endTitle = document.getElementById("end-title");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var pauseBtn = document.getElementById("pause-btn");

  var W = canvas.width, H = canvas.height;
  var PADDLE_W = 92, PADDLE_H = 12, PADDLE_Y = H - 32;
  var BRICK_ROWS = 3, BRICK_COLS = 7, BRICK_W = 68, BRICK_H = 22, BRICK_GAP = 8;
  var ROW_COLORS = ["#ff5c7a", "#ffc93c", "#00d4ff"];
  var paddle = { x: W / 2 - PADDLE_W / 2 };
  var ball = { x: W / 2, y: H - 60, dx: 3.2, dy: -3.2, r: 8 };
  var bricks = [], score = 0, lives = 3, running = false, paused = false;
  var raf = null;
  var keys = {};

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(Math.max(3 - lives, 0));
  }

  function buildBricks() {
    bricks = [];
    var totalW = BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP;
    var startX = (W - totalW) / 2;
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: startX + c * (BRICK_W + BRICK_GAP),
          y: 50 + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W, h: BRICK_H, alive: true, color: ROW_COLORS[r]
        });
      }
    }
  }

  function resetBall() {
    ball.x = W / 2; ball.y = H - 60;
    ball.dx = (Math.random() < 0.5 ? -1 : 1) * 3.2;
    ball.dy = -3.2;
  }

  function canvasX(clientX) {
    var rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }

  canvas.addEventListener("pointermove", function (e) {
    if (!running || paused) return;
    var x = canvasX(e.clientX) - PADDLE_W / 2;
    paddle.x = Math.max(0, Math.min(W - PADDLE_W, x));
    e.preventDefault();
  });
  document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
  });
  document.addEventListener("keyup", function (e) { keys[e.key] = false; });

  function loop() {
    if (!running) return;
    if (paused) { drawPaused(); return; }
    // Paddle via keys
    if (keys["ArrowLeft"]) paddle.x = Math.max(0, paddle.x - 7);
    if (keys["ArrowRight"]) paddle.x = Math.min(W - PADDLE_W, paddle.x + 7);

    ball.x += ball.dx;
    ball.y += ball.dy;
    // Walls
    if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.dx = -ball.dx;
    if (ball.y - ball.r < 0) ball.dy = -ball.dy;
    // Paddle
    if (ball.dy > 0 &&
        ball.y + ball.r >= PADDLE_Y && ball.y + ball.r <= PADDLE_Y + PADDLE_H + 10 &&
        ball.x >= paddle.x && ball.x <= paddle.x + PADDLE_W) {
      ball.dy = -Math.abs(ball.dy);
      // Angle depends on where it hits the paddle
      var hit = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
      ball.dx = hit * 4;
      GZ.beep(440, 0.04);
    }
    // Bricks
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        score += 10;
        GZ.beep(700, 0.05);
        updateHUD();
        ball.dy = -ball.dy;
        break;
      }
    }
    // Ball lost
    if (ball.y - ball.r > H) {
      lives--;
      updateHUD();
      if (lives <= 0) { endGame(false); return; }
      GZ.beep(160, 0.2);
      resetBall();
    }
    // Level cleared
    if (bricks.every(function (b) { return !b.alive; })) { endGame(true); return; }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    bricks.forEach(function (b) {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    ctx.fillStyle = "#7c5cff";
    ctx.fillRect(paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPaused() {
    ctx.fillStyle = "rgba(11,14,34,0.7)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⏸ Paused", W / 2, H / 2);
  }

  function startGame() {
    buildBricks();
    score = 0; lives = 3; running = true; paused = false;
    paddle.x = W / 2 - PADDLE_W / 2;
    resetBall();
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endGame(won) {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    var isBest = GZ.saveBest(KEY, score);
    endTitle.textContent = won ? "🎉 You Win!" : "Game Over";
    finalScore.textContent = won
      ? "Wall cleared! Your score: " + score
      : "Your score: " + score;
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
    if (!paused) raf = requestAnimationFrame(loop);
    else if (raf) cancelAnimationFrame(raf);
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
