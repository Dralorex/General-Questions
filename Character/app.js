(function () {
  const STORAGE = {
    looks: "gq-character-looks-v1",
    creations: "gq-character-creations-v1",
    community: "gq-character-community-v1",
    draft: "gq-character-draft-v1",
    publisherId: "gq-character-publisher-id-v1",
    agreement: "gq-character-publish-agreement-v1",
    bans: "gq-character-bans-v1",
    modUnlock: "gq-character-mod-unlock-v1",
    cachedIp: "gq-character-cached-ip-v1",
    overrides: "gq-character-overrides-v1",
  };

  const Slots = window.CharacterSlots;
  const Mod = window.CharacterModeration || null;
  const official = Array.isArray(window.CharacterCatalog)
    ? window.CharacterCatalog
    : [];

  /** @type {Record<string, string|null>} */
  const equipped = Object.fromEntries(Slots.ORDER.map((s) => [s, null]));

  let draftPiece = null;
  let activeSlot = "body";
  let draftImageData = null;
  let cachedIp = loadJson(STORAGE.cachedIp, null);
  let adminSelectedId = null;
  let adminFolderId = null;
  let adminView = "folders"; // folders | items | edit
  let adminDraft = null;
  let adminDragging = false;
  let adminDragLast = null;
  let adminDrawing = false;
  let adminStrokes = [];
  let adminActiveStroke = null;
  let adminHistory = [];
  let adminHistoryIndex = -1;
  let adminHistoryReady = false;
  let adminEraseDirty = false;

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

  function defaultSlotOrder() {
    return [...Slots.ORDER];
  }

  function getOverridesDoc() {
    const doc = loadJson(STORAGE.overrides, null);
    if (doc && doc.format === "gq-character-overrides-v1") {
      return {
        format: "gq-character-overrides-v1",
        slotOrder: Array.isArray(doc.slotOrder) ? doc.slotOrder : null,
        pieces: doc.pieces && typeof doc.pieces === "object" ? doc.pieces : {},
      };
    }
    return { format: "gq-character-overrides-v1", slotOrder: null, pieces: {} };
  }

  function saveOverridesDoc(doc) {
    saveJson(STORAGE.overrides, {
      format: "gq-character-overrides-v1",
      updatedAt: new Date().toISOString(),
      slotOrder: doc.slotOrder || null,
      pieces: doc.pieces || {},
    });
  }

  function activeSlotOrder() {
    const doc = getOverridesDoc();
    if (Array.isArray(doc.slotOrder) && doc.slotOrder.length) {
      // Keep unknown slots appended
      const seen = new Set(doc.slotOrder);
      return [...doc.slotOrder, ...Slots.ORDER.filter((s) => !seen.has(s))];
    }
    return defaultSlotOrder();
  }

  function defaultZForSlot(slot) {
    const order = activeSlotOrder();
    const idx = order.indexOf(slot);
    return (idx < 0 ? order.length : idx) * 10;
  }

  function resolvePiece(raw) {
    if (!raw) return null;
    const ov = getOverridesDoc().pieces[raw.id];
    if (!ov) {
      return {
        ...raw,
        slot: raw.slot,
        zIndex: raw.zIndex != null ? raw.zIndex : defaultZForSlot(raw.slot),
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          ...(raw.transform || {}),
        },
        strokes: Array.isArray(raw.strokes) ? raw.strokes : [],
        drawSvg: raw.drawSvg || "",
      };
    }
    const slot = ov.slot || raw.slot;
    return {
      ...raw,
      ...ov,
      id: raw.id,
      slot,
      svg: raw.svg,
      imageData: ov.imageData != null ? ov.imageData : raw.imageData,
      underHat: ov.underHat != null ? ov.underHat : raw.underHat,
      tintSkin: raw.tintSkin,
      skinTone: raw.skinTone,
      strokes: Array.isArray(ov.strokes)
        ? ov.strokes
        : Array.isArray(raw.strokes)
          ? raw.strokes
          : [],
      drawSvg: ov.drawSvg != null ? ov.drawSvg : raw.drawSvg || "",
      transform: {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        ...(raw.transform || {}),
        ...(ov.transform || {}),
      },
      zIndex:
        ov.zIndex != null
          ? ov.zIndex
          : raw.zIndex != null
            ? raw.zIndex
            : defaultZForSlot(slot),
      _overridden: true,
    };
  }

  function getPublisherId() {
    let id = localStorage.getItem(STORAGE.publisherId);
    if (!id) {
      id = uid("pub");
      localStorage.setItem(STORAGE.publisherId, id);
    }
    return id;
  }

  function hasAcceptedAgreement() {
    if (!Mod) return true;
    const rec = loadJson(STORAGE.agreement, null);
    return Boolean(rec && rec.version === Mod.AGREEMENT_VERSION && rec.accepted);
  }

  function acceptAgreement() {
    saveJson(STORAGE.agreement, {
      version: Mod ? Mod.AGREEMENT_VERSION : 1,
      accepted: true,
      acceptedAt: new Date().toISOString(),
      publisherId: getPublisherId(),
    });
  }

  function isModUnlocked() {
    return sessionStorage.getItem(STORAGE.modUnlock) === "1";
  }

  function setModUnlocked(on) {
    if (on) sessionStorage.setItem(STORAGE.modUnlock, "1");
    else sessionStorage.removeItem(STORAGE.modUnlock);
    updateModTabVisibility();
  }

  function updateModTabVisibility() {
    const unlocked = isModUnlocked();
    const modBtn = $("#modTabBtn");
    const adminBtn = $("#adminTabBtn");
    if (modBtn) modBtn.hidden = !unlocked;
    if (adminBtn) adminBtn.hidden = !unlocked;
  }

  function getBans() {
    const local = loadJson(STORAGE.bans, { format: "gq-character-bans-v1", bans: [] });
    if (!Array.isArray(local.bans)) local.bans = [];
    return local;
  }

  function saveBans(doc) {
    saveJson(STORAGE.bans, {
      format: "gq-character-bans-v1",
      updatedAt: new Date().toISOString(),
      bans: doc.bans || [],
    });
  }

  function mergeBanDocs(base, incoming) {
    const map = new Map();
    [...(base.bans || []), ...(incoming.bans || [])].forEach((b) => {
      if (!b || !b.type || !b.value) return;
      const key = `${b.type}:${String(b.value).toLowerCase()}`;
      map.set(key, b);
    });
    return {
      format: "gq-character-bans-v1",
      updatedAt: new Date().toISOString(),
      bans: [...map.values()],
    };
  }

  function findBanMatch({ ip, publisherId, author }) {
    const bans = getBans().bans || [];
    const authorNorm = String(author || "").trim().toLowerCase();
    for (const ban of bans) {
      const val = String(ban.value || "").trim().toLowerCase();
      if (!val) continue;
      if (ban.type === "ip" && ip && String(ip).toLowerCase() === val) return ban;
      if (ban.type === "publisherId" && publisherId && String(publisherId).toLowerCase() === val)
        return ban;
      if (ban.type === "author" && authorNorm && authorNorm === val) return ban;
    }
    return null;
  }

  async function resolveIp() {
    if (cachedIp) return cachedIp;
    try {
      const res = await fetch("https://api.ipify.org?format=json", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("ip lookup failed");
      const data = await res.json();
      if (data && data.ip) {
        cachedIp = data.ip;
        saveJson(STORAGE.cachedIp, cachedIp);
        return cachedIp;
      }
    } catch {
      /* offline / blocked — continue without IP */
    }
    return null;
  }

  function isPublishBlocked() {
    const ban = findBanMatch({
      ip: cachedIp,
      publisherId: getPublisherId(),
      author: $("#createAuthor")?.value?.trim() || "",
    });
    return ban;
  }

  function refreshPublishUi() {
    const ban = isPublishBlocked();
    const notice = $("#publishBanNotice");
    const wrap = $("#publishCheckWrap");
    const box = $("#createPublish");
    if (ban) {
      notice.hidden = false;
      notice.textContent = `Publishing is banned on this device (${ban.type}: ${ban.value}). Reason: ${ban.reason || "inappropriate public content"}. You can still save pieces locally.`;
      wrap.dataset.blocked = "1";
      box.checked = false;
    } else {
      notice.hidden = true;
      wrap.dataset.blocked = "0";
    }
  }

  function allPieces() {
    const mine = loadJson(STORAGE.creations, []);
    const community = loadJson(STORAGE.community, []);
    return [...official, ...community, ...mine].map(resolvePiece);
  }

  function pieceById(id) {
    if (!id) return null;
    const raw =
      official.find((p) => p.id === id) ||
      loadJson(STORAGE.community, []).find((p) => p.id === id) ||
      loadJson(STORAGE.creations, []).find((p) => p.id === id) ||
      null;
    return resolvePiece(raw);
  }

  function piecesForSlot(slot) {
    return allPieces().filter((p) => p.slot === slot);
  }

  function rawPieceById(id) {
    if (!id) return null;
    return (
      official.find((p) => p.id === id) ||
      loadJson(STORAGE.community, []).find((p) => p.id === id) ||
      loadJson(STORAGE.creations, []).find((p) => p.id === id) ||
      null
    );
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

  function shadeHex(hex, amt) {
    if (window.CharacterSkin && typeof window.CharacterSkin.shade === "function") {
      return window.CharacterSkin.shade(hex, amt);
    }
    const n = String(hex || "#e8b896").replace("#", "");
    const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
    const num = parseInt(full, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  function activeBodySkin() {
    const body = pieceById(equipped.body);
    if (body && body.skinTone) return body.skinTone;
    return "#e8b896";
  }

  /** Recolor head SVGs so they always match the selected body. */
  function applySkinTint(svg, piece) {
    if (!svg || !piece || !(piece.tintSkin || piece.slot === "head")) return svg;
    const tone = activeBodySkin();
    const mid = shadeHex(tone, -12);
    const dark = shadeHex(tone, -34);
    return String(svg)
      .replace(/__SKIN__/g, tone)
      .replace(/__SKIN_MID__/g, mid)
      .replace(/__SKIN_DARK__/g, dark)
      // Fallback for any leftover hard-coded head skins from older packs
      .replace(/#e8b896|#c6865a|#8d5524|#f0d0b4|#c4a882/gi, tone);
  }

  function strokesToSvg(strokes) {
    if (!Array.isArray(strokes) || !strokes.length) return "";
    return strokes
      .map((stroke) => {
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 1) return "";
        const d = stroke.points
          .map((p, i) => `${i === 0 ? "M" : "L"}${Number(p.x).toFixed(1)} ${Number(p.y).toFixed(1)}`)
          .join(" ");
        if (stroke.eraser) {
          // Eraser punches through drawings underneath via thick dark cover matching stage;
          // also mark class for optional CSS. Prefer destination-out on a group.
          return `<path d="${d}" fill="none" stroke="#0a0e14" stroke-width="${
            stroke.width || 8
          }" stroke-linecap="round" stroke-linejoin="round" class="draw-eraser"/>`;
        }
        return `<path d="${d}" fill="none" stroke="${escapeHtml(stroke.color || "#d4a35a")}" stroke-width="${
          stroke.width || 4
        }" stroke-linecap="round" stroke-linejoin="round" class="draw-ink"/>`;
      })
      .join("");
  }

  function buildDrawOverlay(piece) {
    const fromStrokes = strokesToSvg(piece.strokes);
    const baked = piece.drawSvg || "";
    if (!fromStrokes && !baked) return "";
    return `<g class="piece-draw-overlay" style="mix-blend-mode:normal">${baked}${fromStrokes}</g>`;
  }

  function renderPieceGroup(piece, { hideUnderHat = false, draft = false } = {}) {
    if (!piece) return "";
    const t = transformAttr(piece.transform);
    const hideClass = hideUnderHat ? " hat-equipped" : "";
    const draftClass = draft ? " draft-piece" : "";
    let inner = applySkinTint(piece.svg || "", piece);
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
      inner = `<g class="under-hat">${inner}</g>`;
    }
    inner += buildDrawOverlay(piece);
    return `<g class="layer layer-${piece.slot}${hideClass}${draftClass}" data-piece="${piece.id}" transform="${t}">${inner}</g>`;
  }

  /** Map a stage-space point into the piece's local coordinates (so drawings follow transforms). */
  function stageToPieceLocal(px, py, transform) {
    const t = transform || {};
    const cx = Slots.STAGE.width / 2;
    const cy = Slots.STAGE.height / 2;
    let x = px - (t.x || 0);
    let y = py - (t.y || 0);
    const rad = (-(t.rotate || 0) * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    x = rx + cx;
    y = ry + cy;
    const s = t.scale == null || t.scale === 0 ? 1 : t.scale;
    x = cx + (x - cx) / s;
    y = cy + (y - cy) / s;
    return { x, y };
  }

  function composeSvg(extraDraft = null) {
    const hatOn = Boolean(equipped.hat) || (extraDraft && extraDraft.slot === "hat");
    const layers = [];
    const seen = new Set();

    Object.keys(equipped).forEach((slotKey) => {
      const id = equipped[slotKey];
      if (!id || seen.has(id)) return;
      const piece = pieceById(id);
      if (!piece) return;
      seen.add(id);
      layers.push({
        piece,
        html: renderPieceGroup(piece, {
          hideUnderHat: hatOn && piece.slot === "hair",
        }),
        z: piece.zIndex != null ? piece.zIndex : defaultZForSlot(piece.slot),
      });
    });

    if (extraDraft) {
      layers.push({
        piece: extraDraft,
        html: renderPieceGroup(extraDraft, {
          hideUnderHat: hatOn && extraDraft.slot === "hair",
          draft: true,
        }),
        z:
          extraDraft.zIndex != null
            ? extraDraft.zIndex
            : defaultZForSlot(extraDraft.slot) + 1,
      });
    }

    layers.sort((a, b) => a.z - b.z || String(a.piece.id).localeCompare(String(b.piece.id)));
    return layers.map((l) => l.html).join("\n");
  }

  function paintStage(svgEl, extraDraft = null) {
    if (!svgEl) return;
    svgEl.innerHTML = composeSvg(extraDraft);
    const hatOn = Boolean(equipped.hat) || (extraDraft && extraDraft.slot === "hat");
    svgEl.querySelectorAll(".under-hat").forEach((node) => {
      node.classList.toggle("is-hidden", hatOn);
    });
  }

  function refreshStages() {
    paintStage($("#stage"));
    paintStage($("#createStage"), draftPiece);
    if (document.body.dataset.mode === "admin") {
      paintAdminStageWithDraft();
    } else {
      paintStage($("#adminStage"));
    }
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
    const order = activeSlotOrder();
    tabs.innerHTML = order.map((slot) => {
      const meta = Slots.META[slot];
      if (!meta) return "";
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
    let content = piece.imageData
      ? `<image href="${piece.imageData}" x="40" y="40" width="320" height="480" preserveAspectRatio="xMidYMid meet"/>`
      : applySkinTint(piece.svg || "", piece) ||
        `<text x="200" y="280" text-anchor="middle" fill="#9aabbf" font-size="28">Empty</text>`;
    return `<svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  }

  function renderPieceGrid() {
    const grid = $("#pieceGrid");
    const hint = $("#slotHint");
    const meta = Slots.META[activeSlot];
    hint.textContent = meta.hint;

    const noneCard = meta.required
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
    if (id) {
      Object.keys(equipped).forEach((k) => {
        if (equipped[k] === id) equipped[k] = null;
      });
      const piece = pieceById(id);
      const key = piece?.slot || slot;
      equipped[key] = id;
    } else {
      equipped[slot] = null;
    }
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
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>`, xml], {
      type: "image/svg+xml;charset=utf-8",
    });
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

  /* -------- Creator + moderation -------- */

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
    const hatOn = slot === "hat" || Boolean(equipped.hat);
    $("#createStage")
      .querySelectorAll(".under-hat")
      .forEach((node) => node.classList.toggle("is-hidden", hatOn));
    refreshPublishUi();
  }

  function showCreateMsg(text, isError) {
    const el = $("#createMsg");
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("error", Boolean(isError));
  }

  function openAgreementDialog() {
    return new Promise((resolve) => {
      const dialog = $("#agreementDialog");
      const body = $("#agreementBody");
      const form = $("#agreementForm");
      const check = $("#agreementCheck");
      body.innerHTML = Mod ? Mod.AGREEMENT_HTML : "<p>Agree to publish rules.</p>";
      check.checked = false;

      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      const onSubmit = (e) => {
        e.preventDefault();
        if (!check.checked) return;
        acceptAgreement();
        cleanup();
        dialog.close();
        resolve(true);
      };
      function cleanup() {
        form.removeEventListener("submit", onSubmit);
        $("#agreementCancel").removeEventListener("click", onCancel);
      }

      form.addEventListener("submit", onSubmit);
      $("#agreementCancel").addEventListener("click", () => {
        dialog.close();
        onCancel();
      });
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {
        // Fallback: force accept prompt
        const ok = confirm(
          "You must agree: inappropriate public posts can permanently ban your publisher/IP from publishing. Continue?"
        );
        if (ok) acceptAgreement();
        resolve(ok);
      }
    });
  }

  async function ensureCanPublish() {
    await resolveIp();
    refreshPublishUi();

    const ban = isPublishBlocked();
    if (ban) {
      return {
        ok: false,
        code: "banned",
        message: `You are banned from public publishing (${ban.type}: ${ban.value}). Your piece can only be saved on this device.`,
      };
    }

    if (!hasAcceptedAgreement()) {
      const accepted = await openAgreementDialog();
      if (!accepted) {
        return {
          ok: false,
          code: "agreement",
          message: "Publish cancelled — you must accept the community rules first.",
        };
      }
    }

    return { ok: true };
  }

  async function runContentScan(draft) {
    if (!Mod || !Mod.scanPieceDraft) return { ok: true };
    return Mod.scanPieceDraft(draft);
  }

  async function saveCreatedPiece(equipAfter) {
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

    let wantPublish = $("#createPublish").checked;
    const scanNotice = $("#publishScanNotice");
    scanNotice.hidden = true;

    const author = $("#createAuthor").value.trim() || "anonymous";
    const scan = await runContentScan({
      name,
      author,
      svg: svgRaw,
      imageData: draftImageData,
    });

    if (!scan.ok && wantPublish) {
      wantPublish = false;
      $("#createPublish").checked = false;
      scanNotice.hidden = false;
      scanNotice.textContent =
        scan.reason ||
        "This item looks inappropriate for the public database. It can only be saved on your device.";
      alert(
        (scan.reason || "Inappropriate content detected.") +
          "\n\nYour item will be saved on this device only and will not be posted to the public database."
      );
    }

    if (wantPublish) {
      const gate = await ensureCanPublish();
      if (!gate.ok) {
        wantPublish = false;
        $("#createPublish").checked = false;
        showCreateMsg(gate.message, true);
        if (gate.code === "banned") refreshPublishUi();
        // Fall through to local save
      }
    }

    await resolveIp();
    const publisherId = getPublisherId();

    const piece = {
      id: uid("user"),
      slot: $("#createSlot").value,
      name,
      author,
      svg: svgRaw,
      imageData: draftImageData,
      imageWidth: 220,
      imageHeight: 220,
      underHat: $("#createUnderHat").checked,
      transform: readCreateTransform(),
      source: "user",
      published: wantPublish,
      createdAt: new Date().toISOString(),
      publisherId,
      publisherIp: cachedIp || null,
      agreementVersion: Mod ? Mod.AGREEMENT_VERSION : 1,
      moderation: {
        scannedAt: new Date().toISOString(),
        ok: scan.ok,
        hits: scan.hits || [],
        forcedLocal: !scan.ok,
      },
    };

    const mine = loadJson(STORAGE.creations, []);
    mine.unshift(piece);
    saveJson(STORAGE.creations, mine);

    if (wantPublish) {
      const community = loadJson(STORAGE.community, []);
      community.unshift({ ...piece, source: "community" });
      saveJson(STORAGE.community, community.slice(0, 200));
    }

    if (!scan.ok) {
      showCreateMsg(
        "Saved on this device only — not allowed on the public database.",
        true
      );
    } else {
      showCreateMsg(
        wantPublish
          ? "Saved and published to your community pack. Export the pack to share it."
          : "Saved to My creations (device only)."
      );
    }

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
    if (isModUnlocked()) renderModeration();
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
            <span class="sub">${escapeHtml(Slots.META[p.slot]?.label || p.slot)} · ${
              p.published
                ? "published"
                : p.moderation?.forcedLocal
                  ? "device only (blocked from public)"
                  : "private"
            }</span>
          </div>
          <div class="actions">
            <button type="button" class="btn ghost" data-act="equip-piece">Equip</button>
            <button type="button" class="btn ghost" data-act="toggle-pub">${
              p.published ? "Unpublish" : "Publish"
            }</button>
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
            <span class="sub">${escapeHtml(Slots.META[p.slot]?.label || p.slot)} · by ${escapeHtml(
              p.author || "unknown"
            )}${p.publisherIp ? ` · IP ${escapeHtml(p.publisherIp)}` : ""}</span>
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

  /* -------- Moderation panel -------- */

  function addBan({ type, value, reason, pieceId }) {
    const doc = getBans();
    const entry = {
      id: uid("ban"),
      type,
      value: String(value).trim(),
      reason: (reason || "Inappropriate public post").slice(0, 160),
      pieceId: pieceId || null,
      bannedAt: new Date().toISOString(),
    };
    // replace existing same type+value
    doc.bans = [
      entry,
      ...doc.bans.filter(
        (b) =>
          !(
            b.type === entry.type &&
            String(b.value).toLowerCase() === entry.value.toLowerCase()
          )
      ),
    ];
    saveBans(doc);
    // If banning current user, refresh UI
    refreshPublishUi();
    renderModeration();
    return entry;
  }

  function removeBan(id) {
    const doc = getBans();
    doc.bans = doc.bans.filter((b) => b.id !== id);
    saveBans(doc);
    refreshPublishUi();
    renderModeration();
  }

  function attributionEntries() {
    const community = loadJson(STORAGE.community, []);
    const mine = loadJson(STORAGE.creations, []).filter((p) => p.published);
    const map = new Map();
    [...community, ...mine].forEach((p) => {
      if (!p || !p.id) return;
      map.set(p.id, p);
    });
    return [...map.values()].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
  }

  function renderModeration() {
    if (!isModUnlocked()) return;
    const bans = getBans().bans || [];
    const banEl = $("#banList");
    banEl.innerHTML = bans.length
      ? bans
          .map(
            (b) => `<article class="lib-card" data-ban="${b.id}">
          <div class="meta">
            <span class="title">${escapeHtml(b.type)} · ${escapeHtml(b.value)}</span>
            <span class="sub">${escapeHtml(b.reason || "")} · ${
              b.bannedAt ? new Date(b.bannedAt).toLocaleString() : ""
            }</span>
          </div>
          <div class="actions">
            <button type="button" class="btn danger" data-act="unban">Remove ban</button>
          </div>
        </article>`
          )
          .join("")
      : `<p class="empty">No bans yet.</p>`;

    const attrs = attributionEntries();
    const attrEl = $("#attributionList");
    attrEl.innerHTML = attrs.length
      ? attrs
          .map((p) => {
            const banned = findBanMatch({
              ip: p.publisherIp,
              publisherId: p.publisherId,
              author: p.author,
            });
            return `<article class="lib-card" data-piece="${p.id}">
          <div class="meta">
            <span class="title">${escapeHtml(p.name)}</span>
            <div class="attr-grid">
              <div><strong>Author:</strong> ${escapeHtml(p.author || "—")}</div>
              <div><strong>Publisher ID:</strong> ${escapeHtml(p.publisherId || "—")}</div>
              <div><strong>IP:</strong> ${escapeHtml(p.publisherIp || "unknown")}</div>
              <div><strong>Slot:</strong> ${escapeHtml(p.slot)} · ${
                p.createdAt ? new Date(p.createdAt).toLocaleString() : ""
              }</div>
              ${
                banned
                  ? `<div><strong>Status:</strong> already banned (${escapeHtml(banned.type)})</div>`
                  : ""
              }
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn danger" data-act="ban-ip" ${
              p.publisherIp ? "" : "disabled"
            }>Ban IP</button>
            <button type="button" class="btn danger" data-act="ban-pub" ${
              p.publisherId ? "" : "disabled"
            }>Ban publisher</button>
            <button type="button" class="btn ghost" data-act="ban-author" ${
              p.author ? "" : "disabled"
            }>Ban author</button>
            <button type="button" class="btn ghost" data-act="remove-piece">Remove piece</button>
          </div>
        </article>`;
          })
          .join("")
      : `<p class="empty">No published pieces with attribution yet.</p>`;
  }

  function exportBans() {
    const doc = getBans();
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bans.json";
    a.click();
  }

  async function fetchShippedBans(silent) {
    try {
      const res = await fetch(assetUrl("./data/bans.json"), { cache: "no-store" });
      if (!res.ok) throw new Error("No shipped bans file.");
      const incoming = await res.json();
      const merged = mergeBanDocs(getBans(), incoming);
      saveBans(merged);
      refreshPublishUi();
      if (isModUnlocked()) renderModeration();
      if (!silent) alert(`Loaded bans. Total: ${merged.bans.length}`);
    } catch (err) {
      if (!silent) alert(err.message || "Could not fetch bans.");
    }
  }

  function exportPack() {
    const mine = loadJson(STORAGE.creations, []).filter((p) => p.published);
    const community = loadJson(STORAGE.community, []);
    const map = new Map();
    [...community, ...mine].forEach((p) => {
      // Do not export pieces from banned publishers into share packs
      if (
        findBanMatch({
          ip: p.publisherIp,
          publisherId: p.publisherId,
          author: p.author,
        })
      ) {
        return;
      }
      map.set(p.id, p);
    });
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

  function assetUrl(path) {
    const bust =
      (window.CHARACTER_CACHE_BUST && String(window.CHARACTER_CACHE_BUST)) ||
      "dev";
    const join = path.includes("?") ? "&" : "?";
    return `${path}${join}v=${encodeURIComponent(bust)}`;
  }

  async function fetchSharedPack(silent) {
    try {
      const res = await fetch(assetUrl("./data/community.json"), {
        cache: "no-store",
      });
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
    let skippedBan = 0;
    pack.pieces.forEach((p) => {
      if (!p.id || !p.slot || !p.name) return;
      if (ids.has(p.id)) return;
      if (
        findBanMatch({
          ip: p.publisherIp,
          publisherId: p.publisherId,
          author: p.author,
        })
      ) {
        skippedBan += 1;
        return;
      }
      // Text-scan imported names before accepting into community
      if (Mod && Mod.scanText) {
        const text = Mod.scanText(p.name, p.author, p.svg || "");
        if (!text.ok) {
          skippedBan += 1;
          return;
        }
      }
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
    if (isModUnlocked()) renderModeration();
    if (!silent) {
      alert(
        `Imported ${added} piece(s).${
          skippedBan ? ` Skipped ${skippedBan} banned/flagged.` : ""
        }`
      );
    }
  }

  /* -------- Admin piece layout -------- */

  function adminFolders() {
    return Array.isArray(Slots.FOLDERS) ? Slots.FOLDERS : [];
  }

  function getAdminFolder(id) {
    return adminFolders().find((f) => f.id === id) || null;
  }

  function setAdminView(view) {
    adminView = view;
    $$("[data-admin-view]").forEach((el) => {
      el.hidden = el.getAttribute("data-admin-view") !== view;
    });
    if (view === "folders") {
      adminSelectedId = null;
      adminDraft = null;
      renderAdminFolders();
      renderAdminSlotOrder();
    } else if (view === "items") {
      adminSelectedId = null;
      adminDraft = null;
      renderAdminItems();
    } else if (view === "edit") {
      fillAdminSlotSelect();
    }
  }

  function fillAdminSlotSelect() {
    const slotSel = $("#adminPieceSlot");
    if (!slotSel) return;
    const prev = slotSel.value;
    slotSel.innerHTML = activeSlotOrder()
      .map((slot) => {
        const meta = Slots.META[slot];
        return meta ? `<option value="${slot}">${meta.label}</option>` : "";
      })
      .join("");
    if (prev) slotSel.value = prev;
  }

  function renderAdminFolders() {
    const grid = $("#adminFolderGrid");
    if (!grid) return;
    grid.innerHTML = adminFolders()
      .map((folder) => {
        const count = allPieces().filter((p) => folder.slots.includes(p.slot)).length;
        return `<button type="button" class="admin-folder-card" data-folder="${folder.id}" role="listitem">
          <div class="folder-icon" aria-hidden="true"></div>
          <span class="fname">${escapeHtml(folder.label)}</span>
          <span class="fmeta">${escapeHtml(folder.hint || "")}</span>
          <span class="fmeta">${count} item${count === 1 ? "" : "s"}</span>
        </button>`;
      })
      .join("");
  }

  function renderAdminItems() {
    const grid = $("#adminItemGrid");
    const folder = getAdminFolder(adminFolderId);
    if (!grid || !folder) return;
    if ($("#adminFolderTitle")) $("#adminFolderTitle").textContent = folder.label;
    if ($("#adminFolderHint")) {
      $("#adminFolderHint").textContent =
        folder.hint || "Select an item box to open the editor.";
    }
    const list = allPieces()
      .filter((p) => folder.slots.includes(p.slot))
      .sort((a, b) => a.slot.localeCompare(b.slot) || a.name.localeCompare(b.name));
    grid.innerHTML = list.length
      ? list
          .map((p) => {
            const slotLabel = Slots.META[p.slot]?.label || p.slot;
            const overridden = p._overridden ? " · edited" : "";
            return `<button type="button" class="admin-item-card" data-piece="${p.id}" role="listitem">
              <div class="ithumb">${thumbSvg(p)}</div>
              <span class="iname">${escapeHtml(p.name)}</span>
              <span class="imeta">${escapeHtml(slotLabel)}${overridden}</span>
            </button>`;
          })
          .join("")
      : `<p class="empty">No items in this folder yet.</p>`;
  }

  function openAdminFolder(folderId) {
    adminFolderId = folderId;
    setAdminView("items");
  }

  function openAdminItem(pieceId) {
    if (!pieceId) return;
    setAdminView("edit");
    if ($("#adminEditTitle")) {
      const piece = pieceById(pieceId);
      $("#adminEditTitle").textContent = piece
        ? `Editing · ${piece.name}`
        : "Editing";
    }
    loadAdminPieceToForm(pieceId);
  }

  function loadAdminPieceToForm(id) {
    const piece = pieceById(id);
    if (!piece) {
      adminDraft = null;
      adminStrokes = [];
      return;
    }
    adminSelectedId = id;
    adminStrokes = Array.isArray(piece.strokes)
      ? piece.strokes.map((s) => ({
          ...s,
          points: (s.points || []).map((p) => ({ x: p.x, y: p.y })),
        }))
      : [];
    adminActiveStroke = null;
    const t = piece.transform || { x: 0, y: 0, scale: 1, rotate: 0 };
    $("#adminPieceSlot").value = piece.slot;
    $("#adminOx").value = Math.round(t.x || 0);
    $("#adminOy").value = Math.round(t.y || 0);
    $("#adminScale").value = Math.round((t.scale == null ? 1 : t.scale) * 100);
    $("#adminRot").value = Math.round(t.rotate || 0);
    $("#adminZ").value = Math.round(
      piece.zIndex != null ? piece.zIndex : defaultZForSlot(piece.slot)
    );
    updateAdminOutputs();
    rebuildAdminDraft();
    // Ensure equipped for context
    equip(piece.slot, piece.id);
    syncAdminDrawCursor();
    resetAdminHistoryFromCurrent();
  }

  function updateAdminOutputs() {
    $("#adminOxOut").textContent = $("#adminOx").value;
    $("#adminOyOut").textContent = $("#adminOy").value;
    $("#adminScOut").textContent = (Number($("#adminScale").value) / 100).toFixed(2);
    $("#adminRotOut").textContent = `${$("#adminRot").value}°`;
    $("#adminZOut").textContent = $("#adminZ").value;
  }

  function readAdminDraftFields() {
    return {
      transform: {
        x: Number($("#adminOx").value) || 0,
        y: Number($("#adminOy").value) || 0,
        scale: (Number($("#adminScale").value) || 100) / 100,
        rotate: Number($("#adminRot").value) || 0,
      },
      slot: $("#adminPieceSlot").value,
      zIndex: Number($("#adminZ").value) || 0,
    };
  }

  function rebuildAdminDraft() {
    const base = rawPieceById(adminSelectedId) || pieceById(adminSelectedId);
    if (!base) {
      adminDraft = null;
      paintAdminStageWithDraft();
      return;
    }
    const fields = readAdminDraftFields();
    const liveStrokes = adminActiveStroke
      ? [...adminStrokes, adminActiveStroke]
      : [...adminStrokes];
    adminDraft = {
      ...resolvePiece(base),
      ...fields,
      id: base.id,
      name: base.name,
      svg: base.svg,
      imageData: base.imageData,
      tintSkin: base.tintSkin,
      skinTone: base.skinTone,
      underHat: base.underHat,
      transform: fields.transform,
      slot: fields.slot,
      zIndex: fields.zIndex,
      strokes: liveStrokes,
      drawSvg: "", // live strokes replace baked drawSvg while editing
    };
    paintAdminStageWithDraft();
  }

  function cloneAdminStrokes(list) {
    return (list || []).map((s) => ({
      color: s.color,
      width: s.width,
      eraser: Boolean(s.eraser),
      points: (s.points || []).map((p) => ({ x: p.x, y: p.y })),
    }));
  }

  function captureAdminSnapshot() {
    const fields = readAdminDraftFields();
    return {
      pieceId: adminSelectedId,
      strokes: cloneAdminStrokes(adminStrokes),
      transform: { ...fields.transform },
      slot: fields.slot,
      zIndex: fields.zIndex,
    };
  }

  function snapshotsEqual(a, b) {
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function updateAdminHistoryButtons() {
    const canUndo = adminHistoryIndex > 0;
    const canRedo = adminHistoryIndex >= 0 && adminHistoryIndex < adminHistory.length - 1;
    ["adminUndoBtn", "adminUndoBtn2"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !canUndo;
    });
    ["adminRedoBtn", "adminRedoBtn2"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !canRedo;
    });
  }

  function pushAdminHistory(force) {
    if (!adminSelectedId || !adminHistoryReady) return;
    const snap = captureAdminSnapshot();
    const current = adminHistory[adminHistoryIndex];
    if (!force && current && snapshotsEqual(current, snap)) {
      updateAdminHistoryButtons();
      return;
    }
    adminHistory = adminHistory.slice(0, adminHistoryIndex + 1);
    adminHistory.push(snap);
    if (adminHistory.length > 80) {
      adminHistory.shift();
    } else {
      adminHistoryIndex += 1;
    }
    adminHistoryIndex = adminHistory.length - 1;
    updateAdminHistoryButtons();
  }

  function applyAdminSnapshot(snap, { record } = { record: false }) {
    if (!snap || snap.pieceId !== adminSelectedId) return;
    adminHistoryReady = false;
    adminStrokes = cloneAdminStrokes(snap.strokes);
    adminActiveStroke = null;
    $("#adminPieceSlot").value = snap.slot;
    $("#adminOx").value = Math.round(snap.transform.x || 0);
    $("#adminOy").value = Math.round(snap.transform.y || 0);
    $("#adminScale").value = Math.round((snap.transform.scale == null ? 1 : snap.transform.scale) * 100);
    $("#adminRot").value = Math.round(snap.transform.rotate || 0);
    $("#adminZ").value = Math.round(snap.zIndex || 0);
    updateAdminOutputs();
    rebuildAdminDraft();
    adminHistoryReady = true;
    if (record) pushAdminHistory();
    updateAdminHistoryButtons();
  }

  function undoAdmin() {
    if (adminHistoryIndex <= 0) return;
    adminHistoryIndex -= 1;
    applyAdminSnapshot(adminHistory[adminHistoryIndex]);
    showAdminMsg("Undo");
  }

  function redoAdmin() {
    if (adminHistoryIndex >= adminHistory.length - 1) return;
    adminHistoryIndex += 1;
    applyAdminSnapshot(adminHistory[adminHistoryIndex]);
    showAdminMsg("Redo");
  }

  function resetAdminHistoryFromCurrent() {
    adminHistory = [captureAdminSnapshot()];
    adminHistoryIndex = 0;
    adminHistoryReady = true;
    updateAdminHistoryButtons();
  }

  function eraseStrokesAt(local, radius) {
    const r = Math.max(2, radius * 0.75);
    adminStrokes = adminStrokes
      .map((stroke) => ({
        ...stroke,
        points: (stroke.points || []).filter(
          (p) => Math.hypot(p.x - local.x, p.y - local.y) > r
        ),
      }))
      .filter((s) => (s.points || []).length >= 2);
  }

  function syncAdminDrawCursor() {
    const stage = $("#adminStage");
    if (!stage) return;
    const drawOn = Boolean($("#adminDrawMode")?.checked);
    stage.classList.toggle("is-drawing", drawOn);
    stage.classList.toggle("is-dragging", false);
  }

  function paintAdminStageWithDraft() {
    const svgEl = $("#adminStage");
    if (!svgEl) return;
    const hatOn = Boolean(equipped.hat);
    const layers = [];
    const seen = new Set();
    Object.keys(equipped).forEach((slotKey) => {
      const id = equipped[slotKey];
      if (!id || seen.has(id)) return;
      seen.add(id);
      const piece =
        adminDraft && adminDraft.id === id ? adminDraft : pieceById(id);
      if (!piece) return;
      layers.push({
        html: renderPieceGroup(piece, {
          hideUnderHat: hatOn && piece.slot === "hair",
          draft: adminDraft && adminDraft.id === id,
        }),
        z: piece.zIndex != null ? piece.zIndex : defaultZForSlot(piece.slot),
        id: piece.id,
      });
    });
    if (adminDraft && !seen.has(adminDraft.id)) {
      layers.push({
        html: renderPieceGroup(adminDraft, {
          hideUnderHat: hatOn && adminDraft.slot === "hair",
          draft: true,
        }),
        z: adminDraft.zIndex,
        id: adminDraft.id,
      });
    }
    layers.sort((a, b) => a.z - b.z || String(a.id).localeCompare(String(b.id)));
    svgEl.innerHTML = layers.map((l) => l.html).join("\n");
    svgEl.querySelectorAll(".under-hat").forEach((node) => {
      node.classList.toggle("is-hidden", hatOn);
    });
  }

  function showAdminMsg(text, isError) {
    const el = $("#adminMsg");
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("error", Boolean(isError));
  }

  function saveAdminPieceOverride() {
    if (!adminSelectedId) return;
    const fields = readAdminDraftFields();
    const doc = getOverridesDoc();
    const strokes = adminStrokes.map((s) => ({
      color: s.color,
      width: s.width,
      eraser: Boolean(s.eraser),
      points: (s.points || []).map((p) => ({
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
      })),
    }));
    doc.pieces[adminSelectedId] = {
      transform: fields.transform,
      slot: fields.slot,
      zIndex: fields.zIndex,
      strokes,
      drawSvg: strokesToSvg(strokes),
    };
    saveOverridesDoc(doc);
    Object.keys(equipped).forEach((k) => {
      if (equipped[k] === adminSelectedId) equipped[k] = null;
    });
    equipped[fields.slot] = adminSelectedId;
    persistDraftLook();
    rebuildAdminDraft();
    if (adminView === "items") renderAdminItems();
    buildSlotTabs();
    renderPieceGrid();
    refreshStages();
    showAdminMsg(`Saved override for ${adminSelectedId}. Export overrides to ship them.`);
  }

  function resetAdminPieceOverride() {
    if (!adminSelectedId) return;
    const doc = getOverridesDoc();
    delete doc.pieces[adminSelectedId];
    saveOverridesDoc(doc);
    loadAdminPieceToForm(adminSelectedId);
    buildSlotTabs();
    renderPieceGrid();
    refreshStages();
    showAdminMsg("Cleared override for this piece.");
  }

  function renderAdminSlotOrder() {
    const list = $("#adminSlotOrder");
    if (!list) return;
    const order = activeSlotOrder();
    list.innerHTML = order
      .map((slot, idx) => {
        const meta = Slots.META[slot];
        if (!meta) return "";
        return `<div class="slot-order-row" data-slot="${slot}">
          <span>${idx + 1}. ${escapeHtml(meta.label)} <code>${escapeHtml(slot)}</code></span>
          <div class="ord-actions">
            <button type="button" class="btn ghost" data-act="up" ${idx === 0 ? "disabled" : ""}>Up</button>
            <button type="button" class="btn ghost" data-act="down" ${idx === order.length - 1 ? "disabled" : ""}>Down</button>
          </div>
        </div>`;
      })
      .join("");
  }

  function moveSlotOrder(slot, dir) {
    const order = activeSlotOrder();
    const i = order.indexOf(slot);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    const doc = getOverridesDoc();
    doc.slotOrder = order;
    saveOverridesDoc(doc);
    renderAdminSlotOrder();
    buildSlotTabs();
    fillAdminSlotSelect();
    rebuildAdminDraft();
    refreshStages();
  }

  function saveAdminSlotOrder() {
    const doc = getOverridesDoc();
    doc.slotOrder = activeSlotOrder();
    saveOverridesDoc(doc);
    showAdminMsg("Saved global slot draw order.");
  }

  function resetAdminSlotOrder() {
    const doc = getOverridesDoc();
    doc.slotOrder = null;
    saveOverridesDoc(doc);
    renderAdminSlotOrder();
    buildSlotTabs();
    fillAdminSlotSelect();
    refreshStages();
    showAdminMsg("Reset slot order to defaults.");
  }

  function exportOverrides() {
    const doc = getOverridesDoc();
    const blob = new Blob(
      [JSON.stringify({ ...doc, updatedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "piece-overrides.json";
    a.click();
  }

  function importOverridesObject(incoming, silent) {
    if (!incoming || incoming.format !== "gq-character-overrides-v1") {
      if (!silent) alert("Not a valid overrides file.");
      return;
    }
    const doc = getOverridesDoc();
    if (Array.isArray(incoming.slotOrder)) doc.slotOrder = incoming.slotOrder;
    doc.pieces = { ...doc.pieces, ...(incoming.pieces || {}) };
    saveOverridesDoc(doc);
    buildSlotTabs();
    fillAdminSlotSelect();
    renderAdminSlotOrder();
    if (adminView === "folders") renderAdminFolders();
    if (adminView === "items") renderAdminItems();
    if (adminView === "edit" && adminSelectedId) loadAdminPieceToForm(adminSelectedId);
    refreshStages();
    renderPieceGrid();
    if (!silent) alert("Overrides imported.");
  }

  async function fetchShippedOverrides(silent) {
    try {
      const res = await fetch(assetUrl("./data/piece-overrides.json"), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No shipped overrides file.");
      const incoming = await res.json();
      importOverridesObject(incoming, silent);
    } catch (err) {
      if (!silent) alert(err.message || "Could not fetch overrides.");
    }
  }

  function setupAdminPanel() {
    fillAdminSlotSelect();
    renderAdminSlotOrder();
    adminView = "folders";
    adminFolderId = null;
    adminSelectedId = null;
    adminDraft = null;
    setAdminView("folders");
  }

  function clientPointToSvg(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }

  function setMode(mode) {
    if ((mode === "mod" || mode === "admin") && !isModUnlocked()) {
      mode = "library";
    }
    document.body.dataset.mode = mode;
    $$(".mode-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === mode)
    );
    $$(".mode-panel").forEach((p) =>
      p.classList.toggle("active", p.dataset.panel === mode)
    );
    if (mode === "library") renderLibrary();
    if (mode === "create") {
      rebuildDraft();
      refreshPublishUi();
    }
    if (mode === "build") refreshStages();
    if (mode === "mod") renderModeration();
    if (mode === "admin") {
      setupAdminPanel();
      refreshStages();
    }
  }

  async function tryPublishExisting(piece) {
    if (piece.moderation?.forcedLocal) {
      alert(
        "This piece was flagged as inappropriate for the public database. It can only stay on your device."
      );
      return false;
    }
    const scan = await runContentScan({
      name: piece.name,
      author: piece.author,
      svg: piece.svg,
      imageData: piece.imageData,
    });
    if (!scan.ok) {
      piece.moderation = {
        scannedAt: new Date().toISOString(),
        ok: false,
        hits: scan.hits || [],
        forcedLocal: true,
      };
      alert(
        (scan.reason || "Inappropriate content detected.") +
          "\n\nThis item can only be saved on your device and isn’t allowed on the public database."
      );
      return false;
    }
    const gate = await ensureCanPublish();
    if (!gate.ok) {
      alert(gate.message);
      return false;
    }
    await resolveIp();
    piece.publisherId = piece.publisherId || getPublisherId();
    piece.publisherIp = cachedIp || piece.publisherIp || null;
    piece.agreementVersion = Mod ? Mod.AGREEMENT_VERSION : 1;
    piece.moderation = {
      scannedAt: new Date().toISOString(),
      ok: true,
      hits: [],
      forcedLocal: false,
    };
    return true;
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
    updateModTabVisibility();

    resolveIp().then(() => refreshPublishUi());
    fetchShippedBans(true);
    fetchShippedOverrides(true);

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

    $("#createAuthor").addEventListener("input", refreshPublishUi);

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
      $("#uploadStatus").textContent =
        "Inserted a starter SVG for this slot — edit or reposition.";
      rebuildDraft();
    });

    $("#createForm").addEventListener("submit", (e) => {
      e.preventDefault();
      saveCreatedPiece(false);
    });

    $("#previewEquipBtn").addEventListener("click", () => {
      saveCreatedPiece(true);
    });

    $("#createPublish").addEventListener("change", async () => {
      if (!$("#createPublish").checked) return;
      if (isPublishBlocked()) {
        $("#createPublish").checked = false;
        refreshPublishUi();
        return;
      }
      if (!hasAcceptedAgreement()) {
        const ok = await openAgreementDialog();
        if (!ok) $("#createPublish").checked = false;
      }
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

    $("#unlockModBtn").addEventListener("click", () => {
      const pass = prompt("Moderator passcode:");
      if (!pass) return;
      if (Mod && pass === Mod.MOD_PASSCODE) {
        setModUnlocked(true);
        setMode("admin");
        alert("Admin / moderator tools unlocked for this browser session.");
      } else {
        alert("Incorrect passcode.");
      }
    });

    $("#lockModBtn").addEventListener("click", () => {
      setModUnlocked(false);
      adminDraft = null;
      setMode("library");
    });

    // Admin browse: folders → items → edit
    $("#adminFolderGrid")?.addEventListener("click", (e) => {
      const card = e.target.closest("[data-folder]");
      if (!card) return;
      openAdminFolder(card.dataset.folder);
    });
    $("#adminItemGrid")?.addEventListener("click", (e) => {
      const card = e.target.closest("[data-piece]");
      if (!card) return;
      openAdminItem(card.dataset.piece);
    });
    $("#adminBackFolders")?.addEventListener("click", () => setAdminView("folders"));
    $("#adminBackItems")?.addEventListener("click", () => {
      if (adminFolderId) setAdminView("items");
      else setAdminView("folders");
    });

    ["adminOx", "adminOy", "adminScale", "adminRot", "adminZ", "adminPieceSlot"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
          updateAdminOutputs();
          rebuildAdminDraft();
        });
        el.addEventListener("change", () => {
          updateAdminOutputs();
          rebuildAdminDraft();
          pushAdminHistory();
        });
      }
    );
    $("#adminZBackBtn")?.addEventListener("click", () => {
      $("#adminZ").value = String(Math.max(0, Number($("#adminZ").value) - 10));
      updateAdminOutputs();
      rebuildAdminDraft();
      pushAdminHistory();
    });
    $("#adminZFrontBtn")?.addEventListener("click", () => {
      $("#adminZ").value = String(Math.min(200, Number($("#adminZ").value) + 10));
      updateAdminOutputs();
      rebuildAdminDraft();
      pushAdminHistory();
    });
    const bindUndoRedo = (undoId, redoId) => {
      document.getElementById(undoId)?.addEventListener("click", undoAdmin);
      document.getElementById(redoId)?.addEventListener("click", redoAdmin);
    };
    bindUndoRedo("adminUndoBtn", "adminRedoBtn");
    bindUndoRedo("adminUndoBtn2", "adminRedoBtn2");
    window.addEventListener("keydown", (e) => {
      if (document.body.dataset.mode !== "admin") return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoAdmin();
      } else if (key === "z" && e.shiftKey) {
        e.preventDefault();
        redoAdmin();
      } else if (key === "y") {
        e.preventDefault();
        redoAdmin();
      }
    });
    $("#adminSavePieceBtn")?.addEventListener("click", saveAdminPieceOverride);
    $("#adminResetPieceBtn")?.addEventListener("click", resetAdminPieceOverride);
    $("#adminEquipBtn")?.addEventListener("click", () => {
      if (!adminSelectedId) return;
      const fields = readAdminDraftFields();
      equip(fields.slot, adminSelectedId);
      showAdminMsg("Equipped on build preview.");
    });
    $("#adminSlotOrder")?.addEventListener("click", (e) => {
      const row = e.target.closest("[data-slot]");
      if (!row) return;
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "up") moveSlotOrder(row.dataset.slot, -1);
      if (act === "down") moveSlotOrder(row.dataset.slot, 1);
    });
    $("#adminSaveOrderBtn")?.addEventListener("click", saveAdminSlotOrder);
    $("#adminResetOrderBtn")?.addEventListener("click", resetAdminSlotOrder);
    $("#exportOverridesBtn")?.addEventListener("click", exportOverrides);
    $("#fetchOverridesBtn")?.addEventListener("click", () => fetchShippedOverrides(false));
    $("#clearOverridesBtn")?.addEventListener("click", () => {
      if (!confirm("Clear all local piece overrides and custom slot order?")) return;
      saveOverridesDoc({ format: "gq-character-overrides-v1", slotOrder: null, pieces: {} });
      setupAdminPanel();
      refreshStages();
      renderPieceGrid();
      showAdminMsg("Local overrides cleared.");
    });
    $("#importOverridesFile")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        importOverridesObject(JSON.parse(await file.text()));
      } catch {
        alert("Could not read overrides JSON.");
      }
      e.target.value = "";
    });

    // Drag or draw on admin stage
    const adminStage = $("#adminStage");
    if (adminStage) {
      const onDown = (ev) => {
        if (!adminDraft) return;
        const point = ev.touches ? ev.touches[0] : ev;
        const stagePt = clientPointToSvg(adminStage, point.clientX, point.clientY);
        const drawOn = Boolean($("#adminDrawMode")?.checked);
        if (drawOn) {
          adminDrawing = true;
          adminDragging = false;
          const local = stageToPieceLocal(
            stagePt.x,
            stagePt.y,
            adminDraft.transform || readAdminDraftFields().transform
          );
          const erase = Boolean($("#adminEraseMode")?.checked);
          const brush = Number($("#adminBrushSize")?.value) || 6;
          if (erase) {
            adminActiveStroke = null;
            eraseStrokesAt(local, brush);
            adminEraseDirty = true;
            rebuildAdminDraft();
          } else {
            adminActiveStroke = {
              color: $("#adminDrawColor")?.value || "#d4a35a",
              width: brush,
              eraser: false,
              points: [local],
            };
            rebuildAdminDraft();
          }
        } else {
          adminDragging = true;
          adminDrawing = false;
          adminStage.classList.add("is-dragging");
          adminDragLast = stagePt;
        }
        ev.preventDefault();
      };
      const onMove = (ev) => {
        const point = ev.touches ? ev.touches[0] : ev;
        const stagePt = clientPointToSvg(adminStage, point.clientX, point.clientY);
        if (adminDrawing && adminDraft) {
          const local = stageToPieceLocal(
            stagePt.x,
            stagePt.y,
            adminDraft.transform || readAdminDraftFields().transform
          );
          const erase = Boolean($("#adminEraseMode")?.checked);
          const brush = Number($("#adminBrushSize")?.value) || 6;
          if (erase) {
            eraseStrokesAt(local, brush);
            adminEraseDirty = true;
            rebuildAdminDraft();
          } else if (adminActiveStroke) {
            const last = adminActiveStroke.points[adminActiveStroke.points.length - 1];
            const dist = Math.hypot(local.x - last.x, local.y - last.y);
            if (dist >= 0.8) {
              adminActiveStroke.points.push(local);
              rebuildAdminDraft();
            }
          }
          ev.preventDefault();
          return;
        }
        if (!adminDragging || !adminDragLast) return;
        const dx = stagePt.x - adminDragLast.x;
        const dy = stagePt.y - adminDragLast.y;
        adminDragLast = stagePt;
        $("#adminOx").value = String(
          Math.max(-200, Math.min(200, Math.round(Number($("#adminOx").value) + dx)))
        );
        $("#adminOy").value = String(
          Math.max(-200, Math.min(200, Math.round(Number($("#adminOy").value) + dy)))
        );
        updateAdminOutputs();
        rebuildAdminDraft();
        ev.preventDefault();
      };
      const onUp = () => {
        if (adminDrawing) {
          if (adminActiveStroke) {
            if (adminActiveStroke.points.length) {
              adminStrokes.push(adminActiveStroke);
            }
            adminActiveStroke = null;
            rebuildAdminDraft();
            pushAdminHistory();
          } else if (adminEraseDirty) {
            adminEraseDirty = false;
            pushAdminHistory();
          }
          adminDrawing = false;
        }
        if (adminDragging) {
          adminDragging = false;
          adminDragLast = null;
          adminStage.classList.remove("is-dragging");
          pushAdminHistory();
        }
      };
      adminStage.addEventListener("mousedown", onDown);
      adminStage.addEventListener("touchstart", onDown, { passive: false });
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    }

    $("#adminDrawMode")?.addEventListener("change", () => {
      syncAdminDrawCursor();
      if ($("#adminDrawMode").checked) {
        showAdminMsg("Draw mode on — paint on the selected piece. Turn off to drag/move again.");
      }
    });
    $("#adminBrushSize")?.addEventListener("input", () => {
      if ($("#adminBrushOut")) $("#adminBrushOut").textContent = $("#adminBrushSize").value;
    });
    $("#adminClearDrawBtn")?.addEventListener("click", () => {
      if (!adminStrokes.length && !adminActiveStroke) return;
      if (!confirm("Clear all drawing on this piece?")) return;
      adminStrokes = [];
      adminActiveStroke = null;
      rebuildAdminDraft();
      pushAdminHistory();
      showAdminMsg("Cleared drawing. Save override to keep it cleared.");
    });

    $("#exportBansBtn").addEventListener("click", exportBans);
    $("#reloadBansBtn").addEventListener("click", () => fetchShippedBans(false));
    $("#importBansFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const incoming = JSON.parse(await file.text());
        const merged = mergeBanDocs(getBans(), incoming);
        saveBans(merged);
        refreshPublishUi();
        renderModeration();
        alert(`Imported bans. Total: ${merged.bans.length}`);
      } catch {
        alert("Could not read bans JSON.");
      }
      e.target.value = "";
    });

    $("#manualBanForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const type = $("#banType").value;
      const value = $("#banValue").value.trim();
      const reason = $("#banReason").value.trim();
      if (!value) return;
      addBan({ type, value, reason });
      $("#banValue").value = "";
      $("#banReason").value = "";
    });

    $("#banList").addEventListener("click", (e) => {
      const card = e.target.closest("[data-ban]");
      if (!card) return;
      if (e.target.closest("[data-act='unban']")) {
        removeBan(card.dataset.ban);
      }
    });

    $("#attributionList").addEventListener("click", (e) => {
      const card = e.target.closest("[data-piece]");
      if (!card) return;
      const id = card.dataset.piece;
      const piece = attributionEntries().find((p) => p.id === id);
      if (!piece) return;
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "ban-ip" && piece.publisherIp) {
        addBan({
          type: "ip",
          value: piece.publisherIp,
          reason: `Inappropriate piece: ${piece.name}`,
          pieceId: piece.id,
        });
        // Also strip their community pieces
        purgePublisherFromCommunity({ ip: piece.publisherIp });
      } else if (act === "ban-pub" && piece.publisherId) {
        addBan({
          type: "publisherId",
          value: piece.publisherId,
          reason: `Inappropriate piece: ${piece.name}`,
          pieceId: piece.id,
        });
        purgePublisherFromCommunity({ publisherId: piece.publisherId });
      } else if (act === "ban-author" && piece.author) {
        addBan({
          type: "author",
          value: piece.author,
          reason: `Inappropriate piece: ${piece.name}`,
          pieceId: piece.id,
        });
        purgePublisherFromCommunity({ author: piece.author });
      } else if (act === "remove-piece") {
        saveJson(
          STORAGE.community,
          loadJson(STORAGE.community, []).filter((p) => p.id !== id)
        );
        const mine = loadJson(STORAGE.creations, []);
        const local = mine.find((p) => p.id === id);
        if (local) {
          local.published = false;
          saveJson(STORAGE.creations, mine);
        }
        renderLibrary();
        renderModeration();
      }
    });

    $("#savedLooks").addEventListener("click", (e) => {
      const card = e.target.closest("[data-look]");
      if (!card) return;
      const id = card.dataset.look;
      const act = e.target.closest("[data-act]")?.dataset.act;
      const looks = loadJson(STORAGE.looks, []);
      if (act === "load-look") {
        const look = looks.find((l) => l.id === id);
        if (!look) return;
        Object.assign(
          equipped,
          Object.fromEntries(Slots.ORDER.map((s) => [s, null]))
        );
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

    $("#myCreations").addEventListener("click", async (e) => {
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
        if (piece.published) {
          piece.published = false;
          saveJson(STORAGE.creations, mine);
          saveJson(
            STORAGE.community,
            loadJson(STORAGE.community, []).filter((p) => p.id !== id)
          );
          renderLibrary();
          if (isModUnlocked()) renderModeration();
          return;
        }
        const ok = await tryPublishExisting(piece);
        if (!ok) {
          saveJson(STORAGE.creations, mine);
          renderLibrary();
          return;
        }
        piece.published = true;
        saveJson(STORAGE.creations, mine);
        let community = loadJson(STORAGE.community, []);
        community = [{ ...piece, source: "community" }, ...community.filter((p) => p.id !== id)];
        saveJson(STORAGE.community, community);
        renderLibrary();
        if (isModUnlocked()) renderModeration();
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
        if (isModUnlocked()) renderModeration();
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
        if (isModUnlocked()) renderModeration();
      }
    });
  }

  function purgePublisherFromCommunity({ ip, publisherId, author }) {
    const authorNorm = author ? String(author).toLowerCase() : null;
    const next = loadJson(STORAGE.community, []).filter((p) => {
      if (ip && p.publisherIp === ip) return false;
      if (publisherId && p.publisherId === publisherId) return false;
      if (authorNorm && String(p.author || "").toLowerCase() === authorNorm) return false;
      return true;
    });
    saveJson(STORAGE.community, next);
    // Also unpublish matching local copies
    const mine = loadJson(STORAGE.creations, []);
    mine.forEach((p) => {
      if (ip && p.publisherIp === ip) p.published = false;
      if (publisherId && p.publisherId === publisherId) p.published = false;
      if (authorNorm && String(p.author || "").toLowerCase() === authorNorm)
        p.published = false;
    });
    saveJson(STORAGE.creations, mine);
    renderLibrary();
    renderModeration();
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
