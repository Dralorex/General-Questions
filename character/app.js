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
    const btn = $("#modTabBtn");
    if (!btn) return;
    btn.hidden = !isModUnlocked();
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
    return `<g class="layer layer-${piece.slot}${hideClass}${draftClass}" data-piece="${piece.id}" transform="${t}">${inner}</g>`;
  }

  function composeSvg(extraDraft = null) {
    const hatOn = Boolean(equipped.hat);
    const layers = SpotsOrderLayers(extraDraft, hatOn);
    return layers.join("\n");
  }

  function SpotsOrderLayers(extraDraft, hatOn) {
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
    return layers;
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
    equipped[slot] = id || null;
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
      const res = await fetch("./data/bans.json", { cache: "no-store" });
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

  function setMode(mode) {
    if (mode === "mod" && !isModUnlocked()) {
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
        setMode("mod");
        alert("Moderator tools unlocked for this browser session.");
      } else {
        alert("Incorrect passcode.");
      }
    });

    $("#lockModBtn").addEventListener("click", () => {
      setModUnlocked(false);
      setMode("library");
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
