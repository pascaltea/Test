document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".diagram-card svg").forEach(function (svg) {
    var motions = svg.querySelectorAll("animateMotion");
    if (reduceMotion) {
      motions.forEach(function (m) { m.setAttribute("begin", "indefinite"); });
    }
  });

  document.querySelectorAll(".replay-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".diagram-card");
      if (!card) return;
      var paused = card.classList.toggle("paused");
      var svg = card.querySelector("svg");
      if (svg && typeof svg.pauseAnimations === "function") {
        if (paused) { svg.pauseAnimations(); } else { svg.unpauseAnimations(); }
      }
      btn.textContent = paused ? "▶ Lecture" : "⏸ Pause";
    });
  });
});
