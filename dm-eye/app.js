(() => {
  const STORAGE_KEY = "dm-eye-pwa-v1";
  const Link = window.DmEyeLink;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function defaultStore() {
    return {
      codes: [],
      expanded: {},
      players: {},
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      const parsed = JSON.parse(raw);
      return {
        codes: Array.isArray(parsed.codes) ? parsed.codes.map(Link.normalizeCode).filter(Link.isValidCode) : [],
        expanded: parsed.expanded && typeof parsed.expanded === "object" ? parsed.expanded : {},
        players: parsed.players && typeof parsed.players === "object" ? parsed.players : {},
      };
    } catch {
      return defaultStore();
    }
  }

  const store = loadStore();
  let toastTimer = null;
  let flashCode = null;

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.error(err);
    }
  }

  function toast(message, kind = "info") {
    const el = $("#toast");
    el.textContent = message;
    el.dataset.kind = kind;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  function setStatus(status) {
    const el = $("#linkStatus");
    if (!el) return;
    const map = {
      online: ["Live link online", "1"],
      connecting: ["Connecting…", "0"],
      offline: ["Offline — retrying", "0"],
      error: ["Link error — retrying", "0"],
    };
    const [text, ok] = map[status] || ["Connecting…", "0"];
    el.textContent = text;
    el.dataset.ok = ok;
  }

  function escapeText(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function formatMod(n) {
    const v = Number(n) || 0;
    return v >= 0 ? `+${v}` : String(v);
  }

  function hpClass(player) {
    const cur = Number(player.hp?.current) || 0;
    const max = Math.max(1, Number(player.hp?.max) || 1);
    if (cur <= 0) return "is-hurt";
    if (cur >= max) return "is-full";
    if (cur / max <= 0.35) return "is-hurt";
    return "";
  }

  function hpLabel(player) {
    const cur = Number(player.hp?.current) || 0;
    const max = Math.max(1, Number(player.hp?.max) || 1);
    const temp = Math.max(0, Number(player.hp?.temp) || 0);
    return temp ? `HP ${cur}+${temp}/${max}` : `HP ${cur}/${max}`;
  }

  function hpPct(player) {
    const cur = Math.max(0, Number(player.hp?.current) || 0);
    const max = Math.max(1, Number(player.hp?.max) || 1);
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
  }

  function classLine(player) {
    const bits = [player.className, player.subclass].filter(Boolean);
    return bits.join(" · ") || "—";
  }

  function sourceLabel(source) {
    if (source === "codex") return "Codex";
    if (source === "mana") return "Aincrad Mana";
    return source || "Sheet";
  }

  function deathMarks(arr) {
    return (arr || []).map((on) => (on ? "●" : "○")).join(" ");
  }

  function formatCoinAmount(n) {
    const value = Math.max(0, Math.floor(Number(n) || 0));
    // Always reserve hundreds place (000) so columns stay even before players edit.
    return String(value).padStart(3, "0");
  }

  function moneyCoinsHTML(player) {
    const coins = player.coins || {};
    // Match Codex Profile coin row left→right: CP, SP, EP, GP, PP.
    // data-coin + CSS order pins visual order even if an old build reorders DOM.
    return [
      ["cp", "CP", coins.cp, 1],
      ["sp", "SP", coins.sp, 2],
      ["ep", "EP", coins.ep, 3],
      ["gp", "GP", coins.gp, 4],
      ["pp", "PP", coins.pp, 5],
    ]
      .map(
        ([id, label, n, order]) =>
          `<div class="coin-cell coin-${id}" data-coin="${id}" style="order:${order}"><span class="coin-unit">${label}</span><span class="coin-val">${escapeText(
            formatCoinAmount(n)
          )}</span></div>`
      )
      .join("");
  }

  function playerCardHTML(code, player, open) {
    const name = player.name || "Adventurer";
    const fresh = flashCode === code ? " is-fresh" : "";
    const pct = hpPct(player);
    return `<article class="player-card${open ? " is-open" : ""}${fresh}" data-code="${escapeText(code)}">
      <button type="button" class="player-tab" data-toggle="${escapeText(code)}" aria-expanded="${open ? "true" : "false"}">
        <span class="player-name">${escapeText(name)}</span>
        <span class="chev" aria-hidden="true">▾</span>
        <span class="player-meta">
          <span class="chip">Lv ${escapeText(player.level || 1)}</span>
          <span class="chip">AC ${escapeText(player.ac ?? 10)}</span>
          <span class="chip hp ${hpClass(player)}">${escapeText(hpLabel(player))}</span>
        </span>
      </button>
      <div class="player-body">
        <div class="hp-hero ${hpClass(player)}">
          <span class="hp-hero-label">Health</span>
          <span class="hp-hero-value">${escapeText(hpLabel(player))}</span>
          <div class="hp-bar" aria-hidden="true"><span style="width:${pct}%;background-position:${100 - pct}% 0"></span></div>
        </div>
        <div class="stat-grid">
          <div class="stat"><span class="k">Level</span><span class="v">${escapeText(player.level || 1)}</span></div>
          <div class="stat"><span class="k">AC</span><span class="v">${escapeText(player.ac ?? 10)}</span></div>
          <div class="stat"><span class="k">Class</span><span class="v">${escapeText(classLine(player))}</span></div>
          <div class="stat"><span class="k">Race</span><span class="v">${escapeText(player.race || "—")}</span></div>
          <div class="stat"><span class="k">Speed</span><span class="v">${escapeText(player.speed ?? 30)} ft</span></div>
          <div class="stat"><span class="k">Initiative</span><span class="v">${escapeText(formatMod(Link.abilityMod(player.abilities?.dex) + (Number(player.initiativeBonus) || 0)))}</span></div>
          <div class="stat"><span class="k">Hit Dice</span><span class="v">${escapeText(player.hitDice || "—")}</span></div>
          ${
            player.mana != null || player.maxMana != null
              ? `<div class="stat"><span class="k">Mana</span><span class="v">${escapeText(
                  `${Number(player.mana) || 0}/${Number(player.maxMana) || 100}`
                )}</span></div>`
              : ""
          }
        </div>
        <div class="ability-row">
          ${["str", "dex", "con", "int", "wis", "cha"]
            .map((key) => {
              const score = Number(player.abilities?.[key]) || 10;
              return `<div class="ability"><span class="k">${key.toUpperCase()}</span><span class="v">${score}</span><span class="m">${formatMod(
                Link.abilityMod(score)
              )}</span></div>`;
            })
            .join("")}
        </div>
        <div class="death-row">
          <span>Death successes ${escapeText(deathMarks(player.deathSaves?.success))}</span>
          <span>Fails ${escapeText(deathMarks(player.deathSaves?.fail))}</span>
        </div>
        <div class="money-row">
          <span class="k">Money</span>
          <div class="coins">${moneyCoinsHTML(player)}</div>
        </div>
        <div class="card-actions">
          <span class="source-pill">${escapeText(sourceLabel(player.source))} · ${escapeText(code)}</span>
          <button type="button" class="btn ghost tiny" data-unlink="${escapeText(code)}">Unlink</button>
        </div>
        <p class="muted tiny">Updated ${
          player.updatedAt ? escapeText(new Date(player.updatedAt).toLocaleTimeString()) : "—"
        }</p>
      </div>
    </article>`;
  }

  function render() {
    const list = $("#partyList");
    const empty = $("#partyEmpty");
    const count = $("#partyCount");
    count.textContent = `${store.codes.length} linked`;

    if (!store.codes.length) {
      empty.hidden = false;
      list.innerHTML = "";
      return;
    }

    empty.hidden = true;
    list.innerHTML = store.codes
      .map((code) => {
        const player = store.players[code] || {
          name: "Waiting for player…",
          level: "—",
          ac: "—",
          hp: { current: 0, max: 1, temp: 0 },
          abilities: {},
          deathSaves: { success: [false, false, false], fail: [false, false, false] },
        };
        return playerCardHTML(code, player, !!store.expanded[code]);
      })
      .join("");
  }

  function upsertPlayer(code, snapshot) {
    const prev = store.players[code];
    store.players[code] = {
      ...(prev || {}),
      ...snapshot,
      hp: {
        current: Number(snapshot.hp?.current) || 0,
        max: Math.max(1, Number(snapshot.hp?.max) || 1),
        temp: Math.max(0, Number(snapshot.hp?.temp) || 0),
      },
      abilities: { ...(snapshot.abilities || {}) },
      deathSaves: {
        success: (snapshot.deathSaves?.success || [false, false, false]).slice(0, 3),
        fail: (snapshot.deathSaves?.fail || [false, false, false]).slice(0, 3),
      },
      coins: {
        cp: Math.max(0, Number(snapshot.coins?.cp) || 0),
        sp: Math.max(0, Number(snapshot.coins?.sp) || 0),
        ep: Math.max(0, Number(snapshot.coins?.ep) || 0),
        gp: Math.max(0, Number(snapshot.coins?.gp) || 0),
        pp: Math.max(0, Number(snapshot.coins?.pp) || 0),
      },
    };
    persist();
    flashCode = code;
    render();
    setTimeout(() => {
      if (flashCode === code) {
        flashCode = null;
        $$(`[data-code="${CSS.escape(code)}"]`).forEach((el) => el.classList.remove("is-fresh"));
      }
    }, 700);
  }

  const watcher = new Link.DmLinkWatcher({
    onStatus: setStatus,
    onSnapshot: (code, snapshot) => {
      if (!store.codes.includes(code)) return;
      upsertPlayer(code, snapshot);
    },
  });

  for (const code of store.codes) watcher.watch(code);

  function addCode(raw) {
    const code = Link.normalizeCode(raw);
    const err = $("#linkError");
    if (!Link.isValidCode(code)) {
      err.hidden = false;
      err.textContent = "Enter a 6-character code from the player’s sheet.";
      return;
    }
    if (store.codes.includes(code)) {
      err.hidden = false;
      err.textContent = "That player is already linked.";
      return;
    }
    err.hidden = true;
    store.codes.push(code);
    store.expanded[code] = false;
    persist();
    watcher.watch(code);
    render();
    toast(`Linked ${code}`, "ok");
  }

  function unlink(code) {
    store.codes = store.codes.filter((c) => c !== code);
    delete store.expanded[code];
    delete store.players[code];
    persist();
    watcher.unwatch(code);
    render();
    toast(`Unlinked ${code}`, "info");
  }

  function bind() {
    $("#linkForm").addEventListener("submit", (e) => {
      e.preventDefault();
      addCode($("#codeInput").value);
      $("#codeInput").value = "";
      $("#codeInput").focus();
    });

    $("#codeInput").addEventListener("input", (e) => {
      e.target.value = Link.normalizeCode(e.target.value);
    });

    $("#partyList").addEventListener("click", (e) => {
      const unlinkBtn = e.target.closest("[data-unlink]");
      if (unlinkBtn) {
        e.preventDefault();
        unlink(unlinkBtn.dataset.unlink);
        return;
      }
      const toggle = e.target.closest("[data-toggle]");
      if (!toggle) return;
      const code = toggle.dataset.toggle;
      store.expanded[code] = !store.expanded[code];
      persist();
      render();
    });
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    const BUST_KEY = "dm-eye-bust";
    const BUST = "v11-cp-order";
    try {
      // One-time hard refresh for phones stuck on the old PP→CP money layout.
      if (localStorage.getItem(BUST_KEY) !== BUST) {
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        localStorage.setItem(BUST_KEY, BUST);
        location.reload();
        return;
      }
      const reg = await navigator.serviceWorker.register("./sw.js", {
        updateViaCache: "none",
      });
      await reg.update();
    } catch (err) {
      console.warn("SW failed", err);
    }
  }

  bind();
  render();
  registerSW();
})();
