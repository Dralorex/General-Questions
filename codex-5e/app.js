(() => {
  const ABILITIES = window.DND_ABILITIES;
  const CLASSES = window.CODEX_CLASSES || [];
  const SPELLS = window.CODEX_SPELLS || [];
  const STORAGE_KEY = "codex-5e-pwa-v1";
  const APP_VERSION = "5.1.0";

  const SAVE_ID_BY_KEY = {
    str: "str-save",
    dex: "dex-save",
    con: "con-save",
    int: "int-save",
    wis: "wis-save",
    cha: "cha-save",
  };

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
    return {
      version: APP_VERSION,
      name: "Adventurer",
      level: 1,
      xp: 0,
      classId: "",
      className: "",
      subclass: "",
      race: "",
      background: "",
      alignment: "",
      hitDice: "1d8",
      combatLog: [],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      proficiencies: emptyProficiencies(),
      autoSaveKeys: [],
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
      selectedSpells: [],
      spellSlots: {},
      spellLevelOpen: {},
      spellFilters: {
        search: "",
        level: "all",
        school: "all",
        classOnly: true,
      },
      notes: {
        folders: [],
        items: [],
        currentFolderId: null,
        selectedNoteId: null,
        search: "",
        tagFilter: "",
      },
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
        abilities: { ...base.abilities, ...(parsed.abilities || {}) },
        proficiencies: { ...base.proficiencies, ...(parsed.proficiencies || {}) },
        hp: { ...base.hp, ...(parsed.hp || {}) },
        deathSaves: {
          success: [...(parsed.deathSaves?.success || base.deathSaves.success)],
          fail: [...(parsed.deathSaves?.fail || base.deathSaves.fail)],
        },
        coins: { ...base.coins, ...(parsed.coins || {}) },
        equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
        combatLog: Array.isArray(parsed.combatLog) ? parsed.combatLog : [],
        autoSaveKeys: Array.isArray(parsed.autoSaveKeys) ? parsed.autoSaveKeys : [],
        selectedSpells: Array.isArray(parsed.selectedSpells) ? parsed.selectedSpells : [],
        spellSlots: { ...(parsed.spellSlots || {}) },
        spellLevelOpen: { ...(parsed.spellLevelOpen || {}) },
        spellFilters: {
          ...base.spellFilters,
          ...(parsed.spellFilters || {}),
        },
        notes: {
          ...base.notes,
          ...(parsed.notes || {}),
          folders: Array.isArray(parsed.notes?.folders) ? parsed.notes.folders : [],
          items: Array.isArray(parsed.notes?.items) ? parsed.notes.items : [],
        },
      };
      if (!merged.classId && merged.className) {
        const match = CLASSES.find(
          (c) => c.name.toLowerCase() === String(merged.className).toLowerCase()
        );
        if (match) merged.classId = match.id;
      }
      while (merged.deathSaves.success.length < 3) merged.deathSaves.success.push(false);
      while (merged.deathSaves.fail.length < 3) merged.deathSaves.fail.push(false);
      merged.deathSaves.success = merged.deathSaves.success.slice(0, 3);
      merged.deathSaves.fail = merged.deathSaves.fail.slice(0, 3);

      // Drop legacy mana / sword-skill / training fields if an old backup is imported.
      delete merged.mana;
      delete merged.maxMana;
      delete merged.round;
      delete merged.lastSkillId;
      delete merged.lastWasUltimate;
      delete merged.retreatUsedThisTurn;
      delete merged.reactionTrial;
      delete merged.dualUnlocked;
      delete merged.progress;

      merged.hp.current = Number(merged.hp.current) || 0;
      merged.hp.max = Math.max(1, Number(merged.hp.max) || 1);
      merged.hp.temp = Math.max(0, Number(merged.hp.temp) || 0);

      // Normalize spell slot keys to strings "1"…"9".
      const slots = {};
      for (let i = 1; i <= 9; i++) {
        const key = String(i);
        if (merged.spellSlots[key] != null) slots[key] = Math.max(0, Number(merged.spellSlots[key]) || 0);
        else if (merged.spellSlots[i] != null) slots[key] = Math.max(0, Number(merged.spellSlots[i]) || 0);
      }
      merged.spellSlots = slots;

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
        source: "codex",
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
    dmPublisher.publish(Link.snapshotFromState(state, "codex"));
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

  function selectedClass() {
    return window.codexClassById(state.classId);
  }

  function spellLimits() {
    return window.codexSpellSelectionLimits(state.classId, state.level, state.abilities);
  }

  function maxSlotsMap() {
    return window.codexMaxSpellSlots(state.classId, state.level);
  }

  function ensureSpellArrays() {
    if (!Array.isArray(state.selectedSpells)) state.selectedSpells = [];
    if (!state.spellSlots || typeof state.spellSlots !== "object") state.spellSlots = {};
    if (!state.spellLevelOpen || typeof state.spellLevelOpen !== "object") state.spellLevelOpen = {};
  }

  function selectedSpellObjs() {
    ensureSpellArrays();
    return state.selectedSpells
      .map((id) => window.codexSpellById(id))
      .filter(Boolean)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }

  function countSelectedByKind() {
    const spells = selectedSpellObjs();
    return {
      cantrips: spells.filter((s) => s.level === 0).length,
      leveled: spells.filter((s) => s.level > 0).length,
    };
  }

  /** Sync remaining slots to class table max. Preserves spent slots when max unchanged. */
  function syncSpellSlots({ refill = false, previousMax = null } = {}) {
    ensureSpellArrays();
    const max = maxSlotsMap();
    const next = {};
    for (let i = 1; i <= 9; i++) {
      const key = String(i);
      const cap = max[i] || 0;
      if (cap <= 0) {
        next[key] = 0;
        continue;
      }
      if (refill || state.spellSlots[key] == null) {
        next[key] = cap;
        continue;
      }
      let rem = Number(state.spellSlots[key]) || 0;
      // Level-up: newly gained slots are available immediately (5e).
      if (previousMax) {
        const oldCap = previousMax[i] || 0;
        if (cap > oldCap) rem += cap - oldCap;
      }
      next[key] = clamp(rem, 0, cap);
    }
    state.spellSlots = next;
  }

  /** Drop selections that are no longer valid for class / over limit. */
  function pruneSelectedSpells() {
    ensureSpellArrays();
    const cls = selectedClass();
    if (!cls || !cls.spellcasting) {
      state.selectedSpells = [];
      return;
    }
    const allowed = new Set(window.codexSpellsForClass(cls.id).map((s) => s.id));
    let keep = state.selectedSpells.filter((id) => allowed.has(id));
    const limits = spellLimits();
    const cantrips = [];
    const leveled = [];
    for (const id of keep) {
      const sp = window.codexSpellById(id);
      if (!sp) continue;
      if (sp.level === 0) cantrips.push(id);
      else leveled.push(id);
    }
    state.selectedSpells = [
      ...cantrips.slice(0, limits.cantrips),
      ...leveled.slice(0, limits.leveled),
    ];
  }

  function refreshSpellcasting({
    refillSlots = false,
    prune = true,
    previousMax = null,
  } = {}) {
    if (prune) pruneSelectedSpells();
    syncSpellSlots({ refill: refillSlots, previousMax });
  }

  function isSpellSelected(id) {
    ensureSpellArrays();
    return state.selectedSpells.includes(id);
  }

  function canSelectSpell(spell) {
    if (!spell) return false;
    if (isSpellSelected(spell.id)) return true; // always allow deselect
    const limits = spellLimits();
    const counts = countSelectedByKind();
    if (spell.level === 0) return counts.cantrips < limits.cantrips;
    return counts.leveled < limits.leveled;
  }

  function toggleSpellSelection(spellId, wantSelected) {
    ensureSpellArrays();
    const spell = window.codexSpellById(spellId);
    if (!spell) return;
    const on = state.selectedSpells.includes(spellId);
    if (wantSelected && !on) {
      const cls = selectedClass();
      if (!cls || !cls.spellcasting) {
        toast("Pick a spellcasting class first", "warn");
        return;
      }
      if (!(spell.classes || []).includes(cls.id)) {
        toast(`Not on the ${cls.name} spell list`, "warn");
        return;
      }
      if (!canSelectSpell(spell)) {
        const limits = spellLimits();
        const label = spell.level === 0 ? limits.cantripsLabel : limits.leveledLabel;
        const max = spell.level === 0 ? limits.cantrips : limits.leveled;
        toast(`${label} full (${max})`, "warn");
        return;
      }
      state.selectedSpells.push(spellId);
    } else if (!wantSelected && on) {
      state.selectedSpells = state.selectedSpells.filter((id) => id !== spellId);
    }
    persist();
    render();
  }

  function selectionSlotsLeft() {
    const limits = spellLimits();
    const counts = countSelectedByKind();
    return {
      cantripsLeft: Math.max(0, limits.cantrips - counts.cantrips),
      leveledLeft: Math.max(0, limits.leveled - counts.leveled),
      counts,
      limits,
    };
  }

  function renderSpellSlotsCard() {
    const slotsCard = $("#spellSlotsCard");
    if (!slotsCard) return;
    const cls = selectedClass();
    if (!cls || !cls.spellcasting) {
      slotsCard.hidden = true;
      slotsCard.innerHTML = "";
      return;
    }
    ensureSpellArrays();
    syncSpellSlots({ refill: false });
    const { counts, limits } = selectionSlotsLeft();
    const max = maxSlotsMap();
    const isWarlock = window.codexIsWarlock(cls.id);
    const castBits = [];
    for (let i = 1; i <= 9; i++) {
      const cap = max[i] || 0;
      if (cap <= 0) continue;
      const rem = state.spellSlots[String(i)] ?? cap;
      const label = isWarlock
        ? `Pact ${window.codexSlotLevelShort(i)}`
        : window.codexSlotLevelShort(i);
      castBits.push(`${label} ${rem}/${cap}`);
    }
    const restNote = isWarlock
      ? "Cast slots: short or long rest"
      : "Cast slots: long rest";
    slotsCard.hidden = false;
    slotsCard.innerHTML = `
      <p class="label">${limits.selectLabel} at level ${state.level}</p>
      <p>
        ${limits.cantripsLabel}: <strong>${counts.cantrips}</strong>/${limits.cantrips}
        · ${limits.leveledLabel}: <strong>${counts.leveled}</strong>/${limits.leveled}
      </p>
      ${
        castBits.length
          ? `<p><strong>Cast slots:</strong> ${castBits.join(" · ")}</p>`
          : `<p class="muted">No cast slots yet.</p>`
      }
      <p class="muted tiny">${escapeText(restNote)} · Ability: ${escapeText(
        cls.spellcasting.abilityName || ""
      )}</p>
    `;
  }

  /**
   * Slot level to spend for a spell (5e):
   * - Cantrips: none
   * - Warlock: one pact slot (always the pact slot level)
   * - Others: lowest remaining slot ≥ spell level
   */
  function findSlotToSpend(spellLevel) {
    if (spellLevel <= 0) return null;
    ensureSpellArrays();
    const max = maxSlotsMap();

    if (window.codexIsWarlock(state.classId)) {
      const pact = window.codexWarlockPactLevel(state.classId, state.level);
      if (pact > 0 && (state.spellSlots[String(pact)] || 0) > 0) return pact;
      return null;
    }

    for (let lv = spellLevel; lv <= 9; lv++) {
      if ((max[lv] || 0) <= 0) continue;
      if ((state.spellSlots[String(lv)] || 0) > 0) return lv;
    }
    return null;
  }

  function canCastSpell(spell) {
    if (!spell || !isSpellSelected(spell.id)) return false;
    if (spell.level === 0) return true;
    return findSlotToSpend(spell.level) != null;
  }

  function castSpell(spellId) {
    const spell = window.codexSpellById(spellId);
    if (!spell) return;
    if (!isSpellSelected(spellId)) {
      toast("Spell not prepared / known", "warn");
      return;
    }
    if (spell.level === 0) {
      pushLog({ kind: "cast", text: `Cast ${spell.name} (cantrip)` });
      persist();
      render();
      toast(`${spell.name} · cantrip`, "ok");
      if (navigator.vibrate) navigator.vibrate(12);
      return;
    }
    const slotLv = findSlotToSpend(spell.level);
    if (slotLv == null) {
      toast(`No spell slots left for ${window.codexSpellLevelLabel(spell.level)}`, "warn");
      return;
    }
    const key = String(slotLv);
    state.spellSlots[key] = Math.max(0, (state.spellSlots[key] || 0) - 1);
    const slotLabel = window.codexSlotLevelShort(slotLv);
    const upcast = slotLv > spell.level ? ` (upcast ${slotLabel})` : "";
    pushLog({
      kind: "cast",
      text: `Cast ${spell.name}${upcast} · −1 ${slotLabel} slot`,
    });
    persist();
    render();
    toast(`${spell.name} · −1 ${slotLabel} slot`, "ok");
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function formatFeaturesNotes(cls, level) {
    const feats = window.codexFeaturesUpToLevel(cls.id, level);
    if (!feats.length) return "";
    return feats
      .map((f) => `L${f.level} · ${f.name}`)
      .join("\n");
  }

  function applyClass(classId, { toastMsg = true } = {}) {
    // Clear previously auto-applied save proficiencies.
    for (const key of state.autoSaveKeys || []) {
      const saveId = SAVE_ID_BY_KEY[key];
      if (saveId) state.proficiencies[saveId] = false;
    }
    state.autoSaveKeys = [];

    if (!classId) {
      state.classId = "";
      state.className = "";
      state.selectedSpells = [];
      state.spellSlots = {};
      persist();
      render();
      if (toastMsg) toast("Class cleared", "info");
      return;
    }

    const cls = window.codexClassById(classId);
    if (!cls) return;

    state.classId = cls.id;
    state.className = cls.name;
    state.hitDice = `${state.level}d${cls.hitDie}`;
    state.selectedSpells = [];
    refreshSpellcasting({ refillSlots: true, prune: false });

    const saveKeys = [];
    for (const st of cls.savingThrows || []) {
      if (!st.key) continue;
      saveKeys.push(st.key);
      const saveId = SAVE_ID_BY_KEY[st.key];
      if (saveId) state.proficiencies[saveId] = true;
    }
    state.autoSaveKeys = saveKeys;

    const profLines = [];
    if (cls.proficiencies?.length) {
      profLines.push(cls.proficiencies.join(", "));
    }
    if (cls.skillChoices) {
      const names = (cls.skillChoices.options || [])
        .map((o) => (o.name || "").replace(/^Skill:\s*/i, ""))
        .filter(Boolean);
      profLines.push(
        `Choose ${cls.skillChoices.choose} skill${cls.skillChoices.choose === 1 ? "" : "s"}: ${names.join(", ")}`
      );
    }
    if (cls.spellcasting?.abilityName) {
      profLines.push(`Spellcasting ability: ${cls.spellcasting.abilityName}`);
    }
    state.proficienciesText = profLines.join("\n");
    state.classFeatures = formatFeaturesNotes(cls, state.level);

    persist();
    render();
    if (toastMsg) {
      const n = window.codexSpellsForClass(cls.id).length;
      toast(
        n
          ? `${cls.name} applied · ${n} spells in list`
          : `${cls.name} applied · no spell list`,
        "ok"
      );
    }
  }

  function refreshClassDerived(previousMax = null) {
    const cls = selectedClass();
    if (!cls) return;
    state.hitDice = `${state.level}d${cls.hitDie}`;
    state.classFeatures = formatFeaturesNotes(cls, state.level);
    refreshSpellcasting({ refillSlots: false, prune: true, previousMax });
  }

  function pushLog(entry) {
    state.combatLog.unshift({ t: Date.now(), ...entry });
    state.combatLog = state.combatLog.slice(0, 40);
  }

  function shortRest() {
    ensureSpellArrays();
    if (window.codexIsWarlock(state.classId)) {
      syncSpellSlots({ refill: true });
      pushLog({ kind: "rest", text: "Short rest · warlock pact slots restored" });
      persist();
      render();
      toast("Short rest · pact slots restored", "ok");
      return;
    }
    pushLog({ kind: "rest", text: "Short rest · spell slots unchanged (5e)" });
    persist();
    render();
    toast("Short rest · spell slots need a long rest", "info");
  }

  function longRest() {
    state.hp.current = state.hp.max;
    state.hp.temp = 0;
    state.deathSaves = { success: [false, false, false], fail: [false, false, false] };
    deathPopupShown = false;
    livedPopupShown = false;
    syncSpellSlots({ refill: true });
    const caster = window.codexIsSpellcaster(state.classId);
    pushLog({
      kind: "rest",
      text: caster ? "Long rest · HP + spell slots restored" : "Long rest · HP restored",
    });
    persist();
    render();
    toast(caster ? "Long rest · HP + spell slots" : "Long rest · full HP", "ok");
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
  let gearPickerFilter = { search: "", category: "all" };

  function formatEquipmentDescription(item) {
    return window.codexEquipmentDetailText(item);
  }

  function openGearPicker() {
    const sheet = $("#gearPicker");
    if (!sheet) return;
    gearPickerFilter = { search: "", category: "all" };
    const catSel = $("#gearPickerCategory");
    if (catSel && catSel.options.length <= 1) {
      for (const cat of window.CODEX_EQUIPMENT_CATEGORIES || []) {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSel.appendChild(opt);
      }
    }
    if ($("#gearPickerSearch")) $("#gearPickerSearch").value = "";
    if (catSel) catSel.value = "all";
    sheet.hidden = false;
    renderGearPickerResults();
    $("#gearPickerSearch")?.focus();
  }

  function closeGearPicker() {
    const sheet = $("#gearPicker");
    if (sheet) sheet.hidden = true;
  }

  function filteredCatalogEquipment() {
    const q = String(gearPickerFilter.search || "")
      .trim()
      .toLowerCase();
    const cat = gearPickerFilter.category || "all";
    let list = window.CODEX_EQUIPMENT || [];
    if (cat !== "all") list = list.filter((i) => i.category === cat);
    if (q) {
      list = list.filter((i) => {
        const hay = [
          i.name,
          i.category,
          i.rarity,
          i.damage,
          i.armorClass,
          ...(i.desc || []),
          ...(i.properties || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }

  function renderGearPickerResults() {
    const box = $("#gearPickerResults");
    if (!box) return;
    const list = filteredCatalogEquipment();
    if (!list.length) {
      box.innerHTML = `<p class="muted">No SRD items match.</p>`;
      return;
    }
    const show = list.slice(0, 80);
    box.innerHTML =
      show
        .map((item) => {
          const summary = window.codexEquipmentSummary(item);
          const badge =
            item.source === "magic-item"
              ? item.rarity || "Magic"
              : item.category || "Gear";
          return `<button type="button" class="gear-pick-row" data-add-catalog="${escapeAttr(
            item.id
          )}">
            <span class="gear-pick-main">
              <span class="gear-pick-name">${escapeText(item.name)}</span>
              ${summary ? `<span class="muted tiny">${escapeText(summary)}</span>` : ""}
            </span>
            <span class="pill tiny-pill">${escapeText(badge)}</span>
          </button>`;
        })
        .join("") +
      (list.length > show.length
        ? `<p class="muted tiny">Showing ${show.length} of ${list.length} — refine search.</p>`
        : "");
  }

  function addEquipmentFromCatalog(catalogId) {
    const cat = window.codexEquipmentById(catalogId);
    if (!cat) {
      toast("Item not found in SRD list", "warn");
      return;
    }
    state.equipment.unshift({
      id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      catalogId: cat.id,
      name: cat.name,
      description: formatEquipmentDescription(cat),
      category: cat.category || "",
      summary: window.codexEquipmentSummary(cat),
    });
    closeGearPicker();
    persist();
    render();
    toast(`Added ${cat.name}`, "ok");
  }

  function addCustomEquipment() {
    state.equipment.unshift({
      id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      catalogId: "",
      name: "Custom item",
      description: "",
      category: "",
      summary: "",
    });
    closeGearPicker();
    persist();
    render();
    toast("Custom item added", "info");
  }

  function addEquipment() {
    openGearPicker();
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

  /* ---------- Notes (folders + tags) ---------- */
  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function ensureNotes() {
    if (!state.notes) {
      state.notes = {
        folders: [],
        items: [],
        currentFolderId: null,
        selectedNoteId: null,
        search: "",
        tagFilter: "",
      };
    }
    if (!Array.isArray(state.notes.folders)) state.notes.folders = [];
    if (!Array.isArray(state.notes.items)) state.notes.items = [];
    return state.notes;
  }

  function parseTags(raw) {
    return String(raw || "")
      .split(/[,#]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i);
  }

  function folderById(id) {
    return ensureNotes().folders.find((f) => f.id === id) || null;
  }

  function noteById(id) {
    return ensureNotes().items.find((n) => n.id === id) || null;
  }

  function childFolders(parentId) {
    return ensureNotes().folders.filter((f) => (f.parentId || null) === (parentId || null));
  }

  function notesInFolder(folderId) {
    return ensureNotes().items.filter((n) => (n.folderId || null) === (folderId || null));
  }

  function folderPath(folderId) {
    const path = [];
    let cur = folderId;
    const guard = new Set();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      const f = folderById(cur);
      if (!f) break;
      path.unshift(f);
      cur = f.parentId || null;
    }
    return path;
  }

  function collectFolderTreeIds(folderId) {
    const ids = [folderId];
    for (const child of childFolders(folderId)) {
      ids.push(...collectFolderTreeIds(child.id));
    }
    return ids;
  }

  function allTags() {
    const set = new Set();
    for (const n of ensureNotes().items) {
      for (const t of n.tags || []) set.add(t);
    }
    return [...set].sort();
  }

  function addFolder() {
    const notes = ensureNotes();
    const name = prompt("Folder name", "Tavern Talks");
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) return toast("Folder needs a name", "warn");
    notes.folders.push({
      id: uid("folder"),
      name: trimmed,
      parentId: notes.currentFolderId || null,
      createdAt: Date.now(),
    });
    notes.selectedNoteId = null;
    persist();
    render();
    toast(`Folder “${trimmed}” created`, "ok");
  }

  function openFolder(folderId) {
    const notes = ensureNotes();
    notes.currentFolderId = folderId || null;
    notes.selectedNoteId = null;
    persist();
    render();
  }

  function renameFolder(folderId) {
    const folder = folderById(folderId);
    if (!folder) return;
    const name = prompt("Rename folder", folder.name);
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed) return toast("Folder needs a name", "warn");
    folder.name = trimmed;
    persist();
    render();
  }

  function deleteFolder(folderId) {
    const folder = folderById(folderId);
    if (!folder) return;
    const tree = collectFolderTreeIds(folderId);
    const noteCount = ensureNotes().items.filter((n) => tree.includes(n.folderId)).length;
    const msg =
      noteCount > 0
        ? `Delete “${folder.name}” and ${tree.length - 1} subfolder(s)? This also deletes ${noteCount} note(s).`
        : `Delete folder “${folder.name}”${tree.length > 1 ? ` and ${tree.length - 1} subfolder(s)` : ""}?`;
    if (!confirm(msg)) return;
    const notes = ensureNotes();
    notes.folders = notes.folders.filter((f) => !tree.includes(f.id));
    notes.items = notes.items.filter((n) => !tree.includes(n.folderId));
    if (tree.includes(notes.currentFolderId)) notes.currentFolderId = folder.parentId || null;
    if (notes.selectedNoteId && !noteById(notes.selectedNoteId)) notes.selectedNoteId = null;
    persist();
    render();
    toast("Folder deleted", "warn");
  }

  function addNote() {
    const notes = ensureNotes();
    const note = {
      id: uid("note"),
      folderId: notes.currentFolderId || null,
      title: "New note",
      body: "",
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    notes.items.unshift(note);
    notes.selectedNoteId = note.id;
    persist();
    render();
    toast("Note created", "ok");
  }

  function openNote(noteId) {
    ensureNotes().selectedNoteId = noteId;
    persist();
    render();
  }

  function closeNoteEditor() {
    ensureNotes().selectedNoteId = null;
    persist();
    render();
  }

  function updateNoteField(noteId, field, value) {
    const note = noteById(noteId);
    if (!note) return;
    if (field === "tags") note.tags = parseTags(value);
    else note[field] = value;
    note.updatedAt = Date.now();
    persist();
  }

  function deleteNote(noteId) {
    const note = noteById(noteId);
    if (!note) return;
    if (!confirm(`Delete note “${note.title || "Untitled"}”?`)) return;
    const notes = ensureNotes();
    notes.items = notes.items.filter((n) => n.id !== noteId);
    if (notes.selectedNoteId === noteId) notes.selectedNoteId = null;
    persist();
    render();
    toast("Note deleted", "warn");
  }

  function filteredNotesForCurrentFolder() {
    const notes = ensureNotes();
    const q = String(notes.search || "")
      .trim()
      .toLowerCase();
    const tag = String(notes.tagFilter || "")
      .trim()
      .toLowerCase();
    return notesInFolder(notes.currentFolderId).filter((n) => {
      if (tag && !(n.tags || []).includes(tag)) return false;
      if (!q) return true;
      const hay = `${n.title}\n${n.body}\n${(n.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
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
    refreshSpellcasting({ refillSlots: true, prune: false });
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
    a.download = `codex-5e-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
        refreshSpellcasting({ refillSlots: false, prune: true });
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

  function renderHeader() {
    const cls = selectedClass();
    $("#levelChip").textContent = `Lv ${state.level}`;
    $("#nameChip").textContent = state.name || "Adventurer";
    const classLabel = cls
      ? state.subclass
        ? `${cls.name} (${state.subclass})`
        : cls.name
      : "No class";
    $("#classChip").textContent = classLabel;
    $("#hpChip").textContent = `HP ${hpTotalDisplay()}`;
    $("#profBonusLabel").textContent = `(${window.formatMod(pb())})`;
  }

  function renderVitals() {
    for (const id of ["combatVitals", "profileVitals"]) {
      const root = $(`#${id}`);
      if (!root) continue;
      root.innerHTML = vitalsHTML(id);
    }
  }

  function renderClassSummary() {
    const box = $("#classSummary");
    if (!box) return;
    const cls = selectedClass();
    if (!cls) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    const saves = (cls.savingThrows || []).map((s) => s.name).join(", ") || "—";
    const sc = cls.spellcasting;
    const slots = window.codexSpellSlotsAtLevel(cls.id, state.level);
    const slotBits = slots
      ? Object.keys(slots)
          .filter((k) => k.startsWith("spell_slots_level_") && slots[k] > 0)
          .map((k) => {
            const n = k.replace("spell_slots_level_", "");
            return `${n}: ${slots[k]}`;
          })
          .join(" · ")
      : "";
    box.innerHTML = `
      <p class="label">${cls.name} · Level ${state.level}</p>
      <p><strong>Hit die:</strong> d${cls.hitDie} · <strong>Saves:</strong> ${saves}</p>
      ${
        sc
          ? `<p><strong>Spellcasting:</strong> ${sc.abilityName || "—"} (starts at class level ${sc.level || 1})</p>`
          : `<p class="muted">This class has no spellcasting.</p>`
      }
      ${slotBits ? `<p><strong>Spell slots:</strong> ${slotBits}</p>` : ""}
      ${
        cls.skillChoices
          ? `<p class="muted">Choose ${cls.skillChoices.choose} class skills (see Profile → Proficiencies).</p>`
          : ""
      }
    `;
  }

  function renderFeatures() {
    const root = $("#featureList");
    if (!root) return;
    const cls = selectedClass();
    if (!cls) {
      root.innerHTML = `<p class="muted">Select a class in Profile to load features.</p>`;
      return;
    }
    const feats = window.codexFeaturesUpToLevel(cls.id, state.level);
    if (!feats.length) {
      root.innerHTML = `<p class="muted">No features at this level.</p>`;
      return;
    }
    root.innerHTML = feats
      .map(
        (f) => `<article class="feature-card">
        <header>
          <h3>${escapeText(f.name)}</h3>
          <span class="pill">L${f.level}</span>
        </header>
        <p class="feature-desc">${escapeText(f.description || "—")}</p>
      </article>`
      )
      .join("");
  }

  function renderStats() {
    renderClassSummary();
    $("#abilityBlocks").innerHTML = ABILITIES.map((ab) => {
      const score = state.abilities[ab.key];
      const mod = modFor(ab.key);
      const rows = ab.skills
        .map((sk) => {
          const total = skillTotal(ab.key, sk.id);
          const checked = state.proficiencies[sk.id] ? "checked" : "";
          const auto =
            sk.isSave && (state.autoSaveKeys || []).includes(ab.key)
              ? " data-auto-save=\"1\""
              : "";
          return `<label class="skill-row"${auto}>
            <input type="checkbox" data-prof="${sk.id}" ${checked} />
            <span class="sk-name">${sk.name}</span>
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
    renderFeatures();
  }

  function renderCombat() {
    const panel = $("#combatSpellPanel");
    const slotsEl = $("#combatSlots");
    const quickEl = $("#quickSpells");
    const hint = $("#combatSlotsHint");
    const caster = window.codexIsSpellcaster(state.classId);

    if (panel) panel.hidden = !caster;
    if (!caster) {
      // still render log below
    } else {
      ensureSpellArrays();
      const max = maxSlotsMap();
      const isWarlock = window.codexIsWarlock(state.classId);
      if (hint) {
        hint.textContent = isWarlock
          ? "Warlock pact slots recover on a short or long rest."
          : "Spell slots recover on a long rest (5e).";
      }
      if (slotsEl) {
        const bits = [];
        for (let i = 1; i <= 9; i++) {
          const cap = max[i] || 0;
          if (cap <= 0) continue;
          const rem = state.spellSlots[String(i)] ?? cap;
          const empty = rem <= 0;
          const label = isWarlock
            ? `Pact (${window.codexSlotLevelShort(i)})`
            : window.codexSlotLevelShort(i);
          bits.push(
            `<span class="slot-pill ${empty ? "is-empty" : ""}">${escapeText(label)} <strong>${rem}</strong>/${cap}</span>`
          );
        }
        slotsEl.innerHTML = bits.length
          ? bits.join("")
          : `<p class="muted">No spell slots at this level.</p>`;
      }
      if (quickEl) {
        const selected = selectedSpellObjs();
        if (!selected.length) {
          quickEl.innerHTML = `<p class="muted">Check spells in the Spells tab to add quick-cast buttons.</p>`;
        } else {
          quickEl.innerHTML = selected
            .map((sp) => {
              const ok = canCastSpell(sp);
              let cost;
              if (sp.level === 0) cost = "Free";
              else if (isWarlock) {
                const pact = window.codexWarlockPactLevel(state.classId, state.level);
                cost = pact ? `Pact ${window.codexSlotLevelShort(pact)}` : "No slot";
              } else {
                cost = `${window.codexSlotLevelShort(sp.level)} slot`;
              }
              return `<button type="button" class="quick ${ok ? "" : "is-disabled"}" data-cast="${sp.id}" ${
                ok ? "" : "disabled"
              }>
                <span class="q-name">${escapeText(sp.name)}</span>
                <span class="q-cost">${escapeText(cost)}</span>
              </button>`;
            })
            .join("");
        }
      }
    }

    $("#combatLog").innerHTML = state.combatLog.length
      ? state.combatLog
          .slice(0, 12)
          .map((e) => `<li>${escapeText(e.text || "—")}</li>`)
          .join("")
      : `<li class="muted">No combat actions yet.</li>`;
  }

  function spellCardHTML(spell, { selectable = false, locked = false } = {}) {
    const levelLabel = window.codexSpellLevelLabel(spell.level);
    const comps = (spell.components || []).join(", ");
    const flags = [
      spell.ritual ? "Ritual" : "",
      spell.concentration ? "Concentration" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const classNames = (spell.classes || [])
      .map((id) => {
        const c = window.codexClassById(id);
        return c ? c.name : id;
      })
      .join(", ");
    const selected = isSpellSelected(spell.id);
    const pickClass = [
      "spell-card",
      selectable ? "spell-pick" : "",
      selected ? "is-selected" : "",
      locked && !selected ? "is-locked" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const check = selectable
      ? `<label class="spell-check" title="${selected ? "Selected" : locked ? "Limit reached" : "Select"}">
          <input type="checkbox" data-select-spell="${spell.id}" ${selected ? "checked" : ""} ${
            locked && !selected ? "disabled" : ""
          } />
          <span class="sr-only">Select ${escapeText(spell.name)}</span>
        </label>`
      : `<span class="pill">${spell.level === 0 ? "Cantrip" : `L${spell.level}`}</span>`;

    return `<article class="${pickClass}" data-spell="${spell.id}">
      <header>
        <div>
          <h3>${escapeText(spell.name)}</h3>
          <p class="meta">${levelLabel} · ${escapeText(spell.school)}${
            flags ? ` · ${flags}` : ""
          }</p>
        </div>
        ${check}
      </header>
      <p class="spell-how"><strong>Cast:</strong> ${escapeText(
        spell.castingTime
      )} · <strong>Range:</strong> ${escapeText(
        spell.range
      )} · <strong>Components:</strong> ${escapeText(comps)}${
        spell.material ? ` (${escapeText(spell.material)})` : ""
      } · <strong>Duration:</strong> ${escapeText(spell.duration)}</p>
      ${
        spell.dc || spell.attackType || spell.damageType
          ? `<p class="spell-how"><strong>Attack/Save:</strong> ${escapeText(
              [spell.attackType, spell.dc ? `${spell.dc} save` : "", spell.damageType]
                .filter(Boolean)
                .join(" · ")
            )}</p>`
          : ""
      }
      <p class="spell-desc">${escapeText(spell.description)}</p>
      ${
        spell.higherLevel
          ? `<p class="spell-higher"><strong>At higher levels:</strong> ${escapeText(
              spell.higherLevel
            )}</p>`
          : ""
      }
      <p class="muted tiny">Lists: ${escapeText(classNames || "—")}</p>
    </article>`;
  }

  function filteredSpells() {
    const f = state.spellFilters || {};
    const q = String(f.search || "")
      .trim()
      .toLowerCase();
    let list = SPELLS;
    if (f.classOnly && state.classId) {
      list = window.codexSpellsForClass(state.classId);
    }
    if (f.level !== "all" && f.level !== undefined && f.level !== "") {
      const lv = Number(f.level);
      list = list.filter((s) => s.level === lv);
    }
    if (f.school && f.school !== "all") {
      list = list.filter((s) => s.school === f.school);
    }
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          (s.school || "").toLowerCase().includes(q)
      );
    }
    return list;
  }

  function updatePowerTabLabels() {
    const meta = window.codexClassPowerPanel(state.classId);
    const tabBtn = document.querySelector('.tab[data-tab="spells"]');
    if (tabBtn) tabBtn.textContent = meta.tab;
    const title = $("#powerTitle");
    if (title) title.textContent = meta.title;
    const sub = $("#spellsSubtitle");
    if (sub) sub.textContent = meta.subtitle;
    const chrome = $("#spellCasterChrome");
    if (chrome) chrome.hidden = meta.mode !== "spells";
    return meta;
  }

  function renderFeaturePanel() {
    const list = $("#spellList");
    if (!list) return;
    const cls = selectedClass();
    const slotsCard = $("#spellSlotsCard");
    if (slotsCard) {
      slotsCard.hidden = true;
      slotsCard.innerHTML = "";
    }
    if (!cls) {
      list.innerHTML = `<p class="muted empty-spells">Select a class in Profile to load its features.</p>`;
      return;
    }
    ensureSpellArrays();
    const byLevel = {};
    for (let lv = 1; lv <= state.level; lv++) {
      const feats = cls.featuresByLevel?.[String(lv)] || [];
      if (feats.length) byLevel[lv] = feats;
    }
    const levels = Object.keys(byLevel)
      .map(Number)
      .sort((a, b) => a - b);
    if (!levels.length) {
      list.innerHTML = `<p class="muted empty-spells">No class features unlocked at level ${state.level}.</p>`;
      return;
    }
    list.innerHTML = levels
      .map((lv) => {
        const group = byLevel[lv];
        const openKey = `feat-${lv}`;
        const isOpen =
          state.spellLevelOpen[openKey] != null
            ? !!state.spellLevelOpen[openKey]
            : lv === levels[0];
        return `<details class="spell-level" data-spell-level="${openKey}" ${isOpen ? "open" : ""}>
          <summary class="spell-level-summary">
            <span class="spell-level-name">Level ${lv}</span>
            <span class="muted tiny">${group.length} feature${group.length === 1 ? "" : "s"}</span>
          </summary>
          <div class="spell-level-body">
            ${group
              .map(
                (f) => `<article class="feature-card">
                  <header><h3>${escapeText(f.name)}</h3><span class="pill">L${lv}</span></header>
                  <p class="feature-desc">${escapeText(f.description || "")}</p>
                </article>`
              )
              .join("")}
          </div>
        </details>`;
      })
      .join("");
  }

  function renderSpells() {
    ensureSpellArrays();
    const meta = updatePowerTabLabels();
    if (meta.mode === "features") {
      renderFeaturePanel();
      return;
    }

    const cls = selectedClass();
    const limits = spellLimits();
    const selectable = !!(cls && cls.spellcasting);
    const sub = $("#spellsSubtitle");
    if (sub && cls && cls.spellcasting) {
      sub.textContent = `${cls.name} · expand a level, check spells (${limits.selectLabel.toLowerCase()}). Selected spells appear in Combat.`;
    } else if (sub && !cls) {
      sub.textContent = meta.subtitle;
    }

    const schoolSel = $("#spellSchoolFilter");
    if (schoolSel && schoolSel.options.length <= 1) {
      for (const school of window.CODEX_SCHOOLS || []) {
        const opt = document.createElement("option");
        opt.value = school;
        opt.textContent = school;
        schoolSel.appendChild(opt);
      }
    }

    const f = state.spellFilters;
    if ($("#spellSearch")) $("#spellSearch").value = f.search || "";
    if ($("#spellLevelFilter")) $("#spellLevelFilter").value = f.level || "all";
    if ($("#spellSchoolFilter")) $("#spellSchoolFilter").value = f.school || "all";
    if ($("#spellClassOnly")) $("#spellClassOnly").checked = !!f.classOnly;

    renderSpellSlotsCard();

    const list = $("#spellList");
    if (!list) return;
    if (f.classOnly && !state.classId) {
      list.innerHTML = `<p class="muted empty-spells">Select a class in Profile to load its spell list, or uncheck “Class list only”.</p>`;
      return;
    }
    const spells = filteredSpells();
    if (!spells.length) {
      list.innerHTML = `<p class="muted empty-spells">No spells match these filters.</p>`;
      return;
    }

    const byLevel = {};
    for (const s of spells) {
      (byLevel[s.level] || (byLevel[s.level] = [])).push(s);
    }
    const levels = Object.keys(byLevel)
      .map(Number)
      .sort((a, b) => a - b);

    const left = selectionSlotsLeft();
    const cantripFull = selectable && left.counts.cantrips >= left.limits.cantrips;
    const leveledFull = selectable && left.counts.leveled >= left.limits.leveled;

    list.innerHTML = levels
      .map((lv) => {
        const group = byLevel[lv].sort((a, b) => a.name.localeCompare(b.name));
        const selectedInGroup = group.filter((s) => isSpellSelected(s.id)).length;
        const openKey = String(lv);
        const isOpen =
          state.spellLevelOpen[openKey] != null
            ? !!state.spellLevelOpen[openKey]
            : lv === levels[0];
        const lockedLevel = selectable && (lv === 0 ? cantripFull : leveledFull);
        const slotMax = lv > 0 ? maxSlotsMap()[lv] || 0 : 0;
        const slotRem = lv > 0 ? state.spellSlots[String(lv)] ?? slotMax : 0;
        const metaParts = [`${selectedInGroup} selected`, `${group.length} listed`];
        if (lv > 0 && slotMax > 0) metaParts.push(`cast ${slotRem}/${slotMax}`);
        return `<details class="spell-level" data-spell-level="${lv}" ${isOpen ? "open" : ""}>
          <summary class="spell-level-summary">
            <span class="spell-level-name">${window.codexSpellLevelLabel(lv)}</span>
            <span class="muted tiny">${metaParts.join(" · ")}</span>
          </summary>
          <div class="spell-level-body">
            ${group
              .map((s) => {
                const onClassList =
                  !cls || (s.classes || []).includes(cls.id);
                return spellCardHTML(s, {
                  selectable: selectable && onClassList,
                  locked: lockedLevel && !isSpellSelected(s.id),
                });
              })
              .join("")}
          </div>
        </details>`;
      })
      .join("");
  }

  function renderGear() {
    if (!state.equipment.length) {
      $("#equipmentList").innerHTML = `<p class="muted empty-gear">No items yet. Tap + Add to search the 5e SRD list.</p>`;
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
        ${
          item.category || item.summary
            ? `<p class="equip-meta muted tiny">${escapeText(
                [item.category, item.summary].filter(Boolean).join(" · ")
              )}</p>`
            : ""
        }
        <hr class="equip-rule" />
        <textarea class="equip-desc" data-equip-field="description" rows="4" placeholder="Description">${escapeText(
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
    const classSelect = $("#classSelect");
    if (classSelect && classSelect.options.length <= 1) {
      for (const c of CLASSES) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        classSelect.appendChild(opt);
      }
    }
    if (classSelect) classSelect.value = state.classId || "";

    $("#nameInput").value = state.name || "";
    $("#levelInput").value = String(state.level);
    $("#xpInput").value = String(state.xp || 0);
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

  function renderNotes() {
    const notes = ensureNotes();
    const browser = $("#notesBrowser");
    const editor = $("#noteEditor");
    const crumb = $("#notesBreadcrumb");
    if (!browser || !editor || !crumb) return;

    if ($("#notesSearch")) $("#notesSearch").value = notes.search || "";
    const tagSel = $("#notesTagFilter");
    if (tagSel) {
      const tags = allTags();
      const current = notes.tagFilter || "";
      tagSel.innerHTML =
        `<option value="">All tags</option>` +
        tags.map((t) => `<option value="${escapeAttr(t)}">#${escapeText(t)}</option>`).join("");
      tagSel.value = current;
    }

    const path = folderPath(notes.currentFolderId);
    crumb.innerHTML =
      `<button type="button" class="crumb" data-open-folder="">Root</button>` +
      path
        .map(
          (f) =>
            `<span class="crumb-sep">/</span><button type="button" class="crumb" data-open-folder="${f.id}">${escapeText(
              f.name
            )}</button>`
        )
        .join("");

    const selected = notes.selectedNoteId ? noteById(notes.selectedNoteId) : null;
    if (selected) {
      browser.hidden = true;
      editor.hidden = false;
      editor.innerHTML = `
        <div class="note-editor-top">
          <button type="button" class="btn ghost tiny" data-close-note>← Back</button>
          <button type="button" class="btn danger tiny" data-del-note="${selected.id}">Delete</button>
        </div>
        <label class="field">
          <span>Title</span>
          <input id="noteTitleInput" type="text" value="${escapeAttr(selected.title)}" />
        </label>
        <label class="field">
          <span>Tags (comma-separated)</span>
          <input id="noteTagsInput" type="text" value="${escapeAttr((selected.tags || []).join(", "))}" placeholder="quest, npc, tavern" />
        </label>
        <label class="field">
          <span>Note</span>
          <textarea id="noteBodyInput" rows="12" placeholder="Write your note…">${escapeText(
            selected.body
          )}</textarea>
        </label>
        <p class="muted tiny">Saved on this phone · Updated ${new Date(
          selected.updatedAt || selected.createdAt
        ).toLocaleString()}</p>
      `;
      return;
    }

    editor.hidden = true;
    editor.innerHTML = "";
    browser.hidden = false;

    const folders = childFolders(notes.currentFolderId).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const items = filteredNotesForCurrentFolder().sort(
      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    if (!folders.length && !items.length) {
      browser.innerHTML = `<p class="muted empty-notes">No folders or notes here yet. Tap + Folder or + Note.</p>`;
      return;
    }

    browser.innerHTML =
      (folders.length
        ? `<div class="notes-section">
            <p class="label">Folders</p>
            <div class="notes-folder-list">
              ${folders
                .map((f) => {
                  const subCount = childFolders(f.id).length;
                  const noteCount = notesInFolder(f.id).length;
                  return `<div class="folder-row" data-folder-row="${f.id}">
                    <button type="button" class="folder-open" data-open-folder="${f.id}">
                      <span class="folder-icon" aria-hidden="true"></span>
                      <span class="folder-name">${escapeText(f.name)}</span>
                      <span class="muted tiny">${subCount ? `${subCount} sub · ` : ""}${noteCount} note${
                        noteCount === 1 ? "" : "s"
                      }</span>
                    </button>
                    <button type="button" class="icon-btn" data-rename-folder="${f.id}" title="Rename" aria-label="Rename folder">Rename</button>
                    <button type="button" class="icon-btn danger-text" data-del-folder="${f.id}" title="Delete" aria-label="Delete folder">Del</button>
                  </div>`;
                })
                .join("")}
            </div>
          </div>`
        : "") +
      (items.length
        ? `<div class="notes-section">
            <p class="label">Notes</p>
            <div class="notes-list">
              ${items
                .map((n) => {
                  const preview = String(n.body || "")
                    .trim()
                    .split("\n")[0]
                    .slice(0, 90);
                  const tags = (n.tags || [])
                    .map((t) => `<span class="tag-pill">#${escapeText(t)}</span>`)
                    .join("");
                  return `<button type="button" class="note-row" data-open-note="${n.id}">
                    <span class="note-title">${escapeText(n.title || "Untitled")}</span>
                    ${preview ? `<span class="note-preview muted">${escapeText(preview)}</span>` : ""}
                    ${tags ? `<span class="note-tags">${tags}</span>` : ""}
                  </button>`;
                })
                .join("")}
            </div>
          </div>`
        : "");
  }

  function render() {
    renderHeader();
    renderVitals();
    updatePowerTabLabels();
    const tab = document.body.dataset.tab || "combat";
    if (tab === "combat") renderCombat();
    if (tab === "stats") renderStats();
    if (tab === "spells") renderSpells();
    if (tab === "gear") renderGear();
    if (tab === "notes") renderNotes();
    if (tab === "profile") renderProfile();
  }

  function setTab(tab) {
    document.body.dataset.tab = tab;
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
    render();
  }

  function bind() {
    document.addEventListener("click", handleVitalsClick);
    document.addEventListener("change", handleVitalsChange);

    $("#shortRestBtn")?.addEventListener("click", shortRest);
    $("#longRestBtn").addEventListener("click", longRest);

    $("#quickSpells")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cast]");
      if (!btn || btn.disabled) return;
      castSpell(btn.dataset.cast);
    });

    $("#spellList")?.addEventListener("change", (e) => {
      const box = e.target.closest("[data-select-spell]");
      if (!box) return;
      toggleSpellSelection(box.dataset.selectSpell, !!box.checked);
    });
    $("#spellList")?.addEventListener("toggle", (e) => {
      const details = e.target.closest("details[data-spell-level]");
      if (!details || e.target !== details) return;
      ensureSpellArrays();
      state.spellLevelOpen[details.dataset.spellLevel] = details.open;
      persist();
    }, true);

    $$(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

    $("#abilityBlocks").addEventListener("change", (e) => {
      const ab = e.target.dataset.ability;
      if (ab) {
        state.abilities[ab] = clamp(Number(e.target.value) || 10, 1, 30);
        // Prepared limits depend on spellcasting ability modifier.
        pruneSelectedSpells();
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
    $("#gearPickerClose")?.addEventListener("click", closeGearPicker);
    $("#gearPickerCustom")?.addEventListener("click", addCustomEquipment);
    $("#gearPicker")?.addEventListener("click", (e) => {
      if (e.target.id === "gearPicker") closeGearPicker();
      const row = e.target.closest("[data-add-catalog]");
      if (row) addEquipmentFromCatalog(row.dataset.addCatalog);
    });
    $("#gearPickerSearch")?.addEventListener("input", (e) => {
      gearPickerFilter.search = e.target.value;
      renderGearPickerResults();
    });
    $("#gearPickerCategory")?.addEventListener("change", (e) => {
      gearPickerFilter.category = e.target.value;
      renderGearPickerResults();
    });
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

    $("#noteAddFolderBtn")?.addEventListener("click", addFolder);
    $("#noteAddBtn")?.addEventListener("click", addNote);
    $("#notesSearch")?.addEventListener("input", (e) => {
      ensureNotes().search = e.target.value;
      persist();
      renderNotes();
    });
    $("#notesTagFilter")?.addEventListener("change", (e) => {
      ensureNotes().tagFilter = e.target.value;
      persist();
      renderNotes();
    });

    $("#notesBreadcrumb")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open-folder]");
      if (!btn) return;
      openFolder(btn.dataset.openFolder || null);
    });

    $("#notesBrowser")?.addEventListener("click", (e) => {
      const openFolderBtn = e.target.closest("[data-open-folder]");
      if (openFolderBtn) {
        openFolder(openFolderBtn.dataset.openFolder || null);
        return;
      }
      const renameBtn = e.target.closest("[data-rename-folder]");
      if (renameBtn) {
        renameFolder(renameBtn.dataset.renameFolder);
        return;
      }
      const delFolderBtn = e.target.closest("[data-del-folder]");
      if (delFolderBtn) {
        deleteFolder(delFolderBtn.dataset.delFolder);
        return;
      }
      const openNoteBtn = e.target.closest("[data-open-note]");
      if (openNoteBtn) openNote(openNoteBtn.dataset.openNote);
    });

    $("#noteEditor")?.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-note]")) {
        closeNoteEditor();
        return;
      }
      const del = e.target.closest("[data-del-note]");
      if (del) deleteNote(del.dataset.delNote);
    });
    $("#noteEditor")?.addEventListener("input", (e) => {
      const notes = ensureNotes();
      const id = notes.selectedNoteId;
      if (!id) return;
      if (e.target.id === "noteTitleInput") updateNoteField(id, "title", e.target.value);
      if (e.target.id === "noteBodyInput") updateNoteField(id, "body", e.target.value);
      if (e.target.id === "noteTagsInput") {
        updateNoteField(id, "tags", e.target.value);
        // Refresh tag filter options without leaving the editor.
        const tagSel = $("#notesTagFilter");
        if (tagSel) {
          const current = notes.tagFilter || "";
          tagSel.innerHTML =
            `<option value="">All tags</option>` +
            allTags()
              .map((t) => `<option value="${escapeAttr(t)}">#${escapeText(t)}</option>`)
              .join("");
          tagSel.value = current;
        }
      }
    });

    const profileMap = [
      ["nameInput", (v) => (state.name = v.trim() || "Adventurer")],
      [
        "levelInput",
        (v) => {
          const previousMax = maxSlotsMap();
          state.level = clamp(Number(v) || 1, 1, 20);
          refreshClassDerived(previousMax);
        },
      ],
      ["xpInput", (v) => (state.xp = Math.max(0, Number(v) || 0))],
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

    $("#classSelect")?.addEventListener("change", (e) => {
      applyClass(e.target.value);
    });

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
      const wasOn = state.dmLinkEnabled;
      if (wasOn) stopDmPublisher();
      state.dmLinkCode = window.DmEyeLink.generateCode();
      persist(true);
      renderProfile();
      toast("New DM Link code ready", "ok");
    });

    const syncSpellFilter = () => {
      state.spellFilters = {
        search: $("#spellSearch")?.value || "",
        level: $("#spellLevelFilter")?.value || "all",
        school: $("#spellSchoolFilter")?.value || "all",
        classOnly: !!$("#spellClassOnly")?.checked,
      };
      persist();
      renderSpells();
    };
    $("#spellSearch")?.addEventListener("input", syncSpellFilter);
    $("#spellLevelFilter")?.addEventListener("change", syncSpellFilter);
    $("#spellSchoolFilter")?.addEventListener("change", syncSpellFilter);
    $("#spellClassOnly")?.addEventListener("change", syncSpellFilter);

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
  refreshSpellcasting({ refillSlots: false, prune: true });
  setTab("combat");
  setSaveBadge(true);
  setupInstall();
  registerSW();
  ensureDmLinkCode();
  if (state.dmLinkEnabled) syncDmLink();
  render();
})();
