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

  var handSteps = {
    droitier: { 1: "D", 2: "G", 3: "D", 4: "G" },
    gaucher: { 1: "G", 2: "D", 3: "G", 4: "D" }
  };
  var handDesc = {
    droitier: "pied droit, gauche, droit, puis grand glissé du pied gauche",
    gaucher: "pied gauche, droit, gauche, puis grand glissé du pied droit"
  };
  var handLabel = {
    droitier: "un droitier",
    gaucher: "un gaucher"
  };

  document.querySelectorAll(".hand-toggle").forEach(function (toggleGroup) {
    var card = toggleGroup.closest(".diagram-card");
    if (!card) return;
    var svg = card.querySelector("svg");
    var desc = card.querySelector(".hand-desc");

    toggleGroup.querySelectorAll(".hand-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var hand = btn.getAttribute("data-hand-value");
        if (card.getAttribute("data-hand") === hand) return;

        toggleGroup.querySelectorAll(".hand-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        card.setAttribute("data-hand", hand);

        card.querySelectorAll(".foot-side").forEach(function (el) {
          var step = el.getAttribute("data-step");
          el.textContent = handSteps[hand][step];
        });

        if (desc) { desc.textContent = handDesc[hand]; }

        if (svg) {
          svg.setAttribute("aria-label", "Schéma vu de dessus des 4 pas d'approche pour " + handLabel[hand] + ", du départ jusqu'à la ligne de faute");
        }
      });
    });
  });
});
