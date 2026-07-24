(function () {
  const STORAGE = {
    looks: "gq-character-looks-v1",
    creations: "gq-character-creations-v1",
    community: "gq-character-community-v1",
    draft: "gq-character-draft-v1",
  };

  const Slots = window.CharacterSlots;
  const official = Array.isArray(window.CharacterCatalog)
    ? window.CharacterCatalog
    : [];

  /** @type {Record<string, string|null>} */
  const equipped = Object.fromEntries(Slots.ORDER.map((s) => [s, null]));

  /** Draft piece for creator preview */
  let draftPiece = null;
  let activeSlot = "body";
  let draftImageData = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function allPieces() {
    const mine = loadJson(STORAGE.creations, []);
    const community = loadJson(STORAGE.community, []);
    return [...official, ...community, ...mine];
  }

  function pieceById(id) {
    if (!id) return null;
    return allPieces().find((p) => p.id === id) || null;
  }

  function piecesForSlot(slot) {
    return allPieces().filter((p) => p.slot === slot);
  }

  function transformAttr(t) {
    if (!t) return "";
    const x = t.x || 0;
    const y = t.y || 0;
    const s = t.scale == null ? 1 : t.scale;
    const r = t.rotate || 0;
    const cx = Slots.STAGE.width / 2;
    const cy = Slots.STAGE.height / 2;
    return `translate(${x} ${y}) rotate(${r} ${cx} ${cy}) translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
  }

  function renderPieceGroup(piece, { hideUnderHat = false, draft = false } = {}) {
    if (!piece) return "";
    const t = transformAttr(piece.transform);
    const hideClass = hideUnderHat ? " hat-equipped" : "";
    const draftClass = draft ? " draft-piece" : "";
    let inner = piece.svg || "";
    if (piece.imageData) {
      const w = piece.imageWidth || 200;
      const h = piece.imageHeight || 200;
      const x = (Slots.STAGE.width - w) / 2;
      const y = (Slots.STAGE.height - h) / 2 - 40;
      inner = `<image href="${piece.imageData}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
      if (piece.underHat) {
        inner = `<g class="under-hat">${inner}</g>`;
      }
    } else if (piece.underHat && piece.svg && !piece.svg.includes("under-hat")) {
      inner = `<g class="under-hat">${piece.svg}</g>`;
    }
    return `<g class="layer layer-${piece.slot}${hideClass}${draftClass}" data-piece="${piece.id}" transform="${t}">${inner}</g>`;
  }

  function composeSvg(extraDraft = null) {
    const hatOn = Boolean(equipped.hat);
    const layers = Slots.ORDER.map((slot) => {
      const id = equipped[slot];
      const piece = pieceById(id);
      if (!piece) return "";
      return renderPieceGroup(piece, { hideUnderHat: hatOn && slot === "hair" });
    });
    if (extraDraft) {
      layers.push(
        renderPieceGroup(extraDraft, {
          hideUnderHat: hatOn && extraDraft.slot === "hair",
          draft: true,
        })
      );
    }
    return layers.join("\n");
  }

  function paintStage(svgEl, extraDraft = null) {
    if (!svgEl) return;
    svgEl.innerHTML = composeSvg(extraDraft);
    // Hide under-hat regions when a hat is present
    const hatOn = Boolean(equipped.hat) || (extraDraft && extraDraft.slot === "hat");
    svgEl.querySelectorAll(".under-hat").forEach((node) => {
      node.classList.toggle("is-hidden", hatOn);
    });
  }

  function refreshStages() {
    paintStage($("#stage"));
    paintStage($("#createStage"), draftPiece);
    updateSlotTabMarks();
  }

  function defaultEquip() {
    equipped.background = "bg-studio";
    equipped.base = "base-disc";
    equipped.body = "body-athletic";
    equipped.head = "head-oval";
    equipped.hair = "hair-short";
    equipped.top = "top-tunic";
    equipped.bottom = "bottom-pants";
    equipped.footwear = "boot-leather";
  }

  function buildSlotTabs() {
    const tabs = $("#slotTabs");
    tabs.innerHTML = Slots.ORDER.map((slot) => {
      const meta = Slots.META[slot];
      return `<button type="button" class="slot-tab${slot === activeSlot ? " active" : ""}" data-slot="${slot}" role="tab">${meta.label}</button>`;
    }).join("");
    updateSlotTabMarks();
  }

  function syncActiveSlotTab() {
    $$(".slot-tab").forEach((b) =>
      b.classList.toggle("active", b.dataset.slot === activeSlot)
    );
  }

  function updateSlotTabMarks() {
    $$(".slot-tab").forEach((btn) => {
      btn.classList.toggle("has-piece", Boolean(equipped[btn.dataset.slot]));
    });
  }

  function thumbSvg(piece) {
    const content = piece.imageData
      ? `<image href="${piece.imageData}" x="40" y="40" width="320" height="480" preserveAspectRatio="xMidYMid meet"/>`
      : piece.svg || `<text x="200" y="280" text-anchor="middle" fill="#9aabbf" font-size="28">Empty</text>`;
    return `<svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  }

  function renderPieceGrid() {
    const grid = $("#pieceGrid");
    const hint = $("#slotHint");
    const meta = Slots.META[activeSlot];
    hint.textContent = meta.hint;

    const noneCard =
      meta.required
        ? ""
        : `<button type="button" class="piece-card${!equipped[activeSlot] ? " selected" : ""}" data-id="">
            <div class="thumb"><svg viewBox="0 0 400 560"><text x="200" y="280" text-anchor="middle" fill="#9aabbf" font-size="32">None</text></svg></div>
            <span class="pname">None</span>
            <span class="psrc">clear slot</span>
          </button>`;

    const cards = piecesForSlot(activeSlot)
      .map((p) => {
        const selected = equipped[activeSlot] === p.id ? " selected" : "";
        const src =
          p.source === "official"
            ? "official"
            : p.published
              ? `by ${p.author || "community"}`
              : "mine";
        return `<button type="button" class="piece-card${selected}" data-id="${p.id}" role="option" aria-selected="${Boolean(selected)}">
          <div class="thumb">${thumbSvg(p)}</div>
          <span class="pname">${escapeHtml(p.name)}</span>
          <span class="psrc">${escapeHtml(src)}</span>
        </button>`;
      })
      .join("");

    grid.innerHTML = noneCard + cards;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function equip(slot, id) {
    if (Slots.META[slot]?.required && !id) return;
    equipped[slot] = id || null;
    // Head/hair compatibility: if hair declares specific heads, soft-warn via console only
    refreshStages();
    renderPieceGrid();
    persistDraftLook();
  }

  function persistDraftLook() {
    saveJson(STORAGE.draft, { ...equipped });
  }

  function restoreDraftLook() {
    const draft = loadJson(STORAGE.draft, null);
    if (!draft) {
      defaultEquip();
      return;
    }
    Slots.ORDER.forEach((slot) => {
      equipped[slot] = draft[slot] || null;
    });
    if (!equipped.body) equipped.body = "body-athletic";
    if (!equipped.head) equipped.head = "head-oval";
  }

  function randomize() {
    const pick = (slot, allowNone = true) => {
      const list = piecesForSlot(slot);
      if (!list.length) return null;
      if (allowNone && !Slots.META[slot].required && Math.random() < 0.25) return null;
      return list[Math.floor(Math.random() * list.length)].id;
    };
    equipped.background = pick("background", false);
    equipped.base = pick("base", true);
    equipped.body = pick("body", false);
    equipped.head = pick("head", false);
    equipped.hair = pick("hair", true);
    equipped.hat = pick("hat", true);
    equipped.glasses = pick("glasses", true);
    equipped.top = pick("top", true);
    equipped.bottom = pick("bottom", true);
    equipped.outer = pick("outer", true);
    equipped.footwear = pick("footwear", true);
    equipped["weapon-main"] = pick("weapon-main", true);
    equipped["weapon-off"] = pick("weapon-off", true);
    equipped.item = pick("item", true);
    equipped.prop = pick("prop", true);
    refreshStages();
    renderPieceGrid();
    persistDraftLook();
  }

  function clearGear() {
    [
      "hat",
      "glasses",
      "top",
      "bottom",
      "outer",
      "footwear",
      "weapon-main",
      "weapon-off",
      "item",
      "prop",
    ].forEach((s) => {
      equipped[s] = null;
    });
    refreshStages();
    renderPieceGrid();
    persistDraftLook();
  }

  function saveLook() {
    const name = prompt("Name this look:", "My character");
    if (!name) return;
    const looks = loadJson(STORAGE.looks, []);
    looks.unshift({
      id: uid("look"),
      name: name.trim().slice(0, 48),
      equipped: { ...equipped },
      savedAt: new Date().toISOString(),
    });
    saveJson(STORAGE.looks, looks.slice(0, 40));
    renderLibrary();
    setMode("library");
  }

  async function exportPng() {
    const svg = $("#stage");
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>`, xml],
      { type: "image/svg+xml;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1120;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a0e14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "character.png";
    a.click();
  }

  /* -------- Creator -------- */

  function fillCreateSlots() {
    const sel = $("#createSlot");
    sel.innerHTML = Slots.CREATOR_TARGETS.map((slot) => {
      const meta = Slots.META[slot];
      return `<option value="${slot}">${meta.label}</option>`;
    }).join("");
  }

  function readCreateTransform() {
    return {
      x: Number($("#createOx").value) || 0,
      y: Number($("#createOy").value) || 0,
      scale: (Number($("#createScale").value) || 100) / 100,
      rotate: Number($("#createRot").value) || 0,
    };
  }

  function updateTransformOutputs() {
    $("#oxOut").textContent = $("#createOx").value;
    $("#oyOut").textContent = $("#createOy").value;
    $("#scOut").textContent = (Number($("#createScale").value) / 100).toFixed(2);
    $("#rotOut").textContent = `${$("#createRot").value}°`;
  }

  function rebuildDraft() {
    const name = $("#createName").value.trim() || "Untitled piece";
    const slot = $("#createSlot").value;
    const svgRaw = $("#createSvg").value.trim();
    const underHat = $("#createUnderHat").checked;
    draftPiece = {
      id: "draft-preview",
      slot,
      name,
      svg: svgRaw,
      imageData: draftImageData,
      imageWidth: 220,
      imageHeight: 220,
      underHat,
      transform: readCreateTransform(),
      source: "draft",
      author: $("#createAuthor").value.trim() || "you",
    };
    paintStage($("#createStage"), draftPiece);
    // Also reflect hat hide if drafting a hat against current hair
    const hatOn = slot === "hat" || Boolean(equipped.hat);
    $("#createStage")
      .querySelectorAll(".under-hat")
      .forEach((node) => node.classList.toggle("is-hidden", hatOn));
  }

  function showCreateMsg(text, isError) {
    const el = $("#createMsg");
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("error", Boolean(isError));
  }

  function saveCreatedPiece(equipAfter) {
    const name = $("#createName").value.trim();
    if (!name) {
      showCreateMsg("Give the piece a name.", true);
      return null;
    }
    const svgRaw = $("#createSvg").value.trim();
    if (!svgRaw && !draftImageData) {
      showCreateMsg("Upload an image or paste SVG artwork.", true);
      return null;
    }

    const publish = $("#createPublish").checked;
    const piece = {
      id: uid("user"),
      slot: $("#createSlot").value,
      name,
      author: $("#createAuthor").value.trim() || "anonymous",
      svg: svgRaw,
      imageData: draftImageData,
      imageWidth: 220,
      imageHeight: 220,
      underHat: $("#createUnderHat").checked,
      transform: readCreateTransform(),
      source: "user",
      published: publish,
      createdAt: new Date().toISOString(),
    };

    const mine = loadJson(STORAGE.creations, []);
    mine.unshift(piece);
    saveJson(STORAGE.creations, mine);

    if (publish) {
      const community = loadJson(STORAGE.community, []);
      // Store a community-safe copy (same data — shared via export packs)
      community.unshift({ ...piece, source: "community" });
      saveJson(STORAGE.community, community.slice(0, 200));
    }

    showCreateMsg(
      publish
        ? "Saved and published to your community pack. Export the pack to share it."
        : "Saved to My creations."
    );

    if (equipAfter) {
      equipped[piece.slot] = piece.id;
      persistDraftLook();
      refreshStages();
      setMode("build");
      activeSlot = piece.slot;
      syncActiveSlotTab();
      renderPieceGrid();
    }

    renderLibrary();
    return piece;
  }

  function svgStubForSlot(slot) {
    const stubs = {
      hat: `<g class="piece-hat"><ellipse cx="200" cy="100" rx="70" ry="18" fill="#6a4830"/><path d="M150 100 Q200 40 250 100" fill="#8a6840"/></g>`,
      glasses: `<g fill="none" stroke="#222" stroke-width="3"><circle cx="175" cy="95" r="14"/><circle cx="225" cy="95" r="14"/><path d="M189 95 H211"/></g>`,
      top: `<path d="M145 155 L125 300 L275 300 L255 155 Q200 175 145 155Z" fill="#4a6a7a"/>`,
      bottom: `<path d="M145 300 L140 470 L180 470 L200 330 L220 470 L260 470 L255 300Z" fill="#3a4a5a"/>`,
      outer: `<path d="M130 160 L100 480 L300 480 L270 160 Q200 190 130 160Z" fill="#2a3a4a" opacity=".85"/>`,
      footwear: `<path d="M130 460 H175 V500 H120Z M225 460 H270 V500 H280Z" fill="#4a3020"/>`,
      "weapon-main": `<g transform="translate(290 280) rotate(-15)"><rect x="-5" y="0" width="10" height="140" fill="#5a4030"/><path d="M0 0 L8 -80 L0 -95 L-8 -80Z" fill="#c0c8d8"/></g>`,
      "weapon-off": `<circle cx="100" cy="300" r="36" fill="#6a4830" stroke="#c0a050" stroke-width="4"/>`,
      item: `<g transform="translate(200 300)"><rect x="-16" y="-20" width="32" height="40" rx="3" fill="#3a2040"/></g>`,
      prop: `<g transform="translate(70 450)"><rect x="-24" y="-16" width="48" height="32" rx="3" fill="#6a4830"/></g>`,
      base: `<ellipse cx="200" cy="505" rx="90" ry="20" fill="#5a6578"/>`,
      background: `<rect width="400" height="560" fill="#1a3040"/>`,
      hair: `<g class="piece-hair"><g class="under-hat"><path d="M150 100 Q200 40 250 100 Q240 70 200 65 Q160 70 150 100Z" fill="#2a1a10"/></g><path d="M148 100 Q140 180 155 240" fill="#2a1a10"/><path d="M252 100 Q260 180 245 240" fill="#2a1a10"/></g>`,
      head: `<g><path d="M182 148 L182 136 L218 136 L218 148Z" fill="#e8b896"/><ellipse cx="200" cy="95" rx="40" ry="48" fill="#e8b896"/></g>`,
      body: `<g><path d="M182 148 L182 166 L218 166 L218 148Z" fill="#e8b896"/><path d="M145 160 L130 310 L270 310 L255 160Z" fill="#e8b896"/><path d="M150 290 L180 330 L220 330 L250 290 Q200 305 150 290Z" fill="#3a3548"/></g>`,
    };
    return stubs[slot] || `<circle cx="200" cy="280" r="40" fill="#5a9ec8"/>`;
  }

  /* -------- Library -------- */

  function renderLibrary() {
    const looks = loadJson(STORAGE.looks, []);
    const mine = loadJson(STORAGE.creations, []);
    const community = loadJson(STORAGE.community, []);

    const looksEl = $("#savedLooks");
    looksEl.innerHTML = looks.length
      ? looks
          .map(
            (look) => `<article class="lib-card" data-look="${look.id}">
          <div class="meta">
            <span class="title">${escapeHtml(look.name)}</span>
            <span class="sub">${new Date(look.savedAt).toLocaleString()}</span>
          </div>
          <div class="actions">
            <button type="button" class="btn ghost" data-act="load-look">Load</button>
            <button type="button" class="btn danger" data-act="del-look">Delete</button>
          </div>
        </article>`
          )
          .join("")
      : `<p class="empty">No saved looks yet.</p>`;

    const mineEl = $("#myCreations");
    mineEl.innerHTML = mine.length
      ? mine
          .map(
            (p) => `<article class="lib-card" data-piece="${p.id}">
          <div class="meta">
            <span class="title">${escapeHtml(p.name)}</span>
            <span class="sub">${escapeHtml(Slots.META[p.slot]?.label || p.slot)} · ${p.published ? "published" : "private"}</span>
          </div>
          <div class="actions">
            <button type="button" class="btn ghost" data-act="equip-piece">Equip</button>
            <button type="button" class="btn ghost" data-act="toggle-pub">${p.published ? "Unpublish" : "Publish"}</button>
            <button type="button" class="btn danger" data-act="del-piece">Delete</button>
          </div>
        </article>`
          )
          .join("")
      : `<p class="empty">Create pieces in the Create tab.</p>`;

    const comEl = $("#communityList");
    comEl.innerHTML = community.length
      ? community
          .map(
            (p) => `<article class="lib-card" data-piece="${p.id}">
          <div class="meta">
            <span class="title">${escapeHtml(p.name)}</span>
            <span class="sub">${escapeHtml(Slots.META[p.slot]?.label || p.slot)} · by ${escapeHtml(p.author || "unknown")}</span>
          </div>
          <div class="actions">
            <button type="button" class="btn ghost" data-act="equip-community">Equip</button>
            <button type="button" class="btn danger" data-act="del-community">Remove</button>
          </div>
        </article>`
          )
          .join("")
      : `<p class="empty">No community pieces yet. Publish from Create, import a pack, or fetch the shared pack.</p>`;
  }

  function exportPack() {
    const mine = loadJson(STORAGE.creations, []).filter((p) => p.published);
    const community = loadJson(STORAGE.community, []);
    // Dedupe by id
    const map = new Map();
    [...community, ...mine].forEach((p) => map.set(p.id, p));
    const pack = {
      format: "gq-character-pack-v1",
      exportedAt: new Date().toISOString(),
      pieces: [...map.values()].map((p) => ({
        ...p,
        source: "community",
        published: true,
      })),
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `character-pack-${Date.now()}.json`;
    a.click();
  }

  async function fetchSharedPack(silent) {
    try {
      const res = await fetch("./data/community.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No shared pack on server yet.");
      const pack = await res.json();
      importPackObject(pack, silent);
    } catch (err) {
      if (!silent) alert(err.message || "Could not fetch shared pack.");
    }
  }

  function importPackObject(pack, silent) {
    if (!pack || pack.format !== "gq-character-pack-v1" || !Array.isArray(pack.pieces)) {
      if (!silent) alert("Not a valid character pack.");
      return;
    }
    const community = loadJson(STORAGE.community, []);
    const ids = new Set(community.map((p) => p.id));
    let added = 0;
    pack.pieces.forEach((p) => {
      if (!p.id || !p.slot || !p.name) return;
      if (ids.has(p.id)) return;
      community.unshift({
        ...p,
        source: "community",
        published: true,
      });
      ids.add(p.id);
      added += 1;
    });
    saveJson(STORAGE.community, community.slice(0, 300));
    renderLibrary();
    renderPieceGrid();
    if (!silent) alert(`Imported ${added} piece(s).`);
  }

  function setMode(mode) {
    document.body.dataset.mode = mode;
    $$(".mode-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === mode)
    );
    $$(".mode-panel").forEach((p) =>
      p.classList.toggle("active", p.dataset.panel === mode)
    );
    if (mode === "library") renderLibrary();
    if (mode === "create") rebuildDraft();
    if (mode === "build") refreshStages();
  }

  /* -------- Wire up -------- */

  function init() {
    restoreDraftLook();
    buildSlotTabs();
    fillCreateSlots();
    renderPieceGrid();
    refreshStages();
    renderLibrary();
    updateTransformOutputs();

    // Seed community pieces from the shipped pack once per device
    if (!loadJson(STORAGE.community, []).length) {
      fetchSharedPack(true).then(() => {
        renderPieceGrid();
        renderLibrary();
      });
    }

    $("#slotTabs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-slot]");
      if (!btn) return;
      activeSlot = btn.dataset.slot;
      syncActiveSlotTab();
      renderPieceGrid();
    });

    $("#pieceGrid").addEventListener("click", (e) => {
      const card = e.target.closest(".piece-card");
      if (!card) return;
      equip(activeSlot, card.dataset.id || null);
    });

    $$(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $("#randomBtn").addEventListener("click", randomize);
    $("#clearGearBtn").addEventListener("click", clearGear);
    $("#saveLookBtn").addEventListener("click", saveLook);
    $("#exportPngBtn").addEventListener("click", () => {
      exportPng().catch(() => alert("Could not export PNG."));
    });

    [
      "createName",
      "createSlot",
      "createAuthor",
      "createSvg",
      "createOx",
      "createOy",
      "createScale",
      "createRot",
      "createUnderHat",
    ].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener("input", () => {
        updateTransformOutputs();
        rebuildDraft();
      });
      el.addEventListener("change", () => {
        updateTransformOutputs();
        rebuildDraft();
      });
    });

    $("#createFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const status = $("#uploadStatus");
      if (file.size > 1.5 * 1024 * 1024) {
        status.textContent = "Image too large (max ~1.5MB). Try a smaller PNG.";
        return;
      }
      if (file.type === "image/svg+xml") {
        const text = await file.text();
        $("#createSvg").value = text.replace(/<\/?svg[^>]*>/gi, "").trim();
        draftImageData = null;
        status.textContent = `Loaded SVG: ${file.name}`;
      } else {
        const dataUrl = await fileToDataUrl(file);
        draftImageData = dataUrl;
        status.textContent = `Loaded image: ${file.name}`;
      }
      rebuildDraft();
    });

    $("#useSvgStubBtn").addEventListener("click", () => {
      const slot = $("#createSlot").value;
      $("#createSvg").value = svgStubForSlot(slot);
      draftImageData = null;
      $("#uploadStatus").textContent = "Inserted a starter SVG for this slot — edit or reposition.";
      rebuildDraft();
    });

    $("#createForm").addEventListener("submit", (e) => {
      e.preventDefault();
      saveCreatedPiece(false);
    });

    $("#previewEquipBtn").addEventListener("click", () => {
      saveCreatedPiece(true);
    });

    $("#exportPackBtn").addEventListener("click", exportPack);
    $("#importPackFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const pack = JSON.parse(await file.text());
        importPackObject(pack);
      } catch {
        alert("Could not read that JSON pack.");
      }
      e.target.value = "";
    });
    $("#reloadRemoteBtn").addEventListener("click", () => fetchSharedPack(false));

    $("#savedLooks").addEventListener("click", (e) => {
      const card = e.target.closest("[data-look]");
      if (!card) return;
      const id = card.dataset.look;
      const act = e.target.closest("[data-act]")?.dataset.act;
      const looks = loadJson(STORAGE.looks, []);
      if (act === "load-look") {
        const look = looks.find((l) => l.id === id);
        if (!look) return;
        Object.assign(equipped, Object.fromEntries(Slots.ORDER.map((s) => [s, null])));
        Object.assign(equipped, look.equipped);
        persistDraftLook();
        refreshStages();
        renderPieceGrid();
        setMode("build");
      } else if (act === "del-look") {
        saveJson(
          STORAGE.looks,
          looks.filter((l) => l.id !== id)
        );
        renderLibrary();
      }
    });

    $("#myCreations").addEventListener("click", (e) => {
      const card = e.target.closest("[data-piece]");
      if (!card) return;
      const id = card.dataset.piece;
      const act = e.target.closest("[data-act]")?.dataset.act;
      let mine = loadJson(STORAGE.creations, []);
      const piece = mine.find((p) => p.id === id);
      if (!piece) return;
      if (act === "equip-piece") {
        equipped[piece.slot] = piece.id;
        persistDraftLook();
        refreshStages();
        setMode("build");
        activeSlot = piece.slot;
        syncActiveSlotTab();
        renderPieceGrid();
      } else if (act === "toggle-pub") {
        piece.published = !piece.published;
        saveJson(STORAGE.creations, mine);
        let community = loadJson(STORAGE.community, []);
        if (piece.published) {
          community = [{ ...piece, source: "community" }, ...community.filter((p) => p.id !== id)];
        } else {
          community = community.filter((p) => p.id !== id);
        }
        saveJson(STORAGE.community, community);
        renderLibrary();
      } else if (act === "del-piece") {
        mine = mine.filter((p) => p.id !== id);
        saveJson(STORAGE.creations, mine);
        saveJson(
          STORAGE.community,
          loadJson(STORAGE.community, []).filter((p) => p.id !== id)
        );
        if (equipped[piece.slot] === id) equipped[piece.slot] = null;
        persistDraftLook();
        refreshStages();
        renderLibrary();
        renderPieceGrid();
      }
    });

    $("#communityList").addEventListener("click", (e) => {
      const card = e.target.closest("[data-piece]");
      if (!card) return;
      const id = card.dataset.piece;
      const act = e.target.closest("[data-act]")?.dataset.act;
      const community = loadJson(STORAGE.community, []);
      const piece = community.find((p) => p.id === id);
      if (!piece) return;
      if (act === "equip-community") {
        equipped[piece.slot] = piece.id;
        persistDraftLook();
        refreshStages();
        setMode("build");
        activeSlot = piece.slot;
        syncActiveSlotTab();
        renderPieceGrid();
      } else if (act === "del-community") {
        saveJson(
          STORAGE.community,
          community.filter((p) => p.id !== id)
        );
        renderLibrary();
        renderPieceGrid();
      }
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
