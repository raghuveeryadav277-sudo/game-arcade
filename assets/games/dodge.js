/* Dodge Dash — endless dodger. Arrows or touch-drag. Score = seconds survived. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "dodge";
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
  var PW = 46, PH = 18, PY = H - 56;
  var player = { x: W / 2 - PW / 2 };
  var obstacles = [], running = false, paused = false;
  var raf = null, startTs = 0, elapsed = 0, lastSpawn = 0, spawnGap = 750;
  var keys = {}, targetX = null;

  function updateHUD() {
    scoreEl.textContent = Math.floor(elapsed);
    bestEl.textContent = GZ.getBest(KEY);
  }

  function canvasX(clientX) {
    var rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (!running || paused) return;
    targetX = canvasX(e.clientX) - PW / 2;
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!running || paused || targetX === null) return;
    targetX = canvasX(e.clientX) - PW / 2;
    e.preventDefault();
  });
  canvas.addEventListener("pointerup", function () { targetX = null; });
  canvas.addEventListener("pointerleave", function () { targetX = null; });

  document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
  });
  document.addEventListener("keyup", function (e) { keys[e.key] = false; });

  function spawnObstacle() {
    var w = 30 + Math.random() * 50;
    obstacles.push({
      x: Math.random() * (W - w),
      y: -30,
      w: w,
      h: 18 + Math.random() * 22,
      speed: Math.min(7, 2.2 + elapsed * 0.06)
    });
  }

  function loop(ts) {
    if (!running) return;
    if (paused) { drawPaused(); return; }
    elapsed = (ts - startTs) / 1000;
    // Player movement
    if (keys["ArrowLeft"]) { player.x -= 6; targetX = null; }
    if (keys["ArrowRight"]) { player.x += 6; targetX = null; }
    if (targetX !== null) {
      player.x += (targetX - player.x) * 0.25;
    }
    player.x = Math.max(0, Math.min(W - PW, player.x));
    // Spawn obstacles
    spawnGap = Math.max(340, 750 - elapsed * 12);
    if (ts - lastSpawn > spawnGap) {
      spawnObstacle();
      lastSpawn = ts;
    }
    // Move obstacles
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.y += o.speed;
      if (o.y > H) obstacles.splice(i, 1);
    }
    // Collision (AABB)
    for (var j = 0; j < obstacles.length; j++) {
      var ob = obstacles[j];
      if (player.x < ob.x + ob.w && player.x + PW > ob.x &&
          PY < ob.y + ob.h && PY + PH > ob.y) {
        endGame();
        return;
      }
    }
    updateHUD();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Lane guides
    ctx.strokeStyle = "#1c2044";
    ctx.lineWidth = 2;
    for (var x = W / 4; x < W; x += W / 4) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // Obstacles
    ctx.fillStyle = "#ff5c7a";
    obstacles.forEach(function (o) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // Player
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(player.x, PY, PW, PH);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOU", player.x + PW / 2, PY + 13);
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
    player.x = W / 2 - PW / 2;
    obstacles = []; running = true; paused = false;
    elapsed = 0; lastSpawn = 0; spawnGap = 750; targetX = null;
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    if (raf) cancelAnimationFrame(raf);
    startTs = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    GZ.beep(140, 0.3);
    var secs = Math.floor(elapsed);
    var isBest = GZ.saveBest(KEY, secs);
    finalScore.textContent = "You survived " + secs + " seconds!";
    bestLine.textContent = isBest
      ? "🎉 New best time!"
      : "Best: " + GZ.getBest(KEY) + " seconds";
    updateHUD();
    overScreen.classList.remove("hidden");
  }

  pauseBtn.addEventListener("click", function () {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    if (!paused) {
      // Shift the start time so paused time doesn't count
      startTs = performance.now() - elapsed * 1000;
      raf = requestAnimationFrame(loop);
    } else if (raf) cancelAnimationFrame(raf);
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
