(function () {
  var body = document.body;

  var FX_PER_USD = {
    USD: 1,
    HKD: 7.841,
    GBP: 0.7387,
    SGD: 1.2647
  };

  function convertAmount(amount, from, to) {
    return (amount / FX_PER_USD[from]) * FX_PER_USD[to];
  }

  function formatMoney(amount, ccy) {
    var rounded = Math.round(amount * 100) / 100;
    if (rounded > 0 && rounded < 1) {
      var minor = Math.round(rounded * 100);
      if (ccy === "USD") return minor + "¢";
      if (ccy === "GBP") return minor + "p";
    }
    var formatted = rounded.toLocaleString("en-US", {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    if (ccy === "USD") return "US$" + formatted;
    if (ccy === "HKD") return "HK$" + formatted;
    if (ccy === "GBP") return "£" + formatted;
    if (ccy === "SGD") return "S$" + formatted;
    return formatted;
  }

  function applyCurrency(code) {
    document.querySelectorAll(".money").forEach(function (el) {
      if (!el.hasAttribute("data-local-text")) {
        el.setAttribute("data-local-text", el.textContent);
      }
      var localText = el.getAttribute("data-local-text");
      if (code === "local") {
        el.textContent = localText;
        el.removeAttribute("title");
        return;
      }
      var from = el.getAttribute("data-ccy");
      var amount = parseFloat(el.getAttribute("data-amount"), 10);
      el.textContent = formatMoney(convertAmount(amount, from, code), code);
      el.setAttribute("title", "Published as " + localText);
    });
  }

  var currencySelect = document.querySelector("[data-currency-select]");
  if (currencySelect) {
    currencySelect.addEventListener("change", function () {
      applyCurrency(currencySelect.value);
    });
  }

  var menuBtn = document.querySelector("[data-menu-toggle]");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      body.classList.toggle("nav-open");
      menuBtn.setAttribute(
        "aria-expanded",
        body.classList.contains("nav-open") ? "true" : "false"
      );
      menuBtn.setAttribute(
        "aria-label",
        body.classList.contains("nav-open") ? "Close menu" : "Toggle navigation menu"
      );
    });
  }

  var COUNTRIES = [
    { code: "hk", name: "Hong Kong" },
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "sg", name: "Singapore" }
  ];
  var ALL_CODES = COUNTRIES.map(function (c) {
    return c.code;
  });
  var SLOT_LABELS = [
    "First country to compare",
    "Second country to compare",
    "Third country to compare"
  ];
  var slots = ["hk", "us", "gb"];

  function countryName(code) {
    for (var i = 0; i < COUNTRIES.length; i += 1) {
      if (COUNTRIES[i].code === code) return COUNTRIES[i].name;
    }
    return code;
  }

  function optionHtml(selectedCode) {
    return COUNTRIES.map(function (c) {
      var selected = c.code === selectedCode ? " selected" : "";
      var disabled =
        slots.indexOf(c.code) !== -1 && c.code !== selectedCode ? " disabled" : "";
      return (
        '<option value="' +
        c.code +
        '"' +
        selected +
        disabled +
        ">" +
        c.name +
        "</option>"
      );
    }).join("");
  }

  function reorderRow(row) {
    var cells = {};
    ALL_CODES.forEach(function (code) {
      cells[code] = row.querySelector(".col-" + code);
    });
    slots.forEach(function (code) {
      if (cells[code]) row.appendChild(cells[code]);
    });
    ALL_CODES.forEach(function (code) {
      if (slots.indexOf(code) === -1 && cells[code]) row.appendChild(cells[code]);
    });
  }

  function markEdgeColumns() {
    document.querySelectorAll(".is-first-compare-col, .is-last-compare-col").forEach(function (el) {
      el.classList.remove("is-first-compare-col", "is-last-compare-col");
    });
    document.querySelectorAll(".cmp tr").forEach(function (row) {
      var visible = [];
      row.querySelectorAll(".col-hk, .col-us, .col-gb, .col-sg").forEach(function (cell) {
        if (window.getComputedStyle(cell).display !== "none") visible.push(cell);
      });
      if (visible[0]) visible[0].classList.add("is-first-compare-col");
      if (visible.length) visible[visible.length - 1].classList.add("is-last-compare-col");
    });
  }

  function renderSelects() {
    document.querySelectorAll(".country-cards .country-card:not([hidden])").forEach(function (card, index) {
      var select = card.querySelector("select");
      var label = card.querySelector(".country-card__pick label");
      if (!select || index >= slots.length) return;
      select.id = "compare-slot-" + index;
      select.setAttribute("data-compare-slot", String(index));
      select.innerHTML = optionHtml(slots[index]);
      if (label) {
        label.setAttribute("for", select.id);
        label.textContent = SLOT_LABELS[index];
      }
    });
    document.querySelectorAll(".country-cards .country-card[hidden] select").forEach(function (select) {
      select.removeAttribute("data-compare-slot");
    });
    document.querySelectorAll("#capabilities .cmp thead").forEach(function (thead) {
      ALL_CODES.forEach(function (code) {
        var th = thead.querySelector(".col-" + code);
        if (th) th.textContent = countryName(code);
      });
    });
  }

  function syncCards() {
    var wrap = document.querySelector(".country-cards");
    if (!wrap) return;
    var cards = {};
    ALL_CODES.forEach(function (code) {
      cards[code] = wrap.querySelector('.country-card[data-country="' + code + '"]');
    });
    slots.forEach(function (code) {
      if (!cards[code]) return;
      cards[code].hidden = false;
      wrap.appendChild(cards[code]);
    });
    ALL_CODES.forEach(function (code) {
      if (slots.indexOf(code) !== -1 || !cards[code]) return;
      cards[code].hidden = true;
      wrap.appendChild(cards[code]);
    });
  }

  function applySlots() {
    ALL_CODES.forEach(function (code) {
      body.classList.toggle("cols-" + code, slots.indexOf(code) !== -1);
    });
    document.querySelectorAll(".cmp").forEach(function (table) {
      var colgroup = table.querySelector("colgroup");
      if (colgroup) {
        var cols = {};
        ALL_CODES.forEach(function (code) {
          cols[code] = colgroup.querySelector(".cmp__col-" + code);
        });
        slots.forEach(function (code) {
          if (cols[code]) colgroup.appendChild(cols[code]);
        });
        ALL_CODES.forEach(function (code) {
          if (slots.indexOf(code) === -1 && cols[code]) colgroup.appendChild(cols[code]);
        });
      }
      table.querySelectorAll("tr").forEach(reorderRow);
    });
    markEdgeColumns();
    syncCards();
    renderSelects();
  }

  var capabilities = document.getElementById("capabilities");
  if (capabilities) {
    applySlots();
    var searchInput = capabilities.querySelector("[data-capability-search]");
    var searchEmpty = capabilities.querySelector("[data-search-empty]");
    var searchStatus = capabilities.querySelector("[data-search-status]");

    function rowSearchText(row) {
      var name = row.querySelector(".product-name");
      var desc = row.querySelector(".product-desc");
      return (
        (name ? name.textContent : "") +
        " " +
        (desc ? desc.textContent : "")
      ).toLowerCase();
    }

    function applySearch(query) {
      query = (query || "").trim().toLowerCase();
      var matchCount = 0;
      capabilities.querySelectorAll(".capability-block").forEach(function (block) {
        var head = block.querySelector(".capability-block__head");
        var headText = head ? head.textContent.toLowerCase() : "";
        var headMatch = query !== "" && headText.indexOf(query) !== -1;
        var visible = 0;
        block.querySelectorAll("tbody tr").forEach(function (row) {
          var match =
            query === "" || headMatch || rowSearchText(row).indexOf(query) !== -1;
          row.hidden = !match;
          if (match) visible += 1;
        });
        block.hidden = query !== "" && visible === 0;
        matchCount += visible;
      });
      if (searchEmpty) {
        searchEmpty.hidden = query === "" || matchCount > 0;
        searchEmpty.textContent =
          matchCount > 0
            ? "No products match your search."
            : 'No products match “' + (query || "") + '”.';
      }
      if (searchStatus) {
        if (query === "") {
          searchStatus.textContent = "";
        } else if (matchCount === 0) {
          searchStatus.textContent = "No products match “" + query + "”.";
        } else {
          searchStatus.textContent =
            matchCount + (matchCount === 1 ? " product" : " products") + " match “" + query + "”.";
        }
      }
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        applySearch(searchInput.value);
      });
      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          searchInput.value = "";
          applySearch("");
        }
        if (event.key === "Enter") {
          event.preventDefault();
        }
      });
    }

    capabilities.querySelectorAll(".table-shell__scroller").forEach(function (scroller) {
      if (scroller.querySelector(".table-edge-shadow")) return;
      var edge = document.createElement("div");
      edge.className = "table-edge-shadow";
      edge.setAttribute("aria-hidden", "true");
      scroller.insertBefore(edge, scroller.firstChild);
    });

    function layoutCapabilityShadows() {
      capabilities.querySelectorAll(".table-shell__scroller").forEach(function (scroller) {
        var edge = scroller.querySelector(".table-edge-shadow");
        if (!edge) return;
        var height = scroller.scrollHeight;
        edge.style.height = height + "px";
        edge.style.marginBottom = -height + "px";
      });
    }

    function syncCapabilityFades() {
      capabilities.querySelectorAll(".table-shell").forEach(function (shell) {
        var scroller = shell.querySelector(".table-shell__scroller");
        if (!scroller) return;
        var maxScroll = scroller.scrollWidth - scroller.clientWidth;
        shell.classList.toggle(
          "is-at-end",
          maxScroll <= 1 || scroller.scrollLeft >= maxScroll - 1
        );
      });
    }

    capabilities.querySelectorAll(".table-shell__scroller").forEach(function (scroller) {
      scroller.addEventListener("scroll", syncCapabilityFades, { passive: true });
    });
    window.addEventListener("resize", function () {
      layoutCapabilityShadows();
      syncCapabilityFades();
    });
    layoutCapabilityShadows();
    syncCapabilityFades();
    window.requestAnimationFrame(function () {
      layoutCapabilityShadows();
      syncCapabilityFades();
    });
  }

  document.addEventListener("change", function (event) {
    var select = event.target.closest("[data-compare-slot]");
    if (!select) return;
    var slot = parseInt(select.getAttribute("data-compare-slot"), 10);
    if (slot >= slots.length) return;
    var next = select.value;
    if (slots.indexOf(next) !== -1) {
      select.value = slots[slot];
      return;
    }
    slots[slot] = next;
    applySlots();
  });

  document.addEventListener("click", function (event) {
    var wrap = event.target.closest(".country-card .compare-select-wrap");
    if (!wrap) return;
    var select = wrap.querySelector("select");
    if (!select || event.target === select) return;
    if (typeof select.showPicker === "function") {
      try {
        select.showPicker();
      } catch (err) {
        select.focus();
      }
    } else {
      select.focus();
    }
  });

  function wheelDeltaPx(event, axis) {
    var value = axis === "x" ? event.deltaX : event.deltaY;
    if (event.deltaMode === 1) value *= 16;
    else if (event.deltaMode === 2) {
      value *= axis === "x" ? window.innerWidth : window.innerHeight;
    }
    return value;
  }

  var tableWheelAxis = "";
  var tableWheelAt = 0;
  var pendingDy = 0;
  var pageScrollRaf = 0;

  function scrollPageBy(dy) {
    if (!dy) return;
    var html = document.documentElement;
    var scrollerEl = document.scrollingElement || html;
    var before = scrollerEl.scrollTop;
    window.scrollBy({ top: dy, left: 0, behavior: "instant" });
    if (Math.abs((document.scrollingElement || html).scrollTop - before) >= 0.5) {
      return;
    }
    scrollerEl.scrollTop = before + dy;
    if (Math.abs(scrollerEl.scrollTop - before) >= 0.5) return;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.scrollBy({ top: dy, left: 0, behavior: "instant" });
      }
    } catch (err) {}
  }

  function flushPageScroll() {
    pageScrollRaf = 0;
    var dy = pendingDy;
    pendingDy = 0;
    scrollPageBy(dy);
  }

  document.querySelectorAll(".table-shell__scroller").forEach(function (scroller) {
    scroller.addEventListener(
      "wheel",
      function (event) {
        if (event.ctrlKey || event.metaKey) return;

        var dx = wheelDeltaPx(event, "x");
        var dy = wheelDeltaPx(event, "y");
        if (event.shiftKey && dy && !dx) {
          dx = dy;
          dy = 0;
        }

        var now = Date.now();
        if (!tableWheelAxis || now - tableWheelAt > 160) {
          if (Math.abs(dx) > Math.abs(dy)) tableWheelAxis = "x";
          else if (dy) tableWheelAxis = "y";
          else return;
        }
        tableWheelAt = now;

        if (tableWheelAxis === "x") return;

        event.preventDefault();
        pendingDy += dy;
        if (!pageScrollRaf) {
          pageScrollRaf = window.requestAnimationFrame(flushPageScroll);
        }
      },
      { passive: false }
    );
  });
})();
