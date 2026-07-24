/**
 * Built-in piece catalog — SVG layers on a shared 400×560 stage.
 * Neck joint: CharacterSlots.NECK (200, 148). Bodies include undergarments.
 * Hair groups with class "under-hat" are hidden when a hat is equipped.
 */
(function () {
  const N = { x: 200, y: 148, w: 36 };

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

  /** Shared skin tone helpers */
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
        <ellipse cx="200" cy="500" rx="140" ry="28" fill="#0d1218" opacity=".55"/>`,
    }),
    piece({
      id: "bg-forest",
      slot: "background",
      name: "Misty Forest",
      svg: `<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1c3a2e"/><stop offset="100%" stop-color="#0e1a16"/></linearGradient></defs>
        <rect width="400" height="560" fill="url(#fg)"/>
        <path d="M0 420 Q80 360 120 440 T240 400 T400 450 V560 H0Z" fill="#142820" opacity=".8"/>
        <circle cx="60" cy="80" r="40" fill="#2a5a44" opacity=".35"/>
        <circle cx="340" cy="100" r="50" fill="#2a5a44" opacity=".3"/>`,
    }),
    piece({
      id: "bg-dungeon",
      slot: "background",
      name: "Dungeon Torch",
      svg: `<rect width="400" height="560" fill="#121018"/>
        <rect x="0" y="0" width="400" height="560" fill="url(#dg)" opacity=".9"/>
        <defs><radialGradient id="dg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#5a3010"/><stop offset="70%" stop-color="#1a1018" stop-opacity="0"/></radialGradient></defs>
        <path d="M40 0 V560 M360 0 V560" stroke="#2a2430" stroke-width="18"/>
        <path d="M0 180 H400 M0 360 H400" stroke="#2a2430" stroke-width="10"/>`,
    }),
    piece({
      id: "bg-sky",
      slot: "background",
      name: "Open Sky",
      svg: `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6fa8d8"/><stop offset="100%" stop-color="#c8dce8"/></linearGradient></defs>
        <rect width="400" height="560" fill="url(#sky)"/>
        <ellipse cx="90" cy="90" rx="50" ry="22" fill="#fff" opacity=".55"/>
        <ellipse cx="300" cy="130" rx="70" ry="26" fill="#fff" opacity=".4"/>
        <rect y="430" width="400" height="130" fill="#6a8a4a"/>`,
    }),

    /* ========== BASES ========== */
    piece({
      id: "base-disc",
      slot: "base",
      name: "Stone Disc",
      svg: `<ellipse cx="200" cy="505" rx="95" ry="22" fill="#3a4555"/>
        <ellipse cx="200" cy="500" rx="95" ry="22" fill="#5a6578"/>
        <ellipse cx="200" cy="498" rx="70" ry="12" fill="#4a5568" opacity=".5"/>`,
    }),
    piece({
      id: "base-hex",
      slot: "base",
      name: "Hex Tile",
      svg: `<path d="M200 478 L275 498 L275 522 L200 542 L125 522 L125 498Z" fill="#4a3a28" stroke="#2a2018" stroke-width="2"/>
        <path d="M200 478 L275 498 L200 518 L125 498Z" fill="#6a5440"/>`,
    }),
    piece({
      id: "base-grass",
      slot: "base",
      name: "Grass Tuft",
      svg: `<ellipse cx="200" cy="508" rx="80" ry="16" fill="#3a5a28"/>
        <path d="M140 500 Q145 470 150 500 M160 502 Q168 468 172 502 M200 504 Q205 460 210 504 M230 502 Q238 472 242 502 M260 500 Q268 475 272 500" stroke="#5a8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    }),

    /* ========== BODIES (undergarments always on) ========== */
    piece({
      id: "body-athletic",
      slot: "body",
      name: "Athletic",
      tags: ["humanoid"],
      svg: bodySvg(skin.fair, "athletic"),
    }),
    piece({
      id: "body-sturdy",
      slot: "body",
      name: "Sturdy",
      tags: ["humanoid"],
      svg: bodySvg(skin.warm, "sturdy"),
    }),
    piece({
      id: "body-lithe",
      slot: "body",
      name: "Lithe",
      tags: ["humanoid"],
      svg: bodySvg(skin.pale, "lithe"),
    }),
    piece({
      id: "body-broad",
      slot: "body",
      name: "Broad",
      tags: ["humanoid"],
      svg: bodySvg(skin.deep, "broad"),
    }),
    piece({
      id: "body-olive",
      slot: "body",
      name: "Olive Athletic",
      tags: ["humanoid"],
      svg: bodySvg(skin.olive, "athletic"),
    }),

    /* ========== HEADS ========== */
    piece({
      id: "head-oval",
      slot: "head",
      name: "Oval",
      tags: ["humanoid"],
      svg: headSvg(skin.fair, "oval"),
    }),
    piece({
      id: "head-round",
      slot: "head",
      name: "Round",
      tags: ["humanoid"],
      svg: headSvg(skin.warm, "round"),
    }),
    piece({
      id: "head-angular",
      slot: "head",
      name: "Angular",
      tags: ["humanoid"],
      svg: headSvg(skin.pale, "angular"),
    }),
    piece({
      id: "head-square",
      slot: "head",
      name: "Square",
      tags: ["humanoid"],
      svg: headSvg(skin.deep, "square"),
    }),
    piece({
      id: "head-elf",
      slot: "head",
      name: "Elven",
      tags: ["elf"],
      svg: headSvg(skin.pale, "elf"),
    }),
    piece({
      id: "head-dwarf",
      slot: "head",
      name: "Dwarven",
      tags: ["dwarf"],
      svg: headSvg(skin.warm, "dwarf"),
    }),

    /* ========== HAIR (under-hat regions) ========== */
    piece({
      id: "hair-short",
      slot: "hair",
      name: "Short Crop",
      headFits: "all",
      svg: hairShort("#2a1a10"),
    }),
    piece({
      id: "hair-bob",
      slot: "hair",
      name: "Bob Cut",
      headFits: "all",
      svg: hairBob("#3a2a1a"),
    }),
    piece({
      id: "hair-long",
      slot: "hair",
      name: "Long Waves",
      headFits: "all",
      svg: hairLong("#5a3020"),
    }),
    piece({
      id: "hair-ponytail",
      slot: "hair",
      name: "Ponytail",
      headFits: "all",
      svg: hairPonytail("#1a1a20"),
    }),
    piece({
      id: "hair-braids",
      slot: "hair",
      name: "Side Braids",
      headFits: "all",
      svg: hairBraids("#8a6030"),
    }),
    piece({
      id: "hair-bald",
      slot: "hair",
      name: "None / Bald",
      headFits: "all",
      svg: ``,
    }),
    piece({
      id: "hair-white-long",
      slot: "hair",
      name: "Silver Long",
      headFits: "all",
      svg: hairLong("#d8d4e0"),
    }),
    piece({
      id: "hair-red-short",
      slot: "hair",
      name: "Auburn Crop",
      headFits: "all",
      svg: hairShort("#8a3020"),
    }),

    /* ========== HATS ========== */
    piece({
      id: "hat-hood",
      slot: "hat",
      name: "Travel Hood",
      svg: `<g class="piece-hat">
        <path d="M128 95 Q200 40 272 95 L265 130 Q200 150 135 130Z" fill="#3a4a3a"/>
        <path d="M140 100 Q200 55 260 100" fill="none" stroke="#2a322a" stroke-width="3"/>
        <path d="M200 48 Q230 20 248 70" fill="#3a4a3a"/>
      </g>`,
    }),
    piece({
      id: "hat-wizard",
      slot: "hat",
      name: "Wizard Hat",
      svg: `<g class="piece-hat">
        <ellipse cx="200" cy="108" rx="78" ry="14" fill="#2a2040"/>
        <path d="M145 105 Q200 -20 255 105 L248 112 Q200 125 152 112Z" fill="#3a3060"/>
        <circle cx="210" cy="50" r="5" fill="#d4b050"/>
        <path d="M160 100 Q200 88 240 100" fill="none" stroke="#5a4880" stroke-width="4"/>
      </g>`,
    }),
    piece({
      id: "hat-helm",
      slot: "hat",
      name: "Iron Helm",
      svg: `<g class="piece-hat">
        <path d="M130 100 Q200 35 270 100 L265 125 Q200 145 135 125Z" fill="#6a7080"/>
        <path d="M145 105 Q200 55 255 105" fill="none" stroke="#8a90a0" stroke-width="4"/>
        <rect x="175" y="95" width="50" height="8" rx="2" fill="#3a4050"/>
        <path d="M200 40 L208 70 L200 65 L192 70Z" fill="#8a90a0"/>
      </g>`,
    }),
    piece({
      id: "hat-cap",
      slot: "hat",
      name: "Leather Cap",
      svg: `<g class="piece-hat">
        <path d="M140 95 Q200 50 260 95 L255 120 Q200 135 145 120Z" fill="#6a4830"/>
        <path d="M145 112 Q200 100 255 112" fill="#5a3a22"/>
        <ellipse cx="200" cy="118" rx="55" ry="8" fill="#4a2e18" opacity=".4"/>
      </g>`,
    }),
    piece({
      id: "hat-crown",
      slot: "hat",
      name: "Simple Crown",
      svg: `<g class="piece-hat">
        <path d="M150 95 L165 70 L180 95 L200 60 L220 95 L235 70 L250 95 L248 110 L152 110Z" fill="#d4b050"/>
        <circle cx="200" cy="78" r="5" fill="#c04040"/>
        <circle cx="165" cy="85" r="3" fill="#4080c0"/>
        <circle cx="235" cy="85" r="3" fill="#4080c0"/>
      </g>`,
    }),

    /* ========== GLASSES ========== */
    piece({
      id: "glasses-round",
      slot: "glasses",
      name: "Round Specs",
      svg: `<g class="piece-glasses" fill="none" stroke="#2a2a2a" stroke-width="3">
        <circle cx="175" cy="95" r="16"/><circle cx="225" cy="95" r="16"/>
        <path d="M191 95 H209 M159 95 H145 M241 95 H255"/>
      </g>`,
    }),
    piece({
      id: "glasses-square",
      slot: "glasses",
      name: "Square Frames",
      svg: `<g class="piece-glasses" fill="none" stroke="#1a3040" stroke-width="3">
        <rect x="158" y="82" width="32" height="26" rx="3"/>
        <rect x="210" y="82" width="32" height="26" rx="3"/>
        <path d="M190 95 H210"/>
      </g>`,
    }),
    piece({
      id: "glasses-monocle",
      slot: "glasses",
      name: "Monocle",
      svg: `<g class="piece-glasses" fill="none" stroke="#c0a050" stroke-width="2.5">
        <circle cx="225" cy="95" r="14"/>
        <path d="M239 95 Q260 110 250 140" stroke-dasharray="2 3"/>
      </g>`,
    }),

    /* ========== TOPS ========== */
    piece({
      id: "top-tunic",
      slot: "top",
      name: "Linen Tunic",
      svg: `<g class="piece-top">
        <path d="M145 155 L120 200 L130 320 L270 320 L280 200 L255 155
          Q200 175 145 155Z" fill="#6a8a9a"/>
        <path d="M145 155 Q200 168 255 155" fill="none" stroke="#4a6a7a" stroke-width="3"/>
      </g>`,
    }),
    piece({
      id: "top-vest",
      slot: "top",
      name: "Leather Vest",
      svg: `<g class="piece-top">
        <path d="M150 158 L135 210 L145 300 L255 300 L265 210 L250 158
          Q200 178 150 158Z" fill="#6a4830"/>
        <path d="M200 170 V295" stroke="#4a3020" stroke-width="2"/>
        <circle cx="190" cy="200" r="3" fill="#c0a050"/><circle cx="190" cy="230" r="3" fill="#c0a050"/>
        <circle cx="190" cy="260" r="3" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "top-armor",
      slot: "top",
      name: "Chest Plate",
      svg: `<g class="piece-top">
        <path d="M148 158 L125 205 L138 290 L262 290 L275 205 L252 158
          Q200 180 148 158Z" fill="#7a8498"/>
        <path d="M160 175 Q200 195 240 175" fill="none" stroke="#a0a8b8" stroke-width="4"/>
        <path d="M170 220 H230 M170 250 H230" stroke="#5a6478" stroke-width="3"/>
      </g>`,
    }),
    piece({
      id: "top-robe-shirt",
      slot: "top",
      name: "Mage Shirt",
      svg: `<g class="piece-top">
        <path d="M145 155 L115 210 L130 330 L270 330 L285 210 L255 155
          Q200 172 145 155Z" fill="#4a3a6a"/>
        <path d="M200 165 V320" stroke="#6a5a8a" stroke-width="2" stroke-dasharray="4 6"/>
      </g>`,
    }),

    /* ========== BOTTOMS ========== */
    piece({
      id: "bottom-pants",
      slot: "bottom",
      name: "Cloth Pants",
      svg: `<g class="piece-bottom">
        <path d="M145 300 L135 470 L175 475 L200 330 L225 475 L265 470 L255 300Z" fill="#3a4a5a"/>
        <path d="M200 310 V340" stroke="#2a3a4a" stroke-width="2"/>
      </g>`,
    }),
    piece({
      id: "bottom-skirt",
      slot: "bottom",
      name: "Travel Skirt",
      svg: `<g class="piece-bottom">
        <path d="M140 300 Q200 310 260 300 L280 420 Q200 450 120 420Z" fill="#5a3a4a"/>
        <path d="M150 320 Q200 335 250 320" fill="none" stroke="#7a5a6a" stroke-width="2"/>
      </g>`,
    }),
    piece({
      id: "bottom-greaves",
      slot: "bottom",
      name: "Padded Greaves",
      svg: `<g class="piece-bottom">
        <path d="M145 300 L138 460 L178 465 L200 320 L222 465 L262 460 L255 300Z" fill="#4a5040"/>
        <rect x="145" y="380" width="40" height="18" rx="3" fill="#6a7060"/>
        <rect x="215" y="380" width="40" height="18" rx="3" fill="#6a7060"/>
      </g>`,
    }),

    /* ========== OUTERWEAR ========== */
    piece({
      id: "outer-cloak",
      slot: "outer",
      name: "Traveler Cloak",
      svg: `<g class="piece-outer">
        <path d="M120 160 Q90 280 100 480 L140 485 Q160 300 175 170
          Q200 185 225 170 Q240 300 260 485 L300 480 Q310 280 280 160
          Q200 195 120 160Z" fill="#2a3a4a" opacity=".92"/>
        <path d="M130 165 Q200 200 270 165" fill="none" stroke="#3a4a5a" stroke-width="3"/>
      </g>`,
    }),
    piece({
      id: "outer-cape",
      slot: "outer",
      name: "Hero Cape",
      svg: `<g class="piece-outer">
        <path d="M155 160 Q80 250 90 490 L160 480 Q150 280 180 175
          Q200 185 220 175 Q250 280 240 480 L310 490 Q320 250 245 160
          Q200 178 155 160Z" fill="#8a2030" opacity=".9"/>
      </g>`,
    }),
    piece({
      id: "outer-robe",
      slot: "outer",
      name: "Wizard Robe",
      svg: `<g class="piece-outer">
        <path d="M140 158 L95 250 L110 500 L290 500 L305 250 L260 158
          Q200 185 140 158Z" fill="#2a2450" opacity=".88"/>
        <path d="M200 170 V490" stroke="#4a4080" stroke-width="2"/>
        <circle cx="200" cy="220" r="12" fill="none" stroke="#d4b050" stroke-width="2"/>
      </g>`,
    }),

    /* ========== FOOTWEAR ========== */
    piece({
      id: "boot-leather",
      slot: "footwear",
      name: "Leather Boots",
      svg: `<g class="piece-footwear">
        <path d="M135 455 L120 500 L175 505 L178 460Z" fill="#4a3020"/>
        <path d="M222 460 L225 505 L280 500 L265 455Z" fill="#4a3020"/>
        <path d="M125 490 H170 M230 490 H275" stroke="#6a4830" stroke-width="3"/>
      </g>`,
    }),
    piece({
      id: "boot-plate",
      slot: "footwear",
      name: "Plate Sabatons",
      svg: `<g class="piece-footwear">
        <path d="M136 450 L118 498 L178 505 L180 455Z" fill="#6a7080"/>
        <path d="M220 455 L222 505 L282 498 L264 450Z" fill="#6a7080"/>
        <path d="M130 475 H172 M228 475 H270" stroke="#9aa0b0" stroke-width="3"/>
      </g>`,
    }),
    piece({
      id: "boot-sandals",
      slot: "footwear",
      name: "Sandals",
      svg: `<g class="piece-footwear" fill="none" stroke="#6a4830" stroke-width="3">
        <path d="M138 475 Q155 500 175 478"/>
        <path d="M225 478 Q245 500 262 475"/>
        <path d="M145 485 H170 M230 485 H255"/>
      </g>`,
    }),

    /* ========== WEAPONS ========== */
    piece({
      id: "weapon-sword",
      slot: "weapon-main",
      name: "Longsword",
      svg: `<g class="piece-weapon" transform="translate(285 280) rotate(-18)">
        <rect x="-6" y="40" width="12" height="55" rx="2" fill="#5a4030"/>
        <rect x="-18" y="32" width="36" height="10" rx="2" fill="#c0a050"/>
        <path d="M0 32 L8 -70 L0 -85 L-8 -70Z" fill="#c0c8d8"/>
        <path d="M0 32 V-70" stroke="#e8ecf4" stroke-width="2"/>
      </g>`,
    }),
    piece({
      id: "weapon-axe",
      slot: "weapon-main",
      name: "Battle Axe",
      svg: `<g class="piece-weapon" transform="translate(290 300) rotate(-12)">
        <rect x="-5" y="-20" width="10" height="120" rx="2" fill="#5a4030"/>
        <path d="M5 -10 Q50 -30 45 20 Q20 25 5 15Z" fill="#8a90a0"/>
        <path d="M5 -5 Q35 -15 32 10 Q15 12 5 8" fill="#b0b8c8"/>
      </g>`,
    }),
    piece({
      id: "weapon-staff",
      slot: "weapon-main",
      name: "Oak Staff",
      svg: `<g class="piece-weapon" transform="translate(295 240) rotate(-8)">
        <rect x="-5" y="0" width="10" height="220" rx="3" fill="#6a4830"/>
        <circle cx="0" cy="-5" r="16" fill="#3a3060" stroke="#d4b050" stroke-width="3"/>
        <circle cx="0" cy="-5" r="6" fill="#80d0ff" opacity=".8"/>
      </g>`,
    }),
    piece({
      id: "weapon-bow",
      slot: "weapon-main",
      name: "Hunting Bow",
      svg: `<g class="piece-weapon" transform="translate(300 260)">
        <path d="M0 -80 Q40 0 0 80" fill="none" stroke="#6a4830" stroke-width="6"/>
        <path d="M0 -80 L0 80" stroke="#d8d0c0" stroke-width="1.5"/>
        <path d="M-5 0 H25" stroke="#c0a080" stroke-width="2"/>
      </g>`,
    }),
    piece({
      id: "weapon-dagger",
      slot: "weapon-off",
      name: "Dagger",
      svg: `<g class="piece-weapon" transform="translate(105 310) rotate(20)">
        <rect x="-4" y="20" width="8" height="35" rx="1" fill="#4a3020"/>
        <rect x="-12" y="16" width="24" height="6" fill="#a09040"/>
        <path d="M0 16 L5 -35 L0 -45 L-5 -35Z" fill="#b0b8c8"/>
      </g>`,
    }),
    piece({
      id: "weapon-shield",
      slot: "weapon-off",
      name: "Round Shield",
      svg: `<g class="piece-weapon" transform="translate(100 300)">
        <circle cx="0" cy="0" r="42" fill="#6a4830" stroke="#3a2a18" stroke-width="4"/>
        <circle cx="0" cy="0" r="28" fill="#8a6840"/>
        <circle cx="0" cy="0" r="10" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "weapon-torch",
      slot: "weapon-off",
      name: "Torch",
      svg: `<g class="piece-weapon" transform="translate(100 320) rotate(15)">
        <rect x="-5" y="0" width="10" height="70" rx="2" fill="#6a4830"/>
        <ellipse cx="0" cy="-15" rx="12" ry="22" fill="#f09030"/>
        <ellipse cx="0" cy="-22" rx="7" ry="12" fill="#ffe080"/>
      </g>`,
    }),

    /* ========== ITEMS ========== */
    piece({
      id: "item-pouch",
      slot: "item",
      name: "Belt Pouch",
      svg: `<g class="piece-item" transform="translate(155 295)">
        <path d="M-12 0 Q-14 28 0 30 Q14 28 12 0Z" fill="#5a4030"/>
        <ellipse cx="0" cy="0" rx="14" ry="5" fill="#6a5040"/>
        <circle cx="0" cy="8" r="3" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "item-book",
      slot: "item",
      name: "Spellbook",
      svg: `<g class="piece-item" transform="translate(250 300) rotate(8)">
        <rect x="-18" y="-22" width="36" height="44" rx="2" fill="#3a2040"/>
        <rect x="-14" y="-18" width="28" height="36" fill="#5a3860"/>
        <path d="M-8 -5 H8 M-8 5 H8 M-8 15 H4" stroke="#d4b050" stroke-width="1.5"/>
      </g>`,
    }),
    piece({
      id: "item-amulet",
      slot: "item",
      name: "Amulet",
      svg: `<g class="piece-item">
        <path d="M180 160 Q200 195 220 160" fill="none" stroke="#c0a050" stroke-width="2"/>
        <circle cx="200" cy="200" r="10" fill="#4080c0" stroke="#c0a050" stroke-width="2"/>
      </g>`,
    }),

    /* ========== PROPS ========== */
    piece({
      id: "prop-raven",
      slot: "prop",
      name: "Raven",
      svg: `<g class="piece-prop" transform="translate(320 420)">
        <ellipse cx="0" cy="0" rx="22" ry="12" fill="#1a1a22"/>
        <path d="M18 -2 L35 -8 L20 4Z" fill="#2a2a30"/>
        <circle cx="-10" cy="-4" r="7" fill="#1a1a22"/>
        <circle cx="-12" cy="-5" r="2" fill="#e0c040"/>
        <path d="M-16 -2 L-24 0 L-16 2" fill="#e09030"/>
      </g>`,
    }),
    piece({
      id: "prop-chest",
      slot: "prop",
      name: "Loot Chest",
      svg: `<g class="piece-prop" transform="translate(70 455)">
        <rect x="-28" y="-18" width="56" height="36" rx="3" fill="#6a4830"/>
        <path d="M-28 -18 Q0 -38 28 -18" fill="#8a6840"/>
        <rect x="-6" y="-8" width="12" height="10" rx="1" fill="#c0a050"/>
      </g>`,
    }),
    piece({
      id: "prop-campfire",
      slot: "prop",
      name: "Campfire",
      svg: `<g class="piece-prop" transform="translate(55 470)">
        <path d="M-20 10 L-5 -5 L5 8 L18 -2 L22 12Z" fill="#5a4030"/>
        <ellipse cx="0" cy="-8" rx="14" ry="22" fill="#e07020"/>
        <ellipse cx="0" cy="-16" rx="7" ry="12" fill="#ffe060"/>
      </g>`,
    }),
  ];

  /* ---- SVG builders ---- */

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  function bodySvg(tone, build) {
    const dark = shade(tone, -28);
    const mid = shade(tone, -10);
    let torsoW = 55;
    let hipW = 48;
    let shoulder = 70;
    let arm = 14;
    if (build === "sturdy") {
      torsoW = 62;
      hipW = 56;
      shoulder = 78;
      arm = 16;
    } else if (build === "lithe") {
      torsoW = 46;
      hipW = 42;
      shoulder = 60;
      arm = 12;
    } else if (build === "broad") {
      torsoW = 70;
      hipW = 60;
      shoulder = 88;
      arm = 18;
    }
    const nx = N.x;
    const ny = N.y;
    const nw = N.w / 2;
    return `<g class="piece-body">
      <!-- neck stump (matches head) -->
      <path d="M${nx - nw} ${ny} L${nx - nw + 2} ${ny + 18} L${nx + nw - 2} ${ny + 18} L${nx + nw} ${ny}Z" fill="${tone}"/>
      <!-- torso -->
      <path d="M${nx - shoulder / 2} ${ny + 14}
        L${nx - torsoW} ${ny + 70}
        L${nx - hipW} ${ny + 160}
        L${nx + hipW} ${ny + 160}
        L${nx + torsoW} ${ny + 70}
        L${nx + shoulder / 2} ${ny + 14}
        Q${nx} ${ny + 28} ${nx - shoulder / 2} ${ny + 14}Z" fill="${tone}"/>
      <!-- undergarments (always) -->
      <path d="M${nx - hipW + 4} ${ny + 145}
        L${nx - 22} ${ny + 175} L${nx - 8} ${ny + 155}
        L${nx + 8} ${ny + 155} L${nx + 22} ${ny + 175}
        L${nx + hipW - 4} ${ny + 145}
        Q${nx} ${ny + 158} ${nx - hipW + 4} ${ny + 145}Z" fill="#3a3548"/>
      <path d="M${nx - hipW + 6} ${ny + 138} H${nx + hipW - 6} V${ny + 152}
        Q${nx} ${ny + 160} ${nx - hipW + 6} ${ny + 152}Z" fill="#2e2a3a"/>
      <!-- arms -->
      <path d="M${nx - shoulder / 2} ${ny + 20}
        Q${nx - shoulder / 2 - 35} ${ny + 90} ${nx - shoulder / 2 - 28} ${ny + 175}
        L${nx - shoulder / 2 - 10} ${ny + 178}
        Q${nx - shoulder / 2 - 18} ${ny + 90} ${nx - shoulder / 2 + 8} ${ny + 35}Z" fill="${mid}"/>
      <path d="M${nx + shoulder / 2} ${ny + 20}
        Q${nx + shoulder / 2 + 35} ${ny + 90} ${nx + shoulder / 2 + 28} ${ny + 175}
        L${nx + shoulder / 2 + 10} ${ny + 178}
        Q${nx + shoulder / 2 + 18} ${ny + 90} ${nx + shoulder / 2 - 8} ${ny + 35}Z" fill="${mid}"/>
      <!-- legs -->
      <path d="M${nx - 28} ${ny + 160} L${nx - 38} ${ny + 310} L${nx - 12} ${ny + 312} L${nx - 4} ${ny + 165}Z" fill="${tone}"/>
      <path d="M${nx + 28} ${ny + 160} L${nx + 38} ${ny + 310} L${nx + 12} ${ny + 312} L${nx + 4} ${ny + 165}Z" fill="${tone}"/>
      <!-- hands -->
      <ellipse cx="${nx - shoulder / 2 - 22}" cy="${ny + 182}" rx="${arm}" ry="10" fill="${dark}"/>
      <ellipse cx="${nx + shoulder / 2 + 22}" cy="${ny + 182}" rx="${arm}" ry="10" fill="${dark}"/>
      <!-- feet stubs (covered by footwear usually) -->
      <ellipse cx="${nx - 28}" cy="${ny + 318}" rx="18" ry="8" fill="${dark}"/>
      <ellipse cx="${nx + 28}" cy="${ny + 318}" rx="18" ry="8" fill="${dark}"/>
    </g>`;
  }

  function headSvg(tone, shape) {
    const dark = shade(tone, -35);
    const nx = N.x;
    const ny = N.y;
    const nw = N.w / 2;
    let headPath;
    if (shape === "round") {
      headPath = `M${nx - 42} 100 Q${nx - 45} 55 ${nx} 48 Q${nx + 45} 55 ${nx + 42} 100 Q${nx + 40} 135 ${nx} 142 Q${nx - 40} 135 ${nx - 42} 100Z`;
    } else if (shape === "angular") {
      headPath = `M${nx - 38} 105 L${nx - 40} 60 L${nx} 45 L${nx + 40} 60 L${nx + 38} 105 L${nx + 28} 138 L${nx} 145 L${nx - 28} 138Z`;
    } else if (shape === "square") {
      headPath = `M${nx - 40} 58 H${nx + 40} V120 Q${nx + 38} 142 ${nx} 146 Q${nx - 38} 142 ${nx - 40} 120Z`;
    } else if (shape === "elf") {
      headPath = `M${nx - 38} 100 Q${nx - 42} 55 ${nx} 48 Q${nx + 42} 55 ${nx + 38} 100 Q${nx + 36} 132 ${nx} 140 Q${nx - 36} 132 ${nx - 38} 100Z`;
    } else if (shape === "dwarf") {
      headPath = `M${nx - 44} 95 Q${nx - 46} 58 ${nx} 52 Q${nx + 46} 58 ${nx + 44} 95 Q${nx + 42} 138 ${nx} 148 Q${nx - 42} 138 ${nx - 44} 95Z`;
    } else {
      // oval
      headPath = `M${nx - 40} 102 Q${nx - 42} 55 ${nx} 46 Q${nx + 42} 55 ${nx + 40} 102 Q${nx + 38} 138 ${nx} 144 Q${nx - 38} 138 ${nx - 40} 102Z`;
    }
    const ears =
      shape === "elf"
        ? `<path d="M${nx - 40} 95 L${nx - 62} 78 L${nx - 38} 110Z" fill="${tone}"/>
           <path d="M${nx + 40} 95 L${nx + 62} 78 L${nx + 38} 110Z" fill="${tone}"/>`
        : shape === "dwarf"
          ? `<ellipse cx="${nx - 42}" cy="100" rx="8" ry="12" fill="${tone}"/>
             <ellipse cx="${nx + 42}" cy="100" rx="8" ry="12" fill="${tone}"/>`
          : `<ellipse cx="${nx - 40}" cy="100" rx="7" ry="11" fill="${tone}"/>
             <ellipse cx="${nx + 40}" cy="100" rx="7" ry="11" fill="${tone}"/>`;
    const beard =
      shape === "dwarf"
        ? `<path d="M${nx - 28} 125 Q${nx} 175 ${nx + 28} 125 Q${nx} 145 ${nx - 28} 125Z" fill="#5a3020"/>`
        : "";
    return `<g class="piece-head">
      <!-- neck collar that seats into body stump -->
      <path d="M${nx - nw} ${ny} L${nx - nw + 1} ${ny - 12} L${nx + nw - 1} ${ny - 12} L${nx + nw} ${ny}Z" fill="${tone}"/>
      <path d="${headPath}" fill="${tone}"/>
      ${ears}
      <!-- eyes -->
      <ellipse cx="${nx - 14}" cy="95" rx="6" ry="7" fill="#fff"/>
      <ellipse cx="${nx + 14}" cy="95" rx="6" ry="7" fill="#fff"/>
      <circle cx="${nx - 13}" cy="96" r="3.2" fill="#2a2018"/>
      <circle cx="${nx + 15}" cy="96" r="3.2" fill="#2a2018"/>
      <circle cx="${nx - 12}" cy="95" r="1" fill="#fff"/>
      <circle cx="${nx + 16}" cy="95" r="1" fill="#fff"/>
      <!-- brows -->
      <path d="M${nx - 22} 84 Q${nx - 14} 80 ${nx - 6} 84" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M${nx + 6} 84 Q${nx + 14} 80 ${nx + 22} 84" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- nose -->
      <path d="M${nx} 98 L${nx - 4} 112 H${nx + 4}" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>
      <!-- mouth -->
      <path d="M${nx - 10} 122 Q${nx} 128 ${nx + 10} 122" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>
      ${beard}
    </g>`;
  }

  function hairShort(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M158 95 Q160 48 200 42 Q240 48 242 95 Q235 70 200 65 Q165 70 158 95Z" fill="${color}"/>
        <path d="M160 88 Q170 72 185 78" fill="none" stroke="${shade(color, 20)}" stroke-width="3"/>
      </g>
      <path d="M155 100 Q150 110 152 118" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <path d="M245 100 Q250 110 248 118" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    </g>`;
  }

  function hairBob(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M150 100 Q148 45 200 40 Q252 45 250 100 Q248 75 200 68 Q152 75 150 100Z" fill="${color}"/>
      </g>
      <path d="M148 95 Q140 130 155 145 Q175 150 180 130" fill="${color}"/>
      <path d="M252 95 Q260 130 245 145 Q225 150 220 130" fill="${color}"/>
      <path d="M160 88 H240" stroke="${shade(color, 25)}" stroke-width="2" opacity=".4"/>
    </g>`;
  }

  function hairLong(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M148 105 Q145 42 200 38 Q255 42 252 105 Q245 70 200 62 Q155 70 148 105Z" fill="${color}"/>
      </g>
      <path d="M148 100 Q130 200 145 280 Q170 290 175 200 Q168 140 160 110Z" fill="${color}"/>
      <path d="M252 100 Q270 200 255 280 Q230 290 225 200 Q232 140 240 110Z" fill="${color}"/>
      <path d="M170 70 Q200 85 230 70" fill="none" stroke="${shade(color, 30)}" stroke-width="3" opacity=".5"/>
    </g>`;
  }

  function hairPonytail(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M155 98 Q158 48 200 44 Q242 48 245 98 Q238 72 200 66 Q162 72 155 98Z" fill="${color}"/>
      </g>
      <path d="M230 70 Q280 90 270 180 Q250 200 245 140 Q248 100 235 78Z" fill="${color}"/>
      <ellipse cx="248" cy="78" rx="10" ry="8" fill="${shade(color, -20)}"/>
      <path d="M160 95 Q155 115 158 125" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }

  function hairBraids(color) {
    return `<g class="piece-hair">
      <g class="under-hat">
        <path d="M152 100 Q155 48 200 42 Q245 48 248 100 Q240 72 200 66 Q160 72 152 100Z" fill="${color}"/>
      </g>
      <path d="M150 105 Q140 160 148 220" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
      <path d="M250 105 Q260 160 252 220" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="148" cy="225" r="7" fill="${shade(color, -15)}"/>
      <circle cx="252" cy="225" r="7" fill="${shade(color, -15)}"/>
      <path d="M145 130 Q155 140 145 150 M255 130 Q245 140 255 150" fill="none" stroke="${shade(color, 25)}" stroke-width="2"/>
    </g>`;
  }
})();
