/**
 * Built-in piece catalog — SVG layers on a shared 400×560 stage.
 * Neck joint: CharacterSlots.NECK (200, 148). Bodies own the full slender neck;
 * heads seat on the jaw and tint to the equipped body's skinTone via __SKIN__ tokens.
 * Hair groups with class "under-hat" are hidden when a hat is equipped.
 */
(function () {
  /** Slender neck — body owns the column; head overlaps at the jaw. */
  const N = { x: 200, y: 148, w: 22 };

  function piece(p) {
    return {
      source: "official",
      published: true,
      transform: { x: 0, y: 0, scale: 1, rotate: 0 },
      tags: [],
      headFits: "all",
      ...p,
    };
  }

  const skin = {
    fair: "#e8b896",
    warm: "#c6865a",
    deep: "#8d5524",
    pale: "#f0d0b4",
    olive: "#c4a882",
  };

  window.CharacterCatalog = [
    /* ========== BACKGROUNDS ========== */
    piece({
      id: "bg-studio",
      slot: "background",
      name: "Studio Gray",
      svg: `<rect width="400" height="560" fill="#1a222e"/>
        <ellipse cx="200" cy="508" rx="150" ry="34" fill="#0d1218" opacity=".5"/>`,
    }),
    piece({
      id: "bg-forest",
      slot: "background",
      name: "Misty Forest",
      svg: `<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1c3a2e"/><stop offset="100%" stop-color="#0e1a16"/></linearGradient></defs>
        <rect width="400" height="560" fill="url(#fg)"/>
        <path d="M0 430 C60 370 100 410 140 390 C190 365 220 420 280 400 C340 380 380 430 400 420 V560 H0Z" fill="#142820" opacity=".85"/>
        <ellipse cx="70" cy="90" rx="48" ry="56" fill="#2a5a44" opacity=".32"/>
        <ellipse cx="330" cy="110" rx="60" ry="70" fill="#2a5a44" opacity=".28"/>`,
    }),
    piece({
      id: "bg-dungeon",
      slot: "background",
      name: "Dungeon Torch",
      svg: `<rect width="400" height="560" fill="#121018"/>
        <defs><radialGradient id="dg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#5a3010"/><stop offset="75%" stop-color="#1a1018" stop-opacity="0"/></radialGradient></defs>
        <rect width="400" height="560" fill="url(#dg)"/>
        <path d="M28 0 C36 180 32 360 40 560 M372 0 C364 180 368 360 360 560" fill="none" stroke="#2a2430" stroke-width="20" stroke-linecap="round"/>
        <path d="M0 185 C120 175 280 195 400 180 M0 365 C140 350 260 375 400 360" fill="none" stroke="#2a2430" stroke-width="8"/>`,
    }),
    piece({
      id: "bg-sky",
      slot: "background",
      name: "Open Sky",
      svg: `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6fa8d8"/><stop offset="100%" stop-color="#c8dce8"/></linearGradient></defs>
        <rect width="400" height="560" fill="url(#sky)"/>
        <ellipse cx="90" cy="90" rx="54" ry="24" fill="#fff" opacity=".5"/>
        <ellipse cx="305" cy="128" rx="74" ry="28" fill="#fff" opacity=".38"/>
        <path d="M0 450 C80 430 160 455 240 440 C320 425 370 448 400 438 V560 H0Z" fill="#6a8a4a"/>`,
    }),

    /* ========== BASES ========== */
    piece({
      id: "base-disc",
      slot: "base",
      name: "Stone Disc",
      svg: `<ellipse cx="200" cy="508" rx="98" ry="24" fill="#3a4555"/>
        <ellipse cx="200" cy="502" rx="98" ry="24" fill="#5a6578"/>
        <ellipse cx="200" cy="500" rx="72" ry="14" fill="#4a5568" opacity=".45"/>`,
    }),
    piece({
      id: "base-hex",
      slot: "base",
      name: "Hex Tile",
      svg: `<path d="M200 476 C230 478 268 492 274 500 C278 508 274 520 200 538 C126 520 122 508 126 500 C132 492 170 478 200 476Z" fill="#4a3a28"/>
        <path d="M200 476 C240 492 260 500 200 516 C140 500 160 492 200 476Z" fill="#6a5440"/>`,
    }),
    piece({
      id: "base-grass",
      slot: "base",
      name: "Grass Tuft",
      svg: `<ellipse cx="200" cy="510" rx="84" ry="18" fill="#3a5a28"/>
        <path d="M138 502 C142 468 148 470 152 502 M158 504 C164 462 170 464 174 504 M196 506 C202 452 208 454 214 506 M228 504 C236 468 242 470 246 504 M258 502 C266 472 272 474 276 502" stroke="#5a8a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    }),

    /* ========== BODIES ========== */
    piece({
      id: "body-athletic",
      slot: "body",
      name: "Athletic",
      tags: ["humanoid"],
      skinTone: skin.fair,
      svg: bodySvg(skin.fair, "athletic"),
    }),
    piece({
      id: "body-sturdy",
      slot: "body",
      name: "Sturdy",
      tags: ["humanoid"],
      skinTone: skin.warm,
      svg: bodySvg(skin.warm, "sturdy"),
    }),
    piece({
      id: "body-lithe",
      slot: "body",
      name: "Lithe",
      tags: ["humanoid"],
      skinTone: skin.pale,
      svg: bodySvg(skin.pale, "lithe"),
    }),
    piece({
      id: "body-broad",
      slot: "body",
      name: "Broad",
      tags: ["humanoid"],
      skinTone: skin.deep,
      svg: bodySvg(skin.deep, "broad"),
    }),
    piece({
      id: "body-olive",
      slot: "body",
      name: "Olive Athletic",
      tags: ["humanoid"],
      skinTone: skin.olive,
      svg: bodySvg(skin.olive, "athletic"),
    }),

    /* ========== HEADS (skin tokens filled from body at render) ========== */
    piece({
      id: "head-oval",
      slot: "head",
      name: "Oval",
      tags: ["humanoid"],
      tintSkin: true,
      svg: headSvg("oval"),
    }),
    piece({
      id: "head-round",
      slot: "head",
      name: "Round",
      tags: ["humanoid"],
      tintSkin: true,
      svg: headSvg("round"),
    }),
    piece({
      id: "head-angular",
      slot: "head",
      name: "Angular",
      tags: ["humanoid"],
      tintSkin: true,
      svg: headSvg("angular"),
    }),
    piece({
      id: "head-square",
      slot: "head",
      name: "Square",
      tags: ["humanoid"],
      tintSkin: true,
      svg: headSvg("square"),
    }),
    piece({
      id: "head-elf",
      slot: "head",
      name: "Elven",
      tags: ["elf"],
      tintSkin: true,
      svg: headSvg("elf"),
    }),
    piece({
      id: "head-dwarf",
      slot: "head",
      name: "Dwarven",
      tags: ["dwarf"],
      tintSkin: true,
      svg: headSvg("dwarf"),
    }),

    /* ========== HAIR ========== */
    piece({
      id: "hair-short",
      slot: "hair",
      name: "Short Crop",
      svg: hairShort("#2a1a10"),
    }),
    piece({
      id: "hair-bob",
      slot: "hair",
      name: "Bob Cut",
      svg: hairBob("#3a2a1a"),
    }),
    piece({
      id: "hair-long",
      slot: "hair",
      name: "Long Waves",
      svg: hairLong("#5a3020"),
    }),
    piece({
      id: "hair-ponytail",
      slot: "hair",
      name: "Ponytail",
      svg: hairPonytail("#1a1a20"),
    }),
    piece({
      id: "hair-braids",
      slot: "hair",
      name: "Side Braids",
      svg: hairBraids("#8a6030"),
    }),
    piece({
      id: "hair-bald",
      slot: "hair",
      name: "None / Bald",
      svg: ``,
    }),
    piece({
      id: "hair-white-long",
      slot: "hair",
      name: "Silver Long",
      svg: hairLong("#d8d4e0"),
    }),
    piece({
      id: "hair-red-short",
      slot: "hair",
      name: "Auburn Crop",
      svg: hairShort("#8a3020"),
    }),

    /* ========== HATS ========== */
    piece({
      id: "hat-hood",
      slot: "hat",
      name: "Travel Hood",
      svg: `<g class="piece-hat">
        <path d="M132 98 C150 52 180 38 200 36 C220 38 250 52 268 98 C262 128 230 146 200 148 C170 146 138 128 132 98Z" fill="#3a4a3a"/>
        <path d="M142 102 C165 62 200 50 258 102" fill="none" stroke="#2a322a" stroke-width="3" stroke-linecap="round"/>
        <path d="M200 40 C222 22 246 48 250 72 C238 58 218 48 200 50Z" fill="#3a4a3a"/>
      </g>`,
    }),
    piece({
      id: "hat-wizard",
      slot: "hat",
      name: "Wizard Hat",
      svg: `<g class="piece-hat">
        <ellipse cx="200" cy="110" rx="76" ry="15" fill="#2a2040"/>
        <path d="M148 108 C168 40 188 8 200 -8 C214 10 236 48 252 108 C236 122 214 128 200 128 C186 128 164 122 148 108Z" fill="#3a3060"/>
        <circle cx="208" cy="42" r="5" fill="#d4b050"/>
        <path d="M160 104 C185 90 215 90 240 104" fill="none" stroke="#5a4880" stroke-width="3.5" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "hat-helm",
      slot: "hat",
      name: "Iron Helm",
      svg: `<g class="piece-hat">
        <path d="M134 102 C150 48 180 34 200 32 C220 34 250 48 266 102 C258 132 228 148 200 150 C172 148 142 132 134 102Z" fill="#6a7080"/>
        <path d="M148 104 C170 60 200 48 252 104" fill="none" stroke="#8a90a0" stroke-width="4" stroke-linecap="round"/>
        <path d="M176 98 C188 94 212 94 224 98 C222 106 210 110 200 110 C190 110 178 106 176 98Z" fill="#3a4050"/>
        <path d="M200 36 C206 52 208 68 204 74 C200 70 196 74 192 68 C196 52 198 40 200 36Z" fill="#8a90a0"/>
      </g>`,
    }),
    piece({
      id: "hat-cap",
      slot: "hat",
      name: "Leather Cap",
      svg: `<g class="piece-hat">
        <path d="M142 98 C158 54 182 44 200 42 C218 44 242 54 258 98 C252 124 226 138 200 140 C174 138 148 124 142 98Z" fill="#6a4830"/>
        <path d="M148 114 C175 100 225 100 252 114 C240 122 220 128 200 128 C180 128 160 122 148 114Z" fill="#5a3a22"/>
      </g>`,
    }),
    piece({
      id: "hat-crown",
      slot: "hat",
      name: "Simple Crown",
      svg: `<g class="piece-hat">
        <path d="M152 108 C156 88 162 72 168 78 C178 96 188 70 200 58 C212 70 222 96 232 78 C238 72 244 88 248 108 C246 118 224 122 200 122 C176 122 154 118 152 108Z" fill="#d4b050"/>
        <circle cx="200" cy="78" r="5" fill="#c04040"/>
        <circle cx="168" cy="88" r="3" fill="#4080c0"/>
        <circle cx="232" cy="88" r="3" fill="#4080c0"/>
      </g>`,
    }),

    /* ========== GLASSES ========== */
    piece({
      id: "glasses-round",
      slot: "glasses",
      name: "Round Specs",
      svg: `<g class="piece-glasses" fill="none" stroke="#2a2a2a" stroke-width="2.8" stroke-linecap="round">
        <circle cx="176" cy="96" r="15"/><circle cx="224" cy="96" r="15"/>
        <path d="M191 96 C198 93 206 93 213 96 M161 96 C152 94 146 95 142 98 M239 96 C248 94 254 95 258 98"/>
      </g>`,
    }),
    piece({
      id: "glasses-square",
      slot: "glasses",
      name: "Square Frames",
      svg: `<g class="piece-glasses" fill="none" stroke="#1a3040" stroke-width="2.8" stroke-linecap="round">
        <path d="M160 84 C162 82 186 82 188 84 L190 104 C188 108 162 108 160 104Z"/>
        <path d="M212 84 C214 82 238 82 240 84 L242 104 C240 108 214 108 212 104Z"/>
        <path d="M190 95 C198 92 206 92 214 95"/>
      </g>`,
    }),
    piece({
      id: "glasses-monocle",
      slot: "glasses",
      name: "Monocle",
      svg: `<g class="piece-glasses" fill="none" stroke="#c0a050" stroke-width="2.4" stroke-linecap="round">
        <circle cx="224" cy="96" r="13"/>
        <path d="M237 96 C252 108 248 128 244 142"/>
      </g>`,
    }),

    /* ========== TOPS ========== */
    piece({
      id: "top-tunic",
      slot: "top",
      name: "Linen Tunic",
      svg: `<g class="piece-top">
        <path d="M158 158 C148 168 132 198 128 230 C124 270 132 312 138 328 C168 334 232 334 262 328 C268 312 276 270 272 230 C268 198 252 168 242 158 C228 172 212 178 200 178 C188 178 172 172 158 158Z" fill="#6a8a9a"/>
        <path d="M160 162 C180 174 220 174 240 162" fill="none" stroke="#4a6a7a" stroke-width="3" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "top-vest",
      slot: "top",
      name: "Leather Vest",
      svg: `<g class="piece-top">
        <path d="M162 160 C152 172 140 205 138 235 C136 275 146 302 152 310 C176 316 224 316 248 310 C254 302 264 275 262 235 C260 205 248 172 238 160 C224 176 212 182 200 182 C188 182 176 176 162 160Z" fill="#6a4830"/>
        <path d="M200 176 C200 210 200 250 200 302" stroke="#4a3020" stroke-width="2" fill="none"/>
        <circle cx="190" cy="205" r="3" fill="#c0a050"/><circle cx="190" cy="235" r="3" fill="#c0a050"/><circle cx="190" cy="265" r="3" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "top-armor",
      slot: "top",
      name: "Chest Plate",
      svg: `<g class="piece-top">
        <path d="M156 158 C146 170 130 200 128 228 C126 268 138 292 146 300 C174 308 226 308 254 300 C262 292 274 268 272 228 C270 200 254 170 244 158 C228 176 212 184 200 184 C188 184 172 176 156 158Z" fill="#7a8498"/>
        <path d="M164 178 C186 196 214 196 236 178" fill="none" stroke="#a0a8b8" stroke-width="4" stroke-linecap="round"/>
        <path d="M172 228 C190 234 210 234 228 228 M172 258 C190 264 210 264 228 258" stroke="#5a6478" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "top-robe-shirt",
      slot: "top",
      name: "Mage Shirt",
      svg: `<g class="piece-top">
        <path d="M156 156 C144 168 122 205 120 238 C116 288 128 328 136 338 C170 346 230 346 264 338 C272 328 284 288 280 238 C278 205 256 168 244 156 C228 170 212 176 200 176 C188 176 172 170 156 156Z" fill="#4a3a6a"/>
        <path d="M200 168 C200 220 200 280 200 328" stroke="#6a5a8a" stroke-width="2" stroke-dasharray="5 7" fill="none"/>
      </g>`,
    }),

    /* ========== BOTTOMS ========== */
    piece({
      id: "bottom-pants",
      slot: "bottom",
      name: "Cloth Pants",
      svg: `<g class="piece-bottom">
        <path d="M148 305 C142 350 136 410 134 468 C138 476 168 478 174 470 C186 400 194 350 198 318 C202 350 214 400 226 470 C232 478 262 476 266 468 C264 410 258 350 252 305 C228 318 172 318 148 305Z" fill="#3a4a5a"/>
        <path d="M200 312 C200 330 200 340 200 348" stroke="#2a3a4a" stroke-width="2" fill="none"/>
      </g>`,
    }),
    piece({
      id: "bottom-skirt",
      slot: "bottom",
      name: "Travel Skirt",
      svg: `<g class="piece-bottom">
        <path d="M146 302 C176 314 224 314 254 302 C268 360 282 410 278 430 C240 455 160 455 122 430 C118 410 132 360 146 302Z" fill="#5a3a4a"/>
        <path d="M154 324 C186 338 214 338 246 324" fill="none" stroke="#7a5a6a" stroke-width="2" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "bottom-greaves",
      slot: "bottom",
      name: "Padded Greaves",
      svg: `<g class="piece-bottom">
        <path d="M148 304 C142 360 138 420 136 458 C140 468 170 470 176 460 C186 400 194 350 198 318 C202 350 214 400 224 460 C230 470 260 468 264 458 C262 420 258 360 252 304 C228 316 172 316 148 304Z" fill="#4a5040"/>
        <path d="M144 382 C156 376 176 376 182 384 C176 396 156 396 144 388Z" fill="#6a7060"/>
        <path d="M218 384 C230 376 250 376 256 382 C256 394 236 396 218 388Z" fill="#6a7060"/>
      </g>`,
    }),

    /* ========== OUTERWEAR ========== */
    piece({
      id: "outer-cloak",
      slot: "outer",
      name: "Traveler Cloak",
      svg: `<g class="piece-outer">
        <path d="M128 162 C96 240 92 360 102 485 C130 492 150 400 168 250 C178 200 188 172 200 168 C212 172 222 200 232 250 C250 400 270 492 298 485 C308 360 304 240 272 162 C240 188 160 188 128 162Z" fill="#2a3a4a" opacity=".92"/>
        <path d="M136 166 C170 192 230 192 264 166" fill="none" stroke="#3a4a5a" stroke-width="3" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "outer-cape",
      slot: "outer",
      name: "Hero Cape",
      svg: `<g class="piece-outer">
        <path d="M158 162 C100 230 88 360 94 492 C140 486 152 340 172 220 C184 185 194 170 200 168 C206 170 216 185 228 220 C248 340 260 486 306 492 C312 360 300 230 242 162 C220 178 180 178 158 162Z" fill="#8a2030" opacity=".9"/>
      </g>`,
    }),
    piece({
      id: "outer-robe",
      slot: "outer",
      name: "Wizard Robe",
      svg: `<g class="piece-outer">
        <path d="M146 158 C120 200 100 280 108 500 C160 512 240 512 292 500 C300 280 280 200 254 158 C230 178 170 178 146 158Z" fill="#2a2450" opacity=".88"/>
        <path d="M200 170 C200 280 200 400 200 492" stroke="#4a4080" stroke-width="2" fill="none"/>
        <circle cx="200" cy="222" r="12" fill="none" stroke="#d4b050" stroke-width="2"/>
      </g>`,
    }),

    /* ========== FOOTWEAR ========== */
    piece({
      id: "boot-leather",
      slot: "footwear",
      name: "Leather Boots",
      svg: `<g class="piece-footwear">
        <path d="M138 452 C128 470 122 492 124 502 C140 510 170 508 176 498 C174 475 172 458 170 452 C158 448 146 448 138 452Z" fill="#4a3020"/>
        <path d="M230 452 C228 458 226 475 224 498 C230 508 260 510 276 502 C278 492 272 470 262 452 C254 448 242 448 230 452Z" fill="#4a3020"/>
        <path d="M128 492 C148 498 166 496 174 490 M226 490 C240 498 260 498 274 492" stroke="#6a4830" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "boot-plate",
      slot: "footwear",
      name: "Plate Sabatons",
      svg: `<g class="piece-footwear">
        <path d="M140 448 C128 468 120 490 122 500 C142 510 174 508 178 496 C176 470 174 455 172 450 C160 444 148 444 140 448Z" fill="#6a7080"/>
        <path d="M228 450 C226 455 224 470 222 496 C226 508 258 510 278 500 C280 490 272 468 260 448 C252 444 240 444 228 450Z" fill="#6a7080"/>
        <path d="M132 476 C150 482 166 480 174 474 M226 474 C240 482 258 482 272 476" stroke="#9aa0b0" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "boot-sandals",
      slot: "footwear",
      name: "Sandals",
      svg: `<g class="piece-footwear" fill="none" stroke="#6a4830" stroke-width="3" stroke-linecap="round">
        <path d="M140 478 C152 498 168 498 176 480"/>
        <path d="M224 480 C236 498 252 498 264 478"/>
        <path d="M146 488 C156 492 166 492 172 488 M228 488 C238 492 248 492 258 488"/>
      </g>`,
    }),

    /* ========== WEAPONS ========== */
    piece({
      id: "weapon-sword",
      slot: "weapon-main",
      name: "Longsword",
      svg: `<g class="piece-weapon" transform="translate(286 278) rotate(-16)">
        <path d="M-5 42 C-6 70 -5 90 -4 98 C0 102 4 98 5 90 C6 70 5 42 4 40 Z" fill="#5a4030"/>
        <path d="M-16 34 C-8 30 8 30 16 34 C12 42 -12 42 -16 34Z" fill="#c0a050"/>
        <path d="M0 34 C4 -20 6 -55 2 -82 C0 -90 -2 -82 -6 -55 C-4 -20 0 34 0 34Z" fill="#c0c8d8"/>
        <path d="M0 34 C0 -20 0 -55 0 -78" stroke="#e8ecf4" stroke-width="1.8" fill="none"/>
      </g>`,
    }),
    piece({
      id: "weapon-axe",
      slot: "weapon-main",
      name: "Battle Axe",
      svg: `<g class="piece-weapon" transform="translate(290 300) rotate(-10)">
        <path d="M-4 -15 C-5 40 -4 90 -3 105 C0 108 4 105 5 90 C6 40 5 -15 4 -18 Z" fill="#5a4030"/>
        <path d="M6 -8 C28 -28 48 -18 46 18 C42 32 22 28 6 16 C8 8 8 0 6 -8Z" fill="#8a90a0"/>
        <path d="M8 -2 C26 -14 36 -6 34 12 C22 16 10 10 8 4Z" fill="#b0b8c8"/>
      </g>`,
    }),
    piece({
      id: "weapon-staff",
      slot: "weapon-main",
      name: "Oak Staff",
      svg: `<g class="piece-weapon" transform="translate(296 238) rotate(-7)">
        <path d="M-4 8 C-5 80 -4 160 -3 220 C0 226 4 220 5 160 C6 80 5 8 4 4 Z" fill="#6a4830"/>
        <circle cx="0" cy="-4" r="16" fill="#3a3060" stroke="#d4b050" stroke-width="3"/>
        <circle cx="0" cy="-4" r="6" fill="#80d0ff" opacity=".85"/>
      </g>`,
    }),
    piece({
      id: "weapon-bow",
      slot: "weapon-main",
      name: "Hunting Bow",
      svg: `<g class="piece-weapon" transform="translate(302 258)">
        <path d="M2 -82 C38 -40 38 40 2 82" fill="none" stroke="#6a4830" stroke-width="6" stroke-linecap="round"/>
        <path d="M2 -82 C0 0 0 0 2 82" stroke="#d8d0c0" stroke-width="1.5" fill="none"/>
        <path d="M-4 0 C8 0 20 0 28 0" stroke="#c0a080" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "weapon-dagger",
      slot: "weapon-off",
      name: "Dagger",
      svg: `<g class="piece-weapon" transform="translate(106 308) rotate(18)">
        <path d="M-3 22 C-4 40 -3 52 -2 56 C0 58 3 56 4 48 C5 40 4 22 3 20 Z" fill="#4a3020"/>
        <path d="M-10 18 C-4 14 4 14 10 18 C6 24 -6 24 -10 18Z" fill="#a09040"/>
        <path d="M0 16 C3 -10 4 -28 1 -42 C0 -48 -1 -42 -4 -28 C-3 -10 0 16 0 16Z" fill="#b0b8c8"/>
      </g>`,
    }),
    piece({
      id: "weapon-shield",
      slot: "weapon-off",
      name: "Round Shield",
      svg: `<g class="piece-weapon" transform="translate(102 298)">
        <circle cx="0" cy="0" r="42" fill="#6a4830" stroke="#3a2a18" stroke-width="4"/>
        <circle cx="0" cy="0" r="28" fill="#8a6840"/>
        <circle cx="0" cy="0" r="10" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "weapon-torch",
      slot: "weapon-off",
      name: "Torch",
      svg: `<g class="piece-weapon" transform="translate(102 318) rotate(12)">
        <path d="M-4 4 C-5 30 -4 55 -3 68 C0 72 4 68 5 55 C6 30 5 4 4 2 Z" fill="#6a4830"/>
        <path d="M0 -8 C10 -20 8 -32 0 -38 C-8 -32 -10 -20 0 -8Z" fill="#f09030"/>
        <path d="M0 -16 C5 -24 4 -30 0 -34 C-4 -30 -5 -24 0 -16Z" fill="#ffe080"/>
      </g>`,
    }),

    /* ========== ITEMS ========== */
    piece({
      id: "item-pouch",
      slot: "item",
      name: "Belt Pouch",
      svg: `<g class="piece-item" transform="translate(156 296)">
        <path d="M-12 2 C-14 16 -12 28 0 32 C12 28 14 16 12 2 C6 -2 -6 -2 -12 2Z" fill="#5a4030"/>
        <ellipse cx="0" cy="2" rx="14" ry="5" fill="#6a5040"/>
        <circle cx="0" cy="12" r="3" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "item-book",
      slot: "item",
      name: "Spellbook",
      svg: `<g class="piece-item" transform="translate(250 298) rotate(6)">
        <path d="M-18 -20 C-18 -24 18 -24 18 -20 L18 20 C18 24 -18 24 -18 20Z" fill="#3a2040"/>
        <path d="M-14 -16 C-14 -18 14 -18 14 -16 L14 16 C14 18 -14 18 -14 16Z" fill="#5a3860"/>
        <path d="M-8 -4 C0 -4 8 -4 8 -4 M-8 6 C0 6 8 6 8 6 M-8 16 C-2 16 4 16 4 16" stroke="#d4b050" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>`,
    }),
    piece({
      id: "item-amulet",
      slot: "item",
      name: "Amulet",
      svg: `<g class="piece-item">
        <path d="M182 162 C190 178 210 178 218 162" fill="none" stroke="#c0a050" stroke-width="2" stroke-linecap="round"/>
        <circle cx="200" cy="198" r="10" fill="#4080c0" stroke="#c0a050" stroke-width="2"/>
      </g>`,
    }),

    /* ========== PROPS ========== */
    piece({
      id: "prop-raven",
      slot: "prop",
      name: "Raven",
      svg: `<g class="piece-prop" transform="translate(318 422)">
        <path d="M-20 4 C-18 -8 -4 -12 8 -6 C20 0 22 10 12 14 C0 18 -18 14 -20 4Z" fill="#1a1a22"/>
        <path d="M16 -2 C28 -10 38 -6 34 4 C28 8 20 6 16 2Z" fill="#2a2a30"/>
        <circle cx="-10" cy="-2" r="7" fill="#1a1a22"/>
        <circle cx="-12" cy="-3" r="2" fill="#e0c040"/>
        <path d="M-16 0 C-24 0 -26 2 -24 4 C-20 4 -16 2 -16 0Z" fill="#e09030"/>
      </g>`,
    }),
    piece({
      id: "prop-chest",
      slot: "prop",
      name: "Loot Chest",
      svg: `<g class="piece-prop" transform="translate(72 456)">
        <path d="M-28 -12 C-28 -16 28 -16 28 -12 L28 18 C28 22 -28 22 -28 18Z" fill="#6a4830"/>
        <path d="M-28 -12 C-10 -34 10 -34 28 -12Z" fill="#8a6840"/>
        <path d="M-6 -6 C-6 -10 6 -10 6 -6 L6 4 C6 6 -6 6 -6 4Z" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "prop-campfire",
      slot: "prop",
      name: "Campfire",
      svg: `<g class="piece-prop" transform="translate(58 472)">
        <path d="M-22 12 C-14 0 -6 8 0 2 C6 10 14 0 22 12 C10 18 -10 18 -22 12Z" fill="#5a4030"/>
        <path d="M0 -6 C12 -24 8 -36 0 -42 C-8 -36 -12 -24 0 -6Z" fill="#e07020"/>
        <path d="M0 -14 C6 -26 4 -32 0 -36 C-4 -32 -6 -26 0 -14Z" fill="#ffe060"/>
      </g>`,
    }),
  ];

  /* ---- helpers ---- */

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  /**
   * Body owns a continuous slender neck that flares softly into the shoulders.
   * No hard stump — the head jaw overlaps the top of this neck.
   */
  function bodySvg(tone, build) {
    const dark = shade(tone, -28);
    const mid = shade(tone, -10);
    let torsoW = 52;
    let hipW = 46;
    let shoulder = 68;
    let arm = 13;
    let neckHalf = N.w / 2; // ~11
    if (build === "sturdy") {
      torsoW = 58;
      hipW = 54;
      shoulder = 76;
      arm = 15;
      neckHalf = 12;
    } else if (build === "lithe") {
      torsoW = 44;
      hipW = 40;
      shoulder = 58;
      arm = 11;
      neckHalf = 9.5;
    } else if (build === "broad") {
      torsoW = 66;
      hipW = 58;
      shoulder = 86;
      arm = 17;
      neckHalf = 13;
    }
    const nx = N.x;
    const ny = N.y;
    // Neck rises from shoulders (~ny+8) up past the jaw seat (~ny-18)
    const neckTop = ny - 22;
    const jawSeat = ny - 6;

    return `<g class="piece-body">
      <!-- continuous slender neck with soft shoulder flare -->
      <path d="
        M${nx - neckHalf} ${neckTop}
        C${nx - neckHalf - 1} ${jawSeat} ${nx - neckHalf - 1} ${ny} ${nx - neckHalf - 2} ${ny + 10}
        C${nx - neckHalf - 6} ${ny + 22} ${nx - shoulder / 2 + 4} ${ny + 28} ${nx - shoulder / 2} ${ny + 18}
        C${nx - torsoW} ${ny + 55} ${nx - torsoW - 2} ${ny + 110} ${nx - hipW} ${ny + 158}
        C${nx - 20} ${ny + 168} ${nx + 20} ${ny + 168} ${nx + hipW} ${ny + 158}
        C${nx + torsoW + 2} ${ny + 110} ${nx + torsoW} ${ny + 55} ${nx + shoulder / 2} ${ny + 18}
        C${nx + shoulder / 2 - 4} ${ny + 28} ${nx + neckHalf + 6} ${ny + 22} ${nx + neckHalf + 2} ${ny + 10}
        C${nx + neckHalf + 1} ${ny} ${nx + neckHalf + 1} ${jawSeat} ${nx + neckHalf} ${neckTop}
        C${nx + 4} ${neckTop - 3} ${nx - 4} ${neckTop - 3} ${nx - neckHalf} ${neckTop}Z
      " fill="${tone}"/>
      <!-- soft clavicle shade -->
      <path d="M${nx - shoulder / 2 + 8} ${ny + 20} C${nx - 10} ${ny + 30} ${nx + 10} ${ny + 30} ${nx + shoulder / 2 - 8} ${ny + 20}"
        fill="none" stroke="${mid}" stroke-width="3" stroke-linecap="round" opacity=".45"/>
      <!-- undergarments -->
      <path d="M${nx - hipW + 6} ${ny + 148}
        C${nx - 30} ${ny + 158} ${nx - 24} ${ny + 178} ${nx - 10} ${ny + 168}
        C${nx - 2} ${ny + 160} ${nx + 2} ${ny + 160} ${nx + 10} ${ny + 168}
        C${nx + 24} ${ny + 178} ${nx + 30} ${ny + 158} ${nx + hipW - 6} ${ny + 148}
        C${nx + 16} ${ny + 162} ${nx - 16} ${ny + 162} ${nx - hipW + 6} ${ny + 148}Z" fill="#3a3548"/>
      <path d="M${nx - hipW + 8} ${ny + 140} C${nx - 10} ${ny + 152} ${nx + 10} ${ny + 152} ${nx + hipW - 8} ${ny + 140}
        C${nx + 20} ${ny + 156} ${nx - 20} ${ny + 156} ${nx - hipW + 8} ${ny + 148}Z" fill="#2e2a3a"/>
      <!-- arms — soft taper -->
      <path d="M${nx - shoulder / 2 + 2} ${ny + 22}
        C${nx - shoulder / 2 - 28} ${ny + 70} ${nx - shoulder / 2 - 34} ${ny + 120} ${nx - shoulder / 2 - 26} ${ny + 176}
        C${nx - shoulder / 2 - 18} ${ny + 184} ${nx - shoulder / 2 - 8} ${ny + 180} ${nx - shoulder / 2 - 6} ${ny + 172}
        C${nx - shoulder / 2 - 14} ${ny + 110} ${nx - shoulder / 2 - 8} ${ny + 60} ${nx - shoulder / 2 + 10} ${ny + 32}Z" fill="${mid}"/>
      <path d="M${nx + shoulder / 2 - 2} ${ny + 22}
        C${nx + shoulder / 2 + 28} ${ny + 70} ${nx + shoulder / 2 + 34} ${ny + 120} ${nx + shoulder / 2 + 26} ${ny + 176}
        C${nx + shoulder / 2 + 18} ${ny + 184} ${nx + shoulder / 2 + 8} ${ny + 180} ${nx + shoulder / 2 + 6} ${ny + 172}
        C${nx + shoulder / 2 + 14} ${ny + 110} ${nx + shoulder / 2 + 8} ${ny + 60} ${nx + shoulder / 2 - 10} ${ny + 32}Z" fill="${mid}"/>
      <!-- legs -->
      <path d="M${nx - 26} ${ny + 162}
        C${nx - 34} ${ny + 220} ${nx - 38} ${ny + 280} ${nx - 36} ${ny + 312}
        C${nx - 28} ${ny + 320} ${nx - 14} ${ny + 318} ${nx - 12} ${ny + 308}
        C${nx - 10} ${ny + 250} ${nx - 6} ${ny + 200} ${nx - 4} ${ny + 168}Z" fill="${tone}"/>
      <path d="M${nx + 26} ${ny + 162}
        C${nx + 34} ${ny + 220} ${nx + 38} ${ny + 280} ${nx + 36} ${ny + 312}
        C${nx + 28} ${ny + 320} ${nx + 14} ${ny + 318} ${nx + 12} ${ny + 308}
        C${nx + 10} ${ny + 250} ${nx + 6} ${ny + 200} ${nx + 4} ${ny + 168}Z" fill="${tone}"/>
      <!-- hands -->
      <ellipse cx="${nx - shoulder / 2 - 20}" cy="${ny + 182}" rx="${arm}" ry="9" fill="${dark}"/>
      <ellipse cx="${nx + shoulder / 2 + 20}" cy="${ny + 182}" rx="${arm}" ry="9" fill="${dark}"/>
      <!-- feet -->
      <ellipse cx="${nx - 26}" cy="${ny + 318}" rx="17" ry="8" fill="${dark}"/>
      <ellipse cx="${nx + 26}" cy="${ny + 318}" rx="17" ry="8" fill="${dark}"/>
    </g>`;
  }

  /**
   * Heads use __SKIN__ / __SKIN_MID__ / __SKIN_DARK__ tokens so the composer
   * can recolor them to the equipped body's skinTone.
   * Jaw sits on the body neck — no separate neck stump.
   */
  function headSvg(shape) {
    const tone = "__SKIN__";
    const dark = "__SKIN_DARK__";
    const mid = "__SKIN_MID__";
    const nx = N.x;
    const chinY = 138;
    let headPath;

    if (shape === "round") {
      headPath = `M${nx - 40} 100
        C${nx - 44} 70 ${nx - 36} 48 ${nx} 44
        C${nx + 36} 48 ${nx + 44} 70 ${nx + 40} 100
        C${nx + 38} 122 ${nx + 24} ${chinY} ${nx} ${chinY + 4}
        C${nx - 24} ${chinY} ${nx - 38} 122 ${nx - 40} 100Z`;
    } else if (shape === "angular") {
      headPath = `M${nx - 36} 102
        C${nx - 40} 78 ${nx - 34} 52 ${nx} 42
        C${nx + 34} 52 ${nx + 40} 78 ${nx + 36} 102
        C${nx + 34} 118 ${nx + 22} ${chinY - 2} ${nx} ${chinY + 2}
        C${nx - 22} ${chinY - 2} ${nx - 34} 118 ${nx - 36} 102Z`;
    } else if (shape === "square") {
      headPath = `M${nx - 38} 62
        C${nx - 40} 52 ${nx - 28} 46 ${nx} 44
        C${nx + 28} 46 ${nx + 40} 52 ${nx + 38} 62
        C${nx + 40} 100 ${nx + 36} 124 ${nx + 22} ${chinY}
        C${nx + 8} ${chinY + 6} ${nx - 8} ${chinY + 6} ${nx - 22} ${chinY}
        C${nx - 36} 124 ${nx - 40} 100 ${nx - 38} 62Z`;
    } else if (shape === "elf") {
      headPath = `M${nx - 36} 98
        C${nx - 40} 68 ${nx - 30} 48 ${nx} 44
        C${nx + 30} 48 ${nx + 40} 68 ${nx + 36} 98
        C${nx + 34} 120 ${nx + 20} ${chinY - 4} ${nx} ${chinY}
        C${nx - 20} ${chinY - 4} ${nx - 34} 120 ${nx - 36} 98Z`;
    } else if (shape === "dwarf") {
      headPath = `M${nx - 42} 96
        C${nx - 46} 68 ${nx - 32} 50 ${nx} 48
        C${nx + 32} 50 ${nx + 46} 68 ${nx + 42} 96
        C${nx + 40} 124 ${nx + 26} ${chinY + 4} ${nx} ${chinY + 8}
        C${nx - 26} ${chinY + 4} ${nx - 40} 124 ${nx - 42} 96Z`;
    } else {
      // oval — default soft face
      headPath = `M${nx - 38} 100
        C${nx - 42} 68 ${nx - 32} 46 ${nx} 42
        C${nx + 32} 46 ${nx + 42} 68 ${nx + 38} 100
        C${nx + 36} 122 ${nx + 22} ${chinY} ${nx} ${chinY + 4}
        C${nx - 22} ${chinY} ${nx - 36} 122 ${nx - 38} 100Z`;
    }

    const ears =
      shape === "elf"
        ? `<path d="M${nx - 36} 92 C${nx - 52} 78 ${nx - 58} 70 ${nx - 48} 88 C${nx - 42} 98 ${nx - 36} 104 ${nx - 34} 100Z" fill="${tone}"/>
           <path d="M${nx + 36} 92 C${nx + 52} 78 ${nx + 58} 70 ${nx + 48} 88 C${nx + 42} 98 ${nx + 36} 104 ${nx + 34} 100Z" fill="${tone}"/>`
        : shape === "dwarf"
          ? `<path d="M${nx - 40} 90 C${nx - 50} 92 ${nx - 52} 108 ${nx - 42} 112 C${nx - 38} 108 ${nx - 38} 96 ${nx - 40} 90Z" fill="${mid}"/>
             <path d="M${nx + 40} 90 C${nx + 50} 92 ${nx + 52} 108 ${nx + 42} 112 C${nx + 38} 108 ${nx + 38} 96 ${nx + 40} 90Z" fill="${mid}"/>`
          : `<path d="M${nx - 38} 92 C${nx - 48} 94 ${nx - 48} 108 ${nx - 40} 110 C${nx - 36} 106 ${nx - 36} 96 ${nx - 38} 92Z" fill="${mid}"/>
             <path d="M${nx + 38} 92 C${nx + 48} 94 ${nx + 48} 108 ${nx + 40} 110 C${nx + 36} 106 ${nx + 36} 96 ${nx + 38} 92Z" fill="${mid}"/>`;

    const beard =
      shape === "dwarf"
        ? `<path d="M${nx - 26} 124 C${nx - 10} 150 ${nx + 10} 150 ${nx + 26} 124 C${nx + 8} 138 ${nx - 8} 138 ${nx - 26} 124Z" fill="#5a3020"/>`
        : "";

    // Soft jaw shadow where head meets neck — sells the blend
    return `<g class="piece-head">
      <path d="${headPath}" fill="${tone}"/>
      ${ears}
      <path d="M${nx - 18} ${chinY - 2} C${nx - 6} ${chinY + 6} ${nx + 6} ${chinY + 6} ${nx + 18} ${chinY - 2}"
        fill="none" stroke="${mid}" stroke-width="4" stroke-linecap="round" opacity=".35"/>
      <ellipse cx="${nx - 13}" cy="94" rx="5.5" ry="6.5" fill="#fff"/>
      <ellipse cx="${nx + 13}" cy="94" rx="5.5" ry="6.5" fill="#fff"/>
      <circle cx="${nx - 12}" cy="95" r="3" fill="#2a2018"/>
      <circle cx="${nx + 14}" cy="95" r="3" fill="#2a2018"/>
      <circle cx="${nx - 11}" cy="94" r="1" fill="#fff"/>
      <circle cx="${nx + 15}" cy="94" r="1" fill="#fff"/>
      <path d="M${nx - 20} 84 C${nx - 14} 80 ${nx - 7} 82" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M${nx + 7} 82 C${nx + 14} 80 ${nx + 20} 84" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M${nx} 98 C${nx - 2} 108 ${nx - 3} 112 ${nx} 112 C${nx + 3} 112 ${nx + 2} 108 ${nx} 98"
        fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M${nx - 9} 122 C${nx} 127 ${nx + 9} 122" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>
      ${beard}
    </g>`;
  }

  function hairShort(color) {
    const hi = shade(color, 22);
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M160 96 C162 52 180 40 200 38 C220 40 238 52 240 96 C232 72 216 62 200 60 C184 62 168 72 160 96Z" fill="${color}"/>
        <path d="M168 86 C180 70 192 74 198 82" fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>
      </g>
      <path d="M158 100 C152 112 154 122 158 126" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <path d="M242 100 C248 112 246 122 242 126" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </g>`;
  }

  function hairBob(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M152 98 C150 50 174 38 200 36 C226 38 250 50 248 98 C244 74 224 64 200 62 C176 64 156 74 152 98Z" fill="${color}"/>
      </g>
      <path d="M150 96 C142 122 148 148 164 152 C176 148 178 128 174 110Z" fill="${color}"/>
      <path d="M250 96 C258 122 252 148 236 152 C224 148 222 128 226 110Z" fill="${color}"/>
    </g>`;
  }

  function hairLong(color) {
    const hi = shade(color, 28);
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M150 100 C148 48 174 36 200 34 C226 36 252 48 250 100 C244 72 224 60 200 58 C176 60 156 72 150 100Z" fill="${color}"/>
      </g>
      <path d="M150 98 C132 160 136 230 148 288 C164 298 176 250 174 190 C170 140 162 110 156 100Z" fill="${color}"/>
      <path d="M250 98 C268 160 264 230 252 288 C236 298 224 250 226 190 C230 140 238 110 244 100Z" fill="${color}"/>
      <path d="M172 68 C190 82 210 82 228 68" fill="none" stroke="${hi}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>
    </g>`;
  }

  function hairPonytail(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M156 96 C158 50 178 40 200 38 C222 40 242 50 244 96 C236 72 220 62 200 60 C180 62 164 72 156 96Z" fill="${color}"/>
      </g>
      <path d="M228 68 C268 88 272 150 262 190 C248 205 240 160 242 120 C244 95 236 78 228 68Z" fill="${color}"/>
      <ellipse cx="246" cy="78" rx="9" ry="7" fill="${shade(color, -18)}"/>
      <path d="M160 98 C154 114 156 126 160 130" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
    </g>`;
  }

  function hairBraids(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M154 98 C156 50 178 40 200 38 C222 40 244 50 246 98 C238 72 220 62 200 60 C180 62 162 72 154 98Z" fill="${color}"/>
      </g>
      <path d="M152 104 C144 150 146 190 150 225" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
      <path d="M248 104 C256 150 254 190 250 225" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="150" cy="228" r="6.5" fill="${shade(color, -15)}"/>
      <circle cx="250" cy="228" r="6.5" fill="${shade(color, -15)}"/>
    </g>`;
  }

  // Expose skin map for the composer
  window.CharacterSkin = { tones: skin, shade };
})();
