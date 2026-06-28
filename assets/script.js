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

  // x=80 est toujours le côté gauche de l'image (pied gauche, "G"),
  // x=120 est toujours le côté droit (pied droit, "D") : seule l'étape
  // (1 à 4) qui occupe chaque position change selon la main.
  var handX = {
    droitier: { 1: 120, 2: 80, 3: 120, 4: 80 },
    gaucher: { 1: 80, 2: 120, 3: 80, 4: 120 }
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
          var x = handX[hand][step];
          el.textContent = x === 80 ? "G" : "D";
          el.setAttribute("x", x);
        });

        card.querySelectorAll(".foot, .foot-number").forEach(function (el) {
          var step = el.getAttribute("data-step");
          var x = handX[hand][step];
          if (el.tagName === "circle") {
            el.setAttribute("cx", x);
          } else {
            el.setAttribute("x", x);
          }
        });

        if (desc) { desc.textContent = handDesc[hand]; }

        if (svg) {
          svg.setAttribute("aria-label", "Schéma vu de dessus des 4 pas d'approche pour " + handLabel[hand] + ", du départ jusqu'à la ligne de faute");
        }
      });
    });
  });

  var scoreForm = document.getElementById("score-form");
  if (scoreForm) {
    var STORAGE_KEY = "bf_scores";

    var dateInput = document.getElementById("score-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    function loadScores() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveScores(scores) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    }

    function formatDate(iso) {
      var parts = iso.split("-");
      if (parts.length !== 3) return iso;
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

    function renderChart(scores) {
      var svg = document.getElementById("score-chart");
      if (!svg) return;
      svg.innerHTML = "";

      var sorted = scores.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
      var padLeft = 40, padRight = 20, padTop = 20, padBottom = 30;
      var width = 600, height = 220;
      var plotWidth = width - padLeft - padRight;
      var plotHeight = height - padTop - padBottom;
      var baselineY = padTop + plotHeight;

      function ns(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

      [0, 150, 300].forEach(function (val) {
        var y = padTop + (1 - val / 300) * plotHeight;
        var line = ns("line");
        line.setAttribute("x1", padLeft);
        line.setAttribute("x2", width - padRight);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "#e6e9ef");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);

        var label = ns("text");
        label.setAttribute("x", padLeft - 8);
        label.setAttribute("y", y + 3);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "9");
        label.setAttribute("fill", "#5a6472");
        label.textContent = val;
        svg.appendChild(label);
      });

      if (sorted.length === 0) return;

      var points = sorted.map(function (entry, i) {
        var x = sorted.length === 1 ? padLeft + plotWidth / 2 : padLeft + (i / (sorted.length - 1)) * plotWidth;
        var y = padTop + (1 - Math.min(entry.score, 300) / 300) * plotHeight;
        return { x: x, y: y, entry: entry };
      });

      if (points.length > 1) {
        var polyline = ns("polyline");
        polyline.setAttribute("points", points.map(function (p) { return p.x + "," + p.y; }).join(" "));
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", "#ff6b35");
        polyline.setAttribute("stroke-width", "2");
        svg.appendChild(polyline);
      }

      points.forEach(function (p) {
        var circle = ns("circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "#13294b");
        var title = ns("title");
        title.textContent = formatDate(p.entry.date) + " : " + p.entry.score;
        circle.appendChild(title);
        svg.appendChild(circle);
      });

      var baseline = ns("line");
      baseline.setAttribute("x1", padLeft);
      baseline.setAttribute("x2", width - padRight);
      baseline.setAttribute("y1", baselineY);
      baseline.setAttribute("y2", baselineY);
      baseline.setAttribute("stroke", "#cdd5e0");
      baseline.setAttribute("stroke-width", "1");
      svg.appendChild(baseline);
    }

    function render() {
      var scores = loadScores();
      var empty = document.getElementById("score-empty");
      var stats = document.getElementById("score-stats");
      var chartWrap = document.getElementById("score-chart-wrap");
      var listWrap = document.getElementById("score-list-wrap");
      var list = document.getElementById("score-list");

      if (scores.length === 0) {
        if (empty) empty.hidden = false;
        if (stats) stats.hidden = true;
        if (chartWrap) chartWrap.hidden = true;
        if (listWrap) listWrap.hidden = true;
        return;
      }

      if (empty) empty.hidden = true;
      if (stats) stats.hidden = false;
      if (chartWrap) chartWrap.hidden = false;
      if (listWrap) listWrap.hidden = false;

      var total = scores.reduce(function (sum, s) { return sum + s.score; }, 0);
      var best = Math.max.apply(null, scores.map(function (s) { return s.score; }));
      var avg = Math.round(total / scores.length);
      var sortedByDate = scores.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
      var last = sortedByDate[sortedByDate.length - 1].score;

      document.getElementById("stat-count").textContent = scores.length;
      document.getElementById("stat-best").textContent = best;
      document.getElementById("stat-avg").textContent = avg;
      document.getElementById("stat-last").textContent = last;

      if (list) {
        list.innerHTML = "";
        var newestFirst = scores.slice().sort(function (a, b) {
          return b.date.localeCompare(a.date) || b.id - a.id;
        });
        newestFirst.forEach(function (entry) {
          var li = document.createElement("li");

          var info = document.createElement("div");
          info.className = "score-list-info";

          var scoreSpan = document.createElement("span");
          scoreSpan.className = "score-list-score";
          scoreSpan.textContent = entry.score;
          info.appendChild(scoreSpan);

          var metaSpan = document.createElement("span");
          metaSpan.className = "score-list-meta";
          metaSpan.textContent = formatDate(entry.date) + (entry.note ? " — " + entry.note : "");
          info.appendChild(metaSpan);

          li.appendChild(info);

          var delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "score-list-delete";
          delBtn.setAttribute("aria-label", "Supprimer cette partie");
          delBtn.textContent = "✕";
          delBtn.addEventListener("click", function () {
            var remaining = loadScores().filter(function (s) { return s.id !== entry.id; });
            saveScores(remaining);
            render();
          });
          li.appendChild(delBtn);

          list.appendChild(li);
        });
      }

      renderChart(scores);
    }

    scoreForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var date = document.getElementById("score-date").value;
      var score = parseInt(document.getElementById("score-value").value, 10);
      var note = document.getElementById("score-note").value.trim();

      if (!date || isNaN(score) || score < 0 || score > 300) return;

      var scores = loadScores();
      scores.push({ id: Date.now(), date: date, score: score, note: note });
      saveScores(scores);

      document.getElementById("score-value").value = "";
      document.getElementById("score-note").value = "";

      render();
    });

    var clearBtn = document.getElementById("score-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (window.confirm("Effacer définitivement tout l'historique de scores sur cet appareil ?")) {
          saveScores([]);
          render();
        }
      });
    }

    render();
  }
});
