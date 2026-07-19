(() => {
  const SKILLS = window.KIRITO_SKILLS;
  const byId = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
  const STORAGE_KEY = window.STORAGE_KEY;
  const MAX_MANA_DEFAULT = 100;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function defaultState() {
    const progress = {};
    for (const s of SKILLS) {
      progress[s.id] = {
        sessions: s.starter ? s.trainingNeeded : 0,
        learned: !!s.starter,
      };
    }
    return {
      version: window.APP_VERSION,
      name: "Kirito",
      level: 1,
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
      };
      // Ensure every skill has a progress row
      for (const s of SKILLS) {
        if (!merged.progress[s.id]) {
          merged.progress[s.id] = {
            sessions: s.starter ? s.trainingNeeded : 0,
            learned: !!s.starter,
          };
        }
        if (s.starter) merged.progress[s.id].learned = true;
      }
      merged.mana = clamp(merged.mana, 0, merged.maxMana);
      return merged;
    } catch {
      return defaultState();
    }
  }

  let state = loadState();
  let saveTimer = null;
  let toastTimer = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function persist(immediate = false) {
    state.updatedAt = Date.now();
    const write = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaveBadge(true);
      } catch (err) {
        setSaveBadge(false, "Save failed");
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

  function isLearned(id) {
    return !!state.progress[id]?.learned;
  }

  function prereqsMet(skill) {
    return (skill.prerequisite || []).every((id) => isLearned(id));
  }

  function dualGateOpen() {
    return (
      state.level >= 10 &&
      isLearned("vorpal-strike") &&
      state.reactionTrial &&
      isLearned("dual-blades")
    );
  }

  function skillStatus(skill) {
    if (isLearned(skill.id)) return "learned";
    if (skill.dual || skill.isGate) {
      if (skill.isGate) {
        if (state.level < skill.levelRequired) return "locked";
        if (!isLearned("vorpal-strike") || !state.reactionTrial) return "locked";
        return "unlocked";
      }
      if (!dualGateOpen() && skill.id !== "dual-blades") return "locked";
    }
    if (state.level < skill.levelRequired) return "locked";
    if (!prereqsMet(skill)) return "locked";
    const sessions = state.progress[skill.id]?.sessions || 0;
    if (sessions > 0 && sessions < skill.trainingNeeded) return "training";
    if (sessions >= skill.trainingNeeded && skill.trainingNeeded === 0) return "learned";
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
    if (!skill) return 10; // no-skill turn bonus path handled separately
    if (skill.tier === "Ultimate") return 0;
    if (skill.tier === "Basic" && skill.mana === 0) return 7;
    if (skill.tier === "Basic") return 7;
    return 5;
  }

  function pushLog(entry) {
    state.combatLog.unshift({
      t: Date.now(),
      round: state.round,
      ...entry,
    });
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

    pushLog({
      skill: skill.name,
      cost: skill.mana,
      before,
      after: state.mana,
      kind: "spend",
    });

    persist();
    render();
    toast(
      skill.mana === 0
        ? `${skill.name} · free`
        : `${skill.name} · −${skill.mana} mana`,
      "ok"
    );

    // Haptic if available
    if (navigator.vibrate) navigator.vibrate(skill.tier === "Ultimate" ? 40 : 12);
  }

  function endTurn() {
    const last = state.lastSkillId ? byId[state.lastSkillId] : null;
    let regen = 0;
    if (state.lastWasUltimate) {
      regen = 0;
    } else if (!last) {
      regen = 10;
    } else {
      regen = regenFor(last);
    }
    const before = state.mana;
    state.mana = clamp(state.mana + regen, 0, state.maxMana);
    state.round += 1;
    state.retreatUsedThisTurn = false;
    state.lastSkillId = null;
    state.lastWasUltimate = false;
    pushLog({
      skill: "Turn regen",
      cost: 0,
      regen,
      before,
      after: state.mana,
      kind: "regen",
    });
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
    state.round = 1;
    state.retreatUsedThisTurn = false;
    state.lastSkillId = null;
    state.lastWasUltimate = false;
    persist();
    render();
    toast("Long rest · full mana", "ok");
  }

  function setLevel(level) {
    state.level = clamp(Number(level) || 1, 1, 20);
    // Auto-learn gate completion flag if dual blades learned
    state.dualUnlocked = dualGateOpen();
    persist();
    render();
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
      toast(
        `${skill.name} training ${row.sessions}/${skill.trainingNeeded}`,
        "ok"
      );
    }
    persist();
    render();
  }

  function resetProgress() {
    if (!confirm("Reset all saved progress on this phone?")) return;
    state = defaultState();
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
    a.download = `kirito-mana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exported", "ok");
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !data.progress) {
          throw new Error("Invalid backup");
        }
        const base = defaultState();
        state = {
          ...base,
          ...data,
          progress: { ...base.progress, ...data.progress },
        };
        persist(true);
        render();
        toast("Backup restored", "ok");
      } catch {
        toast("Could not import backup", "warn");
      }
    };
    reader.readAsText(file);
  }

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

  function renderMana() {
    const pct = (state.mana / state.maxMana) * 100;
    $("#manaValue").textContent = `${state.mana}`;
    $("#manaMax").textContent = `${state.maxMana}`;
    $("#manaFill").style.width = `${pct}%`;
    $("#manaFill").dataset.low = state.mana <= 20 ? "1" : "0";
    $("#roundValue").textContent = String(state.round);
    $("#levelChip").textContent = `Lv ${state.level}`;
    $("#nameChip").textContent = state.name || "Kirito";
  }

  function skillCardHTML(skill, mode) {
    const status = skillStatus(skill);
    const usable = mode === "combat" && canUse(skill);
    const sessions = state.progress[skill.id]?.sessions || 0;
    const disabled = mode === "combat" ? !usable : status === "locked" || status === "learned";
    const meta = [
      skill.actionType,
      skill.mana === 0 ? "Free" : `${skill.mana} mana`,
      skill.range,
    ]
      .filter(Boolean)
      .join(" · ");

    const trainBits =
      mode === "train" && status !== "learned" && status !== "locked"
        ? `<div class="train-row"><span>${sessions}/${skill.trainingNeeded} sessions</span>
           <button type="button" class="btn tiny" data-train="${skill.id}">Train +1</button></div>`
        : mode === "train" && status === "learned"
          ? `<div class="train-row muted">Complete</div>`
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

  function renderCombat() {
    const learned = SKILLS.filter((s) => skillStatus(s) === "learned" && !s.isGate);
    const quickIds = ["deflect", "retreat", "rage-spike", "slant", "horizontal", "vertical"];
    const quick = quickIds.map((id) => byId[id]).filter(Boolean);
    $("#quickSkills").innerHTML = quick
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
          .map((e) => {
            if (e.kind === "regen") {
              return `<li><span>R${e.round}</span> +${e.regen} regen → ${e.after}</li>`;
            }
            return `<li><span>R${e.round}</span> ${e.skill}${
              e.cost ? ` −${e.cost}` : " free"
            } → ${e.after}</li>`;
          })
          .join("")
      : `<li class="muted">No actions yet this fight.</li>`;
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
    const list = SKILLS.filter((s) => !s.starter);
    $("#trainSkills").innerHTML = list.map((s) => skillCardHTML(s, "train")).join("");
    $("#trialToggle").checked = !!state.reactionTrial;
    $("#dualStatus").textContent = dualGateOpen()
      ? "Dual Blades OPEN"
      : state.level < 10
        ? "Dual locked until Level 10"
        : !state.reactionTrial
          ? "Need Reaction Trial"
          : !isLearned("vorpal-strike")
            ? "Need Vorpal Strike learned"
            : !isLearned("dual-blades")
              ? "Train Dual Blades Unique Skill"
              : "Dual Blades OPEN";
  }

  function renderProfile() {
    $("#nameInput").value = state.name || "";
    $("#levelInput").value = String(state.level);
    $("#maxManaInput").value = String(state.maxMana);
    const when = state.updatedAt
      ? new Date(state.updatedAt).toLocaleString()
      : "—";
    $("#lastSaved").textContent = when;
    $("#storageNote").textContent =
      "Progress is stored in this phone’s browser storage. Closing the app keeps it. Clearing site data will erase it — use Export Backup.";
  }

  function render() {
    state.dualUnlocked = dualGateOpen();
    renderMana();
    const tab = document.body.dataset.tab || "combat";
    if (tab === "combat") renderCombat();
    if (tab === "skills") renderSkills();
    if (tab === "train") renderTrain();
    if (tab === "profile") renderProfile();
  }

  function setTab(tab) {
    document.body.dataset.tab = tab;
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
    render();
  }

  function bind() {
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

    $$(".tab").forEach((b) =>
      b.addEventListener("click", () => setTab(b.dataset.tab))
    );

    $("#skillFilter")?.addEventListener("change", renderSkills);

    $("#trialToggle").addEventListener("change", (e) => {
      state.reactionTrial = e.target.checked;
      persist();
      render();
    });

    $("#nameInput").addEventListener("change", (e) => {
      state.name = e.target.value.trim() || "Kirito";
      persist();
      render();
    });
    $("#levelInput").addEventListener("change", (e) => setLevel(e.target.value));
    $("#maxManaInput").addEventListener("change", (e) => {
      state.maxMana = clamp(Number(e.target.value) || 100, 1, 999);
      state.mana = clamp(state.mana, 0, state.maxMana);
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

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persist(true);
    });
    window.addEventListener("pagehide", () => persist(true));
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      console.log("SW ready", reg.scope);
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
    // iOS tip always available in profile
  }

  bind();
  setTab("combat");
  setSaveBadge(true);
  setupInstall();
  registerSW();
  render();
})();
