/* Fruit Slice — slice fruit, dodge bombs. 3 lives. Combo bonus for multi-slices. */
(function () {
  "use strict";
  var GZ = window.GameZone;
  var KEY = "fruit-slice";
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var livesEl = document.getElementById("lives");
  var startScreen = document.getElementById("start-screen");
  var overScreen = document.getElementById("gameover-screen");
  var finalScore = document.getElementById("final-score");
  var bestLine = document.getElementById("best-line");
  var pauseBtn = document.getElementById("pause-btn");

  var W = canvas.width, H = canvas.height;
  var FRUITS = [
    { e: "🍎", r: 26 }, { e: "🍊", r: 26 }, { e: "🍉", r: 30 },
    { e: "🍋", r: 24 }, { e: "🍇", r: 24 }, { e: "🍓", r: 22 },
    { e: "🍑", r: 26 }, { e: "🥝", r: 24 }
  ];
  var items = [], particles = [], trail = [];
  var score = 0, lives = 3, running = false, paused = false;
  var raf = null, lastSpawn = 0, spawnGap = 650;
  var pointer = { down: false, x: 0, y: 0, px: 0, py: 0 };
  var flash = 0;

  function updateHUD() {
    scoreEl.textContent = score;
    bestEl.textContent = GZ.getBest(KEY);
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(Math.max(3 - lives, 0));
  }

  function spawn() {
    var bomb = Math.random() < 0.16;
    var f = bomb
      ? { e: "💣", r: 26, type: "bomb" }
      : Object.assign({}, FRUITS[Math.floor(Math.random() * FRUITS.length)], { type: "fruit" });
    f.x = 50 + Math.random() * (W - 100);
    f.y = H + 40;
    f.vx = (Math.random() - 0.5) * 4;
    f.vy = -(9 + Math.random() * 4 + Math.min(score * 0.05, 3));
    f.rot = Math.random() * Math.PI * 2;
    f.vr = (Math.random() - 0.5) * 0.12;
    items.push(f);
    if (Math.random() < 0.35) spawnExtra();
  }
  function spawnExtra() {
    var f = Object.assign({}, FRUITS[Math.floor(Math.random() * FRUITS.length)], { type: "fruit" });
    f.x = 50 + Math.random() * (W - 100);
    f.y = H + 40;
    f.vx = (Math.random() - 0.5) * 4;
    f.vy = -(9 + Math.random() * 4);
    f.rot = 0; f.vr = 0.1;
    items.push(f);
  }

  function burst(x, y, color) {
    for (var i = 0; i < 14; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
        life: 22, color: color
      });
    }
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    var t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    var cx = x1 + t * dx, cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  function sliceAt(x1, y1, x2, y2) {
    var sliced = 0;
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      if (distToSegment(it.x, it.y, x1, y1, x2, y2) < it.r + 8) {
        if (it.type === "bomb") {
          lives--;
          flash = 14;
          burst(it.x, it.y, "#ff5c7a");
          GZ.beep(120, 0.25);
          updateHUD();
          if (lives <= 0) { endGame(); return; }
        } else {
          sliced++;
          burst(it.x, it.y, "#ffd76a");
          GZ.beep(760 + sliced * 80, 0.07);
        }
        items.splice(i, 1);
      }
    }
    if (sliced > 0) {
      score += sliced + (sliced > 1 ? sliced - 1 : 0); // combo bonus
      updateHUD();
    }
  }

  function pointerPos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (!running || paused) return;
    var p = pointerPos(e);
    pointer.down = true; pointer.x = p.x; pointer.y = p.y; pointer.px = p.x; pointer.py = p.y;
    trail.push({ x: p.x, y: p.y, t: Date.now() });
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!running || paused || !pointer.down) return;
    var p = pointerPos(e);
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = p.x; pointer.y = p.y;
    trail.push({ x: p.x, y: p.y, t: Date.now() });
    sliceAt(pointer.px, pointer.py, pointer.x, pointer.y);
    e.preventDefault();
  });
  function endPointer() { pointer.down = false; }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointerleave", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  function loop(ts) {
    if (!running) return;
    if (paused) { drawPaused(); return; }
    if (ts - lastSpawn > spawnGap) {
      spawn();
      lastSpawn = ts;
      spawnGap = Math.max(380, 650 - score * 4);
    }
    // Update items
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.vy += 0.22; // gravity
      it.x += it.vx; it.y += it.vy; it.rot += it.vr;
      if (it.y > H + 60) items.splice(i, 1);
    }
    // Update particles
    for (var j = particles.length - 1; j >= 0; j--) {
      var pt = particles[j];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--;
      if (pt.life <= 0) particles.splice(j, 1);
    }
    // Trim trail
    var now = Date.now();
    trail = trail.filter(function (p) { return now - p.t < 220; });
    if (flash > 0) flash--;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = "rgba(255,60,90,0.25)"; ctx.fillRect(0, 0, W, H); }
    // Trail
    if (trail.length > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (var k = 1; k < trail.length; k++) ctx.lineTo(trail[k].x, trail[k].y);
      ctx.stroke();
    }
    // Items
    items.forEach(function (it) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.font = (it.r * 2) + "px serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(it.e, 0, 0);
      ctx.restore();
    });
    // Particles
    particles.forEach(function (pt) {
      ctx.globalAlpha = Math.max(pt.life / 22, 0);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
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
    items = []; particles = []; trail = [];
    score = 0; lives = 3; running = true; paused = false;
    spawnGap = 650; lastSpawn = 0;
    updateHUD();
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
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
    if (!paused) { lastSpawn = performance.now(); raf = requestAnimationFrame(loop); }
    else if (raf) cancelAnimationFrame(raf);
  });

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("again-btn").addEventListener("click", startGame);
  updateHUD();
})();
