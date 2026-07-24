/**
 * Publish safety: keyword / heuristic scans, agreement copy, mod unlock.
 * Client-side only — pair with bans.json + Moderation panel for enforcement.
 */
(function () {
  const AGREEMENT_VERSION = 1;

  /** Change this passcode in repo to control the Moderation tab unlock. */
  const MOD_PASSCODE = "dralorex-mod";

  /**
   * Blocklist tokens matched against names, authors, and SVG text.
   * Matching is case-insensitive; substrings count.
   */
  const BLOCK_TOKENS = [
    // sexual / adult
    "porn",
    "nsfw",
    "hentai",
    "xxx",
    "onlyfans",
    "nude",
    "nudes",
    "naked",
    "genitals",
    "penis",
    "vagina",
    "vulva",
    "anus",
    "blowjob",
    "handjob",
    "cumshot",
    "orgasm",
    "erotic",
    "fetish",
    "bdsm",
    "loli",
    "shota",
    "underage sex",
    "child porn",
    "cp ",
    // gore / extreme
    "gore",
    "snuff",
    // hate / slurs (partial set — extend as needed)
    "nigger",
    "nigga",
    "faggot",
    "retard",
    "kike",
    "spic",
    "chink",
    "tranny",
  ];

  const AGREEMENT_HTML = `
    <h2>Community publish rules</h2>
    <p>Before you can publish pieces to the <strong>public / community</strong> library, you must agree:</p>
    <ol>
      <li>No sexual, pornographic, or otherwise inappropriate content in public posts.</li>
      <li>No hate speech, slurs, or content that exploits minors.</li>
      <li>You may still <strong>save anything on your own device</strong> for private use — public publish is what we police.</li>
      <li>If automated checks or a moderator find inappropriate public posts, that item stays device-only and cannot be published.</li>
      <li>If you are found posting inappropriate content to the public database, <strong>your publisher account / IP can be banned from ever publishing again</strong>.</li>
    </ol>
    <p>By accepting, you confirm you understand these rules and that bans are permanent for public publishing.</p>
  `;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");
  }

  function scanText(...parts) {
    const hay = normalize(parts.join(" "));
    const hits = [];
    for (const token of BLOCK_TOKENS) {
      if (hay.includes(token)) hits.push(token.trim());
    }
    return {
      ok: hits.length === 0,
      hits: [...new Set(hits)],
      reason: hits.length
        ? `Blocked language detected (${hits.slice(0, 3).join(", ")}${hits.length > 3 ? "…" : ""}).`
        : null,
    };
  }

  /** Rough skin-tone pixel heuristic for uploaded bitmaps (not perfect). */
  function isSkinTone(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (
      r > 60 &&
      g > 30 &&
      b > 15 &&
      r > g &&
      r > b &&
      max - min > 15 &&
      Math.abs(r - g) > 15 &&
      r / (g + 1) > 1.05 &&
      r / (b + 1) > 1.15
    );
  }

  function scanImageDataUrl(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
        resolve({ ok: true, hits: [], reason: null, skinRatio: 0 });
        return;
      }
      if (dataUrl.startsWith("data:image/svg")) {
        // SVG-as-image: rely on text scan of decoded markup if available
        resolve({ ok: true, hits: [], reason: null, skinRatio: 0 });
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 96;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          let skin = 0;
          let opaque = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 40) continue;
            opaque += 1;
            if (isSkinTone(data[i], data[i + 1], data[i + 2])) skin += 1;
          }
          const skinRatio = opaque ? skin / opaque : 0;
          // High skin coverage on a freeform upload is treated as suspicious for public post
          if (skinRatio >= 0.42) {
            resolve({
              ok: false,
              hits: ["image-skin-heuristic"],
              reason:
                "Uploaded image looks like it may show a large amount of bare skin. For safety it can only be saved on your device — not posted to the public database.",
              skinRatio,
            });
            return;
          }
          resolve({ ok: true, hits: [], reason: null, skinRatio });
        } catch {
          resolve({ ok: true, hits: [], reason: null, skinRatio: 0 });
        }
      };
      img.onerror = () =>
        resolve({ ok: true, hits: [], reason: null, skinRatio: 0 });
      img.src = dataUrl;
    });
  }

  async function scanPieceDraft({ name, author, svg, imageData }) {
    const text = scanText(name, author, svg);
    if (!text.ok) {
      return {
        ok: false,
        source: "text",
        hits: text.hits,
        reason:
          text.reason +
          " You can still save this piece on your device, but it cannot be posted to the public database.",
      };
    }
    const image = await scanImageDataUrl(imageData);
    if (!image.ok) {
      return {
        ok: false,
        source: "image",
        hits: image.hits,
        reason: image.reason,
        skinRatio: image.skinRatio,
      };
    }
    return { ok: true, hits: [], reason: null, skinRatio: image.skinRatio || 0 };
  }

  window.CharacterModeration = {
    AGREEMENT_VERSION,
    AGREEMENT_HTML,
    MOD_PASSCODE,
    BLOCK_TOKENS,
    scanText,
    scanImageDataUrl,
    scanPieceDraft,
  };
})();
