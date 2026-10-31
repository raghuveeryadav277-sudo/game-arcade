/* Flappy Ball — click/tap/Space to flap, thread the pipes. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "flappy";
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var pauseBtn = document.getElementById("pause-btn");

  var W = canvas.width, H = canvas.height;
  var GRAVITY = 0.45, FLAP = -8.2, GAP = 132, PIPE_W = 64;
  var ball = { x: 110, y: H / 2, vy: 0, r: 15 };
  var pipes = [], score = 0, running = false, paused = false;
  var raf = null, frame = 0, speed = 2.2;

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
  }

  function spawnPipe() {
    var minY = 60, maxY = H - GAP - 60;
    var gapY = minY + Math.random() * (maxY - minY);
    pipes.push({ x: W + 10, gapY: gapY, passed: false });
  }

  function flap() {
    if (!running || paused) return;
    ball.vy = FLAP;
    GZ.beep(520, 0.05);
  }

  canvas.addEventListener("pointerdown", function (e) { flap(); e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") { flap(); e.preventDefault(); }
  });

  function loop() {
    if (!running) return;
    if (paused) { drawPaused(); return; }
    frame++;
    if (frame % 95 === 0) spawnPipe();
    speed = Math.min(4.4, 2.2 + score * 0.07);

    ball.vy += GRAVITY;
    ball.y += ball.vy;

    // Move pipes, score when passed
    for (var i = pipes.length - 1; i >= 0; i--) {
      var p = pipes[i];
      p.x -= speed;
      if (!p.passed && p.x + PIPE_W < ball.x - ball.r) {
        p.passed = true;
        score++;
        GZ.beep(980, 0.08);
        updateHUD();
      }
      if (p.x < -PIPE_W - 10) pipes.splice(i, 1);
    }

    if (checkCollision()) { endGame(); return; }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function checkCollision() {
    // Ground / ceiling
    if (ball.y + ball.r >= H - 8 || ball.y - ball.r <= 0) return true;
    // Pipes
    for (var i = 0; i < pipes.length; i++) {
      var p = pipes[i];
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + PIPE_W) {
        if (ball.y - ball.r < p.gapY || ball.y + ball.r > p.gapY + GAP) return true;
      }
    }
    return false;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Sky
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1b2a5e");
    grad.addColorStop(1, "#0b0e22");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Pipes
    ctx.fillStyle = "#2f9e44";
    pipes.forEach(function (p) {
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
      ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      ctx.fillStyle = "#37b24d";
      ctx.fillRect(p.x - 3, p.gapY - 14, PIPE_W + 6, 14);
      ctx.fillRect(p.x - 3, p.gapY + GAP, PIPE_W + 6, 14);
      ctx.fillStyle = "#2f9e44";
    });
    // Ground
    ctx.fillStyle = "#3b2d1e";
    ctx.fillRect(0, H - 8, W, 8);
    // Ball
    ctx.fillStyle = "#ffd76a";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ball.x + 5, ball.y - 4, 3, 0, Math.PI * 2);
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
    ball = { x: 110, y: H / 2, vy: 0, r: 15 };
    pipes = []; score = 0; running = true; paused = false; frame = 0; speed = 2.2;
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    spawnPipe();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
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
    if (!paused) raf = requestAnimationFrame(loop);
    else if (raf) cancelAnimationFrame(raf);
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
