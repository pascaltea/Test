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
    var card = toggleGroup.closest("[data-hand]");
    if (!card) return;
    var svg = card.querySelector("svg");
    var desc = card.querySelector(".hand-desc");
    var feet = card.querySelectorAll(".foot-side");

    toggleGroup.querySelectorAll(".hand-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var hand = btn.getAttribute("data-hand-value");
        if (card.getAttribute("data-hand") === hand) return;

        toggleGroup.querySelectorAll(".hand-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        card.setAttribute("data-hand", hand);

        if (feet.length) {
          feet.forEach(function (el) {
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
        }
      });
    });
  });

  document.querySelectorAll(".pin-diagram").forEach(function (diagram) {
    var toggle = diagram.querySelector(".pin-toggle");
    if (!toggle) return;
    toggle.querySelectorAll(".pin-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode-value");
        if (diagram.getAttribute("data-mode") === mode) return;
        toggle.querySelectorAll(".pin-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        diagram.setAttribute("data-mode", mode);
      });
    });
  });

  var weightInput = document.getElementById("weight-input");
  if (weightInput) {
    var weightFill = document.getElementById("weight-gauge-fill");
    var weightMarker = document.getElementById("weight-gauge-marker");
    var weightResult = document.getElementById("weight-result");
    var MIN_LBS = 6, MAX_LBS = 16;

    weightInput.addEventListener("input", function () {
      var kg = parseFloat(weightInput.value);
      if (!kg || kg <= 0) {
        weightResult.textContent = "Indiquez votre poids pour voir une suggestion.";
        weightFill.style.width = "0%";
        weightMarker.style.left = "0%";
        return;
      }
      var lbs = Math.round(kg * 0.2205);
      if (lbs < MIN_LBS) lbs = MIN_LBS;
      if (lbs > MAX_LBS) lbs = MAX_LBS;
      var pct = ((lbs - MIN_LBS) / (MAX_LBS - MIN_LBS)) * 100;
      weightFill.style.width = pct + "%";
      weightMarker.style.left = pct + "%";
      var approxKg = Math.round(lbs * 0.4536 * 10) / 10;
      weightResult.textContent = "Boule recommandée : environ " + lbs + " livres (≈ " + approxKg + " kg).";
    });
  }

  var scoreCalc = document.getElementById("score-calc");
  if (scoreCalc) {
    var calcPinsInput = document.getElementById("score-calc-pins");
    var calcRollBtn = document.getElementById("score-calc-roll");
    var calcResetBtn = document.getElementById("score-calc-reset");
    var calcMsg = document.getElementById("score-calc-msg");
    var calcFramesRow = document.getElementById("score-calc-frames");
    var calcRollsRow = document.getElementById("score-calc-rolls");
    var calcTotalsRow = document.getElementById("score-calc-totals");

    var frames = [];

    function setCalcMsg(text, isError) {
      calcMsg.textContent = text;
      calcMsg.classList.toggle("form-msg-error", !!isError);
    }

    function newGame() {
      frames = [];
      for (var i = 0; i < 10; i++) {
        frames.push({ rolls: [] });
      }
      setCalcMsg("Frame 1 : il reste 10 quille(s) à viser sur ce lancer.", false);
      calcPinsInput.value = "";
    }
    newGame();

    function currentFrameIndex() {
      for (var i = 0; i < 10; i++) {
        if (!frameComplete(i)) return i;
      }
      return -1;
    }

    function frameComplete(i) {
      var rolls = frames[i].rolls;
      if (i < 9) {
        if (rolls.length === 1 && rolls[0] === 10) return true;
        return rolls.length >= 2;
      }
      if (rolls.length < 2) return false;
      if (rolls.length === 2) {
        return rolls[0] !== 10 && rolls[0] + rolls[1] < 10;
      }
      return true;
    }

    function pinsRemaining(i) {
      var rolls = frames[i].rolls;
      if (i < 9) {
        if (rolls.length === 0) return 10;
        return 10 - rolls[0];
      }
      if (rolls.length === 0) return 10;
      if (rolls.length === 1) {
        return rolls[0] === 10 ? 10 : 10 - rolls[0];
      }
      if (rolls[0] === 10) {
        return rolls[1] === 10 ? 10 : 10 - rolls[1];
      }
      if (rolls[0] + rolls[1] === 10) return 10;
      return 0;
    }

    function frameScore(i) {
      var rolls = frames[i].rolls;
      if (i < 9) {
        if (rolls.length === 1 && rolls[0] === 10) {
          var n1 = nextRolls(i, 2);
          if (n1.length < 2) return null;
          return 10 + n1[0] + n1[1];
        }
        if (rolls.length === 2 && rolls[0] + rolls[1] === 10) {
          var n2 = nextRolls(i, 1);
          if (n2.length < 1) return null;
          return 10 + n2[0];
        }
        if (rolls.length === 2) return rolls[0] + rolls[1];
        return null;
      }
      if (frameComplete(9)) {
        return rolls.reduce(function (sum, r) { return sum + r; }, 0);
      }
      return null;
    }

    function nextRolls(i, count) {
      var result = [];
      for (var f = i + 1; f < 10 && result.length < count; f++) {
        frames[f].rolls.forEach(function (r) {
          if (result.length < count) result.push(r);
        });
      }
      return result;
    }

    function totalScore() {
      var total = 0;
      for (var i = 0; i < 10; i++) {
        var fs = frameScore(i);
        if (fs === null) return null;
        total += fs;
      }
      return total;
    }

    function render() {
      calcFramesRow.innerHTML = "";
      calcRollsRow.innerHTML = "";
      calcTotalsRow.innerHTML = "";

      var current = currentFrameIndex();
      var running = 0;
      var brokenAt = -1;

      for (var i = 0; i < 10; i++) {
        var th = document.createElement("th");
        th.textContent = i + 1;
        calcFramesRow.appendChild(th);

        var rollsTd = document.createElement("td");
        rollsTd.className = "score-calc-rolls-cell";
        if (i === current) rollsTd.classList.add("current-frame");
        rollsTd.textContent = formatRolls(i);
        calcRollsRow.appendChild(rollsTd);

        var totalTd = document.createElement("td");
        totalTd.className = "score-calc-total-cell";
        if (i === current) totalTd.classList.add("current-frame");
        var fs = frameScore(i);
        if (fs !== null && brokenAt === -1) {
          running += fs;
          totalTd.textContent = running;
        } else {
          if (brokenAt === -1) brokenAt = i;
          totalTd.textContent = "";
        }
        calcTotalsRow.appendChild(totalTd);
      }
    }

    function formatRolls(i) {
      var rolls = frames[i].rolls;
      if (rolls.length === 0) return "";
      if (i < 9) {
        if (rolls.length === 1 && rolls[0] === 10) return "X";
        if (rolls.length === 2) {
          var second = rolls[0] + rolls[1] === 10 ? "/" : (rolls[1] === 0 ? "-" : rolls[1]);
          var first = rolls[0] === 0 ? "-" : rolls[0];
          return first + " " + second;
        }
        return rolls[0] === 0 ? "-" : String(rolls[0]);
      }
      var labels = rolls.map(function (r, idx) {
        if (r === 10) return "X";
        if (idx > 0 && rolls[idx - 1] !== 10 && rolls[idx - 1] + r === 10) return "/";
        return r === 0 ? "-" : String(r);
      });
      return labels.join(" ");
    }

    calcRollBtn.addEventListener("click", function () {
      var i = currentFrameIndex();
      if (i === -1) {
        setCalcMsg("Partie terminée ! Cliquez sur « Recommencer » pour rejouer.", false);
        return;
      }
      var pins = parseInt(calcPinsInput.value, 10);
      var max = pinsRemaining(i);
      if (isNaN(pins) || pins < 0 || pins > 10) {
        setCalcMsg("Indiquez un nombre de quilles entre 0 et 10.", true);
        return;
      }
      if (pins > max) {
        setCalcMsg("Il ne reste que " + max + " quille(s) debout sur ce lancer.", true);
        return;
      }
      frames[i].rolls.push(pins);
      calcPinsInput.value = "";
      i = currentFrameIndex();
      if (i === -1) {
        setCalcMsg("Partie terminée ! Score final : " + totalScore() + ". Cliquez sur « Recommencer » pour rejouer.", false);
      } else {
        setCalcMsg("Frame " + (i + 1) + " : il reste " + pinsRemaining(i) + " quille(s) à viser sur ce lancer.", false);
      }
      render();
    });

    calcPinsInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        calcRollBtn.click();
      }
    });

    calcResetBtn.addEventListener("click", function () {
      newGame();
      render();
    });

    render();
  }

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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        return true;
      } catch (e) {
        return false;
      }
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

    var formMsg = document.getElementById("score-form-msg");
    function setFormMsg(text, isError) {
      if (!formMsg) return;
      formMsg.textContent = text;
      formMsg.classList.toggle("form-msg-error", !!isError);
    }

    scoreForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var date = document.getElementById("score-date").value;
      var score = parseInt(document.getElementById("score-value").value, 10);
      var note = document.getElementById("score-note").value.trim();

      if (!date) {
        setFormMsg("Merci d'indiquer une date.", true);
        return;
      }
      if (isNaN(score) || score < 0 || score > 300) {
        setFormMsg("Le score doit être un nombre entre 0 et 300.", true);
        return;
      }

      var scores = loadScores();
      scores.push({ id: Date.now(), date: date, score: score, note: note });
      if (!saveScores(scores)) {
        setFormMsg("Impossible d'enregistrer : le stockage local est bloqué ou plein sur ce navigateur.", true);
        return;
      }

      setFormMsg("Score ajouté !", false);
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

    function escapeCsvField(field) {
      var str = String(field);
      if (/[";\n]/.test(str)) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    var exportBtn = document.getElementById("score-export");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var scores = loadScores();
        if (scores.length === 0) return;

        var sorted = scores.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
        var rows = [["Date", "Score", "Note"]];
        sorted.forEach(function (entry) {
          rows.push([formatDate(entry.date), entry.score, entry.note || ""]);
        });
        var csv = rows.map(function (row) {
          return row.map(escapeCsvField).join(";");
        }).join("\r\n");

        var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "scores-bowling-" + new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    render();
  }
});
