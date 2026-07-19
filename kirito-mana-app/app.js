(() => {
  const SKILLS = window.KIRITO_SKILLS;
  const ABILITIES = window.DND_ABILITIES;
  const byId = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
  const STORAGE_KEY = window.STORAGE_KEY;
  const MAX_MANA_DEFAULT = 100;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function emptyProficiencies() {
    const p = {};
    for (const ab of ABILITIES) {
      for (const sk of ab.skills) p[sk.id] = false;
    }
    return p;
  }

  function defaultState() {
    const progress = {};
    for (const s of SKILLS) {
      progress[s.id] = {
        sessions: s.starter ? s.trainingNeeded : 0,
        learned: !!s.starter,
      };
    }
    return {
      version: "2.0.0",
      name: "Kirito",
      level: 1,
      xp: 0,
      className: "",
      subclass: "",
      race: "",
      background: "",
      alignment: "",
      hitDice: "1d8",
      maxMana: MAX_MANA_DEFAULT,
      mana: MAX_MANA_DEFAULT,
      round: 1,
      lastSkillId: null,
      lastWasUltimate: false,
      retreatUsedThisTurn: false,
      reactionTrial: false,
      dualUnlocked: false,
      combatLog: [],
      progress,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      proficiencies: emptyProficiencies(),
      hp: { current: 10, max: 10, temp: 0 },
      speed: 30,
      ac: 10,
      initiativeBonus: 0,
      size: "Medium",
      deathSaves: {
        success: [false, false, false],
        fail: [false, false, false],
      },
      coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      backstory: "",
      languages: "",
      personality: "",
      appearance: "",
      classFeatures: "",
      feats: "",
      proficienciesText: "",
      otherNotes: "",
      portraitDataUrl: "",
      equipment: [],
      dmLinkCode: "",
      dmLinkEnabled: false,
      updatedAt: Date.now(),
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const merged = {
        ...base,
        ...parsed,
        progress: { ...base.progress, ...(parsed.progress || {}) },
        abilities: { ...base.abilities, ...(parsed.abilities || {}) },
        proficiencies: { ...base.proficiencies, ...(parsed.proficiencies || {}) },
        hp: { ...base.hp, ...(parsed.hp || {}) },
        deathSaves: {
          success: [...(parsed.deathSaves?.success || base.deathSaves.success)],
          fail: [...(parsed.deathSaves?.fail || base.deathSaves.fail)],
        },
        coins: { ...base.coins, ...(parsed.coins || {}) },
        equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
      };
      while (merged.deathSaves.success.length < 3) merged.deathSaves.success.push(false);
      while (merged.deathSaves.fail.length < 3) merged.deathSaves.fail.push(false);
      merged.deathSaves.success = merged.deathSaves.success.slice(0, 3);
      merged.deathSaves.fail = merged.deathSaves.fail.slice(0, 3);

      for (const s of SKILLS) {
        if (!merged.progress[s.id]) {
          merged.progress[s.id] = {
            sessions: s.starter ? s.trainingNeeded : 0,
            learned: !!s.starter,
          };
        }
        if (s.starter) merged.progress[s.id].learned = true;
      }
      merged.mana = clamp(Number(merged.mana) || 0, 0, merged.maxMana);
      merged.hp.current = Number(merged.hp.current) || 0;
      merged.hp.max = Math.max(1, Number(merged.hp.max) || 1);
      merged.hp.temp = Math.max(0, Number(merged.hp.temp) || 0);
      return merged;
    } catch {
      return defaultState();
    }
  }

  let state = loadState();
  let saveTimer = null;
  let toastTimer = null;
  let deathPopupShown = false;
  let livedPopupShown = false;
  let dmPublisher = null;
  let dmLinkStatus = "offline";

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function ensureDmLinkCode() {
    const Link = window.DmEyeLink;
    if (!Link) return;
    if (!Link.isValidCode(state.dmLinkCode)) {
      state.dmLinkCode = Link.generateCode();
    }
  }

  function setDmLinkStatusText(status) {
    dmLinkStatus = status || "offline";
    const el = $("#dmLinkStatus");
    if (!el) return;
    if (!state.dmLinkEnabled) {
      el.textContent = "Sharing off — DM Eye will not see updates";
      return;
    }
    const map = {
      online: "Sharing on · live",
      connecting: "Sharing on · connecting…",
      offline: "Sharing on · reconnecting…",
      error: "Sharing on · link error, retrying…",
    };
    el.textContent = map[dmLinkStatus] || "Sharing on";
  }

  function stopDmPublisher() {
    if (!dmPublisher) return;
    try {
      dmPublisher.stop();
    } catch (_) {}
    dmPublisher = null;
  }

  function syncDmLink() {
    const Link = window.DmEyeLink;
    if (!Link) return;
    ensureDmLinkCode();
    if (!state.dmLinkEnabled) {
      stopDmPublisher();
      setDmLinkStatusText("offline");
      return;
    }
    if (!dmPublisher || dmPublisher.code !== state.dmLinkCode) {
      stopDmPublisher();
      dmPublisher = new Link.DmLinkPublisher({
        source: "mana",
        onStatus: setDmLinkStatusText,
      });
      try {
        dmPublisher.start(state.dmLinkCode);
      } catch (err) {
        console.warn(err);
        setDmLinkStatusText("error");
        return;
      }
    }
    dmPublisher.publish(Link.snapshotFromState(state, "mana"));
  }

  function persist(immediate = false) {
    state.updatedAt = Date.now();
    const write = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaveBadge(true);
        syncDmLink();
      } catch (err) {
        setSaveBadge(false, "Save failed — storage full?");
        console.error(err);
      }
    };
    if (immediate) {
      clearTimeout(saveTimer);
      write();
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(write, 80);
  }

  function setSaveBadge(ok, msg) {
    const el = $("#saveBadge");
    if (!el) return;
    el.textContent = msg || (ok ? "Saved on this phone" : "Not saved");
    el.dataset.ok = ok ? "1" : "0";
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

  function pb() {
    return window.proficiencyBonusForLevel(state.level);
  }

  function modFor(abilityKey) {
    return window.abilityModifier(state.abilities[abilityKey]);
  }

  function skillTotal(abilityKey, skillId) {
    const m = modFor(abilityKey);
    return m + (state.proficiencies[skillId] ? pb() : 0);
  }

  function passivePerception() {
    return 10 + skillTotal("wis", "perception");
  }

  function initiativeTotal() {
    return modFor("dex") + (Number(state.initiativeBonus) || 0);
  }

  function hpTotalDisplay() {
    return state.hp.current + state.hp.temp;
  }

  /* ---------- Mana / sword skills (existing) ---------- */
  function isLearned(id) {
    return !!state.progress[id]?.learned;
  }

  function prereqsMet(skill) {
    return (skill.prerequisite || []).every((id) => isLearned(id));
  }

  function dualGateOpen() {
    return state.level >= 3 && state.reactionTrial && isLearned("dual-blades");
  }

  function skillStatus(skill) {
    if (isLearned(skill.id)) return "learned";
    if (skill.dual || skill.isGate) {
      if (skill.isGate) {
        if (state.level < skill.levelRequired) return "locked";
        if (!state.reactionTrial || !prereqsMet(skill)) return "locked";
        return "unlocked";
      }
      if (!dualGateOpen() && skill.id !== "dual-blades") return "locked";
    }
    if (state.level < skill.levelRequired) return "locked";
    if (!prereqsMet(skill)) return "locked";
    const sessions = state.progress[skill.id]?.sessions || 0;
    if (sessions > 0 && sessions < skill.trainingNeeded) return "training";
    return "unlocked";
  }

  function canUse(skill) {
    if (skillStatus(skill) !== "learned") return false;
    if (skill.dual && !dualGateOpen()) return false;
    if (skill.id === "retreat" && state.retreatUsedThisTurn) return false;
    if (skill.mana > state.mana) return false;
    if (skill.isGate) return false;
    return true;
  }

  function regenFor(skill) {
    if (!skill) return 10;
    if (skill.tier === "Ultimate") return 0;
    if (skill.tier === "Basic") return 7;
    return 5;
  }

  function pushLog(entry) {
    state.combatLog.unshift({ t: Date.now(), round: state.round, ...entry });
    state.combatLog = state.combatLog.slice(0, 40);
  }

  function useSkill(id) {
    const skill = byId[id];
    if (!skill) return;
    if (!canUse(skill)) {
      const status = skillStatus(skill);
      if (status !== "learned") return toast("Not learned yet", "warn");
      if (skill.id === "retreat" && state.retreatUsedThisTurn)
        return toast("Retreat already used this turn", "warn");
      if (skill.mana > state.mana) return toast("Not enough mana", "warn");
      return toast("Can't use that now", "warn");
    }
    const before = state.mana;
    state.mana = clamp(state.mana - skill.mana, 0, state.maxMana);
    state.lastSkillId = skill.id;
    state.lastWasUltimate = skill.tier === "Ultimate";
    if (skill.id === "retreat") state.retreatUsedThisTurn = true;
    pushLog({ skill: skill.name, cost: skill.mana, before, after: state.mana, kind: "spend" });
    persist();
    render();
    toast(skill.mana === 0 ? `${skill.name} · free` : `${skill.name} · −${skill.mana} mana`, "ok");
    if (navigator.vibrate) navigator.vibrate(skill.tier === "Ultimate" ? 40 : 12);
  }

  function endTurn() {
    const last = state.lastSkillId ? byId[state.lastSkillId] : null;
    let regen = 0;
    if (state.lastWasUltimate) regen = 0;
    else if (!last) regen = 10;
    else regen = regenFor(last);
    const before = state.mana;
    state.mana = clamp(state.mana + regen, 0, state.maxMana);
    state.round += 1;
    state.retreatUsedThisTurn = false;
    state.lastSkillId = null;
    state.lastWasUltimate = false;
    pushLog({ skill: "Turn regen", cost: 0, regen, before, after: state.mana, kind: "regen" });
    persist();
    render();
    toast(regen ? `Turn ${state.round} · +${regen} mana` : `Turn ${state.round} · hard cool`, "ok");
  }

  function adjustMana(delta) {
    state.mana = clamp(state.mana + delta, 0, state.maxMana);
    persist();
    render();
  }

  function refillMana() {
    state.mana = state.maxMana;
    persist();
    render();
    toast("Mana refilled", "ok");
  }

  function shortRest() {
    state.mana = clamp(state.mana + 50, 0, state.maxMana);
    state.round = 1;
    state.retreatUsedThisTurn = false;
    state.lastSkillId = null;
    state.lastWasUltimate = false;
    persist();
    render();
    toast("Short rest · +50 mana", "ok");
  }

  function longRest() {
    state.mana = state.maxMana;
    state.hp.current = state.hp.max;
    state.hp.temp = 0;
    state.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    deathPopupShown = false;
    livedPopupShown = false;
    state.round = 1;
    state.retreatUsedThisTurn = false;
    state.lastSkillId = null;
    state.lastWasUltimate = false;
    persist();
    render();
    toast("Long rest · full mana & HP", "ok");
  }

  function train(id) {
    const skill = byId[id];
    if (!skill) return;
    if (skill.starter) return toast("Already part of your starter kit", "warn");
    const status = skillStatus(skill);
    if (status === "locked") return toast("Still locked", "warn");
    if (status === "learned") return toast("Already learned", "warn");
    const row = state.progress[id];
    row.sessions = (row.sessions || 0) + 1;
    if (row.sessions >= skill.trainingNeeded) {
      row.learned = true;
      row.sessions = skill.trainingNeeded;
      state.dualUnlocked = dualGateOpen();
      toast(`${skill.name} learned!`, "ok");
    } else {
      toast(`${skill.name} training ${row.sessions}/${skill.trainingNeeded}`, "ok");
    }
    persist();
    render();
  }

  /* ---------- HP / death saves (pools are fully separate) ---------- */
  let hpActionLock = false;
  function withHpLock(fn) {
    if (hpActionLock) return;
    hpActionLock = true;
    try {
      fn();
    } finally {
      setTimeout(() => {
        hpActionLock = false;
      }, 180);
    }
  }

  /** Current HP only. Negative delta damages; positive heals (may exceed max). */
  function adjustCurrentHp(delta) {
    const n = Math.floor(Number(delta) || 0);
    if (!n) return;
    if (n < 0) state.hp.current = Math.max(0, state.hp.current + n);
    else state.hp.current += n;
    persist();
    render();
    toast(n < 0 ? `Current HP ${n}` : `Current HP +${n}`, n < 0 ? "warn" : "ok");
  }

  /** Temp HP only. Never touches current HP. Cannot go below 0. */
  function adjustTempHp(delta) {
    const n = Math.floor(Number(delta) || 0);
    if (!n) return;
    state.hp.temp = Math.max(0, (Number(state.hp.temp) || 0) + n);
    persist();
    render();
    toast(n < 0 ? `Temp HP ${n}` : `Temp HP +${n}`, n < 0 ? "warn" : "ok");
  }

  function healAllCurrent() {
    state.hp.current = state.hp.max;
    persist();
    render();
    toast("Current HP → max", "ok");
  }

  function clearTempHp() {
    state.hp.temp = 0;
    persist();
    render();
    toast("Temp HP cleared", "ok");
  }

  function checkDeathSaveCompletions() {
    const fails = state.deathSaves.fail.filter(Boolean).length;
    const successes = state.deathSaves.success.filter(Boolean).length;
    if (fails >= 3 && !deathPopupShown) {
      deathPopupShown = true;
      showOverlay("died");
    }
    if (successes >= 3 && !livedPopupShown) {
      livedPopupShown = true;
      const prompts = window.LIVED_PROMPTS;
      $("#livedPrompt").textContent =
        prompts[Math.floor(Math.random() * prompts.length)];
      showOverlay("lived");
    }
  }

  function toggleDeathSave(kind, index) {
    const arr = state.deathSaves[kind];
    arr[index] = !arr[index];
    if (kind === "fail" && state.deathSaves.fail.filter(Boolean).length < 3) {
      deathPopupShown = false;
    }
    if (kind === "success" && state.deathSaves.success.filter(Boolean).length < 3) {
      livedPopupShown = false;
    }
    persist();
    render();
    checkDeathSaveCompletions();
  }

  function youveBeenHealed() {
    state.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    deathPopupShown = false;
    livedPopupShown = false;
    persist();
    render();
    showOverlay("healed");
  }

  function showOverlay(name) {
    const map = {
      died: "#diedOverlay",
      lived: "#livedOverlay",
      healed: "#healedOverlay",
    };
    const el = $(map[name]);
    if (el) el.hidden = false;
  }

  function hideOverlay(name) {
    const map = {
      died: "#diedOverlay",
      lived: "#livedOverlay",
      healed: "#healedOverlay",
    };
    const el = $(map[name]);
    if (el) el.hidden = true;
  }

  /* ---------- Equipment ---------- */
  function addEquipment() {
    state.equipment.unshift({
      id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: "New item",
      description: "",
    });
    persist();
    render();
  }

  function updateEquipment(id, field, value) {
    const item = state.equipment.find((e) => e.id === id);
    if (!item) return;
    item[field] = value;
    persist();
  }

  function removeEquipment(id) {
    state.equipment = state.equipment.filter((e) => e.id !== id);
    persist();
    render();
  }

  /* ---------- Portrait ---------- */
  function resizeImageFile(file, maxSize = 512) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Backup ---------- */
  function resetProgress() {
    if (!confirm("Reset ALL saved progress on this phone?")) return;
    state = defaultState();
    deathPopupShown = false;
    livedPopupShown = false;
    persist(true);
    render();
    toast("Progress reset", "warn");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aincrad-mana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exported", "ok");
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("bad");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        state = loadState();
        deathPopupShown = false;
        livedPopupShown = false;
        persist(true);
        render();
        toast("Backup restored", "ok");
      } catch {
        toast("Could not import backup", "warn");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Render helpers ---------- */
  function statusLabel(status) {
    return (
      {
        learned: "Learned",
        unlocked: "Unlocked",
        training: "Training",
        locked: "Locked",
      }[status] || status
    );
  }

  function vitalsHTML(prefix) {
    const total = hpTotalDisplay();
    const over = state.hp.current > state.hp.max;
    return `
      <div class="vitals-card" data-vitals="${prefix}">
        <div class="vitals-grid">
          <label class="field tight"><span>AC</span>
            <input type="number" inputmode="numeric" data-vit="ac" value="${state.ac}" />
          </label>
          <label class="field tight"><span>Speed</span>
            <input type="number" inputmode="numeric" data-vit="speed" value="${state.speed}" />
          </label>
          <label class="field tight"><span>Initiative</span>
            <input type="text" readonly value="${window.formatMod(initiativeTotal())}" />
            <span class="mini-hint">DEX ${window.formatMod(modFor("dex"))} + bonus</span>
          </label>
          <label class="field tight"><span>Init Bonus</span>
            <input type="number" inputmode="numeric" data-vit="initiativeBonus" value="${state.initiativeBonus}" />
          </label>
          <label class="field tight"><span>Size</span>
            <select data-vit="size">
              ${window.DND_SIZES.map(
                (s) =>
                  `<option value="${s}" ${s === state.size ? "selected" : ""}>${s}</option>`
              ).join("")}
            </select>
          </label>
          <label class="field tight"><span>Passive Perc.</span>
            <input type="text" readonly value="${passivePerception()}" />
          </label>
        </div>

        <div class="hp-block">
          <div class="total-health">
            <p class="label">Total Health</p>
            <p class="hp-readout total-readout">${total}</p>
            <p class="muted tiny">Current ${state.hp.current} + Temp ${state.hp.temp}</p>
          </div>

          <div class="hp-pool current-pool">
            <div class="pool-head">
              <div>
                <p class="label">Current HP</p>
                <p class="pool-readout">
                  <span class="${over ? "over-max" : ""}">${state.hp.current}</span>
                  <span class="slash">/</span>${state.hp.max}
                </p>
              </div>
              <label class="field tight"><span>Max HP</span>
                <input type="number" inputmode="numeric" data-vit="hpMax" value="${state.hp.max}" />
              </label>
            </div>
            <div class="hp-bar" aria-hidden="true">
              <div class="hp-fill" style="width:${Math.min(
                100,
                (state.hp.current / Math.max(1, state.hp.max)) * 100
              )}%"></div>
            </div>
            <div class="hp-buttons">
              <button type="button" class="btn ghost" data-pool="current" data-delta="-5">-5</button>
              <button type="button" class="btn ghost" data-pool="current" data-delta="-1">-1</button>
              <button type="button" class="btn primary" data-pool="current" data-delta="healall">Heal All</button>
              <button type="button" class="btn ghost" data-pool="current" data-delta="1">+1</button>
              <button type="button" class="btn ghost" data-pool="current" data-delta="5">+5</button>
            </div>
          </div>

          <div class="hp-pool temp-pool">
            <div class="pool-head">
              <div>
                <p class="label">Temp HP</p>
                <p class="pool-readout temp-readout">${state.hp.temp}</p>
              </div>
              <label class="field tight"><span>Set Temp</span>
                <input type="number" inputmode="numeric" data-vit="hpTemp" value="${state.hp.temp}" />
              </label>
            </div>
            <div class="hp-buttons">
              <button type="button" class="btn ghost" data-pool="temp" data-delta="-5">-5</button>
              <button type="button" class="btn ghost" data-pool="temp" data-delta="-1">-1</button>
              <button type="button" class="btn ghost" data-pool="temp" data-delta="clear">Clear</button>
              <button type="button" class="btn ghost" data-pool="temp" data-delta="1">+1</button>
              <button type="button" class="btn ghost" data-pool="temp" data-delta="5">+5</button>
            </div>
            <p class="muted tiny hp-hint">Temp and current are separate. Buttons never move damage between pools.</p>
          </div>
        </div>

        <div class="death-block">
          <div>
            <p class="label">Death Saves — Success</p>
            <div class="pips" data-death="success">
              ${[0, 1, 2]
                .map(
                  (i) =>
                    `<button type="button" class="pip ${
                      state.deathSaves.success[i] ? "filled" : ""
                    }" data-death-kind="success" data-death-i="${i}" aria-label="Success ${
                      i + 1
                    }"></button>`
                )
                .join("")}
            </div>
          </div>
          <div>
            <p class="label">Death Saves — Failure</p>
            <div class="pips" data-death="fail">
              ${[0, 1, 2]
                .map(
                  (i) =>
                    `<button type="button" class="pip fail ${
                      state.deathSaves.fail[i] ? "filled" : ""
                    }" data-death-kind="fail" data-death-i="${i}" aria-label="Failure ${
                      i + 1
                    }"></button>`
                )
                .join("")}
            </div>
          </div>
        </div>
        <button type="button" class="btn ghost full" data-healed>You've been healed!</button>
      </div>
    `;
  }

  function handleVitalsChange(e) {
    const root = e.target.closest(".vitals-root");
    if (!root) return;
    const t = e.target;
    const key = t.dataset.vit;
    if (!key) return;
    if (key === "hpMax") state.hp.max = Math.max(1, Number(t.value) || 1);
    else if (key === "hpTemp") state.hp.temp = Math.max(0, Number(t.value) || 0);
    else if (key === "ac") state.ac = Number(t.value) || 0;
    else if (key === "speed") state.speed = Number(t.value) || 0;
    else if (key === "initiativeBonus") state.initiativeBonus = Number(t.value) || 0;
    else if (key === "size") state.size = t.value;
    else return;
    persist();
    render();
  }

  function handleVitalsClick(e) {
    const root = e.target.closest(".vitals-root");
    if (!root) return;

    const poolBtn = e.target.closest("[data-pool][data-delta]");
    if (poolBtn) {
      e.preventDefault();
      e.stopPropagation();
      const pool = poolBtn.getAttribute("data-pool");
      const delta = poolBtn.getAttribute("data-delta");
      withHpLock(() => {
        if (pool === "current") {
          if (delta === "healall") healAllCurrent();
          else adjustCurrentHp(Number(delta));
        } else if (pool === "temp") {
          if (delta === "clear") clearTempHp();
          else adjustTempHp(Number(delta));
        }
      });
      return;
    }

    const pip = e.target.closest("[data-death-kind]");
    if (pip) {
      e.preventDefault();
      toggleDeathSave(pip.dataset.deathKind, Number(pip.dataset.deathI));
      return;
    }

    if (e.target.closest("[data-healed]")) {
      e.preventDefault();
      youveBeenHealed();
    }
  }

  function skillCardHTML(skill, mode) {
    const status = skillStatus(skill);
    const usable = mode === "combat" && canUse(skill);
    const sessions = state.progress[skill.id]?.sessions || 0;
    const meta = [
      skill.actionType,
      skill.mana === 0 ? "Free" : `${skill.mana} mana`,
      skill.range,
    ].join(" · ");
    const totalHours = (skill.trainingNeeded || 0) * (skill.hoursEach || 1);
    const trainBits =
      mode === "train"
        ? `<div class="train-detail">
            <p><strong>Unlock:</strong> Level ${skill.levelRequired}</p>
            <p><strong>Time:</strong> ${
              skill.trainingNeeded
                ? `${skill.trainingNeeded} sessions · ~${totalHours} hr total`
                : "None (starter)"
            }</p>
            <p><strong>DC:</strong> ${skill.trainDc || "—"} · <strong>Prereq:</strong> ${
              (skill.prerequisite || []).length
                ? skill.prerequisite.join(", ")
                : "—"
            }</p>
            <p><strong>Drill:</strong> ${skill.drill || "—"}</p>
            <p><strong>Field goal:</strong> ${skill.fieldGoal || "—"}</p>
          </div>
          ${
            status !== "learned" && status !== "locked"
              ? `<div class="train-row"><span>${sessions}/${skill.trainingNeeded} sessions</span>
           <button type="button" class="btn tiny" data-train="${skill.id}">Train +1</button></div>`
              : status === "learned"
                ? `<div class="train-row muted">Complete</div>`
                : `<div class="train-row muted">Locked</div>`
          }`
        : "";
    return `<article class="skill-card status-${status}" data-id="${skill.id}">
      <header>
        <h3>${skill.name}</h3>
        <span class="pill">${statusLabel(status)}</span>
      </header>
      <p class="meta">${meta}</p>
      <p class="effect">${skill.effect}</p>
      <p class="geo">${skill.shape} · AoE: ${skill.aoe} · ${skill.useLimit}</p>
      ${trainBits}
      ${
        mode === "combat"
          ? `<button type="button" class="btn use ${usable ? "" : "is-disabled"}" data-use="${skill.id}" ${
              usable ? "" : "disabled"
            }>${skill.mana === 0 ? "Use" : `Use (−${skill.mana})`}</button>`
          : ""
      }
    </article>`;
  }

  function renderMana() {
    const pct = (state.mana / state.maxMana) * 100;
    $("#manaValue").textContent = `${state.mana}`;
    $("#manaMax").textContent = `${state.maxMana}`;
    $("#manaFill").style.width = `${pct}%`;
    $("#manaFill").dataset.low = state.mana <= 20 ? "1" : "0";
    $("#roundValue").textContent = String(state.round);
    $("#levelChip").textContent = `Lv ${state.level}`;
    $("#nameChip").textContent = state.name || "Kirito";
    $("#hpChip").textContent = `HP ${hpTotalDisplay()}`;
    $("#profBonusLabel").textContent = `(${window.formatMod(pb())})`;
  }

  function renderVitals() {
    for (const id of ["combatVitals", "profileVitals"]) {
      const root = $(`#${id}`);
      if (!root) continue;
      // Replace contents only — listeners stay on document (bound once).
      root.innerHTML = vitalsHTML(id);
    }
  }

  function renderStats() {
    $("#abilityBlocks").innerHTML = ABILITIES.map((ab) => {
      const score = state.abilities[ab.key];
      const mod = modFor(ab.key);
      const rows = ab.skills
        .map((sk) => {
          const total = skillTotal(ab.key, sk.id);
          const checked = state.proficiencies[sk.id] ? "checked" : "";
          return `<label class="skill-row">
            <input type="checkbox" data-prof="${sk.id}" ${checked} />
            <span class="sk-name">${sk.name}${sk.isSave ? "" : ""}</span>
            <span class="sk-mod">${window.formatMod(total)}</span>
          </label>`;
        })
        .join("");
      return `<article class="ability-card">
        <header>
          <div>
            <p class="label">${ab.short}</p>
            <h3>${ab.name}</h3>
          </div>
          <div class="score-box">
            <input type="number" inputmode="numeric" min="1" max="30" data-ability="${ab.key}" value="${score}" />
            <span class="mod-pill">${window.formatMod(mod)}</span>
          </div>
        </header>
        <div class="skill-rows">${rows}</div>
      </article>`;
    }).join("");
  }

  function renderCombat() {
    const learned = SKILLS.filter((s) => skillStatus(s) === "learned" && !s.isGate);
    const quickIds = ["deflect", "retreat", "rage-spike", "slant", "horizontal", "vertical"];
    $("#quickSkills").innerHTML = quickIds
      .map((id) => byId[id])
      .filter(Boolean)
      .map((s) => {
        const ok = canUse(s);
        return `<button type="button" class="quick ${ok ? "" : "is-disabled"}" data-use="${s.id}" ${
          ok ? "" : "disabled"
        }>
          <span class="q-name">${s.name}</span>
          <span class="q-cost">${s.mana === 0 ? "Free" : s.mana}</span>
        </button>`;
      })
      .join("");
    $("#combatSkills").innerHTML = learned.map((s) => skillCardHTML(s, "combat")).join("");
    $("#combatLog").innerHTML = state.combatLog.length
      ? state.combatLog
          .slice(0, 12)
          .map((e) =>
            e.kind === "regen"
              ? `<li><span>R${e.round}</span> +${e.regen} regen → ${e.after}</li>`
              : `<li><span>R${e.round}</span> ${e.skill}${
                  e.cost ? ` −${e.cost}` : " free"
                } → ${e.after}</li>`
          )
          .join("")
      : `<li class="muted">No sword-skill actions yet.</li>`;
  }

  function renderSkills() {
    const filter = $("#skillFilter")?.value || "all";
    let list = [...SKILLS];
    if (filter === "learned") list = list.filter((s) => skillStatus(s) === "learned");
    if (filter === "locked") list = list.filter((s) => skillStatus(s) === "locked");
    if (filter === "trainable")
      list = list.filter((s) => ["unlocked", "training"].includes(skillStatus(s)));
    $("#allSkills").innerHTML = list.map((s) => skillCardHTML(s, "browse")).join("");
  }

  function renderTrain() {
    const rules = window.TRAINING_RULES || {};
    const rulesBox = $("#trainRules");
    if (rulesBox) {
      rulesBox.innerHTML = `
        <p><strong>1 session</strong> ≈ ${rules.sessionHoursDefault || 1} hour focused drill.</p>
        <p><strong>Cap:</strong> ${rules.maxSessionsPerLongRest || 2} sessions per long rest.</p>
        <p class="muted">${rules.checkPackage || ""}</p>
        <p class="muted">${rules.fieldPackage || ""}</p>`;
    }
    $("#trainSkills").innerHTML = SKILLS.filter((s) => !s.starter)
      .map((s) => skillCardHTML(s, "train"))
      .join("");
    $("#trialToggle").checked = !!state.reactionTrial;
    $("#dualStatus").textContent = dualGateOpen()
      ? "Dual Blades OPEN"
      : state.level < 3
        ? "Dual locked until Level 3"
        : !state.reactionTrial
          ? "Need Reaction Trial"
          : !isLearned("uppercut")
            ? "Need Uppercut learned"
            : !isLearned("dual-blades")
              ? "Train Dual Blades Unique Skill (4 sessions)"
              : "Dual Blades OPEN";
  }

  function renderGear() {
    if (!state.equipment.length) {
      $("#equipmentList").innerHTML = `<p class="muted empty-gear">No items yet. Tap + Add.</p>`;
      return;
    }
    $("#equipmentList").innerHTML = state.equipment
      .map(
        (item) => `<article class="equip-card" data-equip="${item.id}">
        <div class="equip-top">
          <input class="equip-name" type="text" data-equip-field="name" value="${escapeAttr(
            item.name
          )}" placeholder="Item name" />
          <button type="button" class="icon-trash" data-equip-del="${item.id}" aria-label="Remove item" title="Remove">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9zm-1 12h10a1 1 0 0 0 1-1V8H6v12a1 1 0 0 0 1 1z"/></svg>
          </button>
        </div>
        <hr class="equip-rule" />
        <textarea class="equip-desc" data-equip-field="description" rows="3" placeholder="Description">${escapeText(
          item.description
        )}</textarea>
      </article>`
      )
      .join("");
  }

  function escapeAttr(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeText(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function renderProfile() {
    $("#nameInput").value = state.name || "";
    $("#levelInput").value = String(state.level);
    $("#xpInput").value = String(state.xp || 0);
    $("#maxManaInput").value = String(state.maxMana);
    $("#classInput").value = state.className || "";
    $("#subclassInput").value = state.subclass || "";
    $("#raceInput").value = state.race || "";
    $("#backgroundInput").value = state.background || "";
    $("#alignmentInput").value = state.alignment || "";
    $("#hitDiceInput").value = state.hitDice || "";
    $("#coinCp").value = state.coins.cp;
    $("#coinSp").value = state.coins.sp;
    $("#coinEp").value = state.coins.ep;
    $("#coinGp").value = state.coins.gp;
    $("#coinPp").value = state.coins.pp;
    $("#appearanceInput").value = state.appearance || "";
    $("#personalityInput").value = state.personality || "";
    $("#backstoryInput").value = state.backstory || "";
    $("#languagesInput").value = state.languages || "";
    $("#classFeaturesInput").value = state.classFeatures || "";
    $("#featsInput").value = state.feats || "";
    $("#profTextInput").value = state.proficienciesText || "";
    $("#otherNotesInput").value = state.otherNotes || "";
    ensureDmLinkCode();
    const codeEl = $("#dmLinkCode");
    if (codeEl) codeEl.textContent = state.dmLinkCode || "————";
    const toggle = $("#dmLinkToggle");
    if (toggle) toggle.checked = !!state.dmLinkEnabled;
    setDmLinkStatusText(dmLinkStatus);
    const preview = $("#portraitPreview");
    if (state.portraitDataUrl) {
      preview.classList.remove("empty");
      preview.innerHTML = `<img src="${state.portraitDataUrl}" alt="Character portrait" />`;
    } else {
      preview.classList.add("empty");
      preview.textContent = "No photo";
    }
    $("#lastSaved").textContent = state.updatedAt
      ? new Date(state.updatedAt).toLocaleString()
      : "—";
    $("#storageNote").textContent =
      "Progress is stored in this phone’s browser storage. Closing the app keeps it. Clearing site data erases it — use Export Backup.";
  }

  function render() {
    state.dualUnlocked = dualGateOpen();
    renderMana();
    renderVitals();
    const tab = document.body.dataset.tab || "combat";
    if (tab === "combat") renderCombat();
    if (tab === "stats") renderStats();
    if (tab === "skills") renderSkills();
    if (tab === "train") renderTrain();
    if (tab === "gear") renderGear();
    if (tab === "profile") renderProfile();
  }

  function setTab(tab) {
    document.body.dataset.tab = tab;
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
    render();
  }

  function bind() {
    // Vitals: bind once on document so re-renders don't stack listeners
    document.addEventListener("click", handleVitalsClick);
    document.addEventListener("change", handleVitalsChange);

    $("#quickSkills").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-use]");
      if (btn) useSkill(btn.dataset.use);
    });
    $("#combatSkills").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-use]");
      if (btn) useSkill(btn.dataset.use);
    });
    $("#trainSkills").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-train]");
      if (btn) train(btn.dataset.train);
    });

    $("#endTurnBtn").addEventListener("click", endTurn);
    $("#refillBtn").addEventListener("click", refillMana);
    $("#shortRestBtn").addEventListener("click", shortRest);
    $("#longRestBtn").addEventListener("click", longRest);
    $("#manaMinus").addEventListener("click", () => adjustMana(-1));
    $("#manaPlus").addEventListener("click", () => adjustMana(1));

    $$(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
    $("#skillFilter")?.addEventListener("change", renderSkills);

    $("#trialToggle").addEventListener("change", (e) => {
      state.reactionTrial = e.target.checked;
      persist();
      render();
    });

    $("#abilityBlocks").addEventListener("change", (e) => {
      const ab = e.target.dataset.ability;
      if (ab) {
        state.abilities[ab] = clamp(Number(e.target.value) || 10, 1, 30);
        persist();
        render();
        return;
      }
      const prof = e.target.dataset.prof;
      if (prof) {
        state.proficiencies[prof] = !!e.target.checked;
        persist();
        render();
      }
    });

    $("#addItemBtn").addEventListener("click", addEquipment);
    $("#equipmentList").addEventListener("click", (e) => {
      const del = e.target.closest("[data-equip-del]");
      if (del) removeEquipment(del.dataset.equipDel);
    });
    $("#equipmentList").addEventListener("input", (e) => {
      const card = e.target.closest("[data-equip]");
      if (!card) return;
      const field = e.target.dataset.equipField;
      if (!field) return;
      updateEquipment(card.dataset.equip, field, e.target.value);
    });

    const profileMap = [
      ["nameInput", (v) => (state.name = v.trim() || "Kirito")],
      ["levelInput", (v) => (state.level = clamp(Number(v) || 1, 1, 20))],
      ["xpInput", (v) => (state.xp = Math.max(0, Number(v) || 0))],
      ["maxManaInput", (v) => {
        state.maxMana = clamp(Number(v) || 100, 1, 999);
        state.mana = clamp(state.mana, 0, state.maxMana);
      }],
      ["classInput", (v) => (state.className = v)],
      ["subclassInput", (v) => (state.subclass = v)],
      ["raceInput", (v) => (state.race = v)],
      ["backgroundInput", (v) => (state.background = v)],
      ["alignmentInput", (v) => (state.alignment = v)],
      ["hitDiceInput", (v) => (state.hitDice = v)],
      ["appearanceInput", (v) => (state.appearance = v)],
      ["personalityInput", (v) => (state.personality = v)],
      ["backstoryInput", (v) => (state.backstory = v)],
      ["languagesInput", (v) => (state.languages = v)],
      ["classFeaturesInput", (v) => (state.classFeatures = v)],
      ["featsInput", (v) => (state.feats = v)],
      ["profTextInput", (v) => (state.proficienciesText = v)],
      ["otherNotesInput", (v) => (state.otherNotes = v)],
      ["coinCp", (v) => (state.coins.cp = Math.max(0, Number(v) || 0))],
      ["coinSp", (v) => (state.coins.sp = Math.max(0, Number(v) || 0))],
      ["coinEp", (v) => (state.coins.ep = Math.max(0, Number(v) || 0))],
      ["coinGp", (v) => (state.coins.gp = Math.max(0, Number(v) || 0))],
      ["coinPp", (v) => (state.coins.pp = Math.max(0, Number(v) || 0))],
    ];
    for (const [id, fn] of profileMap) {
      const el = $(`#${id}`);
      if (!el) continue;
      el.addEventListener("change", () => {
        fn(el.value);
        persist();
        render();
      });
    }

    $("#dmLinkToggle")?.addEventListener("change", (e) => {
      state.dmLinkEnabled = !!e.target.checked;
      persist(true);
      renderProfile();
      toast(state.dmLinkEnabled ? "DM Link sharing on" : "DM Link sharing off", "ok");
    });
    $("#dmLinkCopy")?.addEventListener("click", async () => {
      ensureDmLinkCode();
      try {
        await navigator.clipboard.writeText(state.dmLinkCode);
        toast("Code copied", "ok");
      } catch {
        toast(state.dmLinkCode, "info");
      }
    });
    $("#dmLinkRegen")?.addEventListener("click", () => {
      if (!window.DmEyeLink) return;
      if (state.dmLinkEnabled) stopDmPublisher();
      state.dmLinkCode = window.DmEyeLink.generateCode();
      persist(true);
      renderProfile();
      toast("New DM Link code ready", "ok");
    });

    $("#portraitInput").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        state.portraitDataUrl = await resizeImageFile(file);
        persist(true);
        render();
        toast("Portrait saved", "ok");
      } catch {
        toast("Could not load image", "warn");
      }
      e.target.value = "";
    });
    $("#portraitClear").addEventListener("click", () => {
      state.portraitDataUrl = "";
      persist();
      render();
    });

    $("#exportBtn").addEventListener("click", exportBackup);
    $("#importBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) importBackup(file);
      e.target.value = "";
    });
    $("#resetBtn").addEventListener("click", resetProgress);

    $$("[data-close-overlay]").forEach((btn) => {
      btn.addEventListener("click", () => hideOverlay(btn.dataset.closeOverlay));
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persist(true);
    });
    window.addEventListener("pagehide", () => persist(true));
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (err) {
      console.warn("SW failed", err);
    }
  }

  function setupInstall() {
    const btn = $("#installBtn");
    let deferred = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
    });
    btn.addEventListener("click", async () => {
      if (!deferred) {
        toast("On iPhone: Share → Add to Home Screen", "info");
        return;
      }
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      btn.hidden = true;
    });
  }

  bind();
  setTab("combat");
  setSaveBadge(true);
  setupInstall();
  registerSW();
  ensureDmLinkCode();
  if (state.dmLinkEnabled) syncDmLink();
  render();
})();
