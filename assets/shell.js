/* GameZone — shared shell helpers (sound toggle + best-score storage) */
(function () {
  "use strict";

  var SOUND_KEY = "gamezone_sound";
  var audioCtx = null;

  function soundOn() {
    return localStorage.getItem(SOUND_KEY) !== "off";
  }

  function beep(freq, dur) {
    if (!soundOn()) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq || 440;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.08));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (dur || 0.08));
    } catch (e) { /* audio unavailable — ignore */ }
  }

  function getBest(key) {
    var v = parseInt(localStorage.getItem("gamezone_best_" + key), 10);
    return isNaN(v) ? 0 : v;
  }

  // Returns true if the score is a new best (and saves it).
  function saveBest(key, score) {
    if (score > getBest(key)) {
      localStorage.setItem("gamezone_best_" + key, String(score));
      return true;
    }
    return false;
  }

  // Wire up every .sound-btn on the page.
  function initSoundButtons() {
    var btns = document.querySelectorAll(".sound-btn");
    btns.forEach(function (btn) {
      var update = function () {
        btn.textContent = soundOn() ? "🔊 Sound On" : "🔇 Sound Off";
      };
      update();
      btn.addEventListener("click", function () {
        localStorage.setItem(SOUND_KEY, soundOn() ? "off" : "on");
        update();
        beep(660, 0.08);
      });
    });
  }

  // Fill every [data-best="key"] element with its stored best score.
  // data-best-unit (e.g. " moves", "s") labels lower-is-better scores.
  function initBestLabels() {
    document.querySelectorAll("[data-best]").forEach(function (el) {
      var best = getBest(el.getAttribute("data-best"));
      var unit = el.getAttribute("data-best-unit") || "";
      el.textContent = best > 0 ? "Best: " + best + unit : "Best: —";
    });
  }

  // Live search + category filter for the hub (index.html only).
  function initHub() {
    var search = document.getElementById("search");
    var chips = document.querySelectorAll(".chip[data-cat]");
    var cards = document.querySelectorAll(".card[data-name][data-cat]");
    var noResults = document.getElementById("no-results");
    if (!search || !cards.length) return;
    var activeCat = "all";
    function apply() {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var name = (card.getAttribute("data-name") || "").toLowerCase();
        var desc = (card.getAttribute("data-desc") || "").toLowerCase();
        var cat = card.getAttribute("data-cat") || "";
        var ok = (activeCat === "all" || cat === activeCat) &&
                 (q === "" || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1);
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      if (noResults) noResults.style.display = shown === 0 ? "block" : "none";
    }
    search.addEventListener("input", apply);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        activeCat = chip.getAttribute("data-cat");
        apply();
      });
    });
  }

  window.GameZone = { beep: beep, getBest: getBest, saveBest: saveBest, soundOn: soundOn };

  document.addEventListener("DOMContentLoaded", function () {
    initSoundButtons();
    initBestLabels();
    initHub();
  });
})();
